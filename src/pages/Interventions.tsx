const C = {
  navy:'#2D4459', teal:'#3BBFBF', coral:'#F05F57',
  burnt:'#C8613F', slate:'#7A8F95', mint:'#C8E8E5',
  cream:'#FEFAF5', white:'#ffffff', border:'#C8E8E5',
  purple:'#6B5EA8',
};

const tiers = [
  {
    name: 'The Spark',
    price: '$1,499',
    cadence: 'one-time',
    color: C.burnt,
    bg: '#E8A99A20',
    description: 'Decision Intelligence Audit. We map where your expertise is leaking into manual work and show you exactly what AI should be doing instead.',
    includes: [
      '90-minute STZ discovery session',
      'Five-page gap analysis',
      'ROI projection with real numbers',
      '30-day roadmap',
      '4 hours of Zubia\'s time',
    ],
  },
  {
    name: 'The Pulse',
    price: '$3,500',
    cadence: 'build + $199/month',
    color: C.teal,
    bg: '#C8E8E530',
    description: 'Web-based decision intelligence dashboard configured for your practice. Five pages. Your signals. Your data. Nothing in the cloud.',
    includes: [
      'Morning Brief — who needs attention today',
      'Business Goals — revenue tracking',
      'Client Intelligence — every client organized',
      'Health Interventions — signals before problems',
      'My Practice — patterns over time',
    ],
  },
  {
    name: 'The Vault',
    price: '$7,500',
    cadence: 'build + $349/month',
    color: C.navy,
    bg: '#2D445910',
    description: 'Desktop application. Fully airgapped. Local AI running on your machine. All five STZ layers operational. Nothing ever leaves your office.',
    includes: [
      'Everything in The Pulse',
      'Local AI via Ollama — runs on your machine',
      'Document extraction and RAG',
      'All five STZ layers built',
      'Windows + Mac installer delivered',
    ],
  },
  {
    name: 'The Scale',
    price: '$499',
    cadence: 'per quarter',
    color: C.purple,
    bg: '#6B5EA810',
    description: 'Quarterly strategy session for Vault clients. Pre-call data review, one-page intelligence brief, and one async question per month.',
    includes: [
      'Quarterly strategy session',
      'Pre-call data review',
      'One-page intelligence brief',
      'One async question per month',
      'Vault clients only — 12 months minimum',
    ],
  },
];

