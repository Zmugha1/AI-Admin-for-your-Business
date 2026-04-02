import { useState } from 'react';
import { clients } from '../data/mockData';
import { Client } from '../types';

const C = {
  navy:'#2D4459', teal:'#3BBFBF', coral:'#F05F57',
  burnt:'#C8613F', slate:'#7A8F95', mint:'#C8E8E5',
  cream:'#FEFAF5', white:'#ffffff', border:'#C8E8E5',
  lightgray:'#F4F7F8',
};

const statusColor: Record<string, string> = {
  active: C.teal, prospect: C.burnt,
  paused: C.slate, closed: '#ccc',
};
const statusBg: Record<string, string> = {
  active: '#C8E8E520', prospect: '#E8A99A30',
  paused: '#F4F7F8', closed: '#f0f0f0',
};

export const Clients = () => {
  const [selected, setSelected] = useState<Client | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  const filtered = clients.filter(c => {
    const ms = filter === 'All' || c.status === filter.toLowerCase();
    const mq = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.company.toLowerCase().includes(search.toLowerCase());
    return ms && mq;
  });

  return (
    <div style={{
      display: 'flex', height: '100vh',
      background: C.cream,
    }}>
      {/* List panel */}
      <div style={{
        width: 270, minWidth: 270,
        background: C.white,
        borderRight: `1px solid ${C.border}`,
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '16px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 13, fontWeight: 700,
            color: C.navy, marginBottom: 10 }}>
            Clients
          </div>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search clients..."
            style={{
              width: '100%', padding: '7px 12px',
              border: `1px solid ${C.border}`,
              borderRadius: 8, fontSize: 12,
              color: C.navy, boxSizing: 'border-box',
              background: C.lightgray,
            }} />
          <div style={{
            display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap',
          }}>
            {['All','Active','Prospect','Paused'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{
                  padding: '3px 10px', borderRadius: 20,
                  border: `1px solid ${filter===f ? C.teal : C.border}`,
                  background: filter===f ? C.mint : 'transparent',
                  color: filter===f ? C.teal : C.slate,
                  fontSize: 10, fontWeight: filter===f ? 700 : 400,
                  cursor: 'pointer',
                }}>
                {f}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filtered.map(c => (
            <div key={c.id}
              onClick={() => setSelected(c)}
              style={{
                padding: '12px 16px', cursor: 'pointer',
                borderBottom: `1px solid ${C.border}20`,
                borderLeft: selected?.id === c.id
                  ? `3px solid ${C.teal}` : '3px solid transparent',
                background: selected?.id === c.id
                  ? 'rgba(59,191,191,0.06)' : 'transparent',
              }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>
                  {c.name}
                </div>
                <span style={{
                  fontSize: 9, fontWeight: 700,
                  padding: '2px 7px', borderRadius: 20,
                  background: statusBg[c.status],
                  color: statusColor[c.status],
                }}>
                  {c.status}
                </span>
              </div>
              <div style={{ fontSize: 11, color: C.slate, marginTop: 2 }}>
                {c.company}
              </div>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                marginTop: 4,
              }}>
                <span style={{ fontSize: 10, color: C.slate }}>
                  {c.vertical}
                </span>
                {c.monthlyValue > 0 && (
                  <span style={{ fontSize: 10, color: C.teal, fontWeight: 600 }}>
                    ${c.monthlyValue}/mo
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail panel */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
        {!selected ? (
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', height: '100%',
            flexDirection: 'column', gap: 12,
          }}>
            <div style={{ fontSize: 40, color: C.mint }}>👤</div>
            <div style={{ fontSize: 14, color: C.slate }}>
              Select a client to view their profile
            </div>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center',
              gap: 16, marginBottom: 24,
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: '50%',
                background: C.mint,
                display: 'flex', alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18, fontWeight: 700, color: C.navy,
              }}>
                {selected.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, color: C.navy }}>
                  {selected.name}
                </div>
                <div style={{ fontSize: 13, color: C.slate, marginTop: 2 }}>
                  {selected.company} · {selected.vertical}
                </div>
              </div>
              <span style={{
                marginLeft: 'auto', fontSize: 11, fontWeight: 700,
                padding: '4px 12px', borderRadius: 20,
                background: statusBg[selected.status],
                color: statusColor[selected.status],
              }}>
                {selected.status.toUpperCase()}
              </span>
            </div>

            {/* Info cards */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr',
              gap: 12, marginBottom: 20,
            }}>
              {[
                ['Email', selected.email],
                ['Phone', selected.phone],
                ['Monthly Value',
                  selected.monthlyValue > 0
                    ? `$${selected.monthlyValue}/month` : 'Not started'],
                ['Health Score', `${selected.healthScore}%`],
                ['Client Since',
                  selected.startDate || 'Prospect'],
                ['Last Contact', selected.lastContact],
              ].map(([k, v]) => (
                <div key={k} style={{
                  background: C.cream, borderRadius: 8,
                  padding: '10px 14px',
                }}>
                  <div style={{ fontSize: 10, color: C.slate,
                    textTransform: 'uppercase', letterSpacing: '0.04em',
                    marginBottom: 4 }}>{k}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.navy }}>
                    {v}
                  </div>
                </div>
              ))}
            </div>

            {/* Notes */}
            <div style={{
              background: C.white, border: `1px solid ${C.border}`,
              borderLeft: `4px solid ${C.teal}`,
              borderRadius: 10, padding: '14px 16px',
            }}>
              <div style={{ fontSize: 11, color: C.teal, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.05em',
                marginBottom: 6 }}>Notes</div>
              <div style={{ fontSize: 13, color: C.navy, lineHeight: 1.6 }}>
                {selected.notes || 'No notes yet.'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
