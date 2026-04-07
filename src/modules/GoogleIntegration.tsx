import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import {
  getGoogleAuthState,
  saveTokens,
  syncGmail,
  syncCalendar,
  disconnectGoogle,
  type GoogleAuthState,
} from '../services/googleService';
import { getDb } from '../services/db';

interface EmailNotification {
  notification_id: string;
  subject: string | null;
  sender: string | null;
  sender_email: string | null;
  snippet: string | null;
  received_at: string | null;
  is_read: number;
  flagged: number;
}

interface CalendarEvent {
  event_id: string;
  title: string | null;
  start_time: string | null;
  end_time: string | null;
  attendees: string | null;
  brief_generated: number;
}

type GoogleTab = 'overview' | 'emails' | 'calendar';

export function GoogleIntegration() {
  const [auth, setAuth] =
    useState<GoogleAuthState | null>(null);
  const [emails, setEmails] = useState<EmailNotification[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [connecting, setConnecting] =
    useState(false);
  const [authCode, setAuthCode] = useState('');
  const [showCodeInput, setShowCodeInput] =
    useState(false);
  const [syncStatus, setSyncStatus] =
    useState('');
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<GoogleTab>('overview');

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const state = await getGoogleAuthState();
      setAuth(state);
      if (state.connected) {
        await loadData();
      }
    } catch (err) {
      console.error(
        'GoogleIntegration load:', err
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadData() {
    const db = await getDb();
    const em = await db.select<EmailNotification[]>(
      `SELECT notification_id, subject,
              sender, sender_email, snippet,
              received_at, is_read, flagged
       FROM email_notifications
       ORDER BY received_at DESC LIMIT 20`
    );
    setEmails(em);

    const ev = await db.select<CalendarEvent[]>(
      `SELECT event_id, title, start_time,
              end_time, attendees,
              brief_generated
       FROM calendar_events
       WHERE date(start_time) >= date('now')
       ORDER BY start_time ASC LIMIT 20`
    );
    setEvents(ev);
  }

  async function handleConnect() {
    setConnecting(true);
    setSyncStatus(
      'Opening browser. Sign in with Google. ' +
      'The app will connect automatically.'
    );
    try {
      const listenPromise = invoke<string>('google_auth_listen');
      await invoke('google_auth_start');
      const code = await listenPromise;

      const token = await invoke<{
        access_token: string;
        refresh_token: string | null;
        expires_in: number | null;
      }>('google_auth_exchange', {
        code,
      });

      await saveTokens(
        token.access_token,
        token.refresh_token,
        token.expires_in,
      );

      setShowCodeInput(false);
      setAuthCode('');
      setSyncStatus(
        'Connected successfully. Click Sync Now.'
      );
      await load();
    } catch (err) {
      setSyncStatus(
        `Connection failed: ${String(err)}. ` +
        'Try manual code entry below.'
      );
      setShowCodeInput(true);
    } finally {
      setConnecting(false);
    }
  }

  async function handleCodeSubmit() {
    if (!authCode.trim()) return;
    setConnecting(true);
    try {
      const token = await invoke<{
        access_token: string;
        refresh_token: string | null;
        expires_in: number | null;
      }>('google_auth_exchange', {
        code: authCode.trim(),
      });
      await saveTokens(
        token.access_token,
        token.refresh_token,
        token.expires_in,
      );
      setShowCodeInput(false);
      setAuthCode('');
      setSyncStatus('Connected successfully.');
      await load();
    } catch (err) {
      setSyncStatus(
        `Auth failed: ${String(err)}`
      );
    } finally {
      setConnecting(false);
    }
  }

  async function handleSync() {
    setSyncing(true);
    setSyncStatus('Syncing...');
    try {
      const [emailCount, eventCount] =
        await Promise.all([
          syncGmail(),
          syncCalendar(),
        ]);
      setSyncStatus(
        `Synced: ${emailCount} new emails, ` +
        `${eventCount} new calendar events.`
      );
      await loadData();
    } catch (err) {
      setSyncStatus(`Sync failed: ${String(err)}`);
    } finally {
      setSyncing(false);
    }
  }

  async function handleDisconnect() {
    await disconnectGoogle();
    setAuth(null);
    setEmails([]);
    setEvents([]);
    setSyncStatus('Disconnected from Google.');
    await load();
  }

  async function markRead(id: string) {
    const db = await getDb();
    await db.execute(
      `UPDATE email_notifications
       SET is_read = 1
       WHERE notification_id = ?`,
      [id]
    );
    await loadData();
  }

  async function toggleFlag(
    id: string, current: number
  ) {
    const db = await getDb();
    await db.execute(
      `UPDATE email_notifications
       SET flagged = ?
       WHERE notification_id = ?`,
      [current === 1 ? 0 : 1, id]
    );
    await loadData();
  }

  if (loading) {
    return (
      <div style={{
        padding: 32, color: 'var(--slate)',
        fontSize: 12,
        fontFamily: 'Courier New, monospace',
      }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{ padding: 32 }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
      }}>
        <div>
          <h2 style={{ marginBottom: 4 }}>
            Google Integration
          </h2>
          <p style={{
            color: 'var(--slate)', fontSize: 13,
          }}>
            Gmail and Calendar — synced locally.
            Nothing stored in the cloud.
          </p>
        </div>
        {auth?.connected && (
          <div style={{
            display: 'flex', gap: 8,
          }}>
            <button
              type="button"
              onClick={handleSync}
              disabled={syncing}
              style={{
                padding: '7px 16px',
                background: syncing
                  ? 'var(--mgray)'
                  : 'var(--teal)',
                color: syncing
                  ? 'var(--slate)'
                  : 'var(--white)',
                border: 'none', borderRadius: 8,
                fontSize: 12, fontWeight: 700,
                cursor: syncing
                  ? 'default' : 'pointer',
              }}>
              {syncing ? 'Syncing...' : 'Sync Now'}
            </button>
            <button
              type="button"
              onClick={handleDisconnect}
              style={{
                padding: '7px 16px',
                background: '#F05F5712',
                border: '1px solid var(--coral)',
                borderRadius: 8,
                fontSize: 12,
                color: 'var(--coral)',
                cursor: 'pointer',
              }}>
              Disconnect
            </button>
          </div>
        )}
      </div>

      {syncStatus && (
        <div style={{
          background: 'var(--teal3)',
          border: '1px solid var(--teal2)',
          borderRadius: 8,
          padding: '10px 14px',
          fontSize: 12,
          color: 'var(--navy)',
          marginBottom: 16,
          fontFamily: 'Courier New, monospace',
        }}>
          {syncStatus}
        </div>
      )}

      {!auth?.connected && (
        <div style={{
          background: 'var(--white)',
          border: '1px solid var(--mgray)',
          borderTop: '4px solid var(--teal)',
          borderRadius: 12,
          padding: '24px 28px',
          maxWidth: 520,
        }}>
          <div style={{
            fontSize: 15, fontWeight: 700,
            color: 'var(--navy)',
            marginBottom: 8,
          }}>
            Connect Google Account
          </div>
          <p style={{
            fontSize: 13, color: 'var(--slate)',
            marginBottom: 16, lineHeight: 1.6,
          }}>
            Connect your Gmail and Google Calendar
            to see meetings and emails from your
            pipeline contacts in Morning Brief.
            All data syncs locally. Nothing leaves
            your machine.
          </p>
          <div style={{
            background: 'var(--lgray)',
            borderRadius: 8,
            padding: '10px 14px',
            fontSize: 11,
            color: 'var(--slate)',
            marginBottom: 16,
            fontFamily: 'Courier New, monospace',
          }}>
            Scopes: gmail.readonly +
            calendar.readonly only.
            Read access only. No sending.
            No writing. No deleting.
          </div>

          {!showCodeInput ? (
            <button
              type="button"
              onClick={handleConnect}
              disabled={connecting}
              style={{
                padding: '10px 24px',
                background: connecting
                  ? 'var(--mgray)'
                  : 'var(--teal)',
                color: 'var(--white)',
                border: 'none', borderRadius: 8,
                fontSize: 13, fontWeight: 700,
                cursor: connecting
                  ? 'default' : 'pointer',
              }}>
              {connecting
                ? 'Opening browser...'
                : 'Connect Google'}
            </button>
          ) : (
            <div>
              <div style={{
                fontSize: 12,
                color: 'var(--navy)',
                marginBottom: 8,
                lineHeight: 1.5,
              }}>
                After signing in Google will show
                you an authorization code.
                Paste it here:
              </div>
              <input
                type="text"
                value={authCode}
                onChange={e =>
                  setAuthCode(e.target.value)}
                placeholder="Paste authorization code here"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid var(--mgray)',
                  borderRadius: 8,
                  fontSize: 12,
                  color: 'var(--navy)',
                  marginBottom: 8,
                  boxSizing: 'border-box',
                }} />
              <div style={{
                display: 'flex', gap: 8,
              }}>
                <button
                  type="button"
                  onClick={handleCodeSubmit}
                  disabled={
                    !authCode.trim() || connecting
                  }
                  style={{
                    padding: '8px 20px',
                    background:
                      authCode.trim()
                        ? 'var(--teal)'
                        : 'var(--mgray)',
                    color: 'var(--white)',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}>
                  {connecting
                    ? 'Connecting...'
                    : 'Submit Code'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCodeInput(false);
                    setAuthCode('');
                    setSyncStatus('');
                  }}
                  style={{
                    padding: '8px 16px',
                    background: 'var(--lgray)',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 12,
                    color: 'var(--slate)',
                    cursor: 'pointer',
                  }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {auth?.connected && (
        <div>
          <div style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit,minmax(160px,1fr))',
            gap: 12, marginBottom: 20,
          }}>
            {([
              ['Gmail', 'Connected',
                'var(--teal)'],
              ['Calendar', 'Connected',
                'var(--teal)'],
              ['Emails synced',
                `${emails.length}`,
                'var(--navy)'],
              ['Upcoming events',
                `${events.length}`,
                'var(--navy)'],
              ['Last sync',
                auth.last_sync
                  ? auth.last_sync.slice(0, 16)
                  : 'Never',
                'var(--slate)'],
            ] as const).map(([label, value, color]) => (
              <div key={label} style={{
                background: 'var(--white)',
                border: '1px solid var(--mgray)',
                borderRadius: 12,
                padding: '12px 16px',
              }}>
                <div className="label"
                  style={{ marginBottom: 4 }}>
                  {label}
                </div>
                <div style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: color,
                }}>
                  {value}
                </div>
              </div>
            ))}
          </div>

          <div style={{
            display: 'flex', gap: 8,
            marginBottom: 20,
          }}>
            {([
              ['overview', 'Overview'],
              ['emails', 'Emails'],
              ['calendar', 'Calendar'],
            ] as const).map(([id, label]) => (
              <button
                type="button"
                key={id}
                onClick={() =>
                  setTab(id)}
                style={{
                  padding: '7px 16px',
                  borderRadius: 20,
                  border: `1px solid ${
                    tab === id
                      ? 'var(--teal)'
                      : 'var(--mgray)'}`,
                  background: tab === id
                    ? 'var(--teal)'
                    : 'transparent',
                  color: tab === id
                    ? 'var(--white)'
                    : 'var(--slate)',
                  fontSize: 12, fontWeight: 600,
                  cursor: 'pointer',
                }}>
                {label}
              </button>
            ))}
          </div>

          {tab === 'overview' && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 16,
            }}>
              <div>
                <div className="label"
                  style={{ marginBottom: 10 }}>
                  Recent emails from pipeline
                </div>
                {emails.slice(0, 5).map(e => (
                  <div key={e.notification_id}
                    style={{
                      background: 'var(--white)',
                      border: `1px solid ${
                        e.flagged
                          ? 'var(--coral)'
                          : 'var(--mgray)'}`,
                      borderLeft: `4px solid ${
                        e.flagged
                          ? 'var(--coral)'
                          : e.is_read
                          ? 'var(--mgray)'
                          : 'var(--teal)'}`,
                      borderRadius: 10,
                      padding: '10px 14px',
                      marginBottom: 8,
                    }}>
                    <div style={{
                      fontSize: 12,
                      fontWeight: e.is_read
                        ? 400 : 700,
                      color: 'var(--navy)',
                      marginBottom: 2,
                    }}>
                      {e.subject ?? '(no subject)'}
                    </div>
                    <div style={{
                      fontSize: 11,
                      color: 'var(--slate)',
                    }}>
                      {e.sender ?? e.sender_email}
                      {e.received_at
                        ? ` · ${e.received_at
                            .slice(0, 10)}`
                        : ''}
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <div className="label"
                  style={{ marginBottom: 10 }}>
                  Upcoming meetings
                </div>
                {events.slice(0, 5).map(e => (
                  <div key={e.event_id} style={{
                    background: 'var(--white)',
                    border:
                      '1px solid var(--mgray)',
                    borderLeft:
                      '4px solid var(--gold)',
                    borderRadius: 10,
                    padding: '10px 14px',
                    marginBottom: 8,
                  }}>
                    <div style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: 'var(--navy)',
                      marginBottom: 2,
                    }}>
                      {e.title ?? 'Untitled'}
                    </div>
                    <div style={{
                      fontSize: 11,
                      color: 'var(--slate)',
                      fontFamily:
                        'Courier New, monospace',
                    }}>
                      {e.start_time
                        ? e.start_time
                            .slice(0, 16)
                            .replace('T', ' ')
                        : 'No time'}
                    </div>
                    {e.attendees && (
                      <div style={{
                        fontSize: 10,
                        color: 'var(--slate)',
                        marginTop: 2,
                      }}>
                        {e.attendees
                          .split(', ')
                          .slice(0, 2)
                          .join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'emails' && (
            <div>
              {emails.length === 0 ? (
                <div style={{
                  background: 'var(--lgray)',
                  borderRadius: 10,
                  padding: '20px 24px',
                  fontSize: 13,
                  color: 'var(--slate)',
                  textAlign: 'center',
                }}>
                  No emails synced yet.
                  Click Sync Now to fetch.
                </div>
              ) : emails.map(e => (
                <div key={e.notification_id}
                  style={{
                    background: 'var(--white)',
                    border: `1px solid ${
                      e.flagged
                        ? 'var(--coral)'
                        : 'var(--mgray)'}`,
                    borderLeft: `4px solid ${
                      e.flagged
                        ? 'var(--coral)'
                        : e.is_read
                        ? 'var(--mgray)'
                        : 'var(--teal)'}`,
                    borderRadius: 10,
                    padding: '12px 16px',
                    marginBottom: 8,
                    display: 'flex',
                    justifyContent:
                      'space-between',
                    alignItems: 'flex-start',
                  }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: 13,
                      fontWeight: e.is_read
                        ? 400 : 700,
                      color: 'var(--navy)',
                      marginBottom: 2,
                    }}>
                      {e.subject ?? '(no subject)'}
                    </div>
                    <div style={{
                      fontSize: 11,
                      color: 'var(--slate)',
                      marginBottom: 4,
                    }}>
                      {e.sender ?? e.sender_email}
                      {e.received_at
                        ? ` · ${e.received_at
                            .slice(0, 16)}`
                        : ''}
                    </div>
                    {e.snippet && (
                      <div style={{
                        fontSize: 11,
                        color: 'var(--slate)',
                        fontStyle: 'italic',
                        lineHeight: 1.4,
                      }}>
                        {e.snippet.slice(0, 120)}
                        {e.snippet.length > 120
                          ? '...' : ''}
                      </div>
                    )}
                  </div>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4, marginLeft: 12,
                    flexShrink: 0,
                  }}>
                    <button
                      type="button"
                      onClick={() =>
                        toggleFlag(
                          e.notification_id,
                          e.flagged
                        )}
                      style={{
                        padding: '3px 8px',
                        background: e.flagged
                          ? '#F05F5718'
                          : 'var(--lgray)',
                        border: `1px solid ${
                          e.flagged
                            ? 'var(--coral)'
                            : 'var(--mgray)'}`,
                        borderRadius: 6,
                        fontSize: 10,
                        color: e.flagged
                          ? 'var(--coral)'
                          : 'var(--slate)',
                        cursor: 'pointer',
                      }}>
                      {e.flagged
                        ? 'Flagged' : 'Flag'}
                    </button>
                    {!e.is_read && (
                      <button
                        type="button"
                        onClick={() =>
                          markRead(
                            e.notification_id
                          )}
                        style={{
                          padding: '3px 8px',
                          background:
                            'var(--teal2)',
                          border: 'none',
                          borderRadius: 6,
                          fontSize: 10,
                          color: 'var(--navy)',
                          cursor: 'pointer',
                        }}>
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'calendar' && (
            <div>
              {events.length === 0 ? (
                <div style={{
                  background: 'var(--lgray)',
                  borderRadius: 10,
                  padding: '20px 24px',
                  fontSize: 13,
                  color: 'var(--slate)',
                  textAlign: 'center',
                }}>
                  No upcoming events found.
                  Click Sync Now to fetch.
                </div>
              ) : events.map(e => (
                <div key={e.event_id} style={{
                  background: 'var(--white)',
                  border: '1px solid var(--mgray)',
                  borderLeft:
                    '4px solid var(--gold)',
                  borderRadius: 10,
                  padding: '14px 16px',
                  marginBottom: 10,
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  }}>
                    <div>
                      <div style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: 'var(--navy)',
                        marginBottom: 4,
                      }}>
                        {e.title ?? 'Untitled'}
                      </div>
                      <div style={{
                        fontSize: 11,
                        color: 'var(--slate)',
                        fontFamily:
                          'Courier New, monospace',
                        marginBottom: 4,
                      }}>
                        {e.start_time
                          ? e.start_time
                              .slice(0, 16)
                              .replace('T', ' ')
                          : 'No time'}
                        {e.end_time
                          ? ` to ${e.end_time
                              .slice(11, 16)}`
                          : ''}
                      </div>
                      {e.attendees && (
                        <div style={{
                          fontSize: 11,
                          color: 'var(--slate)',
                        }}>
                          {e.attendees}
                        </div>
                      )}
                    </div>
                    <span style={{
                      fontSize: 9,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 20,
                      background:
                        e.brief_generated
                          ? '#3A7D5C18'
                          : '#C8974A18',
                      color: e.brief_generated
                        ? 'var(--green)'
                        : 'var(--gold)',
                    }}>
                      {e.brief_generated
                        ? 'Brief ready'
                        : 'No brief'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
