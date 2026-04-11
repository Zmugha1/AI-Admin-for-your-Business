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

interface Source {
  source_id: string;
  title: string;
  type:
    | 'government'
    | 'peer_review'
    | 'regulatory'
    | 'clinical'
    | 'education'
    | 'intelligence'
    | 'practice';
  year: string;
  url: string;
  domain: string;
  active: boolean;
}

const PATIENT_ED_SOURCES: Source[] = [
  {
    source_id: 'src_medlineplus',
    title:
      'NIH MedlinePlus, Patient Education Library',
    type: 'government',
    year: 'ongoing',
    url: 'https://medlineplus.gov',
    domain: 'Patient Education',
    active: true,
  },
  {
    source_id: 'src_mayo_liver',
    title:
      'Mayo Clinic, Liver Enzyme Reference',
    type: 'clinical',
    year: 'ongoing',
    url: 'https://www.mayoclinic.org',
    domain: 'Clinical Reference',
    active: true,
  },
  {
    source_id: 'src_fda_supplements',
    title:
      'FDA, Dietary Supplement Safety Database',
    type: 'regulatory',
    year: 'ongoing',
    url: 'https://www.fda.gov/food/dietary-supplements',
    domain: 'Supplement Safety',
    active: true,
  },
  {
    source_id: 'src_practice_guidelines',
    title:
      'Dr. Vuppalanchi, Practice Education Guidelines',
    type: 'practice',
    year: '2026',
    url: '',
    domain: 'Practice Protocol',
    active: true,
  },
  {
    source_id: 'src_patient_record',
    title: 'Patient EHR, Visit Notes and History',
    type: 'clinical',
    year: 'current',
    url: '',
    domain: 'Patient Context',
    active: false,
  },
  {
    source_id: 'src_natural_medicines',
    title:
      'Natural Medicines Database, Supplement Interactions',
    type: 'clinical',
    year: 'ongoing',
    url:
      'https://naturalmedicines.therapeuticresearch.com',
    domain: 'Supplement Pharmacology',
    active: false,
  },
];

const AGENT_SOURCE_IDS: string[][] = [
  [
    'src_medlineplus',
    'src_mayo_liver',
    'src_fda_supplements',
    'src_natural_medicines',
  ],
  ['src_practice_guidelines', 'src_patient_record'],
  ['src_patient_record', 'src_practice_guidelines'],
];

type Conf = 'High' | 'Medium' | 'Low';

const AGENTS: {
  name: string;
  role: string;
  verdict: string;
  confidence: Conf;
  flag: string;
}[] = [
  {
    name: 'The Disease Educator',
    role: 'CONDITION EDUCATION',
    verdict:
      'Elevated liver enzymes (ALT and AST) can ' +
      'indicate liver stress from multiple sources ' +
      'including supplements, medications, alcohol, ' +
      'or underlying liver disease. Some supplements ' +
      'including green tea extract, kava, and high ' +
      'dose vitamin A are known hepatotoxins. The ' +
      'patient should bring a complete supplement ' +
      'list to their next visit.',
    confidence: 'High',
    flag:
      'Response stays within education boundary. ' +
      'Does not advise stopping or continuing any ' +
      'specific supplement. Physician decision required.',
  },
  {
    name: 'The Safety Guardian',
    role: 'BOUNDARY COMPLIANCE',
    verdict:
      'This question requests implicit medical ' +
      'advice: whether to stop a supplement. That ' +
      'crosses the boundary from education into ' +
      'clinical recommendation. The safe response ' +
      'acknowledges the concern, provides general ' +
      'information about supplement-liver ' +
      'interactions, and directs the patient to ' +
      'discuss the specific supplement list with ' +
      'Dr. Vuppalanchi before making any changes.',
    confidence: 'High',
    flag:
      'BOUNDARY FLAG: question contains a decision ' +
      'request. Answer must not advise stopping or ' +
      'continuing any supplement. Physician review ' +
      'recommended before this response is delivered.',
  },
  {
    name: 'The Context Checker',
    role: 'PATIENT HISTORY',
    verdict:
      'No prior visit notes indicate which specific ' +
      'supplements this patient takes. Without that ' +
      'context the education response cannot be ' +
      'personalized and risks being irrelevant or ' +
      'anxiety-inducing. Recommend the response ' +
      'acknowledge the concern, provide general ' +
      'information, and prompt the patient to bring ' +
      'supplement bottles to the next appointment.',
    confidence: 'Medium',
    flag:
      'Supplement list not in patient record. ' +
      'Context is incomplete. Response should prompt ' +
      'information gathering, not information delivery.',
  },
];

