import { useState, useEffect, useCallback } from 'react';
import { getDb } from '../services/db';

interface LogRow {
  log_id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: string | null;
  logged_at: string;
}

const ACTION_COLOR: Record<string, string> = {
  job_completed:       'var(--teal)',
  job_failed:          'var(--coral)',
  prompt_versioned:    'var(--navy)',
  prompt_restored:     'var(--gold)',
  identity_updated:    'var(--teal)',
  stz_answer_saved:    '#6B5EA8',
  aha_captured:        'var(--gold)',
  contact_added:       'var(--teal)',
  contact_updated:     'var(--slate)',
  gone_quiet_toggled:  'var(--coral)',
  goals_updated:       'var(--teal)',
  content_added:       'var(--gold)',
  draft_saved:         'var(--teal)',
  content_published:   'var(--green)',
  content_deleted:     'var(--coral)',
  correction_logged:   'var(--coral)',
};

const ACTION_CATEGORIES: Record<string, string> = {
  job_completed:       'Jobs',
  job_failed:          'Jobs',
  prompt_versioned:    'Prompts',
  prompt_restored:     'Prompts',
  identity_updated:    'Identity',
  stz_answer_saved:    'STZ',
  aha_captured:        'Capture',
  contact_added:       'Pipeline',
  contact_updated:     'Pipeline',
  gone_quiet_toggled:  'Pipeline',
  goals_updated:       'Goals',
  content_added:       'Content',
  draft_saved:         'Content',
  content_published:   'Content',
  content_deleted:     'Content',
  correction_logged:   'Jobs',
};

const FILTERS = [
  'All', 'Jobs', 'Prompts', 'STZ',
  'Capture', 'Pipeline', 'Goals', 'Content',
  'Identity',
];

export function AuditLog() {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    try {
      const db = await getDb();
      const rows = await db.select<LogRow[]>(
        `SELECT log_id, action, entity_type,
                entity_id, details, logged_at
         FROM audit_log
         ORDER BY logged_at DESC
         LIMIT 200`
      );
      setLogs(rows);
      const countRows = await db.select<{ n: number }[]>(
        `SELECT COUNT(*) as n FROM audit_log`
      );
      setTotal(countRows[0]?.n ?? 0);
    } catch (err) {
      console.error('AuditLog load:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [load]);

  const filtered = logs.filter(row => {
    const cat =
      ACTION_CATEGORIES[row.action] ?? 'Other';
    const matchFilter =
      filter === 'All' || cat === filter;
    const q = search.toLowerCase();
    const matchSearch =
      search === '' ||
      row.action.toLowerCase().includes(q) ||
      (row.details ?? '').toLowerCase().includes(q) ||
      (row.entity_type ?? '').toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

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

      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
      }}>
        <div>
          <h2 style={{ marginBottom: 4 }}>
            Audit Log
          </h2>
          <p style={{
            color: 'var(--slate)', fontSize: 13,
          }}>
            Every action. Every decision.
            Nothing is a black box.
          </p>
        </div>
        <div style={{
          fontSize: 10,
          color: 'var(--slate)',
          fontFamily: 'Courier New, monospace',
          textAlign: 'right',
        }}>
          {total.toLocaleString()} total entries
          <br />
          showing last 200
          <br />
          <span style={{
            color: 'var(--teal)',
          }}>
            live · refreshes every 5s
          </span>
        </div>
      </div>

      {/* Search */}
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search actions, details, entity..."
        style={{
          width: '100%',
          padding: '8px 12px',
          border: '1px solid var(--mgray)',
          borderRadius: 8,
          fontSize: 12,
          color: 'var(--navy)',
          marginBottom: 12,
          boxSizing: 'border-box',
        }} />

      {/* Filter tabs */}
      <div style={{
        display: 'flex', gap: 6,
        flexWrap: 'wrap', marginBottom: 20,
      }}>
        {FILTERS.map(f => (
          <button key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '5px 12px',
              borderRadius: 20,
              border: `1px solid ${filter === f
                ? 'var(--teal)'
                : 'var(--mgray)'}`,
              background: filter === f
                ? 'var(--teal2)'
                : 'transparent',
              color: filter === f
                ? 'var(--teal)'
                : 'var(--slate)',
              fontSize: 11,
              fontWeight: filter === f ? 700 : 400,
              cursor: 'pointer',
            }}>
            {f}
          </button>
        ))}
      </div>

      {/* Log count */}
      <div style={{
        fontSize: 10, color: 'var(--slate)',
        fontFamily: 'Courier New, monospace',
        marginBottom: 12,
      }}>
        {filtered.length} entries shown
      </div>

      {/* Log entries */}
      {filtered.length === 0 ? (
        <div style={{
          background: 'var(--lgray)',
          borderRadius: 10,
          padding: '20px 24px',
          fontSize: 13, color: 'var(--slate)',
          textAlign: 'center',
        }}>
          No log entries yet.
          Every action you take will appear here.
        </div>
      ) : (
        <div style={{
          background: 'var(--white)',
          border: '1px solid var(--mgray)',
          borderRadius: 12,
          overflow: 'hidden',
        }}>
          {filtered.map((row, idx) => {
            const color =
              ACTION_COLOR[row.action] ??
              'var(--slate)';
            const cat =
              ACTION_CATEGORIES[row.action] ??
              'Other';
            const isLast =
              idx === filtered.length - 1;

            return (
              <div key={row.log_id} style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: '10px 16px',
                borderBottom: isLast
                  ? 'none'
                  : '1px solid var(--lgray)',
                background: idx % 2 === 0
                  ? 'var(--white)'
                  : 'var(--cream)',
              }}>

                {/* Color dot */}
                <div style={{
                  width: 8, height: 8,
                  borderRadius: '50%',
                  background: color,
                  flexShrink: 0,
                  marginTop: 4,
                }} />

                {/* Content */}
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8, flexWrap: 'wrap',
                  }}>
                    <span style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: 'var(--navy)',
                      fontFamily:
                        'Courier New, monospace',
                    }}>
                      {row.action}
                    </span>
                    <span style={{
                      fontSize: 9,
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: 20,
                      background: `${color}18`,
                      color,
                    }}>
                      {cat}
                    </span>
                    {row.entity_type && (
                      <span style={{
                        fontSize: 10,
                        color: 'var(--slate)',
                        fontFamily:
                          'Courier New, monospace',
                      }}>
                        {row.entity_type}
                      </span>
                    )}
                  </div>
                  {row.details && (
                    <div style={{
                      fontSize: 11,
                      color: 'var(--slate)',
                      marginTop: 2,
                      lineHeight: 1.4,
                    }}>
                      {row.details}
                    </div>
                  )}
                </div>

                {/* Timestamp */}
                <div style={{
                  fontSize: 9,
                  color: 'var(--slate)',
                  fontFamily:
                    'Courier New, monospace',
                  flexShrink: 0,
                  textAlign: 'right',
                  lineHeight: 1.5,
                }}>
                  {row.logged_at
                    .slice(0, 10)}
                  <br />
                  {row.logged_at
                    .slice(11, 16)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
