import { useState, useEffect } from 'react';
import { useOllamaStatus } from './hooks/useOllamaStatus';
import { runMigrations } from './services/migrationService';
import { ALL_MIGRATIONS } from './services/migrations';
import { startQueuePoller } from './services/jobQueueService';
import { MorningBrief } from './modules/MorningBrief';
import { RunAJob } from './modules/RunAJob';
import { MyPrompts } from './modules/MyPrompts';
import './styles/brand.css';

type Page =
  | 'morning'
  | 'pipeline'
  | 'content'
  | 'run_job'
  | 'prompts'
  | 'stz'
  | 'identity'
  | 'goals'
  | 'vault'
  | 'audit';

const NAV: { id: Page; label: string }[] = [
  { id: 'morning',  label: 'Morning Brief'   },
  { id: 'pipeline', label: 'My Pipeline'     },
  { id: 'content',  label: 'Content Queue'   },
  { id: 'run_job',  label: 'Run a Job'       },
  { id: 'prompts',  label: 'My Prompts'      },
  { id: 'stz',      label: 'My STZ Layers'   },
  { id: 'identity', label: 'My Identity'     },
  { id: 'goals',    label: 'Business Goals'  },
  { id: 'vault',    label: 'The Vault'       },
  { id: 'audit',    label: 'Audit Log'       },
];

function Placeholder({ title }: { title: string }) {
  return (
    <div style={{ padding: 32 }}>
      <h2 style={{ marginBottom: 8 }}>{title}</h2>
      <p style={{ color: 'var(--slate)', fontSize: 13 }}>
        Coming next.
      </p>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState<Page>('morning');
  const [ready, setReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(
    null
  );
  const { isConnected } = useOllamaStatus();

  useEffect(() => {
    runMigrations(ALL_MIGRATIONS)
      .then(() => {
        startQueuePoller(2000);
        setReady(true);
      })
      .catch(err => {
        setInitError(String(err));
      });
  }, []);

  if (initError) {
    return (
      <div style={{
        padding: 32, color: 'var(--coral)',
        fontFamily: 'Courier New, monospace',
      }}>
        Init error: {initError}
      </div>
    );
  }

  if (!ready) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', height: '100vh',
        color: 'var(--slate)', fontSize: 13,
        fontFamily: 'Courier New, monospace',
      }}>
        Starting Zubia Pulse...
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex', height: '100vh',
      overflow: 'hidden',
    }}>

      {/* Sidebar */}
      <aside style={{
        width: 220, minWidth: 220,
        background: 'var(--navy)',
        display: 'flex', flexDirection: 'column',
        height: '100vh',
      }}>

        {/* Top bar */}
        <div style={{
          padding: '18px 16px 14px',
          borderBottom: '1px solid rgba(200,232,229,0.12)',
        }}>
          <div style={{
            fontFamily: 'Georgia, serif',
            fontSize: 15, fontWeight: 700,
            color: 'var(--teal)',
            marginBottom: 2,
          }}>
            Dr. Zubia's Pulse
          </div>
          <div style={{
            fontSize: 10, color: 'var(--slate)',
            fontFamily: 'Courier New, monospace',
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: isConnected === null
                ? 'var(--slate)'
                : isConnected
                ? 'var(--green)'
                : 'var(--coral)',
              display: 'inline-block',
              flexShrink: 0,
            }} />
            {isConnected === null
              ? 'checking...'
              : isConnected
              ? 'ollama connected'
              : 'ollama offline'}
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
          {NAV.map(item => {
            const active = page === item.id;
            return (
              <button key={item.id}
                onClick={() => setPage(item.id)}
                style={{
                  width: '100%',
                  display: 'flex', alignItems: 'center',
                  padding: '9px 16px',
                  background: active
                    ? 'rgba(59,191,191,0.10)' : 'transparent',
                  borderLeft: active
                    ? '3px solid var(--teal)'
                    : '3px solid transparent',
                  border: 'none',
                  color: active
                    ? 'var(--teal2)' : 'var(--slate)',
                  fontSize: 12,
                  fontWeight: active ? 600 : 400,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s',
                  fontFamily: 'Trebuchet MS, sans-serif',
                }}>
                {item.label}
              </button>
            );
          })}
        </nav>

        <div style={{
          padding: '10px 16px',
          borderTop: '1px solid rgba(200,232,229,0.10)',
          fontSize: 10,
          color: 'var(--slate)',
          fontFamily: 'Courier New, monospace',
        }}>
          airgapped · local only
        </div>
      </aside>

      {/* Main content */}
      <main style={{
        flex: 1, overflowY: 'auto',
        background: 'var(--cream)',
      }}>

        {/* Offline banner */}
        {isConnected === false && (
          <div style={{
            background: 'var(--coral)',
            color: 'var(--white)',
            padding: '8px 24px',
            textAlign: 'center',
            fontSize: 12,
            fontFamily: 'Courier New, monospace',
          }}>
            Ollama is not running — open Terminal
            and run: ollama serve
          </div>
        )}

        {page === 'morning'  && <MorningBrief />}
        {page === 'pipeline' && <Placeholder title="My Pipeline" />}
        {page === 'content'  && <Placeholder title="Content Queue" />}
        {page === 'run_job'  && <RunAJob />}
        {page === 'prompts'  && <MyPrompts />}
        {page === 'stz'      && <Placeholder title="My STZ Layers" />}
        {page === 'identity' && <Placeholder title="My Identity" />}
        {page === 'goals'    && <Placeholder title="Business Goals" />}
        {page === 'vault'    && <Placeholder title="The Vault" />}
        {page === 'audit'    && <Placeholder title="Audit Log" />}
      </main>
    </div>
  );
}