const CRITIQUES: {
  reviewer: string;
  subject: string;
  agree: string;
  challenge: string;
  score: number;
}[] = [
  {
    reviewer: 'The Disease Educator',
    subject: 'The Safety Guardian',
    agree:
      'Boundary flag is correct. This question does ' +
      'request a clinical decision, not just information.',
    challenge:
      'Response framework is appropriate but could be ' +
      'more specific about which supplement categories ' +
      'are highest risk for liver stress.',
    score: 9,
  },
  {
    reviewer: 'The Safety Guardian',
    subject: 'The Context Checker',
    agree:
      'Missing supplement list is a critical context ' +
      'gap that affects the quality of any response.',
    challenge:
      'Medium confidence rating underweights the ' +
      'boundary concern. The boundary issue is high ' +
      'confidence regardless of context completeness.',
    score: 8,
  },
  {
    reviewer: 'The Context Checker',
    subject: 'The Disease Educator',
    agree:
      'General education content is accurate and ' +
      'appropriately scoped.',
    challenge:
      'Listing specific supplement names like kava ' +
      'and green tea extract may cause the patient to ' +
      'self-diagnose before speaking with the physician.',
    score: 7,
  },
];

function ConfDot({ level }: { level: Conf }) {
  const color =
    level === 'High'
      ? C.green
      : level === 'Medium'
      ? C.gold
      : C.coral;
  return (
    <span
      style={{
        display: 'inline-block',
        width: 10,
        height: 10,
        borderRadius: '50%',
        background: color,
        marginRight: 6,
        verticalAlign: 'middle',
      }}
    />
  );
}

function SourceCitedPills({
  sourceIds,
  sources,
}: {
  sourceIds: string[];
  sources: Source[];
}) {
  return (
    <div
      style={{
        marginTop: 12,
        borderTop: `1px solid ${C.lgray}`,
        paddingTop: 10,
      }}
    >
      <div
        style={{
          fontFamily: 'Courier New, monospace',
          fontSize: 9,
          color: C.slate,
          marginBottom: 6,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        SOURCES CITED
      </div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        {sourceIds.map(id => {
          const src = sources.find(
            s => s.source_id === id
          );
          if (!src) return null;
          const act = src.active;
          return (
            <span
              key={id}
              title={
                !act
                  ? 'Source not active - add subscription or access to enable'
                  : undefined
              }
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                background: act ? '#3BBFBF18' : '#F05F5712',
                border: act
                  ? '1px solid #3BBFBF'
                  : '1px solid #F05F57',
                color: act ? '#2D4459' : '#F05F57',
                fontFamily: 'Courier New, monospace',
                fontSize: 9,
                padding: '2px 8px',
                borderRadius: 20,
                marginRight: 4,
                marginBottom: 4,
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: act ? '#3A7D5C' : '#F05F57',
                  marginRight: 4,
                  flexShrink: 0,
                }}
              />
              {src.title}
            </span>
          );
        })}
      </div>
    </div>
  );
}

const DEFAULT_Q =
  'My doctor said my liver enzymes are elevated. ' +
  'Should I stop taking my supplements?';

