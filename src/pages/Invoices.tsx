import { useState } from 'react';
import { invoices } from '../data/mockData';

const C = {
  navy:'#2D4459', teal:'#3BBFBF', coral:'#F05F57',
  burnt:'#C8613F', slate:'#7A8F95', mint:'#C8E8E5',
  cream:'#FEFAF5', white:'#ffffff', border:'#C8E8E5',
};

const statusColor: Record<string, string> = {
  draft: C.slate, sent: C.burnt,
  paid: C.teal, overdue: C.coral,
};
const statusBg: Record<string, string> = {
  draft: '#F4F7F8', sent: '#E8A99A30',
  paid: '#C8E8E530', overdue: '#F05F5714',
};

export const Invoices = () => {
  const [filter, setFilter] = useState('All');

  const filtered = invoices.filter(i =>
    filter === 'All' || i.status === filter.toLowerCase()
  );

  const totals = {
    paid: invoices.filter(i => i.status === 'paid')
      .reduce((s, i) => s + i.amount, 0),
    outstanding: invoices.filter(i =>
      i.status === 'sent' || i.status === 'overdue')
      .reduce((s, i) => s + i.amount, 0),
    overdue: invoices.filter(i => i.status === 'overdue')
      .reduce((s, i) => s + i.amount, 0),
  };

  return (
    <div style={{ padding: '28px 32px', background: C.cream, minHeight: '100vh' }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: C.navy, marginBottom: 4 }}>
        Invoices
      </div>
      <div style={{ fontSize: 13, color: C.slate, marginBottom: 20 }}>
        Track payments and outstanding amounts
      </div>

      {/* Summary cards */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
        gap: 12, marginBottom: 24,
      }}>
        {[
          ['Collected', `$${totals.paid.toLocaleString()}`, C.teal],
          ['Outstanding', `$${totals.outstanding.toLocaleString()}`, C.burnt],
          ['Overdue', `$${totals.overdue.toLocaleString()}`, C.coral],
        ].map(([label, value, color]) => (
          <div key={label as string} style={{
            background: C.white, border: `1px solid ${C.border}`,
            borderRadius: 12, padding: '14px 18px',
          }}>
            <div style={{ fontSize: 10, color: C.slate,
              textTransform: 'uppercase', letterSpacing: '0.05em',
              marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: color as string }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {['All','Draft','Sent','Paid','Overdue'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{
              padding: '5px 14px', borderRadius: 20,
              border: `1px solid ${filter===f ? C.teal : C.border}`,
              background: filter===f ? C.mint : 'transparent',
              color: filter===f ? C.teal : C.slate,
              fontSize: 11, fontWeight: filter===f ? 700 : 400,
              cursor: 'pointer',
            }}>
            {f}
          </button>
        ))}
      </div>

      {/* Invoice table */}
      <div style={{
        background: C.white, border: `1px solid ${C.border}`,
        borderRadius: 12, overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: C.cream }}>
              {['Invoice #','Client','Issue Date','Due Date','Amount','Status'].map(h => (
                <th key={h} style={{
                  padding: '10px 14px', textAlign: 'left',
                  fontWeight: 600, color: C.slate, fontSize: 10,
                  textTransform: 'uppercase', letterSpacing: '0.04em',
                  borderBottom: `1px solid ${C.border}`,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((inv, i) => (
              <tr key={inv.id}
                style={{ background: i % 2 === 0 ? C.white : C.cream,
                  borderBottom: `1px solid ${C.border}20` }}>
                <td style={{ padding: '10px 14px', color: C.teal,
                  fontWeight: 600 }}>{inv.invoiceNumber}</td>
                <td style={{ padding: '10px 14px', color: C.navy,
                  fontWeight: 600 }}>{inv.clientName}</td>
                <td style={{ padding: '10px 14px', color: C.slate }}>
                  {inv.issueDate}</td>
                <td style={{ padding: '10px 14px', color: C.slate }}>
                  {inv.dueDate}</td>
                <td style={{ padding: '10px 14px', color: C.navy,
                  fontWeight: 700 }}>
                  ${inv.amount.toLocaleString()}</td>
                <td style={{ padding: '10px 14px' }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    padding: '2px 10px', borderRadius: 20,
                    background: statusBg[inv.status],
                    color: statusColor[inv.status],
                  }}>
                    {inv.status.toUpperCase()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
