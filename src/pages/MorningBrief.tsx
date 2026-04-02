import { clients, invoices, projects } from '../data/mockData';

const C = {
  navy:'#2D4459', teal:'#3BBFBF', coral:'#F05F57',
  burnt:'#C8613F', slate:'#7A8F95', mint:'#C8E8E5',
  cream:'#FEFAF5', white:'#ffffff', border:'#C8E8E5',
};

export const MorningBrief = () => {
  const now = new Date();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning'
    : hour < 17 ? 'Good afternoon' : 'Good evening';
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric'
  });

  const overdueInvoices = invoices.filter(i => i.status === 'overdue');
  const activeProjects = projects.filter(p => p.status === 'active');
  const overdueTasks = projects.flatMap(p =>
    p.tasks.filter(t => t.status !== 'done' &&
      new Date(t.dueDate) < now)
  );
  const mrr = clients
    .filter(c => c.status === 'active')
    .reduce((s, c) => s + c.monthlyValue, 0);
  const annualTarget = 240000;
  const ytd = invoices
    .filter(i => i.status === 'paid')
    .reduce((s, i) => s + i.amount, 0);

  const signals = [
    ...overdueInvoices.map(i => ({
      type: 'overdue' as const,
      label: i.clientName,
      msg: `Invoice ${i.invoiceNumber} overdue — $${i.amount.toLocaleString()}`,
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

  const signalColors: Record<string, string> = {
    overdue: C.coral, warning: C.burnt, task: C.slate,
  };
  const signalBg: Record<string, string> = {
    overdue: '#F05F5714', warning: '#E8A99A30', task: '#F4F7F8',
  };

  return (
    <div style={{ padding: '28px 32px', background: C.cream, minHeight: '100vh' }}>

      {/* Greeting */}
      <div style={{
        background: C.navy, borderRadius: 16,
        padding: '22px 28px', marginBottom: 20,
      }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
          {greeting}, Zubia.
        </div>
        <div style={{ fontSize: 13, color: C.mint, marginBottom: 8 }}>{dateStr}</div>
        <div style={{ fontSize: 12, color: 'rgba(200,232,229,0.95)', marginBottom: 6 }}>
          Here is what needs your attention today.
        </div>
        <div style={{ fontSize: 12, color: 'rgba(200,232,229,0.8)' }}>
          {overdueInvoices.length > 0
            ? `${overdueInvoices.length} invoice${overdueInvoices.length > 1 ? 's' : ''} overdue · `
            : ''}
          {activeProjects.length} active project{activeProjects.length !== 1 ? 's' : ''} ·
          {' '}{clients.filter(c => c.status === 'active').length} active clients
        </div>
      </div>

      {/* Revenue pulse */}
      <div style={{
        background: C.white, border: `1px solid ${C.border}`,
        borderRadius: 12, padding: '16px 20px', marginBottom: 20,
        display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap',
      }}>
        <div>
          <div style={{ fontSize: 10, color: C.slate, textTransform: 'uppercase',
            letterSpacing: '0.05em', marginBottom: 4 }}>Annual Target</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: C.navy }}>
            ${annualTarget.toLocaleString()}
          </div>
          <div style={{ fontSize: 11, color: C.slate, marginTop: 2 }}>
            YTD collected: ${ytd.toLocaleString()}
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{
            height: 8, background: C.mint, borderRadius: 4, overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${Math.min((ytd / annualTarget) * 100, 100)}%`,
              background: C.teal, borderRadius: 4,
            }} />
          </div>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            marginTop: 6, fontSize: 11,
          }}>
            <span style={{ color: C.slate }}>
              {Math.round((ytd / annualTarget) * 100)}% of target
            </span>
            <span style={{ color: C.teal, fontWeight: 600 }}>
              MRR ${mrr.toLocaleString()}/month
            </span>
          </div>
        </div>
      </div>

      {/* Two column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Signals */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, marginBottom: 10 }}>
            Signals Needing Attention
          </div>
          {signals.length === 0 ? (
            <div style={{
              background: C.mint, borderRadius: 10,
              padding: '14px 16px', fontSize: 13, color: C.teal, fontWeight: 600,
            }}>
              All clear — no signals today.
            </div>
          ) : signals.map((s, i) => (
            <div key={i} style={{
              background: signalBg[s.type],
              borderLeft: `4px solid ${signalColors[s.type]}`,
              borderRadius: 10, padding: '12px 14px',
              marginBottom: 8,
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>
                {s.label}
              </div>
              <div style={{ fontSize: 11, color: C.slate, marginTop: 2 }}>
                {s.msg}
              </div>
            </div>
          ))}
        </div>

        {/* Today's tasks */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, marginBottom: 10 }}>
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
              background: C.white, border: `1px solid ${C.border}`,
              borderRadius: 10, padding: '10px 14px',
              marginBottom: 8, display: 'flex',
              justifyContent: 'space-between', alignItems: 'flex-start',
            }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.navy }}>
                  {t.description}
                </div>
                <div style={{ fontSize: 10, color: C.slate, marginTop: 2 }}>
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
