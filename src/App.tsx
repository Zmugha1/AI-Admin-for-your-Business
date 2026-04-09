import { useState, useEffect } from 'react';
import { useOllamaStatus } from './hooks/useOllamaStatus';
import { runMigrations } from './services/migrationService';
import { ALL_MIGRATIONS } from './services/migrations';
import { startQueuePoller } from './services/jobQueueService';
import { MorningBrief } from './modules/MorningBrief';
import { RunAJob } from './modules/RunAJob';
import { MyPrompts } from './modules/MyPrompts';
import { MyIdentity } from './modules/MyIdentity';
import { STZLayers } from './modules/STZLayers';
import { TheCapture } from './modules/TheCapture';
import { MyPipeline } from './modules/MyPipeline';
import { BusinessGoals } from './modules/BusinessGoals';
import { MyFinances } from './modules/MyFinances';
import { GoogleIntegration } from './modules/GoogleIntegration';
import { ResearchIntelligence } from './modules/ResearchIntelligence';
import { ContentQueue } from './modules/ContentQueue';
import { AuditLog } from './modules/AuditLog';
import { DrRajDemo } from './modules/DrRajDemo';
import './styles/brand.css';

type Page =
  | 'morning'
  | 'capture'
  | 'stz'
  | 'identity'
  | 'pipeline'
  | 'run_job'
  | 'prompts'
  | 'content'
  | 'goals'
  | 'finances'
  | 'google'
  | 'research'
  | 'vault'
  | 'audit'
  | 'raj_demo'
  | 'settings';

const NAV: { id: Page; label: string }[] = [
  { id: 'morning',  label: 'Morning Brief'   },
  { id: 'capture',  label: 'The Capture'     },
  { id: 'stz',      label: 'My STZ Layers'   },
  { id: 'identity', label: 'My Identity'     },
  { id: 'pipeline', label: 'My Pipeline'     },
  { id: 'run_job',  label: 'Run a Job'       },
  { id: 'prompts',  label: 'My Prompts'      },
  { id: 'content',  label: 'Content Queue'   },
  { id: 'goals',    label: 'Business Goals'  },
  { id: 'finances', label: 'My Finances'     },
  { id: 'google',   label: 'Google Integration' },
  { id: 'research', label: 'Research Intelligence' },
  { id: 'vault',    label: 'The Vault'       },
  { id: 'audit',    label: 'Audit Log'       },
  { id: 'raj_demo', label: 'Dr. Raj Demo'    },
  { id: 'settings', label: 'Settings'        },
];

function Placeholder({ title }: { title: string }) {
  return (
    <div style={{ padding: 32 }}>
      <h2 style={{ marginBottom: 8 }}>{title}</h2>
      <p style={{
        color: 'var(--slate)', fontSize: 13,
        fontFamily: 'Courier New, monospace',
      }}>
        Coming next.
      </p>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState<Page>('morning');
  const [ready, setReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
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

        {/* Header */}
        <div style={{
          padding: '18px 16px 14px',
          borderBottom:
            '1px solid rgba(200,232,229,0.12)',
        }}>
          <div style={{
            fontFamily: 'Georgia, serif',
            fontSize: 17, fontWeight: 700,
            color: 'var(--teal)', marginBottom: 2,
          }}>
            Dr. Zubia's Pulse
          </div>
          <div style={{
            fontSize: 10, color: 'var(--slate)',
            fontFamily: 'Courier New, monospace',
            display: 'flex',
            alignItems: 'center', gap: 5,
          }}>
            <span style={{
              width: 6, height: 6,
              borderRadius: '50%',
              background:
                isConnected === null
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
        <nav style={{
          flex: 1, padding: '8px 0',
          overflowY: 'auto',
        }}>
          {NAV.map(item => {
            const active = page === item.id;
            return (
              <button key={item.id}
                onClick={() => setPage(item.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '9px 16px',
                  background: active
                    ? 'rgba(59,191,191,0.10)'
                    : 'transparent',
                  borderLeft: active
                    ? '3px solid var(--teal)'
                    : '3px solid transparent',
                  border: 'none',
                  color: active
                    ? 'var(--teal2)'
                    : 'var(--slate)',
                  fontSize: 14,
                  fontWeight: active ? 600 : 400,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s',
                  fontFamily:
                    'Trebuchet MS, sans-serif',
                }}>
                {item.label}
              </button>
            );
          })}
        </nav>

        <div style={{
          padding: '10px 16px',
          borderTop:
            '1px solid rgba(200,232,229,0.10)',
          fontSize: 12, color: 'var(--slate)',
          fontFamily: 'Courier New, monospace',
        }}>
          airgapped · local only
        </div>
      </aside>

      {/* Main */}
      <main style={{
        flex: 1, overflowY: 'auto',
        background: 'var(--cream)',
      }}>
        {isConnected === false && (
          <div style={{
            background: 'var(--coral)',
            color: 'var(--white)',
            padding: '8px 24px',
            textAlign: 'center', fontSize: 12,
            fontFamily: 'Courier New, monospace',
          }}>
            Ollama is not running — open Terminal
            and run: ollama serve
          </div>
        )}

        {page === 'morning'  && <MorningBrief />}
        {page === 'capture'  && <TheCapture />}
        {page === 'stz'      && <STZLayers />}
        {page === 'identity' && <MyIdentity />}
        {page === 'pipeline' && <MyPipeline />}
        {page === 'run_job'  && <RunAJob />}
        {page === 'prompts'  && <MyPrompts />}
        {page === 'content'  && <ContentQueue />}
        {page === 'goals'    && <BusinessGoals />}
        {page === 'finances' && <MyFinances />}
        {page === 'google'   && <GoogleIntegration />}
        {page === 'research' && <ResearchIntelligence />}
        {page === 'vault'    && <Placeholder title="The Vault" />}
        {page === 'audit'    && <AuditLog />}
        {page === 'raj_demo' && <DrRajDemo />}
        {page === 'settings' && <Placeholder title="Settings" />}
      </main>
    </div>
  );
}