const catalogue = [
  {
    category: 'Communicate',
    color: C.teal,
    icon: '✉️',
    jobs: [
      {
        name: 'Follow-Up Email',
        in: 'Meeting transcript or notes',
        out: 'Email in your voice — ready to send',
      },
      {
        name: 'Re-Engagement Message',
        in: 'Client name + last contact date',
        out: 'Outreach message — personal and warm',
      },
      {
        name: 'Proposal',
        in: 'Client profile + goals + tier',
        out: 'Full proposal document — pre-filled',
      },
      {
        name: 'Newsletter Draft',
        in: '5 bullet points or a topic',
        out: 'Full newsletter in your voice',
      },
      {
        name: 'LinkedIn Post',
        in: 'Topic or idea',
        out: 'Post in your voice — ready to publish',
      },
      {
        name: 'Cold Outreach',
        in: 'Contact profile or company',
        out: 'First message — specific and relevant',
      },
    ],
  },
  {
    category: 'Document',
    color: C.navy,
    icon: '📄',
    jobs: [
      {
        name: 'Statement of Work',
        in: 'Approved proposal + timeline',
        out: 'Full SOW with milestones and payment schedule',
      },
      {
        name: 'Project Plan',
        in: 'Scope + timeline + client name',
        out: 'Phase-by-phase plan with tasks and owners',
      },
      {
        name: 'Status Update',
        in: 'Progress notes or bullet points',
        out: 'Client-ready update — professional and clear',
      },
      {
        name: 'Meeting Summary',
        in: 'Transcript or rough notes',
        out: 'Structured summary with action items',
      },
      {
        name: 'Onboarding Pack',
        in: 'Client intake form answers',
        out: 'Welcome document with next steps',
      },
      {
        name: 'SOP Builder',
        in: 'How you do something — in your words',
        out: 'Written procedure — repeatable and trainable',
      },
    ],
  },
  {
    category: 'Read and Extract',
    color: C.burnt,
    icon: '🔍',
    jobs: [
      {
        name: 'Pain Point Extractor',
        in: 'Transcript, notes, or intake form',
        out: 'Pain points listed and ranked by urgency',
      },
      {
        name: 'Action Item Extractor',
        in: 'Meeting transcript or notes',
        out: 'Clean action list with owners and dates',
      },
      {
        name: 'Risk Flag Finder',
        in: 'Document, contract, or notes',
        out: 'Red flags surfaced with plain-language explanation',
      },
      {
        name: 'Key Points Reader',
        in: 'Any document up to 20 pages',
        out: 'Top 5 takeaways — one paragraph each',
      },
      {
        name: 'Contract Plain English',
        in: 'Legal document or agreement',
        out: 'Plain language summary — what it actually means',
      },
      {
        name: 'Competitive Intel',
        in: 'Competitor page, doc, or notes',
        out: 'Comparison summary — where you win',
      },
    ],
  },
  {
    category: 'Find Patterns',
    color: C.coral,
    icon: '📊',
    jobs: [
      {
        name: 'Trend Finder',
        in: 'Articles, reports, or market notes',
        out: 'Patterns and signals — what it means for you',
      },
      {
        name: 'Client Pattern Detector',
        in: 'Multiple client notes or transcripts',
        out: 'Common themes across your client base',
      },
      {
        name: 'Revenue Signal Finder',
        in: 'CRM notes or past emails',
        out: 'Buying signals — who is ready to move',
      },
      {
        name: 'Objection Pattern',
        in: 'Past meeting notes or call transcripts',
        out: 'Recurring objections — and how to address them',
      },
      {
        name: 'Gone Quiet Detector',
        in: 'Client history and contact log',
        out: 'At-risk list with recommended next action',
      },
    ],
  },
  {
    category: 'Build Knowledge',
    color: C.purple,
    icon: '🧠',
    jobs: [
      {
        name: 'Voice Library',
        in: 'Your best writing samples',
        out: 'Reusable prompt set trained on your voice',
      },
      {
        name: 'FAQ Builder',
        in: 'Past emails or client questions',
        out: 'FAQ document — ready to share or publish',
      },
      {
        name: 'Expert Profile',
        in: 'Your methodology and approach',
        out: 'Structured knowledge base — your expertise encoded',
      },
      {
        name: 'Training Material',
        in: 'Your process — how you do what you do',
        out: 'Onboarding document for staff or clients',
      },
      {
        name: 'Exception Library',
        in: 'Your edge cases and judgment calls',
        out: 'AI training examples — your exceptions encoded',
      },
    ],
  },
  {
    category: 'Full Systems',
    color: C.teal,
    icon: '⚡',
    jobs: [
      {
        name: 'Starter Voice',
        in: 'Your writing samples + one job defined',
        out: 'Voice built + local AI connected + 1 job running',
      },
      {
        name: 'Pulse Dashboard',
        in: 'STZ discovery session answers',
        out: 'Five-page web dashboard configured for your practice',
      },
      {
        name: 'Vault System',
        in: 'Full STZ build across all five layers',
        out: 'Desktop app — airgapped, local AI, full intelligence',
      },
      {
        name: 'Menu Retainer',
        in: 'Ongoing practice needs',
        out: 'System maintained + new jobs added every month',
      },
    ],
  },
];

