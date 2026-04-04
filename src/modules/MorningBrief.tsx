import { useState, useEffect } from 'react';
import { getDb } from '../services/db';
import { enqueueJob } from '../services/jobQueueService';

interface Contact {
  contact_id: string;
  full_name: string;
  company: string | null;
  status: string;
  last_contact: string | null;
  next_action: string | null;
  gone_quiet: number;
}

interface ContentItem {
  content_id: string;
  type: string;
  title: string | null;
  topic: string | null;
  scheduled_date: string | null;
  status: string;
}

interface GoalRow {
  revenue_target: number;
  revenue_actual: number;
  builds_target: number;
  builds_actual: number;
  jobs_sold: number;
  maintenance_clients: number;
  maintenance_revenue: number;
}

export function MorningBrief() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [goal, setGoal] = useState<GoalRow | null>(null);
  const [queued, setQueued] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 12 ? 'Good morning'
    : hour < 17 ? 'Good afternoon'
    : 'Good evening';
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
    year: 'numeric',
  });
  const monthKey = now.toISOString().slice(0, 7);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const db = await getDb();

      const c = await db.select<Contact[]>(
        `SELECT contact_id, full_name, company, status,
                last_contact, next_action, gone_quiet
         FROM contacts
         WHERE status != 'inactive'
           AND (
             gone_quiet = 1
             OR next_action_date <= date('now', '+3 days')
             OR last_contact <= date('now', '-14 days')
             OR last_contact IS NULL
           )
         ORDER BY gone_quiet DESC, last_contact ASC
         LIMIT 10`
      );
      setContacts(c);

      const week = new Date();
      week.setDate(week.getDate() + 7);
      const weekStr = week.toISOString().slice(0, 10);

      const ct = await db.select<ContentItem[]>(
        `SELECT content_id, type, title, topic,
                scheduled_date, status
         FROM content_queue
         WHERE status != 'published'
           AND (scheduled_date IS NULL
                OR scheduled_date <= ?)
         ORDER BY scheduled_date ASC
         LIMIT 5`,
        [weekStr]
      );
      setContent(ct);

      const g = await db.select<GoalRow[]>(
        `SELECT revenue_target, revenue_actual,
                builds_target, builds_actual,
                jobs_sold, maintenance_clients,
                maintenance_revenue
         FROM business_goals WHERE month = ?`,
        [monthKey]
      );
      setGoal(g.length > 0 ? g[0] : null);

    } catch (err) {
      console.error('MorningBrief load error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleFollowUp(contact: Contact) {
    const input = `Contact: ${contact.full_name}
Company: ${contact.company ?? 'Unknown'}
Status: ${contact.status}
Last contact: ${contact.last_contact ?? 'Unknown'}
Next action: ${contact.next_action ?? 'Not set'}`;

    await enqueueJob('follow_up_email', input, contact.contact_id);
    setQueued(prev => new Set(prev).add(contact.contact_id));
  }

  if (loading) {
    return (
      <div style={{
        padding: 32, color: 'var(--slate)',
        fontFamily: 'Courier New, monospace', fontSize: 12,
      }}>
        Loading...
      </div>
    );
  }

  const mrr = goal
    ? goal.revenue_actual + goal.maintenance_revenue
    : 0;
  const target = goal?.revenue_target ?? 20000;
  const pct = Math.min(Math.round((mrr / target) * 100), 100);

  return (
    <div style={{ padding: 32 }}>

      {/* Greeting */}
      <div style={{
        background: 'var(--navy)',
        borderRadius: 14,
        padding: '22px 28px',
        marginBottom: 24,
      }}>
        <h1 style={{
          color: 'var(--white)',
          fontFamily: 'Georgia, serif',
          fontSize: 22, marginBottom: 4,
        }}>
          {greeting}, Zubia.
        </h1>
        <div style={{
          color: 'var(--teal2)',
          fontSize: 12,
          fontFamily: 'Courier New, monospace',
        }}>
          {dateStr}
        </div>
      </div>

      {/* Revenue snapshot */}
      <div style={{
        background: 'var(--white)',
        border: '1px solid var(--mgray)',
        borderRadius: 12,
        padding: '18px 22px',
        marginBottom: 24,
      }}>
        <div className="label" style={{ marginBottom: 8 }}>
          Business Snapshot — {monthKey}
        </div>
        <div style={{
          display: 'flex', gap: 32,
          flexWrap: 'wrap', marginBottom: 12,
        }}>
          {[
            ['Revenue this month',
              `$${mrr.toLocaleString()}`,
              `of $${target.toLocaleString()} target`],
            ['Builds this month',
              `${goal?.builds_actual ?? 0}`,
              `of ${goal?.builds_target ?? 2} target`],
            ['Jobs sold',
              `${goal?.jobs_sold ?? 0}`, ''],
            ['Maintenance clients',
              `${goal?.maintenance_clients ?? 0}`, ''],
          ].map(([label, value, sub]) => (
            <div key={label as string}>
              <div className="label">{label}</div>
              <div style={{
                fontSize: 24, fontWeight: 700,
                color: 'var(--navy)',
                fontFamily: 'Georgia, serif',
              }}>
                {value}
              </div>
              {sub && (
                <div style={{
                  fontSize: 11, color: 'var(--slate)',
                }}>
                  {sub}
                </div>
              )}
            </div>
          ))}
        </div>
        <div style={{
          height: 6, background: 'var(--teal3)',
          borderRadius: 3, overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${pct}%`,
            background: pct >= 50
              ? 'var(--teal)' : 'var(--gold)',
            borderRadius: 3,
            transition: 'width 0.4s ease',
          }} />
        </div>
        <div style={{
          fontSize: 11, color: 'var(--slate)',
          marginTop: 4,
          fontFamily: 'Courier New, monospace',
        }}>
          {pct}% of monthly target
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 20,
      }}>

        {/* Who needs attention */}
        <div>
          <div className="label" style={{ marginBottom: 10 }}>
            Who needs attention today
          </div>
          {contacts.length === 0 ? (
            <div style={{
              background: 'var(--green2)',
              borderRadius: 10, padding: '14px 16px',
              fontSize: 13, color: 'var(--green)',
              fontWeight: 600,
            }}>
              All clear — no follow-ups needed.
            </div>
          ) : contacts.map(c => (
            <div key={c.contact_id} style={{
              background: 'var(--white)',
              border: `1px solid ${c.gone_quiet
                ? 'var(--coral)' : 'var(--mgray)'}`,
              borderLeft: `4px solid ${c.gone_quiet
                ? 'var(--coral)' : 'var(--teal)'}`,
              borderRadius: 10,
              padding: '12px 14px',
              marginBottom: 8,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <div style={{
                  fontSize: 13, fontWeight: 600,
                  color: 'var(--navy)',
                }}>
                  {c.full_name}
                </div>
                <div style={{
                  fontSize: 11, color: 'var(--slate)',
                  marginTop: 2,
                }}>
                  {c.company ?? ''}
                  {c.gone_quiet
                    ? ' · ⚠ gone quiet' : ''}
                  {c.last_contact
                    ? ` · last: ${c.last_contact}` : ''}
                </div>
                {c.next_action && (
                  <div style={{
                    fontSize: 11,
                    color: 'var(--gold)',
                    marginTop: 2,
                  }}>
                    → {c.next_action}
                  </div>
                )}
              </div>
              <button
                onClick={() => handleFollowUp(c)}
                disabled={queued.has(c.contact_id)}
                style={{
                  padding: '6px 14px',
                  background: queued.has(c.contact_id)
                    ? 'var(--mgray)' : 'var(--teal)',
                  color: queued.has(c.contact_id)
                    ? 'var(--slate)' : 'var(--white)',
                  border: 'none', borderRadius: 8,
                  fontSize: 11, fontWeight: 600,
                  cursor: queued.has(c.contact_id)
                    ? 'default' : 'pointer',
                  whiteSpace: 'nowrap',
                }}>
                {queued.has(c.contact_id)
                  ? 'Queued ✓' : 'Follow Up'}
              </button>
            </div>
          ))}
        </div>

        {/* Content due */}
        <div>
          <div className="label" style={{ marginBottom: 10 }}>
            Content due this week
          </div>
          {content.length === 0 ? (
            <div style={{
              background: 'var(--lgray)',
              borderRadius: 10, padding: '14px 16px',
              fontSize: 13, color: 'var(--slate)',
            }}>
              No content scheduled this week.
            </div>
          ) : content.map(ct => (
            <div key={ct.content_id} style={{
              background: 'var(--white)',
              border: '1px solid var(--mgray)',
              borderLeft: '4px solid var(--gold)',
              borderRadius: 10,
              padding: '12px 14px',
              marginBottom: 8,
            }}>
              <div style={{
                fontSize: 13, fontWeight: 600,
                color: 'var(--navy)',
              }}>
                {ct.title ?? ct.topic ?? 'Untitled'}
              </div>
              <div style={{
                fontSize: 11, color: 'var(--slate)',
                marginTop: 2,
                fontFamily: 'Courier New, monospace',
              }}>
                {ct.type}
                {ct.scheduled_date
                  ? ` · due ${ct.scheduled_date}` : ''}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
