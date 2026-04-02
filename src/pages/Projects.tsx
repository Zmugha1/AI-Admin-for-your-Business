import { useState } from 'react';
import { projects } from '../data/mockData';
import { Project } from '../types';

const C = {
  navy:'#2D4459', teal:'#3BBFBF', coral:'#F05F57',
  burnt:'#C8613F', slate:'#7A8F95', mint:'#C8E8E5',
  cream:'#FEFAF5', white:'#ffffff', border:'#C8E8E5',
};

const statusColor: Record<string, string> = {
  scoping: C.slate, active: C.teal,
  review: C.burnt, delivered: C.teal,
  complete: C.slate,
};

export const Projects = () => {
  const [selected, setSelected] = useState<Project | null>(null);

  return (
    <div style={{ display: 'flex', height: '100vh', background: C.cream }}>

      {/* List */}
      <div style={{
        width: 270, background: C.white,
        borderRight: `1px solid ${C.border}`,
        overflowY: 'auto',
      }}>
        <div style={{ padding: '16px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.navy }}>
            Projects
          </div>
        </div>
        {projects.map(p => (
          <div key={p.id}
            onClick={() => setSelected(p)}
            style={{
              padding: '12px 16px', cursor: 'pointer',
              borderBottom: `1px solid ${C.border}20`,
              borderLeft: selected?.id === p.id
                ? `3px solid ${C.teal}` : '3px solid transparent',
              background: selected?.id === p.id
                ? 'rgba(59,191,191,0.06)' : 'transparent',
            }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>
                {p.name}
              </div>
              <span style={{
                fontSize: 9, fontWeight: 700,
                padding: '2px 7px', borderRadius: 20,
                background: `${statusColor[p.status]}18`,
                color: statusColor[p.status],
              }}>
                {p.status}
              </span>
            </div>
            <div style={{ fontSize: 11, color: C.slate, marginTop: 2 }}>
              {p.clientName}
            </div>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              marginTop: 4,
            }}>
              <span style={{ fontSize: 10, color: C.slate }}>
                {p.tasks.filter(t => t.status === 'done').length}/
                {p.tasks.length} tasks
              </span>
              <span style={{ fontSize: 10, color: C.teal, fontWeight: 600 }}>
                ${p.value.toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Detail */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
        {!selected ? (
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', height: '100%',
            flexDirection: 'column', gap: 12,
          }}>
            <div style={{ fontSize: 14, color: C.slate }}>
              Select a project to view details
            </div>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 22, fontWeight: 700,
                color: C.navy, marginBottom: 4 }}>{selected.name}</div>
              <div style={{ fontSize: 13, color: C.slate }}>
                {selected.clientName} · ${selected.value.toLocaleString()}
                · {selected.startDate} → {selected.endDate}
              </div>
            </div>

            {/* Milestones */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700,
                color: C.navy, marginBottom: 10 }}>Milestones</div>
              {selected.milestones.map(m => (
                <div key={m.id} style={{
                  background: C.white, border: `1px solid ${C.border}`,
                  borderRadius: 10, padding: '12px 16px',
                  marginBottom: 8, display: 'flex',
                  justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>
                      {m.name}
                    </div>
                    <div style={{ fontSize: 11, color: C.slate, marginTop: 2 }}>
                      Due {m.dueDate}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.teal }}>
                      ${m.payment.toLocaleString()}
                    </div>
                    <span style={{
                      fontSize: 9, fontWeight: 700,
                      padding: '2px 8px', borderRadius: 20,
                      background: m.status === 'complete'
                        ? '#C8E8E530' : '#F4F7F8',
                      color: m.status === 'complete' ? C.teal : C.slate,
                    }}>
                      {m.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Tasks */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 700,
                color: C.navy, marginBottom: 10 }}>Tasks</div>
              {selected.tasks.map(t => (
                <div key={t.id} style={{
                  background: C.white, border: `1px solid ${C.border}`,
                  borderLeft: `4px solid ${t.status === 'done'
                    ? C.teal : t.priority === 'high'
                    ? C.coral : C.border}`,
                  borderRadius: 10, padding: '10px 16px',
                  marginBottom: 6, display: 'flex',
                  justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div>
                    <div style={{
                      fontSize: 12, fontWeight: 600, color: C.navy,
                      textDecoration: t.status === 'done'
                        ? 'line-through' : 'none',
                      opacity: t.status === 'done' ? 0.5 : 1,
                    }}>
                      {t.description}
                    </div>
                    <div style={{ fontSize: 10, color: C.slate, marginTop: 2 }}>
                      Due {t.dueDate}
                    </div>
                  </div>
                  <span style={{
                    fontSize: 9, fontWeight: 700,
                    padding: '2px 8px', borderRadius: 20,
                    background: t.status === 'done'
                      ? '#C8E8E530'
                      : t.status === 'in_progress'
                      ? '#E8A99A30' : '#F4F7F8',
                    color: t.status === 'done'
                      ? C.teal
                      : t.status === 'in_progress'
                      ? C.burnt : C.slate,
                  }}>
                    {t.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
