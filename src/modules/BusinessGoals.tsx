import { useState, useEffect } from 'react';
import { getDb } from '../services/db';
import { v4 as uuidv4 } from 'uuid';
import {
  LineChart, Line, XAxis, YAxis,
  Tooltip, ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface GoalRow {
  goal_id: string;
  month: string;
  revenue_target: number;
  revenue_actual: number;
  builds_target: number;
  builds_actual: number;
  jobs_sold: number;
  maintenance_clients: number;
  maintenance_revenue: number;
  notes: string | null;
}

const MONTH_TARGET = 20000;

type GoalNumericKey =
  | 'revenue_target'
  | 'revenue_actual'
  | 'builds_target'
  | 'builds_actual'
  | 'jobs_sold'
  | 'maintenance_clients'
  | 'maintenance_revenue';

export function BusinessGoals() {
  const [goals, setGoals] = useState<GoalRow[]>([]);
  const [current, setCurrent] =
    useState<GoalRow | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<GoalRow>>({});
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const monthKey = new Date()
    .toISOString().slice(0, 7);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const db = await getDb();

      const existing = await db.select<{ goal_id: string }[]>(
        `SELECT goal_id FROM business_goals
         WHERE month = ?`,
        [monthKey]
      );
      if (existing.length === 0) {
        await db.execute(
          `INSERT INTO business_goals
             (goal_id, month, revenue_target)
           VALUES (?, ?, ?)`,
          [uuidv4(), monthKey, MONTH_TARGET]
        );
      }

      const rows = await db.select<GoalRow[]>(
        `SELECT goal_id, month, revenue_target,
                revenue_actual, builds_target,
                builds_actual, jobs_sold,
                maintenance_clients,
                maintenance_revenue, notes
         FROM business_goals
         ORDER BY month ASC`
      );
      setGoals(rows);

      const cur = rows.find(
        r => r.month === monthKey
      ) ?? null;
      setCurrent(cur);
      if (cur) {
        setForm({
          revenue_target: cur.revenue_target,
          revenue_actual: cur.revenue_actual,
          builds_target: cur.builds_target,
          builds_actual: cur.builds_actual,
          jobs_sold: cur.jobs_sold,
          maintenance_clients:
            cur.maintenance_clients,
          maintenance_revenue:
            cur.maintenance_revenue,
          notes: cur.notes ?? '',
        });
      }
    } catch (err) {
      console.error('BusinessGoals load:', err);
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    if (!current) return;
    const db = await getDb();
    await db.execute(
      `UPDATE business_goals SET
         revenue_target = ?,
         revenue_actual = ?,
         builds_target = ?,
         builds_actual = ?,
         jobs_sold = ?,
         maintenance_clients = ?,
         maintenance_revenue = ?,
         notes = ?,
         updated_at = datetime('now')
       WHERE goal_id = ?`,
      [
        Number(form.revenue_target ?? 20000),
        Number(form.revenue_actual ?? 0),
        Number(form.builds_target ?? 2),
        Number(form.builds_actual ?? 0),
        Number(form.jobs_sold ?? 0),
        Number(form.maintenance_clients ?? 0),
        Number(form.maintenance_revenue ?? 0),
        form.notes || null,
        current.goal_id,
      ]
    );
    await db.execute(
      `INSERT INTO audit_log
         (log_id, action, entity_type,
          entity_id, details)
       VALUES (?, 'goals_updated',
               'business_goals', ?, ?)`,
      [
        uuidv4(), current.goal_id,
        `Month: ${monthKey}`,
      ]
    );
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setEditing(false);
    await load();
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

  const mrr = current
    ? current.revenue_actual +
      current.maintenance_revenue
    : 0;
  const target =
    current?.revenue_target ?? MONTH_TARGET;
  const pct = Math.min(
    Math.round((mrr / target) * 100), 100
  );

  const chartData = goals.map(g => ({
    month: g.month.slice(5),
    actual: g.revenue_actual +
      g.maintenance_revenue,
    target: g.revenue_target,
  }));

  const numInput = (
    label: string,
    key: GoalNumericKey,
    prefix = ''
  ) => (
    <div>
      <div className="label"
        style={{ marginBottom: 4 }}>
        {label}
      </div>
      <div style={{
        display: 'flex', alignItems: 'center',
        gap: 4,
      }}>
        {prefix && (
          <span style={{
            fontSize: 13, color: 'var(--slate)',
          }}>
            {prefix}
          </span>
        )}
        <input
          type="number"
          value={Number(form[key] ?? 0)}
          onChange={e => setForm({
            ...form,
            [key]: Number(e.target.value),
          })}
          style={{
            width: '100%',
            padding: '7px 10px',
            border: '1px solid var(--mgray)',
            borderRadius: 8,
            fontSize: 13,
            color: 'var(--navy)',
          }} />
      </div>
    </div>
  );

  const milestones: [string, string, boolean][] = [
    ['Month 6',
      '$8,000–$9,000/mo',
      mrr >= 8000],
    ['Month 12',
      '$13,000–$14,000/mo',
      mrr >= 13000],
    ['Month 18',
      '$20,000/mo',
      mrr >= 20000],
  ];

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
            Business Goals
          </h2>
          <p style={{
            color: 'var(--slate)', fontSize: 13,
          }}>
            Your path to $20,000 MRR.
            Month by month.
          </p>
        </div>
        <button
          onClick={() => setEditing(!editing)}
          style={{
            padding: '7px 16px',
            background: editing
              ? 'var(--mgray)' : 'var(--teal)',
            color: editing
              ? 'var(--slate)' : 'var(--white)',
            border: 'none', borderRadius: 8,
            fontSize: 12, fontWeight: 700,
            cursor: 'pointer',
          }}>
          {editing ? 'Cancel' : 'Update Month'}
        </button>
      </div>

      {/* MRR progress */}
      <div style={{
        background: 'var(--navy)',
        borderRadius: 14,
        padding: '22px 28px',
        marginBottom: 20,
      }}>
        <div style={{
          fontSize: 10,
          color: 'var(--teal2)',
          fontFamily: 'Courier New, monospace',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: 6,
        }}>
          Monthly Recurring Revenue — {monthKey}
        </div>
        <div style={{
          fontSize: 36, fontWeight: 800,
          color: 'var(--white)',
          fontFamily: 'Georgia, serif',
          marginBottom: 4,
        }}>
          ${mrr.toLocaleString()}
          <span style={{
            fontSize: 14, fontWeight: 400,
            color: 'var(--teal2)',
            marginLeft: 6,
          }}>
            / month
          </span>
        </div>
        <div style={{
          fontSize: 12, color: 'var(--slate)',
          marginBottom: 12,
        }}>
          Goal: $20,000/month ·{' '}
          ${(MONTH_TARGET - mrr).toLocaleString()}{' '}
          to go
        </div>
        <div style={{
          height: 8,
          background: 'rgba(200,232,229,0.2)',
          borderRadius: 4, overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${pct}%`,
            background: pct >= 50
              ? 'var(--teal)' : 'var(--gold)',
            borderRadius: 4,
            transition: 'width 0.4s ease',
          }} />
        </div>
        <div style={{
          fontSize: 11, color: 'var(--teal2)',
          marginTop: 6,
          fontFamily: 'Courier New, monospace',
        }}>
          {pct}% of monthly target
        </div>
      </div>

      {/* KPI cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns:
          'repeat(auto-fit, minmax(160px, 1fr))',
        gap: 12, marginBottom: 24,
      }}>
        {([
          ['Builds This Month',
            `${current?.builds_actual ?? 0}`,
            `of ${current?.builds_target ?? 2} target`],
          ['Jobs Sold',
            `${current?.jobs_sold ?? 0}`,
            'this month'],
          ['Maintenance Clients',
            `${current?.maintenance_clients ?? 0}`,
            'active retainers'],
          ['Maintenance Revenue',
            `$${(current?.maintenance_revenue ?? 0)
              .toLocaleString()}`,
            'recurring this month'],
        ] as const).map(([label, value, sub]) => (
          <div key={label} style={{
            background: 'var(--white)',
            border: '1px solid var(--mgray)',
            borderRadius: 12,
            padding: '14px 16px',
          }}>
            <div className="label"
              style={{ marginBottom: 6 }}>
              {label}
            </div>
            <div style={{
              fontSize: 26, fontWeight: 800,
              color: 'var(--navy)',
              fontFamily: 'Georgia, serif',
            }}>
              {value}
            </div>
            <div style={{
              fontSize: 11, color: 'var(--slate)',
              marginTop: 2,
            }}>
              {sub}
            </div>
          </div>
        ))}
      </div>

      {/* Edit form */}
      {editing && (
        <div style={{
          background: 'var(--white)',
          border: '1px solid var(--mgray)',
          borderTop: '4px solid var(--teal)',
          borderRadius: 12,
          padding: '20px 24px',
          marginBottom: 24,
        }}>
          <div style={{
            fontSize: 13, fontWeight: 700,
            color: 'var(--navy)', marginBottom: 16,
          }}>
            Update {monthKey}
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12, marginBottom: 12,
          }}>
            {numInput(
              'Revenue Target',
              'revenue_target', '$'
            )}
            {numInput(
              'Revenue Actual',
              'revenue_actual', '$'
            )}
            {numInput(
              'Builds Target',
              'builds_target'
            )}
            {numInput(
              'Builds Actual',
              'builds_actual'
            )}
            {numInput('Jobs Sold', 'jobs_sold')}
            {numInput(
              'Maintenance Clients',
              'maintenance_clients'
            )}
            {numInput(
              'Maintenance Revenue',
              'maintenance_revenue', '$'
            )}
          </div>
          <div className="label"
            style={{ marginBottom: 4 }}>
            Notes
          </div>
          <textarea
            value={form.notes ?? ''}
            onChange={e => setForm({
              ...form, notes: e.target.value,
            })}
            rows={2}
            placeholder="Any notes about this month..."
            style={{
              width: '100%',
              padding: '8px 10px',
              border: '1px solid var(--mgray)',
              borderRadius: 8,
              fontSize: 12,
              color: 'var(--navy)',
              resize: 'vertical',
              fontFamily: 'Trebuchet MS, sans-serif',
              marginBottom: 12,
            }} />
          <button
            onClick={save}
            style={{
              padding: '8px 20px',
              background: saved
                ? 'var(--green)' : 'var(--teal)',
              color: 'var(--white)',
              border: 'none', borderRadius: 8,
              fontSize: 12, fontWeight: 700,
              cursor: 'pointer',
            }}>
            {saved ? 'Saved ✓' : 'Save Month'}
          </button>
        </div>
      )}

      {/* Revenue chart */}
      {chartData.length > 0 && (
        <div style={{
          background: 'var(--white)',
          border: '1px solid var(--mgray)',
          borderRadius: 12,
          padding: '18px 20px',
          marginBottom: 20,
        }}>
          <div className="label"
            style={{ marginBottom: 16 }}>
            Revenue by Month
          </div>
          <ResponsiveContainer
            width="100%" height={220}>
            <LineChart data={chartData}>
              <XAxis dataKey="month"
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false} />
              <YAxis
                tick={{ fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={v =>
                  `$${(Number(v) / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(value) =>
                  [`$${Number(value).toLocaleString()}`,
                    '']}
                contentStyle={{
                  borderRadius: 8,
                  fontSize: 12,
                  border:
                    '1px solid var(--mgray)',
                }} />
              <ReferenceLine
                y={MONTH_TARGET}
                stroke="var(--coral)"
                strokeDasharray="4 3"
                label={{
                  value: '$20K goal',
                  fontSize: 10,
                  fill: 'var(--coral)',
                }} />
              <Line
                type="monotone"
                dataKey="actual"
                stroke="var(--teal)"
                strokeWidth={2.5}
                dot={{ r: 4 }}
                name="Actual" />
              <Line
                type="monotone"
                dataKey="target"
                stroke="var(--mgray)"
                strokeWidth={1.5}
                strokeDasharray="4 3"
                dot={false}
                name="Target" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Path to $20K */}
      <div style={{
        background: 'var(--white)',
        border: '1px solid var(--mgray)',
        borderRadius: 12,
        padding: '16px 20px',
      }}>
        <div className="label"
          style={{ marginBottom: 12 }}>
          Path to $20K MRR
        </div>
        {milestones.map(([label, value, done]) => (
          <div key={label} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 0',
            borderBottom: '1px solid var(--lgray)',
          }}>
            <div style={{
              fontSize: 12, color: 'var(--slate)',
            }}>
              {done
                ? '✓ ' : ''}{label}
            </div>
            <div style={{
              fontSize: 12, fontWeight: 700,
              color: done
                ? 'var(--teal)' : 'var(--navy)',
            }}>
              {value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
