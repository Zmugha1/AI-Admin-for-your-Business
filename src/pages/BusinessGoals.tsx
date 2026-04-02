import { LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer } from 'recharts';
import { clients, invoices, proposals,
  revenueByMonth } from '../data/mockData';

const C = {
  navy:'#2D4459', teal:'#3BBFBF', coral:'#F05F57',
  burnt:'#C8613F', slate:'#7A8F95', mint:'#C8E8E5',
  cream:'#FEFAF5', white:'#ffffff', border:'#C8E8E5',
};

interface KPIProps {
  label: string;
  value: string | number;
  sub: string;
  note?: string;
  color?: string;
  progress?: number;
}

const KPI = ({ label, value, sub, note, color = C.teal, progress }: KPIProps) => (
  <div style={{
    background: C.white, border: `1px solid ${C.border}`,
    borderRadius: 12, padding: '14px 16px',
  }}>
    <div style={{ fontSize: 10, color: C.slate, textTransform: 'uppercase',
      letterSpacing: '0.05em', marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 24, fontWeight: 700, color: C.navy, marginBottom: 4 }}>
      {value}
    </div>
    {progress !== undefined && (
      <div style={{ height: 4, background: C.mint, borderRadius: 2,
        overflow: 'hidden', marginBottom: 4 }}>
        <div style={{ height: '100%', width: `${progress}%`,
          background: C.teal, borderRadius: 2 }} />
      </div>
    )}
    <div style={{ fontSize: 11, color: C.slate }}>{sub}</div>
    {note && <div style={{ fontSize: 10, color, fontWeight: 600, marginTop: 3 }}>
      {note}
    </div>}
  </div>
);

export const BusinessGoals = () => {
  const mrr = clients.filter(c => c.status === 'active')
    .reduce((s, c) => s + c.monthlyValue, 0);
  const ytd = invoices.filter(i => i.status === 'paid')
    .reduce((s, i) => s + i.amount, 0);
  const outstanding = invoices.filter(i =>
    i.status === 'sent' || i.status === 'overdue')
    .reduce((s, i) => s + i.amount, 0);
  const pipelineValue = proposals.filter(p =>
    p.status === 'sent' || p.status === 'viewed')
    .reduce((s, p) => s + p.value, 0);
  const activeClients = clients.filter(c => c.status === 'active').length;
  const target = 240000;

  return (
    <div style={{ padding: '28px 32px', background: C.cream, minHeight: '100vh' }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: C.navy, marginBottom: 4 }}>
        Business Goals
      </div>
      <div style={{ fontSize: 13, color: C.slate, marginBottom: 20 }}>
        Your $240,000 year — year to date
      </div>

      <div style={{ display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))',
        gap: 12, marginBottom: 24 }}>
        <KPI label="YTD Revenue" value={`$${ytd.toLocaleString()}`}
          sub={`of $${target.toLocaleString()} target`}
          note={`Projected $${Math.round(mrr * 12).toLocaleString()} ARR`}
          progress={Math.round((ytd / target) * 100)} />
        <KPI label="Monthly Recurring" value={`$${mrr.toLocaleString()}`}
          sub="from active clients"
          note={`${activeClients} active clients`} />
        <KPI label="Outstanding" value={`$${outstanding.toLocaleString()}`}
          sub="invoices sent — awaiting payment"
          note={outstanding > 0 ? "Follow up on overdue" : "All clear"}
          color={outstanding > 1000 ? C.coral : C.teal} />
        <KPI label="Pipeline Value" value={`$${pipelineValue.toLocaleString()}`}
          sub="proposals sent — not yet accepted"
          note="Potential first-year value" />
        <KPI label="Active Clients" value={activeClients}
          sub={`of ${clients.length} total clients`}
          progress={Math.round((activeClients / clients.length) * 100)} />
        <KPI label="Win Rate" value="75%"
          sub="proposals accepted this year"
          note="3 of 4 proposals closed" />
      </div>

      <div style={{
        background: C.white, border: `1px solid ${C.border}`,
        borderRadius: 12, padding: '18px 20px',
      }}>
        <div style={{ fontSize: 13, fontWeight: 700,
          color: C.navy, marginBottom: 16 }}>
          Revenue by Month
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={revenueByMonth}>
            <XAxis dataKey="month"
              tick={{ fontSize: 11, fill: C.slate }}
              axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: C.slate }}
              axisLine={false} tickLine={false}
              tickFormatter={v => `$${v / 1000}k`} />
            <Tooltip
              formatter={(v) => `$${Number(v).toLocaleString()}`}
              contentStyle={{
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                fontSize: 12,
              }} />
            <Line type="monotone" dataKey="actual"
              stroke={C.teal} strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="proj"
              stroke={C.teal} strokeWidth={2}
              strokeDasharray="5 4" dot={false} opacity={0.5} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
