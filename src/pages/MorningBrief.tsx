import { clients, invoices, projects } from '../data/mockData';

const C = {
  navy:'#2D4459', teal:'#3BBFBF', coral:'#F05F57',
  burnt:'#C8613F', slate:'#7A8F95', mint:'#C8E8E5',
  cream:'#FEFAF5', white:'#ffffff', border:'#C8E8E5',
};

export const MorningBrief = () => {
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning'
    : hour < 17 ? 'Good afternoon' : 'Good evening';
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric'
  });

  const activeClients = clients.filter(c => c.status === 'active');
  const mrr = activeClients.reduce((s, c) => s + c.monthlyValue, 0);
  const mrrTarget = 20000;
  const monthsElapsed = 4;
  const totalMonths = 18;

  const ytd = invoices
    .filter(i => i.status === 'paid')
    .reduce((s, i) => s + i.amount, 0);
  const annualTarget = 240000;

  const overdueInvoices = invoices.filter(i => i.status === 'overdue');
  const sentInvoices = invoices.filter(i => i.status === 'sent');
  const activeProjects = projects.filter(p => p.status === 'active');
  const overdueTasks = projects.flatMap(p =>
    p.tasks.filter(t =>
      t.status !== 'done' && new Date(t.dueDate) < now
    )
  );

  const signals = [
    ...overdueInvoices.map(i => ({
      type: 'overdue' as const,
      label: i.clientName,
      msg: `Invoice ${i.invoiceNumber} overdue — $${i.amount.toLocaleString()}`,
    })),
    ...sentInvoices.map(i => ({
      type: 'sent' as const,
      label: i.clientName,
      msg: `Invoice ${i.invoiceNumber} sent — $${i.amount.toLocaleString()} awaiting payment`,
    })),
    ...activeProjects.filter(p => p.healthScore < 80).map(p => ({
      type: 'warning' as const,
      label: p.clientName,
      msg: `${p.name} — health score ${p.healthScore}%`,
    })),
    ...overdueTasks.slice(0, 2).map(t => ({
      type: 'task' as const,
      label: 'Overdue task',
      msg: t.description,
    })),
  ];

  const signalColor: Record<string, string> = {
    overdue: C.coral,
    sent: C.burnt,
    warning: C.burnt,
    task: C.slate,
  };
  const signalBg: Record<string, string> = {
    overdue: '#F05F5712',
    sent: '#E8A99A20',
    warning: '#E8A99A20',
    task: '#F4F7F8',
  };

  const mrrPct = Math.min(Math.round((mrr / mrrTarget) * 100), 100);
  const ytdPct = Math.min(Math.round((ytd / annualTarget) * 100), 100);

  return (
    <div style={{
      padding: '28px 32px',
      background: C.cream,
      minHeight: '100vh',
    }}>

      {/* Greeting banner */}
      <div style={{
        background: C.navy, borderRadius: 16,
        padding: '24px 28px', marginBottom: 20,
      }}>
        <div style={{
          fontSize: 24, fontWeight: 700,
          color: '#fff', marginBottom: 4,
        }}>
          {greeting}, Zubia.
        </div>
        <div style={{ fontSize: 13, color: C.mint, marginBottom: 10 }}>
          {dateStr}
        </div>
        <div style={{ fontSize: 12, color: 'rgba(200,232,229,0.75)' }}>
          Here is what needs your attention today.
        </div>
        <div style={{
          display: 'flex', gap: 20, marginTop: 14,
          flexWrap: 'wrap',
        }}>
          {[
            [`${activeClients.length} active clients`, ''],
            [`${activeProjects.length} active project${activeProjects.length !== 1 ? 's' : ''}`, ''],
            [overdueInvoices.length > 0
              ? `${overdueInvoices.length} invoice overdue`
              : 'No overdue invoices', overdueInvoices.length > 0 ? C.coral : C.mint],
            [`Month ${monthsElapsed} of ${totalMonths} to $20K MRR`, C.mint],
          ].map(([label, color], i) => (
            <div key={i} style={{
              fontSize: 12, fontWeight: 600,
              color: (color as string) || 'rgba(200,232,229,0.85)',
            }}>
              {label as string}
            </div>
          ))}
        </div>
      </div>

      {/* Two revenue cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 16, marginBottom: 20,
      }}>

        {/* MRR card */}
        <div style={{
          background: C.white,
          border: `1px solid ${C.border}`,
          borderRadius: 12, padding: '18px 22px',
        }}>
          <div style={{
            fontSize: 10, color: C.slate,
            textTransform: 'uppercase',
            letterSpacing: '0.06em', marginBottom: 6,
          }}>
            Monthly Recurring Revenue
          </div>
          <div style={{
            fontSize: 32, fontWeight: 800,
            color: C.navy, marginBottom: 2,
          }}>
            ${mrr.toLocaleString()}
            <span style={{
              fontSize: 14, fontWeight: 400,
              color: C.slate, marginLeft: 4,
            }}>/month</span>
          </div>
          <div style={{
            fontSize: 11, color: C.slate, marginBottom: 10,
          }}>
            Goal: $20,000/month by month 18
          </div>
          <div style={{
            height: 8, background: C.mint,
            borderRadius: 4, overflow: 'hidden',
            marginBottom: 6,
          }}>
            <div style={{
              height: '100%',
              width: `${mrrPct}%`,
              background: C.teal,
              borderRadius: 4,
              transition: 'width 0.4s ease',
            }} />
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 11,
          }}>
            <span style={{ color: C.slate }}>
              {mrrPct}% of goal
            </span>
            <span style={{ color: C.teal, fontWeight: 700 }}>
              ${(mrrTarget - mrr).toLocaleString()} to go
            </span>
          </div>
          <div style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: `1px solid ${C.border}`,
            fontSize: 11, color: C.slate,
          }}>
            {activeClients.map(c => (
              <div key={c.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 3,
              }}>
                <span>{c.name}</span>
                <span style={{ color: C.teal, fontWeight: 600 }}>
                  ${c.monthlyValue}/mo
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* YTD card */}
        <div style={{
          background: C.white,
          border: `1px solid ${C.border}`,
          borderRadius: 12, padding: '18px 22px',
        }}>
          <div style={{
            fontSize: 10, color: C.slate,
            textTransform: 'uppercase',
            letterSpacing: '0.06em', marginBottom: 6,
          }}>
            Year to Date Revenue
          </div>
          <div style={{
            fontSize: 32, fontWeight: 800,
            color: C.navy, marginBottom: 2,
          }}>
            ${ytd.toLocaleString()}
          </div>
          <div style={{
            fontSize: 11, color: C.slate, marginBottom: 10,
          }}>
            of $${annualTarget.toLocaleString()} annual target
            · Month {monthsElapsed} of 12
          </div>
          <div style={{
            height: 8, background: C.mint,
            borderRadius: 4, overflow: 'hidden',
            marginBottom: 6,
          }}>
            <div style={{
              height: '100%',
              width: `${ytdPct}%`,
              background: ytdPct >= 30 ? C.teal : C.burnt,
              borderRadius: 4,
              transition: 'width 0.4s ease',
            }} />
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 11,
          }}>
            <span style={{ color: C.slate }}>
              {ytdPct}% of annual target
            </span>
            <span style={{
              color: C.burnt, fontWeight: 700,
            }}>
              On track for month 4
            </span>
          </div>
          <div style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: `1px solid ${C.border}`,
          }}>
            <div style={{
              fontSize: 11, color: C.slate,
              marginBottom: 6, fontWeight: 600,
            }}>
              Path to $20K MRR
            </div>
            {[
              ['Month 6 target', '$8,000–$9,000/mo'],
              ['Month 12 target', '$13,000–$14,000/mo'],
              ['Month 18 target', '$20,000/mo'],
            ].map(([label, value]) => (
              <div key={label} style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 11, marginBottom: 3,
              }}>
                <span style={{ color: C.slate }}>{label}</span>
                <span style={{
                  color: C.navy, fontWeight: 600,
                }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Signals + Tasks */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 16,
      }}>

        {/* Signals */}
        <div>
          <div style={{
            fontSize: 13, fontWeight: 700,
            color: C.navy, marginBottom: 10,
          }}>
            Signals Needing Attention
          </div>
          {signals.length === 0 ? (
            <div style={{
              background: C.mint, borderRadius: 10,
              padding: '14px 16px',
              fontSize: 13, color: C.teal, fontWeight: 600,
            }}>
              All clear — no signals today.
            </div>
          ) : signals.map((s, i) => (
            <div key={i} style={{
              background: signalBg[s.type],
              borderLeft: `4px solid ${signalColor[s.type]}`,
              borderRadius: 10,
              padding: '12px 14px',
              marginBottom: 8,
            }}>
              <div style={{
                fontSize: 13, fontWeight: 600, color: C.navy,
              }}>
                {s.label}
              </div>
              <div style={{
                fontSize: 11, color: C.slate, marginTop: 2,
              }}>
                {s.msg}
              </div>
            </div>
          ))}
        </div>

        {/* Active tasks */}
        <div>
          <div style={{
            fontSize: 13, fontWeight: 700,
            color: C.navy, marginBottom: 10,
          }}>
            Active Project Tasks
          </div>
          {activeProjects.flatMap(p =>
            p.tasks
              .filter(t => t.status !== 'done')
              .slice(0, 2)
              .map(t => ({
                ...t,
                projectName: p.name,
                clientName: p.clientName,
              }))
          ).slice(0, 6).map((t, i) => (
            <div key={i} style={{
              background: C.white,
              border: `1px solid ${C.border}`,
              borderRadius: 10,
              padding: '10px 14px',
              marginBottom: 8,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}>
              <div>
                <div style={{
                  fontSize: 12, fontWeight: 600, color: C.navy,
                }}>
                  {t.description}
                </div>
                <div style={{
                  fontSize: 10, color: C.slate, marginTop: 2,
                }}>
                  {t.clientName} · {t.projectName}
                </div>
              </div>
              <span style={{
                fontSize: 9, fontWeight: 700,
                padding: '2px 8px', borderRadius: 20,
                background: t.priority === 'high'
                  ? '#F05F5714' : '#C8E8E520',
                color: t.priority === 'high' ? C.coral : C.teal,
              }}>
                {t.priority}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
