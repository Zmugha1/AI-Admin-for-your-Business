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

const DRUG_SAFETY_SOURCES: Source[] = [
  {
    source_id: 'src_nih_fiau',
    title:
      'NIH Clinical Center Report, Fialuridine Trial',
    type: 'government',
    year: '1994',
    url: 'https://www.nih.gov',
    domain: 'Clinical Outcomes',
    active: true,
  },
  {
    source_id: 'src_nejm_fiau',
    title:
      'New England Journal of Medicine, ' +
      'Fialuridine Hepatotoxicity',
    type: 'peer_review',
    year: '1995',
    url: 'https://www.nejm.org',
    domain: 'Mechanism and Outcomes',
    active: true,
  },
  {
    source_id: 'src_fda_fiau',
    title:
      'FDA Drug Safety Communication, FIAU Clinical Hold',
    type: 'regulatory',
    year: '1994',
    url: 'https://www.fda.gov',
    domain: 'Regulatory Record',
    active: true,
  },
  {
    source_id: 'src_endpoint',
    title: 'Endpoint News, Pharma Intelligence Feed',
    type: 'intelligence',
    year: 'ongoing',
    url: 'https://endpointsnews.com',
    domain: 'Sponsor Communications',
    active: false,
  },
  {
    source_id: 'src_pubmed_mito',
    title: 'PubMed, Mitochondrial Toxicity Literature',
    type: 'peer_review',
    year: 'ongoing',
    url: 'https://pubmed.ncbi.nlm.nih.gov',
    domain: 'Pharmacology',
    active: true,
  },
  {
    source_id: 'src_foia',
    title: 'FOIA Request Database, FDA Records',
    type: 'government',
    year: 'ongoing',
    url:
      'https://www.fda.gov/regulatory-information/freedom-information',
    domain: 'Sponsor Records',
    active: false,
  },
];

