import {
  useState,
  useEffect,
  useRef,
} from 'react';

const C = {
  navy: '#2D4459',
  teal: '#3BBFBF',
  mint: '#C8E8E5',
  coral: '#F05F57',
  gold: '#C8974A',
  slate: '#7A8F95',
  cream: '#FEFAF5',
  white: '#FFFFFF',
  lgray: '#F4F7F8',
  green: '#3A7D5C',
};

const AGENTS: {
  role: string;
  name: string;
  body: string;
}[] = [
  {
    role: 'Pharmacovigilance',
    name: 'Agent PV-1',
    body:
      'Signal triage favors a structured label ' +
      'update: add explicit hepatic monitoring ' +
      'language and a patient wallet card. No ' +
      'change to indication at this time.',
  },
  {
    role: 'Clinical operations',
    name: 'Agent CO-2',
    body:
      'Site run-in should include a one-page ' +
      'liver enzyme ladder and a stop rule tied ' +
      'to phone triage. Keep visit windows tight ' +
      'so DSMB sees clean cohorts.',
  },
  {
    role: 'Biostatistics',
    name: 'Agent ST-3',
    body:
      'Under the assumed event rate, a 12-week ' +
      'look is underpowered for rare events. ' +
      'Recommend pre-specified pooling across ' +
      'sites for interim read.',
  },
];

const SYNTHESIS =
  'Council synthesis: proceed with a label ' +
  'adjunct focused on hepatic monitoring and ' +
  'site run-in checklists. Hold indication ' +
  'changes until pooled interim counts cross ' +
  'the DSMB charter threshold. Next step: ' +
  'circulate draft DSMB slide set within 5 ' +
  'business days.';

export function DrugSafetyCouncil() {
  const [phase, setPhase] = useState<
    'idle' | 'revealing' | 'ready' | 'accepted'
  >('idle');
  const [visibleCount, setVisibleCount] =
    useState(0);
  const [accepted, setAccepted] =
    useState(false);
  const [audit, setAudit] = useState('');
  const timerRef = useRef<
    ReturnType<typeof setTimeout> | null
  >(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  function startCouncil() {
    if (phase !== 'idle') return;
    setPhase('revealing');
    setVisibleCount(0);
    let n = 0;
    const step = () => {
      n += 1;
      setVisibleCount(n);
      if (n < AGENTS.length) {
        timerRef.current = setTimeout(step, 950);
      } else {
        timerRef.current = setTimeout(() => {
          setPhase('ready');
        }, 600);
      }
    };
    timerRef.current = setTimeout(step, 400);
  }

  function acceptSynthesis() {
    if (phase !== 'ready' || accepted) return;
    setAccepted(true);
    setAudit(
      'Council synthesis accepted by ' +
        'Dr. Raj Vuppalanchi · ' +
        new Date().toLocaleString()
    );
  }

  return (
    <div>
      <h2
        style={{
          fontFamily: 'Georgia, serif',
          color: C.navy,
          marginBottom: 4,
          fontSize: 22,
        }}
      >
        Drug Safety Council
      </h2>
      <p
        style={{
          color: C.slate,
          fontSize: 13,
          marginBottom: 20,
          fontFamily: 'Trebuchet MS, sans-serif',
        }}
      >
        Multi-agent review for DSMB-facing drug
        safety decisions. Agents reveal in
        sequence, then you accept or reject the
        written synthesis.
      </p>

      <button
        type="button"
        onClick={startCouncil}
        disabled={phase !== 'idle'}
        style={{
          padding: '10px 22px',
          marginBottom: 18,
          background:
            phase === 'idle' ? C.teal : C.lgray,
          color:
            phase === 'idle' ? C.white : C.slate,
          border: 'none',
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 700,
          cursor:
            phase === 'idle' ? 'pointer' : 'default',
          fontFamily: 'Trebuchet MS, sans-serif',
        }}
      >
        {phase === 'idle'
          ? 'Convene Council'
          : phase === 'revealing'
          ? 'Council in session...'
          : 'Council complete'}
      </button>

      {(phase === 'revealing' || phase === 'ready') &&
        AGENTS.slice(0, visibleCount).map(
          (a, i) => (
            <div
              key={i}
              style={{
                background: C.white,
                border: `1px solid ${C.mint}`,
                borderLeft: `4px solid ${C.gold}`,
                borderRadius: 12,
                padding: '14px 18px',
                marginBottom: 12,
                animation: 'fadeIn 0.35s ease',
              }}
            >
              <style>{`@keyframes fadeIn { from { opacity: 0.4 } to { opacity: 1 } }`}</style>
              <div
                style={{
                  fontFamily: 'Courier New, monospace',
                  fontSize: 9,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: C.slate,
                  marginBottom: 4,
                }}
              >
                {a.role} · {a.name}
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  color: C.navy,
                  lineHeight: 1.65,
                  fontFamily: 'Trebuchet MS, sans-serif',
                }}
              >
                {a.body}
              </p>
            </div>
          )
        )}

      {phase === 'ready' && (
        <div
          style={{
            background: C.navy,
            borderRadius: 12,
            padding: '18px 20px',
            marginBottom: 16,
            marginTop: 8,
          }}
        >
          <div
            style={{
              fontFamily: 'Courier New, monospace',
              fontSize: 10,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: C.mint,
              marginBottom: 10,
            }}
          >
            Synthesis
          </div>
          <p
            style={{
              margin: 0,
              fontSize: 14,
              color: C.white,
              lineHeight: 1.75,
              fontFamily: 'Trebuchet MS, sans-serif',
            }}
          >
            {SYNTHESIS}
          </p>
        </div>
      )}

      {phase === 'ready' && (
        <button
          type="button"
          onClick={acceptSynthesis}
          disabled={accepted}
          style={{
            padding: '10px 24px',
            background: accepted ? C.green : C.teal,
            color: C.white,
            border: 'none',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 700,
            cursor: accepted ? 'default' : 'pointer',
            fontFamily: 'Trebuchet MS, sans-serif',
          }}
        >
          {accepted
            ? 'Synthesis accepted'
            : 'Accept synthesis'}
        </button>
      )}

      {audit ? (
        <div
          style={{
            marginTop: 14,
            fontFamily: 'Courier New, monospace',
            fontSize: 11,
            color: C.slate,
            background: C.lgray,
            borderRadius: 8,
            padding: '10px 12px',
          }}
        >
          {audit}
        </div>
      ) : null}
    </div>
  );
}
