import { useState, useEffect, useMemo, useCallback } from 'react';
import { getDb } from '../services/db';
import { enqueueJob } from '../services/jobQueueService';

const C = {
  navy: '#2D4459',
  teal: '#3BBFBF',
  mint: '#C8E8E5',
  coral: '#F05F57',
  gold: '#C8974A',
  slate: '#7A8F95',
  cream: '#FEFAF5',
  white: '#FFFFFF',
  green: '#3A7D5C',
  lgray: '#F4F7F8',
};

interface CalendarEvent {
  event_id: string;
  title: string | null;
  start_time: string | null;
  end_time: string | null;
  attendees: string | null;
  brief_generated: number;
  contact_id: string | null;
  contact_name?: string | null;
}

interface Contact {
  contact_id: string;
  full_name: string;
  company: string | null;
  pipeline_stage: string;
  tier: string;
  last_contact: string | null;
  next_action: string | null;
  health_score: string;
  mrr: number;
  proposal_sent_date: string | null;
  go_live_date: string | null;
}

interface Reminder {
  reminder_id: string;
  contact_id: string | null;
  message: string;
  reminder_date: string;
  priority: string;
  contact_name: string | null;
}

interface ContentItem {
  content_id: string;
  content_type: string;
  title: string | null;
  status: string;
}

interface PaperProgress {
  paper_id: string;
  title: string;
  status: string;
  current_section: string | null;
  last_updated: string | null;
}

interface PipelineSignal {
  contact_id: string;
  full_name: string;
  pipeline_stage: string;
  signal: string;
  action: string;
  urgency: 'high' | 'medium' | 'low';
  accent: string;
}

type ZoneKind = 'in_zone' | 'below_zone' | 'above_zone';

function daysSinceDate(iso: string | null): number | null {
  if (!iso) return null;
  const t = new Date(iso.replace(' ', 'T').slice(0, 10)).getTime();
  if (Number.isNaN(t)) return null;
  const d0 = new Date();
  d0.setHours(0, 0, 0, 0);
  const d1 = new Date(t);
  d1.setHours(0, 0, 0, 0);
  return Math.floor((d0.getTime() - d1.getTime()) / 86400000);
}