const AGENT_SOURCE_IDS: string[][] = [
  ['src_nih_fiau', 'src_nejm_fiau', 'src_pubmed_mito'],
  ['src_fda_fiau', 'src_foia', 'src_endpoint'],
  ['src_nejm_fiau', 'src_pubmed_mito'],
  ['src_endpoint', 'src_foia'],
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
    name: 'The Evidence Engine',
    role: 'CLINICAL LITERATURE',
    verdict:
      'Fialuridine was a nucleoside analogue ' +
      'tested for hepatitis B in a 1993 NIH ' +
      'trial. Seven of fifteen patients developed ' +
      'severe hepatotoxicity. Five died. Two ' +
      'required liver transplants. The mechanism ' +
      'was mitochondrial DNA polymerase gamma ' +
      'inhibition, a toxicity not predicted by ' +
      'animal models.',
    confidence: 'High',
    flag:
      'Animal model data did not predict human ' +
      'mitochondrial toxicity. Species gap was ' +
      'the core failure.',
  },
  {
    name: 'The Governance Lens',
    role: 'REGULATORY REVIEW',
    verdict:
      'FDA issued a clinical hold after the trial ' +
      'halt. The 1994 NEJM publication documented ' +
      'the timeline of adverse events. The IND was ' +
      'withdrawn. No post-market data exists because ' +
      'the drug never reached approval. Regulatory ' +
      'record is complete and publicly available.',
    confidence: 'High',
    flag:
      'Sponsor communications during the trial ' +
      'period are not in the public record. ' +
      'Internal escalation timeline is unverified.',
  },
  {
    name: 'The Mechanism Analyst',
    role: 'PHARMACOLOGY',
    verdict:
      'FIAU incorporates into mitochondrial DNA ' +
      'via polymerase gamma. Unlike nuclear DNA ' +
      'polymerases, gamma has no proofreading. FIAU ' +
      'accumulates over weeks, causing progressive ' +
      'mitochondrial dysfunction. Lactic acidosis and ' +
      'hepatic failure follow. The latency period ' +
      '(four to twenty weeks) masked early toxicity ' +
      'signals during monitoring.',
    confidence: 'High',
    flag:
      'Latency pattern suggests standard monthly ' +
      'safety reviews were insufficient for this ' +
      'mechanism. Monitoring frequency was not ' +
      'designed for slow-accumulation toxicants.',
  },
  {
    name: 'The Gap Finder',
    role: 'INTELLIGENCE GAPS',
    verdict:
      'Public record covers the clinical outcomes ' +
      'and regulatory response thoroughly. What is ' +
      'absent: the sponsor internal safety signal ' +
      'review prior to the halt, the IRB ' +
      'communication timeline, and any preclinical ' +
      'data that was available but not published. ' +
      'Endpoint News reporting would be the source ' +
      'for behind-the-scenes sponsor decision-making.',
    confidence: 'Medium',
    flag:
      'Three critical process questions have no ' +
      'public answer. Endpoint News subscription may ' +
      'resolve two of them.',
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
    reviewer: 'The Evidence Engine',
    subject: 'The Mechanism Analyst',
    agree:
      'Mitochondrial mechanism analysis is ' +
      'consistent with published data.',
    challenge:
      'Does not address why the specific dosing ' +
      'schedule accelerated accumulation beyond ' +
      'predicted thresholds.',
    score: 8,
  },
  {
    reviewer: 'The Governance Lens',
    subject: 'The Gap Finder',
    agree:
      'Correctly identifies the sponsor ' +
      'communication gap as the critical ' +
      'unresolved question.',
    challenge:
      'Understates the FDA inspection record. ' +
      'Some internal communications may be in ' +
      'FOIA requests.',
    score: 7,
  },
  {
    reviewer: 'The Mechanism Analyst',
    subject: 'The Evidence Engine',
    agree: 'Clinical outcome data is accurately summarized.',
    challenge:
      'Species gap framing is correct but ' +
      'incomplete. The dog model showed early ' +
      'signal that was interpreted as non-significant.',
    score: 7,
  },
  {
    reviewer: 'The Gap Finder',
    subject: 'The Governance Lens',
    agree:
      'Regulatory record assessment is thorough ' +
      'and accurate.',
    challenge:
      'FOIA pathway for sponsor communications ' +
      'was not flagged as an available resolution ' +
      'option.',
    score: 9,
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

const DEFAULT_DRUG =
  'Fialuridine (FIAU), 1993 hepatotoxicity trial halt';

export default function DrugSafetyCouncil() {
  const [drugQuery, setDrugQuery] = useState(
    DEFAULT_DRUG
  );
  const [phase, setPhase] = useState<
    'input' | 'agents' | 'cross' | 'complete'
  >('input');
  const [agentShown, setAgentShown] = useState(0);
  const [critShown, setCritShown] = useState(0);
  const [audit, setAudit] = useState('');
  const [sources, setSources] = useState<Source[]>(
    DRUG_SAFETY_SOURCES
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
      <h2
        style={{
          fontFamily: 'Georgia, serif',
          color: C.navy,
          fontSize: 22,
          marginBottom: 6,
        }}
      >
        Drug Safety Council
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
        Four independent agents review the same
        safety event in isolation. No agent sees
        what the others said. You are the chairman.
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
          Enter drug name or safety event
        </div>
        <input
          type="text"
          value={drugQuery}
          onChange={e => setDrugQuery(e.target.value)}
          placeholder="e.g. Fialuridine, troglitazone, bromfenac..."
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
                alignItems: 'center',
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
                  flex: '1 1 200px',
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
                'All four agents confirm the mechanism, ' +
                  'the clinical outcomes, and the regulatory ' +
                  'timeline. The toxicity was real, severe, ' +
                  'and the public record is well documented. ' +
                  'Mitochondrial DNA accumulation was the ' +
                  'cause. Standard monitoring was insufficient ' +
                  'for this toxicity profile.',
              ],
              [
                'WHERE THE COUNCIL DISAGREED',
                'The Evidence Engine and Mechanism Analyst ' +
                  'diverge on whether the dog model provided ' +
                  'an early signal that was missed or ' +
                  'dismissed. This is a material disagreement ' +
                  'for anyone drawing lessons about ' +
                  'preclinical translation failures.',
              ],
              [
                'RECOMMENDATION',
                'The public record supports a complete ' +
                  'mechanistic brief. The sponsor decision ' +
                  'timeline requires Endpoint News or FOIA ' +
                  'to resolve. Proceed with the public brief ' +
                  'now. Flag the sponsor communication gap as ' +
                  'an open item requiring additional sourcing ' +
                  'before any regulatory submission cites this ' +
                  'case.',
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
                  <li>
                    Clinical outcomes: 7 deaths and
                    transplants confirmed in NEJM 1994
                  </li>
                  <li>
                    Mechanism: mitochondrial gamma
                    polymerase confirmed in literature
                  </li>
                  <li>
                    Regulatory action: FDA clinical hold
                    confirmed in public record
                  </li>
                  <li>
                    Latency period: 4 to 20 weeks
                    confirmed across multiple sources
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
                  <li>
                    Sponsor internal safety review
                    timeline before the halt
                  </li>
                  <li>IRB communication dates</li>
                  <li>
                    Dog model data interpretation by the
                    original investigators
                  </li>
                  <li>
                    Whether FOIA requests exist with
                    additional sponsor documents
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
                  RISKS IF YOU PROCEED
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
                    Citing this case in a regulatory brief
                    without resolving the sponsor timeline
                    gap creates a sourcing vulnerability
                  </li>
                  <li>
                    Mechanism section relies on published
                    interpretation. Original raw data is
                    not publicly available
                  </li>
                  <li>
                    Dog model disagreement between agents
                    is unresolved and may affect lessons
                    learned framing
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
