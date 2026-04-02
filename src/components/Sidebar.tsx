import { Sun, Target, Users, Zap, BarChart2,
  FileText, Settings, DollarSign,
  FolderOpen } from 'lucide-react';

const C = {
  navy: '#2D4459', teal: '#3BBFBF',
  mint: '#C8E8E5', slate: '#7A8F95',
};

interface SidebarProps {
  activePage: string;
  onPageChange: (page: string) => void;
}

const navItems = [
  { id: 'morning',       label: 'Morning Brief',      icon: Sun        },
  { id: 'goals',         label: 'Business Goals',     icon: Target     },
  { id: 'clients',       label: 'Clients',            icon: Users      },
  { id: 'projects',      label: 'Projects',           icon: FolderOpen },
  { id: 'invoices',      label: 'Invoices',           icon: DollarSign },
  { id: 'documents',     label: 'Documents',          icon: FileText   },
  { id: 'interventions', label: 'Interventions',      icon: Zap        },
  { id: 'practice',      label: 'My Practice',        icon: BarChart2  },
];

export const Sidebar = ({ activePage, onPageChange }: SidebarProps) => {
  return (
    <div style={{
      width: 220, minWidth: 220,
      background: C.navy,
      height: '100vh', display: 'flex',
      flexDirection: 'column',
      position: 'fixed', left: 0, top: 0,
    }}>
      <div style={{ padding: '20px 16px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: C.teal,
            display: 'flex', alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: '#fff'
          }}>P</div>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>
            Pulse Admin
          </span>
        </div>
        <div style={{ color: C.mint, fontSize: 10, opacity: 0.7, paddingLeft: 36 }}>
          Your practice. Compounding.
        </div>
      </div>

      <nav style={{ flex: 1, padding: '0 8px' }}>
        {navItems.map(item => {
          const active = activePage === item.id;
          const Icon = item.icon;
          return (
            <button key={item.id}
              onClick={() => onPageChange(item.id)}
              style={{
                width: '100%', display: 'flex',
                alignItems: 'center', gap: 10,
                padding: '9px 12px',
                marginBottom: 2,
                background: active
                  ? 'rgba(59,191,191,0.12)' : 'transparent',
                border: 'none',
                borderLeft: active
                  ? `3px solid ${C.teal}` : '3px solid transparent',
                borderRadius: active ? '0 8px 8px 0' : '8px',
                color: active ? C.teal : C.slate,
                fontSize: 12, fontWeight: active ? 600 : 400,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                if (!active) {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    'rgba(200,232,229,0.08)';
                  (e.currentTarget as HTMLButtonElement).style.color = C.mint;
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                  (e.currentTarget as HTMLButtonElement).style.color = C.slate;
                }
              }}>
              <Icon size={15} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid rgba(200,232,229,0.15)',
      }}>
        <button
          onClick={() => onPageChange('settings')}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'transparent', border: 'none',
            color: C.slate, fontSize: 11, cursor: 'pointer',
            padding: '6px 8px', width: '100%',
          }}>
          <Settings size={13} />
          Settings
        </button>
      </div>
    </div>
  );
};