export const Interventions = () => {
  return (
    <div style={{
      padding: '28px 32px',
      background: C.cream,
      minHeight: '100vh',
    }}>
      <div style={{
        fontSize: 20, fontWeight: 700,
        color: C.navy, marginBottom: 4,
      }}>
        Services
      </div>
      <div style={{
        fontSize: 13, color: C.slate, marginBottom: 28,
      }}>
        Everything we build. Every job we run.
        Every system we deploy.
      </div>

      {/* Tier cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 12, marginBottom: 36,
      }}>
        {tiers.map(t => (
          <div key={t.name} style={{
            background: C.white,
            border: `1px solid ${C.border}`,
            borderTop: `4px solid ${t.color}`,
            borderRadius: 12,
            padding: '18px 18px 16px',
          }}>
            <div style={{
              fontSize: 13, fontWeight: 800,
              color: t.color, marginBottom: 2,
            }}>
              {t.name}
            </div>
            <div style={{
              fontSize: 22, fontWeight: 800,
              color: C.navy, marginBottom: 2,
            }}>
              {t.price}
            </div>
            <div style={{
              fontSize: 10, color: C.slate,
              marginBottom: 10,
            }}>
              {t.cadence}
            </div>
            <div style={{
              fontSize: 11, color: C.navy,
              lineHeight: 1.6, marginBottom: 12,
              paddingBottom: 12,
              borderBottom: `1px solid ${C.border}`,
            }}>
              {t.description}
            </div>
            {t.includes.map((item, i) => (
              <div key={i} style={{
                display: 'flex', gap: 6,
                alignItems: 'flex-start',
                marginBottom: 5,
              }}>
                <span style={{
                  color: t.color, fontSize: 10,
                  marginTop: 2, flexShrink: 0,
                }}>✓</span>
                <span style={{
                  fontSize: 11, color: C.slate,
                  lineHeight: 1.5,
                }}>
                  {item}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Catalogue */}
      <div style={{
        fontSize: 15, fontWeight: 700,
        color: C.navy, marginBottom: 4,
      }}>
        Job Catalogue
      </div>
      <div style={{
        fontSize: 12, color: C.slate, marginBottom: 20,
      }}>
        Individual jobs built into your dashboard.
        Select what your practice needs.
        Each job runs privately on your machine.
      </div>

      <div style={{
        display: 'flex', flexDirection: 'column', gap: 28,
      }}>
        {catalogue.map(cat => (
          <div key={cat.category}>
            <div style={{
              display: 'flex', alignItems: 'center',
              gap: 8, marginBottom: 12,
            }}>
              <span style={{ fontSize: 16 }}>{cat.icon}</span>
              <div style={{
                fontSize: 13, fontWeight: 700,
                color: cat.color,
              }}>
                {cat.category}
              </div>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 10,
            }}>
              {cat.jobs.map(job => (
                <div key={job.name} style={{
                  background: C.white,
                  border: `1px solid ${C.border}`,
                  borderLeft: `4px solid ${cat.color}`,
                  borderRadius: 10,
                  padding: '12px 14px',
                }}>
                  <div style={{
                    fontSize: 13, fontWeight: 700,
                    color: C.navy, marginBottom: 8,
                  }}>
                    {job.name}
                  </div>
                  <div style={{
                    display: 'flex', flexDirection: 'column',
                    gap: 4,
                  }}>
                    <div style={{
                      display: 'flex', gap: 6,
                      alignItems: 'flex-start',
                    }}>
                      <span style={{
                        fontSize: 9, fontWeight: 700,
                        color: C.slate,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        minWidth: 24, marginTop: 1,
                      }}>IN</span>
                      <span style={{
                        fontSize: 11, color: C.slate,
                        lineHeight: 1.5,
                      }}>
                        {job.in}
                      </span>
                    </div>
                    <div style={{
                      display: 'flex', gap: 6,
                      alignItems: 'flex-start',
                    }}>
                      <span style={{
                        fontSize: 9, fontWeight: 700,
                        color: cat.color,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        minWidth: 24, marginTop: 1,
                      }}>OUT</span>
                      <span style={{
                        fontSize: 11, color: C.navy,
                        fontWeight: 600, lineHeight: 1.5,
                      }}>
                        {job.out}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