export default function NurseCouncil() {
  const [phase, setPhase] = useState<
    'input' | 'agents' | 'cross' | 'complete'
  >('input');
  const [patientQ, setPatientQ] =
    useState(DEFAULT_Q);
  const [agentShown, setAgentShown] = useState(0);
  const [critShown, setCritShown] = useState(0);
  const [audit, setAudit] = useState('');
  const [sources, setSources] = useState<Source[]>(
    PATIENT_ED_SOURCES
  );
  const [showSources, setShowSources] =
    useState(false);
  const [showAddSource, setShowAddSource] =
    useState(false);
  const [newSource, setNewSource] = useState({
    title: '',
    type: 'peer_review' as Source['type'],
    year: '',
    url: '',
    domain: '',
  });
  const timers = useRef<
    ReturnType<typeof setTimeout>[]
  >([]);

  function clearTimers() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }

  useEffect(() => () => clearTimers(), []);

  function convene() {
    if (phase !== 'input') return;
    clearTimers();
    setPhase('agents');
    setAgentShown(0);
    setCritShown(0);
    setAudit('');
    let a = 0;
    const runAgent = () => {
      a += 1;
      setAgentShown(a);
      if (a < AGENTS.length) {
        timers.current.push(
          setTimeout(runAgent, 800)
        );
      } else {
        timers.current.push(
          setTimeout(() => {
            setPhase('cross');
            setCritShown(0);
            let c = 0;
            const runCrit = () => {
              c += 1;
              setCritShown(c);
              if (c < CRITIQUES.length) {
                timers.current.push(
                  setTimeout(runCrit, 600)
                );
              } else {
                timers.current.push(
                  setTimeout(
                    () => setPhase('complete'),
                    400
                  )
                );
              }
            };
            runCrit();
          }, 500)
        );
      }
    };
    runAgent();
  }

  function logAction(kind: 'Accept' | 'Flag') {
    setAudit(
      `Action logged: ${kind} · ` +
        `Dr. Raj Vuppalanchi · ` +
        new Date().toLocaleString()
    );
  }

  return (
    <div>
      <div
        style={{
          background: C.gold,
          color: C.navy,
          fontFamily: 'Courier New, monospace',
          fontSize: 11,
          padding: '12px 14px',
          borderRadius: 10,
          marginBottom: 18,
          lineHeight: 1.5,
        }}
      >
        DEMO MODE: No real patient data. All outputs
        are illustrative only. In production: physician
        reviews all flagged responses before delivery.
      </div>

      <h2
        style={{
          fontFamily: 'Georgia, serif',
          color: C.navy,
          fontSize: 22,
          marginBottom: 6,
        }}
      >
        Patient Education Council
      </h2>
      <p
        style={{
          fontFamily: 'Trebuchet MS, sans-serif',
          color: C.slate,
          fontSize: 13,
          marginBottom: 22,
          lineHeight: 1.55,
        }}
      >
        Three agents review the patient question
        independently. If any agent disagrees or flags
        a boundary, the answer is held for physician
        review. You are the physician. You make the
        call.
      </p>

      <div
        style={{
          background: C.white,
          border: `1px solid ${C.mint}`,
          borderRadius: 12,
          padding: '16px 18px',
          marginBottom: 20,
        }}
      >
        <div
          style={{
            fontFamily: 'Courier New, monospace',
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: C.slate,
            marginBottom: 8,
          }}
        >
          Patient question received
        </div>
        <textarea
          value={patientQ}
          onChange={e => setPatientQ(e.target.value)}
          rows={3}
          placeholder="Enter patient question..."
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '10px 12px',
            border: `1px solid ${C.mint}`,
            borderRadius: 8,
            fontSize: 13,
            color: C.navy,
            fontFamily: 'Trebuchet MS, sans-serif',
            marginBottom: 12,
            resize: 'vertical' as const,
          }}
        />
        <button
          type="button"
          onClick={convene}
          disabled={phase !== 'input'}
          style={{
            padding: '10px 22px',
            background:
              phase === 'input' ? C.teal : C.lgray,
            color:
              phase === 'input' ? C.white : C.slate,
            border: 'none',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 700,
            cursor:
              phase === 'input' ? 'pointer' : 'default',
            fontFamily: 'Trebuchet MS, sans-serif',
          }}
        >
          Convene the Council
        </button>
      </div>

      {(phase === 'agents' ||
        phase === 'cross' ||
        phase === 'complete') &&
        AGENTS.slice(0, agentShown).map((ag, i) => (
          <div
            key={i}
            style={{
              background: C.white,
              border: `1px solid ${C.mint}`,
              borderRadius: 12,
              padding: '16px 18px',
              marginBottom: 12,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: 16,
                  fontWeight: 700,
                  color: C.navy,
                }}
              >
                {ag.name}
              </div>
              <span
                style={{
                  fontFamily: 'Courier New, monospace',
                  fontSize: 9,
                  color: C.slate,
                  background: C.mint,
                  padding: '4px 10px',
                  borderRadius: 999,
                }}
              >
                {ag.role}
              </span>
            </div>
            <p
              style={{
                margin: '0 0 12px',
                fontFamily: 'Trebuchet MS, sans-serif',
                fontSize: 13,
                color: C.navy,
                lineHeight: 1.65,
              }}
            >
              {ag.verdict}
            </p>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'flex-start',
                gap: 10,
                borderTop: `1px solid ${C.lgray}`,
                paddingTop: 10,
              }}
            >
              <span
                style={{
                  fontFamily: 'Courier New, monospace',
                  fontSize: 10,
                  color: C.slate,
                }}
              >
                <ConfDot level={ag.confidence} />
                Confidence: {ag.confidence}
              </span>
              <span
                style={{
                  fontFamily: 'Courier New, monospace',
                  fontSize: 10,
                  color: C.slate,
                  flex: '1 1 220px',
                }}
              >
                Key flag: {ag.flag}
              </span>
            </div>
            <SourceCitedPills
              sourceIds={AGENT_SOURCE_IDS[i]}
              sources={sources}
            />
          </div>
        ))}

      {(phase === 'cross' || phase === 'complete') &&
        agentShown >= AGENTS.length && (
          <div
            style={{
              textAlign: 'center',
              margin: '20px 0 14px',
              fontFamily: 'Courier New, monospace',
              fontSize: 10,
              letterSpacing: '0.12em',
              color: C.slate,
            }}
          >
            COUNCIL CROSS-EXAMINATION
          </div>
        )}

      {(phase === 'cross' || phase === 'complete') &&
        CRITIQUES.slice(0, critShown).map((cr, i) => (
          <div
            key={i}
            style={{
              background: C.lgray,
              border: `1px solid ${C.mint}`,
              borderRadius: 12,
              padding: '14px 16px',
              marginBottom: 10,
            }}
          >
            <div
              style={{
                fontFamily: 'Courier New, monospace',
                fontSize: 10,
                color: C.navy,
                marginBottom: 8,
              }}
            >
              {cr.reviewer} reviewing {cr.subject}
            </div>
            <p
              style={{
                margin: '0 0 6px',
                fontFamily: 'Trebuchet MS, sans-serif',
                fontSize: 12,
                color: C.navy,
                lineHeight: 1.55,
              }}
            >
              Agreement: {cr.agree}
            </p>
            <p
              style={{
                margin: '0 0 10px',
                fontFamily: 'Trebuchet MS, sans-serif',
                fontSize: 12,
                color: C.navy,
                lineHeight: 1.55,
              }}
            >
              Challenge: {cr.challenge}
            </p>
            <div
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: 22,
                fontWeight: 800,
                color: C.navy,
              }}
            >
              Score: {cr.score}
            </div>
          </div>
        ))}

      {phase === 'complete' && (
        <>
          <div
            style={{
              background: C.navy,
              borderRadius: 12,
              padding: '22px 24px',
              marginTop: 16,
              marginBottom: 18,
            }}
          >
            <h3
              style={{
                fontFamily: 'Georgia, serif',
                color: C.cream,
                fontSize: 20,
                margin: '0 0 6px',
              }}
            >
              Chairman Synthesis
            </h3>
            <p
              style={{
                fontFamily: 'Trebuchet MS, sans-serif',
                color: C.slate,
                fontSize: 12,
                margin: '0 0 18px',
              }}
            >
              Consolidated verdict for your review
            </p>
            {[
              [
                'WHERE THE COUNCIL AGREED',
                'All three agents agree this question ' +
                  'contains an implicit clinical decision ' +
                  'request. The patient is asking whether ' +
                  'to stop a supplement. That is a physician ' +
                  'call. The response must not answer that ' +
                  'question directly. All agents agree the ' +
                  'supplement list is missing and the patient ' +
                  'should be directed to bring it to the next ' +
                  'visit.',
              ],
              [
                'WHERE THE COUNCIL DISAGREED',
                'The Disease Educator and Context Checker ' +
                  'diverge on whether naming specific ' +
                  'high-risk supplements is helpful or ' +
                  'anxiety-inducing without personalized ' +
                  'context. This is a tone and framing ' +
                  'disagreement, not a safety disagreement.',
              ],
              [
                'RECOMMENDATION',
                'HOLD FOR PHYSICIAN REVIEW. The boundary ' +
                  'flag from the Safety Guardian is valid. ' +
                  'Suggested patient response below, pending ' +
                  'your approval: Your question is an ' +
                  'important one and Dr. Vuppalanchi will want ' +
                  'to review your specific supplements at ' +
                  'your next visit. Please bring all supplement ' +
                  'bottles with you. In the meantime, do not ' +
                  'make any changes without speaking with your ' +
                  'doctor first.',
              ],
            ].map(([lab, body]) => (
              <div key={lab} style={{ marginBottom: 14 }}>
                <div
                  style={{
                    fontFamily: 'Courier New, monospace',
                    fontSize: 10,
                    color: C.gold,
                    letterSpacing: '0.06em',
                    marginBottom: 6,
                  }}
                >
                  {lab}
                </div>
                <p
                  style={{
                    margin: 0,
                    fontFamily: 'Trebuchet MS, sans-serif',
                    fontSize: 13,
                    color: C.cream,
                    lineHeight: 1.65,
                  }}
                >
                  {body}
                </p>
              </div>
            ))}
          </div>

          <div
            style={{
              border: `1px solid ${C.mint}`,
              borderRadius: 12,
              padding: '18px 20px',
              background: C.white,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                fontFamily: 'Courier New, monospace',
                fontSize: 11,
                fontWeight: 700,
                color: C.navy,
                marginBottom: 14,
              }}
            >
              Governance Audit
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: 14,
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: 'Courier New, monospace',
                    fontSize: 9,
                    color: C.green,
                    marginBottom: 8,
                  }}
                >
                  VERIFIED
                </div>
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: 16,
                    fontFamily: 'Trebuchet MS, sans-serif',
                    fontSize: 11,
                    color: C.navy,
                    lineHeight: 1.5,
                  }}
                >
                  <li>Question received and logged</li>
                  <li>Boundary flag triggered correctly</li>
                  <li>
                    All three agents stayed within
                    approved knowledge boundary
                  </li>
                  <li>
                    No clinical recommendation was made
                  </li>
                  <li>
                    Response held for physician review
                  </li>
                </ul>
              </div>
              <div>
                <div
                  style={{
                    fontFamily: 'Courier New, monospace',
                    fontSize: 9,
                    color: C.coral,
                    marginBottom: 8,
                  }}
                >
                  NOT VERIFIED
                </div>
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: 16,
                    fontFamily: 'Trebuchet MS, sans-serif',
                    fontSize: 11,
                    color: C.navy,
                    lineHeight: 1.5,
                  }}
                >
                  <li>Patient supplement list</li>
                  <li>Patient prior visit notes</li>
                  <li>
                    Whether patient has seen this education
                    content before
                  </li>
                  <li>
                    Patient literacy level for the drafted
                    response
                  </li>
                </ul>
              </div>
              <div>
                <div
                  style={{
                    fontFamily: 'Courier New, monospace',
                    fontSize: 9,
                    color: C.gold,
                    marginBottom: 8,
                  }}
                >
                  RISKS IF YOU PROCEED WITHOUT REVIEW
                </div>
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: 16,
                    fontFamily: 'Trebuchet MS, sans-serif',
                    fontSize: 11,
                    color: C.navy,
                    lineHeight: 1.5,
                  }}
                >
                  <li>
                    Delivering response without physician
                    approval violates the boundary contract
                  </li>
                  <li>
                    Patient may interpret general supplement
                    information as specific advice
                  </li>
                  <li>
                    Missing supplement list means response
                    cannot be personalized to actual risk
                  </li>
                </ul>
              </div>
            </div>

            <div
              style={{
                borderTop: `1px solid ${C.mint}`,
                marginTop: 18,
                paddingTop: 16,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                  marginBottom:
                    showSources || showAddSource ? 12 : 0,
                }}
              >
                <div
                  style={{
                    fontFamily: 'Courier New, monospace',
                    fontSize: 11,
                    color: C.navy,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  INTELLIGENCE SOURCES
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    flexWrap: 'wrap',
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setShowSources(v => !v)
                    }
                    style={{
                      padding: '6px 14px',
                      background: 'transparent',
                      color: C.teal,
                      border: `1px solid ${C.teal}`,
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      fontFamily:
                        'Trebuchet MS, sans-serif',
                      cursor: 'pointer',
                    }}
                  >
                    Manage Sources
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setShowAddSource(v => !v)
                    }
                    style={{
                      padding: '6px 14px',
                      background: C.teal,
                      color: C.white,
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      fontFamily:
                        'Trebuchet MS, sans-serif',
                      cursor: 'pointer',
                    }}
                  >
                    Add Source
                  </button>
                </div>
              </div>
              {showSources ? (
                <div
                  style={{
                    borderRadius: 8,
                    overflow: 'hidden',
                    border: `1px solid ${C.mint}`,
                  }}
                >
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns:
                        '100px minmax(0,1.4fr) 100px minmax(0,1fr) 72px 88px',
                      gap: 0,
                      alignItems: 'center',
                      padding: '8px 12px',
                      background: C.lgray,
                      borderBottom: `1px solid ${C.mint}`,
                      fontFamily: 'Courier New, monospace',
                      fontSize: 9,
                      color: C.slate,
                      textTransform: 'uppercase',
                    }}
                  >
                    <div>Status</div>
                    <div>Title</div>
                    <div>Type</div>
                    <div>Domain</div>
                    <div>Year</div>
                    <div style={{ textAlign: 'right' }}>
                      &nbsp;
                    </div>
                  </div>
                  {sources.map((row, ri) => (
                    <div
                      key={row.source_id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns:
                          '100px minmax(0,1.4fr) 100px minmax(0,1fr) 72px 88px',
                        gap: 0,
                        alignItems: 'center',
                        padding: '8px 12px',
                        background:
                          ri % 2 === 0 ? C.white : C.cream,
                        borderBottom: `1px solid ${C.mint}`,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          fontFamily: 'Courier New, monospace',
                          fontSize: 10,
                          color: row.active
                            ? C.green
                            : C.coral,
                        }}
                      >
                        <span
                          style={{
                            display: 'inline-block',
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: row.active
                              ? C.green
                              : C.coral,
                            flexShrink: 0,
                          }}
                        />
                        {row.active ? 'Active' : 'Inactive'}
                      </div>
                      <div>
                        {row.url ? (
                          <button
                            type="button"
                            onClick={() =>
                              window.open(
                                row.url,
                                '_blank'
                              )
                            }
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: 0,
                              margin: 0,
                              fontFamily:
                                'Trebuchet MS, sans-serif',
                              fontSize: 12,
                              color: C.teal,
                              cursor: 'pointer',
                              textAlign: 'left',
                              textDecoration: 'underline',
                            }}
                          >
                            {row.title}
                          </button>
                        ) : (
                          <span
                            style={{
                              fontFamily:
                                'Trebuchet MS, sans-serif',
                              fontSize: 12,
                              color: C.navy,
                            }}
                          >
                            {row.title}
                          </span>
                        )}
                      </div>
                      <div>
                        <span
                          style={{
                            display: 'inline-block',
                            background: C.mint,
                            color: C.navy,
                            fontFamily:
                              'Courier New, monospace',
                            fontSize: 9,
                            textTransform: 'uppercase',
                            padding: '2px 8px',
                            borderRadius: 20,
                          }}
                        >
                          {row.type.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div
                        style={{
                          fontFamily:
                            'Trebuchet MS, sans-serif',
                          fontSize: 11,
                          color: C.slate,
                        }}
                      >
                        {row.domain}
                      </div>
                      <div
                        style={{
                          fontFamily: 'Courier New, monospace',
                          fontSize: 10,
                          color: C.slate,
                        }}
                      >
                        {row.year}
                      </div>
                      <div
                        style={{
                          textAlign: 'right',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setSources(prev =>
                              prev.map(s =>
                                s.source_id ===
                                row.source_id
                                  ? {
                                      ...s,
                                      active: !s.active,
                                    }
                                  : s
                              )
                            )
                          }
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            fontSize: 11,
                            fontWeight: 600,
                            fontFamily:
                              'Trebuchet MS, sans-serif',
                            cursor: 'pointer',
                            color: row.active
                              ? C.coral
                              : C.teal,
                          }}
                        >
                          {row.active
                            ? 'Deactivate'
                            : 'Activate'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
              {showAddSource ? (
                <div
                  style={{
                    border: `1px solid ${C.mint}`,
                    borderTop: `4px solid ${C.teal}`,
                    background: C.white,
                    padding: '16px 20px',
                    borderRadius: 12,
                    marginTop: 12,
                  }}
                >
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '12px 16px',
                    }}
                  >
                    <div
                      style={{
                        gridColumn: '1 / -1',
                      }}
                    >
                      <label
                        style={{
                          display: 'block',
                          fontSize: 10,
                          color: C.slate,
                          marginBottom: 4,
                          fontFamily:
                            'Courier New, monospace',
                        }}
                      >
                        Title
                      </label>
                      <input
                        type="text"
                        value={newSource.title}
                        onChange={e =>
                          setNewSource(ns => ({
                            ...ns,
                            title: e.target.value,
                          }))
                        }
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          padding: '8px 10px',
                          border: `1px solid ${C.mint}`,
                          borderRadius: 8,
                          fontSize: 13,
                          color: C.navy,
                          fontFamily:
                            'Trebuchet MS, sans-serif',
                        }}
                      />
                    </div>
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: 10,
                          color: C.slate,
                          marginBottom: 4,
                          fontFamily:
                            'Courier New, monospace',
                        }}
                      >
                        Type
                      </label>
                      <select
                        value={newSource.type}
                        onChange={e =>
                          setNewSource(ns => ({
                            ...ns,
                            type: e.target
                              .value as Source['type'],
                          }))
                        }
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          padding: '8px 10px',
                          border: `1px solid ${C.mint}`,
                          borderRadius: 8,
                          fontSize: 13,
                          color: C.navy,
                          fontFamily:
                            'Trebuchet MS, sans-serif',
                        }}
                      >
                        {(
                          [
                            'government',
                            'peer_review',
                            'regulatory',
                            'clinical',
                            'education',
                            'intelligence',
                            'practice',
                          ] as const
                        ).map(t => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: 10,
                          color: C.slate,
                          marginBottom: 4,
                          fontFamily:
                            'Courier New, monospace',
                        }}
                      >
                        Domain
                      </label>
                      <input
                        type="text"
                        value={newSource.domain}
                        onChange={e =>
                          setNewSource(ns => ({
                            ...ns,
                            domain: e.target.value,
                          }))
                        }
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          padding: '8px 10px',
                          border: `1px solid ${C.mint}`,
                          borderRadius: 8,
                          fontSize: 13,
                          color: C.navy,
                          fontFamily:
                            'Trebuchet MS, sans-serif',
                        }}
                      />
                    </div>
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: 10,
                          color: C.slate,
                          marginBottom: 4,
                          fontFamily:
                            'Courier New, monospace',
                        }}
                      >
                        Year
                      </label>
                      <input
                        type="text"
                        value={newSource.year}
                        onChange={e =>
                          setNewSource(ns => ({
                            ...ns,
                            year: e.target.value,
                          }))
                        }
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          padding: '8px 10px',
                          border: `1px solid ${C.mint}`,
                          borderRadius: 8,
                          fontSize: 13,
                          color: C.navy,
                          fontFamily:
                            'Trebuchet MS, sans-serif',
                        }}
                      />
                    </div>
                    <div
                      style={{
                        gridColumn: '1 / -1',
                      }}
                    >
                      <label
                        style={{
                          display: 'block',
                          fontSize: 10,
                          color: C.slate,
                          marginBottom: 4,
                          fontFamily:
                            'Courier New, monospace',
                        }}
                      >
                        URL
                      </label>
                      <input
                        type="text"
                        value={newSource.url}
                        onChange={e =>
                          setNewSource(ns => ({
                            ...ns,
                            url: e.target.value,
                          }))
                        }
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          padding: '8px 10px',
                          border: `1px solid ${C.mint}`,
                          borderRadius: 8,
                          fontSize: 13,
                          color: C.navy,
                          fontFamily:
                            'Trebuchet MS, sans-serif',
                        }}
                      />
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      gap: 10,
                      marginTop: 16,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        const t =
                          newSource.title.trim();
                        if (!t) return;
                        const slug = t
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, '_')
                          .replace(/^_|_$/g, '')
                          .slice(0, 40);
                        const source_id =
                          `src_${slug || 'new'}_${Date.now()}`;
                        setSources(prev => [
                          ...prev,
                          {
                            source_id,
                            title: t,
                            type: newSource.type,
                            year:
                              newSource.year.trim() ||
                              'ongoing',
                            url: newSource.url.trim(),
                            domain:
                              newSource.domain.trim() ||
                              'General',
                            active: true,
                          },
                        ]);
                        setNewSource({
                          title: '',
                          type: 'peer_review',
                          year: '',
                          url: '',
                          domain: '',
                        });
                        setShowAddSource(false);
                      }}
                      style={{
                        padding: '10px 20px',
                        background: C.teal,
                        color: C.white,
                        border: 'none',
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 700,
                        fontFamily:
                          'Trebuchet MS, sans-serif',
                        cursor: 'pointer',
                      }}
                    >
                      Add to Council
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setShowAddSource(false)
                      }
                      style={{
                        padding: '10px 20px',
                        background: 'transparent',
                        color: C.slate,
                        border: `1px solid ${C.mint}`,
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 600,
                        fontFamily:
                          'Trebuchet MS, sans-serif',
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            <div
              style={{
                display: 'flex',
                gap: 12,
                marginTop: 18,
              }}
            >
              <button
                type="button"
                onClick={() => logAction('Accept')}
                style={{
                  padding: '10px 22px',
                  background: C.teal,
                  color: C.white,
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: 'Trebuchet MS, sans-serif',
                  cursor: 'pointer',
                }}
              >
                Accept Synthesis
              </button>
              <button
                type="button"
                onClick={() => logAction('Flag')}
                style={{
                  padding: '10px 22px',
                  background: '#F05F5718',
                  color: C.coral,
                  border: `1px solid ${C.coral}`,
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: 'Trebuchet MS, sans-serif',
                  cursor: 'pointer',
                }}
              >
                Flag for Review
              </button>
            </div>
            {audit ? (
              <div
                style={{
                  marginTop: 14,
                  fontFamily: 'Courier New, monospace',
                  fontSize: 11,
                  color: C.slate,
                }}
              >
                {audit}
              </div>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