function formatTimeShort(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso.replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return iso.slice(11, 16) || iso;
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function truncate(s: string, n: number): string {
  if (s.length <= n) return s;
  return `${s.slice(0, n)}…`;
}

function jobIdForContentType(ct: string): string {
  if (ct === 'blog') return 'blog_builder';
  if (ct === 'linkedin') return 'linkedin_post';
  if (ct === 'bni_pitch') return 'linkedin_post';
  return 'linkedin_post';
}

function inputForContentJob(ct: string, title: string | null): string {
  const t = title ?? ct;
  if (ct === 'bni_pitch') return `BNI weekly pitch: ${t}`;
  return t;
}

export function MorningBrief() {
  const [displayName, setDisplayName] = useState('Dr. Zubia');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [papers, setPapers] = useState<PaperProgress[]>([]);
  const [totalMrr, setTotalMrr] = useState(0);
  const [loading, setLoading] = useState(true);
  const [queueHint, setQueueHint] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const db = await getDb();
      const [
        idRows,
        evRows,
        cRows,
        rRows,
        ctRows,
        pRows,
        mrrRows,
      ] = await Promise.all([
        db.select<{ full_name: string }[]>(
          `SELECT full_name FROM identity
           WHERE id = 'zubia' LIMIT 1`
        ),
        db.select<CalendarEvent[]>(
          `SELECT ce.event_id, ce.title, ce.start_time,
                  ce.end_time, ce.attendees, ce.brief_generated,
                  ce.contact_id, c.full_name AS contact_name
           FROM calendar_events ce
           LEFT JOIN contacts c
             ON ce.contact_id = c.contact_id
           WHERE date(ce.start_time) = date('now')
              OR date(ce.start_time) = date('now', '+1 day')
           ORDER BY ce.start_time ASC
           LIMIT 10`
        ),
        db.select<Contact[]>(
          `SELECT contact_id, full_name, company,
                  COALESCE(pipeline_stage, 'prospect')
                    AS pipeline_stage,
                  COALESCE(tier, 'pulse') AS tier,
                  last_contact, next_action,
                  COALESCE(health_score, 'green')
                    AS health_score,
                  COALESCE(mrr, 0) AS mrr,
                  proposal_sent_date, go_live_date
           FROM contacts
           WHERE status != 'inactive'
           ORDER BY full_name ASC`
        ),
        db.select<Reminder[]>(
          `SELECT r.reminder_id, r.contact_id, r.message,
                  r.reminder_date, r.priority,
                  c.full_name AS contact_name
           FROM client_reminders r
           LEFT JOIN contacts c
             ON r.contact_id = c.contact_id
           WHERE r.completed = 0
             AND date(r.reminder_date) <= date('now')
           ORDER BY r.reminder_date ASC`
        ),
        db.select<ContentItem[]>(
          `SELECT content_id, content_type, title, status
           FROM client_content
           WHERE status IN ('not_started', 'in_progress')
             AND contact_id IS NULL
           ORDER BY content_type ASC`
        ),
        db.select<PaperProgress[]>(
          `SELECT paper_id, title, status, current_section,
                  last_updated
           FROM paper_progress
           ORDER BY last_updated DESC
           LIMIT 3`
        ),
        db.select<{ total_mrr: number }[]>(
          `SELECT COALESCE(SUM(mrr), 0) AS total_mrr
           FROM contacts
           WHERE status = 'active'
             AND pipeline_stage = 'active_client'`
        ),
      ]);

      if (idRows.length > 0 && idRows[0].full_name) {
        setDisplayName(idRows[0].full_name.split(',')[0].trim());
      }
      setEvents(evRows);
      setContacts(cRows);
      setReminders(rRows);
      setContentItems(ctRows);
      setPapers(pRows);
      setTotalMrr(Number(mrrRows[0]?.total_mrr ?? 0));
    } catch (e) {
      console.error('MorningBrief load', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const signals = useMemo((): PipelineSignal[] => {
    const out: PipelineSignal[] = [];
    const today = new Date().toISOString().slice(0, 10);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomStr = tomorrow.toISOString().slice(0, 10);

    const eventContactToday = new Set<string>();
    for (const e of events) {
      if (!e.contact_id || !e.start_time) continue;
      const d = e.start_time.slice(0, 10);
      if (d === today || d === tomStr) {
        eventContactToday.add(e.contact_id);
      }
    }

    for (const c of contacts) {
      const stage = c.pipeline_stage || 'prospect';
      const days = daysSinceDate(c.last_contact);

      if (stage === 'prospect') {
        if (days === null || days > 7) {
          out.push({
            contact_id: c.contact_id,
            full_name: c.full_name,
            pipeline_stage: stage,
            signal: `${c.full_name} - not yet contacted`,
            action: 'Schedule Spark',
            urgency: 'medium',
            accent: C.slate,
          });
        }
        continue;
      }

      if (stage === 'spark_scheduled') {
        if (eventContactToday.has(c.contact_id)) {
          out.push({
            contact_id: c.contact_id,
            full_name: c.full_name,
            pipeline_stage: stage,
            signal: `${c.full_name} - Spark meeting soon`,
            action: 'Prepare',
            urgency: 'high',
            accent: C.teal,
          });
        }
        continue;
      }

      if (stage === 'spark_complete') {
        if (days !== null && days < 3) {
          out.push({
            contact_id: c.contact_id,
            full_name: c.full_name,
            pipeline_stage: stage,
            signal: `${c.full_name} - follow-up needed`,
            action: 'Send Follow-Up',
            urgency: 'high',
            accent: C.coral,
          });
        }
        continue;
      }

      if (stage === 'pulse_demo') {
        if (days !== null && days > 5) {
          out.push({
            contact_id: c.contact_id,
            full_name: c.full_name,
            pipeline_stage: stage,
            signal: `${c.full_name} - demo sent, awaiting decision`,
            action: 'Nudge',
            urgency: 'medium',
            accent: C.gold,
          });
        }
        continue;
      }

      if (stage === 'proposal_sent') {
        const pd = c.proposal_sent_date;
        const pdDays = daysSinceDate(pd);
        if (pd && pdDays !== null && pdDays > 7) {
          out.push({
            contact_id: c.contact_id,
            full_name: c.full_name,
            pipeline_stage: stage,
            signal: `${c.full_name} - proposal overdue response`,
            action: 'Follow Up',
            urgency: 'high',
            accent: C.coral,
          });
        }
        continue;
      }

      if (stage === 'contract_signed') {
        out.push({
          contact_id: c.contact_id,
          full_name: c.full_name,
          pipeline_stage: stage,
          signal: `${c.full_name} - build in progress`,
          action: 'Check Milestone',
          urgency: 'low',
          accent: C.navy,
        });
        continue;
      }

      if (stage === 'active_client') {
        if (days === null || days > 30) {
          out.push({
            contact_id: c.contact_id,
            full_name: c.full_name,
            pipeline_stage: stage,
            signal: `${c.full_name} - check-in overdue`,
            action: 'Check In',
            urgency: 'medium',
            accent: C.teal,
          });
        }
      }
    }

    return out;
  }, [contacts, events]);

  const highUrgencyCount = useMemo(
    () => signals.filter(s => s.urgency === 'high').length,
    [signals]
  );

  const overdueReminderCount = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return reminders.filter(r => r.reminder_date < today).length;
  }, [reminders]);

  const zone = useMemo((): ZoneKind => {
    if (
      totalMrr === 0 ||
      highUrgencyCount >= 2 ||
      overdueReminderCount >= 3
    ) {
      return 'below_zone';
    }
    return 'in_zone';
  }, [totalMrr, highUrgencyCount, overdueReminderCount]);

  const zoneLabel =
    zone === 'in_zone'
      ? 'IN ZONE'
      : zone === 'below_zone'
        ? 'BELOW ZONE'
        : 'ABOVE ZONE';

  const zoneMessage =
    zone === 'in_zone'
      ? 'System is working. Focus on high-value work today.'
      : zone === 'below_zone'
        ? 'Attention needed. Clear pipeline signals before deep work.'
        : 'Review boundaries. Some work may belong to the system not to you.';

  const goalAmount = 20000;
  const pct = Math.min(100, Math.round((totalMrr / goalAmount) * 100));
  const remaining = Math.max(0, goalAmount - totalMrr);

  const avgMrr = useMemo(() => {
    const active = contacts.filter(
      c =>
        c.pipeline_stage === 'active_client' &&
        Number(c.mrr) > 0
    );
    if (active.length === 0) return 0;
    const sum = active.reduce((s, c) => s + Number(c.mrr), 0);
    return sum / active.length;
  }, [contacts]);

  const clientsNeeded =
    avgMrr > 0 ? Math.ceil(remaining / avgMrr) : null;

  const gapLine =
    avgMrr > 0
      ? `At current pace you need ${clientsNeeded} more active clients at average MRR of ${Math.round(avgMrr)} to reach your goal.`
      : 'N/A - add client MRR to pipeline';

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const hour = new Date().getHours();
  const greet =
    hour < 12
      ? 'Good morning'
      : hour < 17
        ? 'Good afternoon'
        : 'Good evening';

  async function dismissReminder(id: string) {
    const db = await getDb();
    await db.execute(
      `UPDATE client_reminders SET completed = 1,
           completed_date = datetime('now')
       WHERE reminder_id = ?`,
      [id]
    );
    await load();
  }

  async function onSignalAction(s: PipelineSignal) {
    const body = `Contact: ${s.full_name}\nStage: ${s.pipeline_stage}\nSignal: ${s.signal}`;
    await enqueueJob('follow_up_email', body, s.contact_id);
    setQueueHint('Added to queue');
    setTimeout(() => setQueueHint(''), 2500);
  }

  async function prepareMeeting(e: CalendarEvent) {
    const input = `${e.title ?? 'Meeting'} on ${e.start_time ?? ''}`;
    await enqueueJob('meeting_summary', input, e.contact_id ?? undefined);
    setQueueHint('Added to queue');
    setTimeout(() => setQueueHint(''), 2500);
  }

  async function runContentJob(item: ContentItem) {
    const jid = jobIdForContentType(item.content_type);
    const inp = inputForContentJob(
      item.content_type,
      item.title
    );
    await enqueueJob(jid, inp, undefined);
    setQueueHint('Added to queue');
    setTimeout(() => setQueueHint(''), 2500);
  }

  const todayYmd = new Date().toISOString().slice(0, 10);

  const blogCount = contentItems.filter(
    i => i.content_type === 'blog'
  ).length;
  const linkedinCount = contentItems.filter(
    i => i.content_type === 'linkedin'
  ).length;
  const bniItems = contentItems.filter(
    i => i.content_type === 'bni_pitch'
  );

  const zonePillBg =
    zone === 'in_zone'
      ? C.green
      : zone === 'below_zone'
        ? C.gold
        : C.coral;

  const footerBg =
    zone === 'in_zone'
      ? `${C.green}18`
      : zone === 'below_zone'
        ? `${C.gold}18`
        : `${C.coral}18`;
  const footerBorder =
    zone === 'in_zone' ? C.green : zone === 'below_zone' ? C.gold : C.coral;
  const footerTitleColor = footerBorder;

  if (loading) {
    return (
      <div style={{
        padding: 32,
        color: C.slate,
        fontFamily: 'Courier New, monospace',
        fontSize: 12,
        background: C.cream,
      }}>
        Loading…
      </div>
    );
  }

  return (
    <div style={{
      padding: 32,
      background: C.cream,
      minHeight: '100%',
      boxSizing: 'border-box',
    }}>
      {queueHint && (
        <div style={{
          marginBottom: 12,
          padding: 8,
          background: `${C.teal}22`,
          borderRadius: 8,
          fontSize: 12,
          color: C.navy,
        }}>
          {queueHint}
        </div>
      )}

      <header style={{ marginBottom: 28 }}>
        <h1 style={{
          fontFamily: 'Georgia, serif',
          fontSize: 24,
          color: C.navy,
          margin: '0 0 10px 0',
        }}>
          {greet}, {displayName}.
        </h1>
        <div style={{
          fontFamily: 'Trebuchet MS, sans-serif',
          fontSize: 14,
          color: C.slate,
          marginBottom: 12,
        }}>
          Today is {todayStr}.
        </div>
        <span style={{
          display: 'inline-block',
          background: zonePillBg,
          color: C.white,
          fontFamily: 'Courier New, monospace',
          fontSize: 11,
          padding: '4px 14px',
          borderRadius: 20,
        }}>
          {zoneLabel}
        </span>
      </header>

      {/* Panel 1 */}
      <section style={{ marginBottom: 28 }}>
        <div style={{
          fontFamily: 'Courier New, monospace',
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: C.slate,
          marginBottom: 12,
        }}>
          Today&apos;s meetings
        </div>
        {events.length === 0 ? (
          <p style={{
            color: C.slate,
            fontFamily: 'Trebuchet MS, sans-serif',
            fontSize: 13,
            margin: 0,
          }}>
            No meetings today. Calendar is clear.
          </p>
        ) : (
          events.map(e => (
            <div
              key={e.event_id}
              style={{
                background: C.white,
                border: `1px solid ${C.mint}`,
                borderLeft: `4px solid ${C.gold}`,
                borderRadius: 10,
                padding: '12px 16px',
                marginBottom: 8,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: 12,
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: 13,
                  fontWeight: 700,
                  color: C.navy,
                }}>
                  {e.title ?? 'Untitled'}
                </div>
                <div style={{
                  fontFamily: 'Courier New, monospace',
                  fontSize: 11,
                  color: C.slate,
                  marginTop: 4,
                }}>
                  {formatTimeShort(e.start_time)}
                </div>
                {e.attendees && (
                  <div style={{
                    fontSize: 11,
                    color: C.slate,
                    marginTop: 4,
                    fontFamily: 'Trebuchet MS, sans-serif',
                  }}>
                    {e.attendees}
                  </div>
                )}
              </div>
              <div>
                {e.brief_generated === 1 ? (
                  <span style={{
                    background: C.green,
                    color: C.white,
                    fontSize: 10,
                    padding: '4px 10px',
                    borderRadius: 6,
                    fontFamily: 'Courier New, monospace',
                  }}>
                    Brief ready
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => prepareMeeting(e)}
                    style={{
                      background: C.teal,
                      color: C.white,
                      fontSize: 11,
                      padding: '4px 12px',
                      borderRadius: 6,
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: 'Trebuchet MS, sans-serif',
                    }}
                  >
                    Prepare
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </section>

      {/* Panel 2 */}
      <section style={{ marginBottom: 28 }}>
        <div style={{
          fontFamily: 'Courier New, monospace',
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: C.slate,
          marginBottom: 12,
        }}>
          Pipeline signals
        </div>
        {signals.length === 0 ? (
          <p style={{
            color: C.slate,
            fontFamily: 'Trebuchet MS, sans-serif',
            fontSize: 13,
            margin: 0,
          }}>
            All pipeline contacts are on track.
          </p>
        ) : (
          signals.map(s => (
            <div
              key={`${s.contact_id}-${s.pipeline_stage}-${s.signal}`}
              style={{
                background: C.white,
                border: `1px solid ${C.mint}`,
                borderLeft: `4px solid ${s.accent}`,
                borderRadius: 10,
                padding: '12px 16px',
                marginBottom: 8,
              }}
            >
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 8,
                marginBottom: 6,
              }}>
                <span style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: 13,
                  fontWeight: 700,
                  color: C.navy,
                }}>
                  {s.full_name}
                </span>
                <span style={{
                  fontFamily: 'Courier New, monospace',
                  fontSize: 9,
                  color: C.slate,
                }}>
                  {s.pipeline_stage}
                </span>
              </div>
              <div style={{
                fontSize: 12,
                color: C.slate,
                fontFamily: 'Trebuchet MS, sans-serif',
                marginBottom: 8,
              }}>
                {s.signal}
              </div>
              <div style={{ textAlign: 'right' }}>
                <button
                  type="button"
                  onClick={() => onSignalAction(s)}
                  style={{
                    background: s.accent,
                    color: C.white,
                    fontSize: 11,
                    padding: '4px 12px',
                    borderRadius: 6,
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'Trebuchet MS, sans-serif',
                  }}
                >
                  {s.action}
                </button>
              </div>
            </div>
          ))
        )}
      </section>

      {/* Panel 3 */}
      <section style={{ marginBottom: 28 }}>
        <div style={{
          fontFamily: 'Courier New, monospace',
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: C.slate,
          marginBottom: 12,
        }}>
          Reminders
        </div>
        {reminders.length === 0 ? (
          <p style={{
            color: C.slate,
            fontFamily: 'Trebuchet MS, sans-serif',
            fontSize: 13,
            margin: 0,
          }}>
            No reminders due today.
          </p>
        ) : (
          <div style={{
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            paddingBottom: 8,
          }}>
            {reminders.map(r => {
              const overdue = r.reminder_date < todayYmd;
              const bg = overdue ? C.coral : C.gold;
              const label = `${r.contact_name ?? 'General'}: ${r.message}`;
              return (
                <div
                  key={r.reminder_id}
                  style={{
                    flex: '0 0 auto',
                    maxWidth: 280,
                    background: bg,
                    color: C.white,
                    fontFamily: 'Courier New, monospace',
                    fontSize: 11,
                    padding: '6px 28px 6px 14px',
                    borderRadius: 20,
                    position: 'relative',
                  }}
                >
                  {truncate(label, 40)}
                  <button
                    type="button"
                    onClick={() => dismissReminder(r.reminder_id)}
                    style={{
                      position: 'absolute',
                      top: 4,
                      right: 8,
                      border: 'none',
                      background: 'transparent',
                      color: C.white,
                      cursor: 'pointer',
                      fontSize: 14,
                      lineHeight: 1,
                    }}
                    aria-label="Dismiss"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Panel 4 */}
      <section style={{ marginBottom: 28 }}>
        <div style={{
          fontFamily: 'Courier New, monospace',
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: C.slate,
          marginBottom: 12,
        }}>
          Revenue intelligence
        </div>
        <div style={{
          background: C.white,
          border: `1px solid ${C.mint}`,
          borderRadius: 12,
          padding: '16px 20px',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 16,
            marginBottom: 12,
          }}>
            <div>
              <div style={{
                fontFamily: 'Courier New, monospace',
                fontSize: 9,
                textTransform: 'uppercase',
                color: C.slate,
              }}>
                Current MRR
              </div>
              <div style={{
                fontFamily: 'Georgia, serif',
                fontSize: 28,
                fontWeight: 800,
                color: C.teal,
              }}>
                ${Math.round(totalMrr).toLocaleString()}
              </div>
            </div>
            <div>
              <div style={{
                fontFamily: 'Courier New, monospace',
                fontSize: 9,
                textTransform: 'uppercase',
                color: C.slate,
              }}>
                Goal
              </div>
              <div style={{
                fontFamily: 'Georgia, serif',
                fontSize: 28,
                fontWeight: 800,
                color: C.navy,
              }}>
                $20,000
              </div>
            </div>
          </div>
          <div style={{
            width: '100%',
            height: 8,
            background: C.lgray,
            borderRadius: 4,
            overflow: 'hidden',
            marginBottom: 8,
          }}>
            <div style={{
              width: `${pct}%`,
              height: '100%',
              background: C.teal,
              borderRadius: 4,
            }} />
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontFamily: 'Courier New, monospace',
            fontSize: 11,
            color: C.slate,
            marginBottom: 12,
          }}>
            <span>{pct}% of goal</span>
            <span>${remaining.toLocaleString()} remaining</span>
          </div>
          <p style={{
            margin: 0,
            fontFamily: 'Trebuchet MS, sans-serif',
            fontSize: 12,
            color: C.slate,
            lineHeight: 1.5,
          }}>
            {gapLine}
          </p>
        </div>
      </section>

      {/* Panel 5 */}
      <section style={{ marginBottom: 28 }}>
        <div style={{
          fontFamily: 'Courier New, monospace',
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: C.slate,
          marginBottom: 12,
        }}>
          Content this week
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 16,
        }}>
          <div style={{
            background: C.white,
            border: `1px solid ${C.mint}`,
            borderRadius: 10,
            padding: 14,
          }}>
            <div style={{ fontWeight: 700, color: C.navy, marginBottom: 8 }}>
              Blog post
            </div>
            <div style={{ fontSize: 12, color: C.slate }}>
              Not started: {blogCount}
            </div>
          </div>
          <div style={{
            background: C.white,
            border: `1px solid ${C.mint}`,
            borderRadius: 10,
            padding: 14,
          }}>
            <div style={{ fontWeight: 700, color: C.navy, marginBottom: 8 }}>
              LinkedIn posts
            </div>
            <div style={{ fontSize: 12, color: C.slate }}>
              Items: {linkedinCount}
            </div>
          </div>
          <div style={{
            background: C.white,
            border: `1px solid ${C.mint}`,
            borderRadius: 10,
            padding: 14,
          }}>
            <div style={{ fontWeight: 700, color: C.navy, marginBottom: 8 }}>
              BNI pitch
            </div>
            {bniItems.map(b => (
              <div key={b.content_id} style={{
                fontSize: 12,
                color: C.slate,
                marginBottom: 6,
              }}>
                {b.status}
              </div>
            ))}
            {bniItems.length === 0 && (
              <div style={{ fontSize: 12, color: C.slate }}>None</div>
            )}
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <div style={{
            fontFamily: 'Courier New, monospace',
            fontSize: 10,
            color: C.slate,
            marginBottom: 8,
          }}>
            Content rows
          </div>
          {contentItems.map(item => {
            const dot =
              item.status === 'not_started'
                ? C.coral
                : item.status === 'in_progress'
                  ? C.gold
                  : C.green;
            return (
              <div
                key={item.content_id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 0',
                  borderBottom: `1px solid ${C.mint}`,
                }}
              >
                <span style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: dot,
                  flexShrink: 0,
                }} />
                <div style={{ flex: 1, fontSize: 13, color: C.navy }}>
                  {item.content_type}
                  {item.title ? ` · ${item.title}` : ''}
                </div>
                <span style={{
                  fontFamily: 'Courier New, monospace',
                  fontSize: 9,
                  color: C.slate,
                }}>
                  {item.status}
                </span>
                <button
                  type="button"
                  onClick={() => runContentJob(item)}
                  style={{
                    background: C.teal,
                    color: C.white,
                    fontSize: 11,
                    padding: '4px 10px',
                    borderRadius: 6,
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Run job
                </button>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 20 }}>
          <div style={{
            fontFamily: 'Courier New, monospace',
            fontSize: 10,
            textTransform: 'uppercase',
            color: C.slate,
            marginBottom: 10,
          }}>
            Paper progress
          </div>
          {papers.map(p => {
            const daysPaper = daysSinceDate(p.last_updated);
            const stale =
              daysPaper !== null && daysPaper > 7;
            return (
              <div
                key={p.paper_id}
                style={{
                  background: C.white,
                  border: `1px solid ${C.mint}`,
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 8,
                }}
              >
                <div style={{
                  fontSize: 13,
                  color: C.navy,
                  fontWeight: 600,
                }}>
                  {truncate(p.title, 50)}
                </div>
                <div style={{
                  fontFamily: 'Courier New, monospace',
                  fontSize: 9,
                  color: C.slate,
                  marginTop: 4,
                }}>
                  {p.status}
                </div>
                <div style={{ fontSize: 11, color: C.slate, marginTop: 4 }}>
                  Last updated:{' '}
                  {daysPaper === null
                    ? 'unknown'
                    : `${daysPaper} days ago`}
                </div>
                {stale && (
                  <div style={{
                    marginTop: 6,
                    fontSize: 11,
                    color: C.gold,
                    fontWeight: 600,
                  }}>
                    Not updated in {daysPaper} days
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Panel 6 */}
      <footer style={{
        width: '100%',
        background: footerBg,
        border: `1px solid ${footerBorder}`,
        borderRadius: 12,
        padding: '18px 20px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 16,
      }}>
        <div style={{
          fontFamily: 'Georgia, serif',
          fontSize: 18,
          color: footerTitleColor,
          fontWeight: 700,
        }}>
          {zoneLabel}
        </div>
        <div style={{
          fontFamily: 'Trebuchet MS, sans-serif',
          fontSize: 13,
          color: C.navy,
          maxWidth: 480,
          lineHeight: 1.5,
        }}>
          {zoneMessage}
        </div>
        <div style={{
          width: '100%',
          fontFamily: 'Courier New, monospace',
          fontSize: 10,
          color: C.slate,
          marginTop: 8,
        }}>
          Zone computed from MRR, pipeline signals, and overdue items.
        </div>
      </footer>
    </div>
  );
}
