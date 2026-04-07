import { invoke } from '@tauri-apps/api/core';
import { getDb } from './db';
import { v4 as uuidv4 } from 'uuid';

export interface GoogleAuthState {
  connected: boolean;
  access_token: string | null;
  refresh_token: string | null;
  token_expiry: string | null;
  last_sync: string | null;
}

export async function getGoogleAuthState(): Promise<GoogleAuthState> {
  const db = await getDb();
  const rows = await db.select<{
    connected: number;
    access_token: string | null;
    refresh_token: string | null;
    token_expiry: string | null;
    last_sync: string | null;
  }[]>(
    `SELECT connected, access_token,
            refresh_token, token_expiry,
            last_sync
     FROM google_auth WHERE id = 'zubia'`
  );
  if (rows.length === 0) {
    return {
      connected: false,
      access_token: null,
      refresh_token: null,
      token_expiry: null,
      last_sync: null,
    };
  }
  return {
    connected: rows[0].connected === 1,
    access_token: rows[0].access_token,
    refresh_token: rows[0].refresh_token,
    token_expiry: rows[0].token_expiry,
    last_sync: rows[0].last_sync,
  };
}

export async function saveTokens(
  accessToken: string,
  refreshToken: string | null,
  expiresIn: number | null,
): Promise<void> {
  const db = await getDb();
  const expiry = expiresIn
    ? new Date(Date.now() + expiresIn * 1000).toISOString()
    : null;
  await db.execute(
    `UPDATE google_auth SET
       access_token = ?,
       refresh_token = ?,
       token_expiry = ?,
       connected = 1,
       updated_at = datetime('now')
     WHERE id = 'zubia'`,
    [accessToken, refreshToken, expiry]
  );
}

export async function getValidToken(): Promise<string | null> {
  const state = await getGoogleAuthState();
  if (!state.connected || !state.access_token) {
    return null;
  }

  if (state.token_expiry) {
    const expiry = new Date(state.token_expiry).getTime();
    const now = Date.now();
    if (expiry - now < 5 * 60 * 1000) {
      if (state.refresh_token) {
        try {
          const newToken = await invoke<{
            access_token: string;
            expires_in: number | null;
          }>('google_refresh_token', {
            refreshToken: state.refresh_token,
          });
          await saveTokens(
            newToken.access_token,
            state.refresh_token,
            newToken.expires_in ?? null,
          );
          return newToken.access_token;
        } catch {
          return null;
        }
      }
      return null;
    }
  }

  return state.access_token;
}

export async function syncGmail(): Promise<number> {
  const token = await getValidToken();
  if (!token) return 0;

  const db = await getDb();

  const contacts = await db.select<{ email: string }[]>(
    `SELECT email FROM contacts
     WHERE email IS NOT NULL
       AND status != 'inactive'`
  );
  const emails = contacts.map(c => c.email).filter(Boolean);

  const notifications = await invoke<
    {
      notification_id: string;
      subject: string;
      sender: string;
      sender_email: string;
      snippet: string;
      google_message_id: string;
      received_at: string;
    }[]
  >('gmail_sync', {
    accessToken: token,
    contactEmails: emails,
  });

  let inserted = 0;
  for (const n of notifications) {
    const exists = await db.select<{ notification_id: string }[]>(
      `SELECT notification_id
       FROM email_notifications
       WHERE google_message_id = ?`,
      [n.google_message_id]
    );
    if (exists.length > 0) continue;

    const contact = await db.select<{ contact_id: string }[]>(
      `SELECT contact_id FROM contacts
       WHERE LOWER(email) = LOWER(?)`,
      [n.sender_email]
    );

    await db.execute(
      `INSERT INTO email_notifications
         (notification_id, subject, sender,
          sender_email, contact_id, snippet,
          google_message_id, received_at)
       VALUES (?,?,?,?,?,?,?,?)`,
      [
        n.notification_id,
        n.subject,
        n.sender,
        n.sender_email,
        contact[0]?.contact_id ?? null,
        n.snippet,
        n.google_message_id,
        n.received_at,
      ]
    );

    if (contact[0]?.contact_id) {
      await db.execute(
        `UPDATE contacts
         SET last_contact = date('now'),
             updated_at = datetime('now')
         WHERE contact_id = ?`,
        [contact[0].contact_id]
      );
    }

    inserted++;
  }

  await db.execute(
    `UPDATE google_auth
     SET last_sync = datetime('now')
     WHERE id = 'zubia'`
  );

  await db.execute(
    `INSERT INTO audit_log
       (log_id, action, entity_type,
        entity_id, details)
     VALUES (?, 'gmail_synced',
             'google_auth', 'zubia', ?)`,
    [uuidv4(), `${inserted} new emails`]
  );

  await db.execute(
    `UPDATE google_auth
     SET last_sync = datetime('now'),
         updated_at = datetime('now')
     WHERE id = 'zubia'`
  );

  return inserted;
}

export async function syncCalendar(): Promise<number> {
  const token = await getValidToken();
  if (!token) return 0;

  const db = await getDb();

  const events = await invoke<
    {
      event_id: string;
      title: string;
      start_time: string;
      end_time: string;
      attendees: string;
      google_event_id: string;
    }[]
  >('calendar_sync', {
    accessToken: token,
    daysAhead: 7,
  });

  let inserted = 0;
  for (const e of events) {
    const exists = await db.select<{ event_id: string }[]>(
      `SELECT event_id FROM calendar_events
       WHERE google_event_id = ?`,
      [e.google_event_id]
    );

    if (exists.length > 0) {
      await db.execute(
        `UPDATE calendar_events
         SET title = ?, start_time = ?,
             end_time = ?, attendees = ?
         WHERE google_event_id = ?`,
        [
          e.title,
          e.start_time,
          e.end_time,
          e.attendees,
          e.google_event_id,
        ]
      );
      continue;
    }

    const attendeeEmails = e.attendees.split(', ').filter(Boolean);

    let contactId: string | null = null;
    for (const email of attendeeEmails) {
      const c = await db.select<{ contact_id: string }[]>(
        `SELECT contact_id FROM contacts
         WHERE LOWER(email) = LOWER(?)`,
        [email]
      );
      if (c[0]) {
        contactId = c[0].contact_id;
        break;
      }
    }

    await db.execute(
      `INSERT INTO calendar_events
         (event_id, title, start_time,
          end_time, attendees, contact_id,
          google_event_id)
       VALUES (?,?,?,?,?,?,?)`,
      [
        e.event_id,
        e.title,
        e.start_time,
        e.end_time,
        e.attendees,
        contactId,
        e.google_event_id,
      ]
    );
    inserted++;
  }

  await db.execute(
    `INSERT INTO audit_log
       (log_id, action, entity_type,
        entity_id, details)
     VALUES (?, 'calendar_synced',
             'google_auth', 'zubia', ?)`,
    [uuidv4(), `${inserted} new events`]
  );

  await db.execute(
    `UPDATE google_auth
     SET last_sync = datetime('now'),
         updated_at = datetime('now')
     WHERE id = 'zubia'`
  );

  return inserted;
}

export async function disconnectGoogle(): Promise<void> {
  const db = await getDb();
  const state = await getGoogleAuthState();

  if (state.access_token) {
    try {
      await invoke('google_revoke_token', {
        accessToken: state.access_token,
      });
    } catch {
      /* ignore */
    }
  }

  await db.execute(
    `UPDATE google_auth SET
       access_token = NULL,
       refresh_token = NULL,
       token_expiry = NULL,
       connected = 0,
       updated_at = datetime('now')
     WHERE id = 'zubia'`
  );
}
