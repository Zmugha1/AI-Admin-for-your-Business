import { useState, type ReactNode } from 'react';
import DrugSafetyCouncil from './DrugSafetyCouncil';
import NurseCouncil from './NurseCouncil';

const C = {
  navy:   '#2D4459',
  teal:   '#3BBFBF',
  mint:   '#C8E8E5',
  coral:  '#F05F57',
  gold:   '#C8974A',
  slate:  '#7A8F95',
  cream:  '#FEFAF5',
  white:  '#FFFFFF',
  border: '#C8E8E5',
  lgray:  '#F4F7F8',
  green:  '#3A7D5C',
};

type Job =
  | 'invoice'
  | 'timesheet'
  | 'safety'
  | 'drug_council'
  | 'nurse_council';

function Card({
  children,
  accent,
}: {
  children: ReactNode;
  accent?: string;
}) {
  return (
    <div style={{
      background: C.white,
      border: `1px solid ${C.border}`,
      borderLeft: `4px solid ${accent ?? C.teal}`,
      borderRadius: 12,
      padding: '16px 20px',
      marginBottom: 14,
    }}>
      {children}
    </div>
  );
}

function Label({ children }: {
  children: ReactNode
}) {
  return (
    <div style={{
      fontFamily: 'Courier New, monospace',
      fontSize: 10,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.08em',
      color: C.slate,
      marginBottom: 4,
    }}>
      {children}
    </div>
  );
}

function Source({ children }: {
  children: ReactNode
}) {
  return (
    <div style={{
      fontFamily: 'Courier New, monospace',
      fontSize: 10,
      color: C.teal,
      marginTop: 6,
    }}>
      {children}
    </div>
  );
}

function AuditLine({ text }: { text: string }) {
  return (
    <div style={{
      fontFamily: 'Courier New, monospace',
      fontSize: 11,
      color: C.slate,
      background: C.lgray,
      borderRadius: 8,
      padding: '8px 12px',
      marginTop: 10,
    }}>
      {text}
    </div>
  );
}

function ApproveReject({
  onApprove,
  onReject,
  approved,
  rejected,
}: {
  onApprove: () => void;
  onReject: () => void;
  approved: boolean;
  rejected: boolean;
}) {
  return (
    <div style={{
      display: 'flex', gap: 10, marginTop: 16,
    }}>
      <button
        type="button"
        onClick={onApprove}
        disabled={approved || rejected}
        style={{
          padding: '9px 22px',
          background: approved
            ? C.green : C.teal,
          color: C.white,
          border: 'none', borderRadius: 8,
          fontSize: 13, fontWeight: 700,
          cursor: approved || rejected
            ? 'default' : 'pointer',
          fontFamily: 'Trebuchet MS, sans-serif',
        }}>
        {approved
          ? 'Approved ✓'
          : 'Approve and Send'}
      </button>
      <button
        type="button"
        onClick={onReject}
        disabled={approved || rejected}
        style={{
          padding: '9px 22px',
          background: rejected
            ? C.lgray : '#F05F5712',
          color: rejected ? C.slate : C.coral,
          border: `1px solid ${rejected
            ? C.border : C.coral}`,
          borderRadius: 8,
          fontSize: 13, fontWeight: 600,
          cursor: approved || rejected
            ? 'default' : 'pointer',
          fontFamily: 'Trebuchet MS, sans-serif',
        }}>
        {rejected
          ? 'Rejected'
          : 'Reject and Edit'}
      </button>
    </div>
  );
}

function InvoiceJob() {
  const [prepHours, setPrepHours] =
    useState<string>('');
  const [calculated, setCalculated] =
    useState(false);
  const [approved, setApproved] =
    useState(false);
  const [rejected, setRejected] =
    useState(false);
  const [auditLine, setAuditLine] =
    useState('');

  const meetingHours = 2.0;
  const rate = 450;
  const prep = parseFloat(prepHours) || 0;
  const total = meetingHours + prep;
  const invoiceTotal = total * rate;
  const now = new Date().toLocaleString();

  function handleApprove() {
    setApproved(true);
    setAuditLine(
      `Action logged: Approved by ` +
      `Dr. Raj Vuppalanchi · ${now}`
    );
  }

  function handleReject() {
    setRejected(true);
    setAuditLine(
      `Action logged: Rejected by ` +
      `Dr. Raj Vuppalanchi · ${now}`
    );
  }

  return (
    <div>
      <h2 style={{
        fontFamily: 'Georgia, serif',
        color: C.navy, marginBottom: 4,
        fontSize: 22,
      }}>
        Consulting Invoice Generator
      </h2>
      <p style={{
        color: C.slate, fontSize: 13,
        marginBottom: 24,
        fontFamily: 'Trebuchet MS, sans-serif',
      }}>
        Draft an invoice from a calendar meeting
        and your contract rate, then approve
        before it is treated as final.
      </p>

      <Card accent={C.teal}>
        <Label>Meeting Detected</Label>
        <div style={{
          fontSize: 15, fontWeight: 700,
          color: C.navy,
          fontFamily: 'Georgia, serif',
          marginBottom: 2,
        }}>
          Helix Pharma Inc.
        </div>
        <div style={{
          fontSize: 13, color: C.slate,
          fontFamily: 'Trebuchet MS, sans-serif',
        }}>
          DSMB Review Call · March 18, 2026 ·
          2 hours
        </div>
        <Source>Source: Google Calendar</Source>
      </Card>

      <Card accent={C.gold}>
        <Label>Contract Rate Pulled</Label>
        <div style={{
          fontSize: 22, fontWeight: 800,
          color: C.navy,
          fontFamily: 'Georgia, serif',
        }}>
          $450/hour
        </div>
        <Source>
          Source: Helix Pharma Agreement 2025.pdf
        </Source>
      </Card>

      <Card accent={C.slate}>
        <Label>Preparation Hours</Label>
        <div style={{
          fontSize: 13, color: C.navy,
          marginBottom: 10,
          fontFamily: 'Trebuchet MS, sans-serif',
        }}>
          How many hours did you spend preparing
          for this meeting?
        </div>
        <div style={{
          display: 'flex', gap: 10,
          alignItems: 'center',
        }}>
          <input
            type="number"
            min="0"
            step="0.5"
            value={prepHours}
            onChange={e =>
              setPrepHours(e.target.value)}
            placeholder="0"
            style={{
              width: 100,
              padding: '8px 12px',
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              fontSize: 14, color: C.navy,
              fontFamily:
                'Trebuchet MS, sans-serif',
            }} />
          <button
            type="button"
            onClick={() => setCalculated(true)}
            disabled={calculated}
            style={{
              padding: '8px 20px',
              background: calculated
                ? C.lgray : C.teal,
              color: calculated
                ? C.slate : C.white,
              border: 'none', borderRadius: 8,
              fontSize: 12, fontWeight: 700,
              cursor: calculated
                ? 'default' : 'pointer',
              fontFamily:
                'Trebuchet MS, sans-serif',
            }}>
            {calculated
              ? 'Calculated ✓'
              : 'Calculate Invoice'}
          </button>
        </div>
      </Card>

      {calculated && (
        <Card accent={C.teal}>
          <Label>Invoice Preview</Label>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8, marginBottom: 12,
          }}>
            {[
              ['Bill To', 'Helix Pharma Inc.'],
              ['From',
                'Dr. Data Decision Intelligence LLC'],
              ['Invoice Date', 'March 18, 2026'],
              ['Due Date', 'April 17, 2026'],
              ['Meeting Hours',
                `${meetingHours.toFixed(1)} hrs`],
              ['Prep Hours', `${prep.toFixed(1)} hrs`],
              ['Total Hours',
                `${total.toFixed(1)} hrs`],
              ['Rate', `$${rate}/hour`],
            ].map(([k, v]) => (
              <div key={k} style={{
                background: C.lgray,
                borderRadius: 8,
                padding: '8px 12px',
              }}>
                <div style={{
                  fontFamily:
                    'Courier New, monospace',
                  fontSize: 9,
                  textTransform: 'uppercase' as const,
                  color: C.slate,
                  marginBottom: 2,
                }}>
                  {k}
                </div>
                <div style={{
                  fontSize: 13, fontWeight: 600,
                  color: C.navy,
                  fontFamily:
                    'Trebuchet MS, sans-serif',
                }}>
                  {v}
                </div>
              </div>
            ))}
          </div>

          <div style={{
            background: C.navy,
            borderRadius: 10,
            padding: '14px 18px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 4,
          }}>
            <div style={{
              fontFamily: 'Georgia, serif',
              fontSize: 15, color: C.mint,
            }}>
              Invoice Total
            </div>
            <div style={{
              fontFamily: 'Georgia, serif',
              fontSize: 28, fontWeight: 800,
              color: C.white,
            }}>
              ${invoiceTotal.toLocaleString()}
            </div>
          </div>

          <ApproveReject
            onApprove={handleApprove}
            onReject={handleReject}
            approved={approved}
            rejected={rejected}
          />
          {auditLine && (
            <AuditLine text={auditLine} />
          )}
        </Card>
      )}
    </div>
  );
}

function TimesheetJob() {
  const [extraHours, setExtraHours] =
    useState<string>('0');
  const [generated, setGenerated] =
    useState(false);
  const [approved, setApproved] =
    useState(false);
  const [rejected, setRejected] =
    useState(false);
  const [auditLine, setAuditLine] =
    useState('');

  const meetings = [
    {
      date: 'April 1, 2026',
      name: 'Division Leadership Meeting',
      hours: 1.0,
    },
    {
      date: 'April 7, 2026',
      name: 'Faculty Senate Subcommittee',
      hours: 0.5,
    },
    {
      date: 'April 14, 2026',
      name: 'Division Leadership Meeting',
      hours: 1.0,
    },
    {
      date: 'April 21, 2026',
      name: 'Research Compliance Review',
      hours: 1.5,
    },
  ];

  const calendarHours = meetings.reduce(
    (s, m) => s + m.hours, 0
  );
  const extra = parseFloat(extraHours) || 0;
  const totalHours = calendarHours + extra;
  const allocated = 120;
  const claimedToDate = 47.5;
  const remaining =
    allocated - claimedToDate - totalHours;
  const now = new Date().toLocaleString();

  function handleApprove() {
    setApproved(true);
    setAuditLine(
      `Action logged: Approved by ` +
      `Dr. Raj Vuppalanchi · ${now}`
    );
  }

  function handleReject() {
    setRejected(true);
    setAuditLine(
      `Action logged: Rejected by ` +
      `Dr. Raj Vuppalanchi · ${now}`
    );
  }

  return (
    <div>
      <h2 style={{
        fontFamily: 'Georgia, serif',
        color: C.navy, marginBottom: 4,
        fontSize: 22,
      }}>
        Directorship Hours Timesheet
      </h2>
      <p style={{
        color: C.slate, fontSize: 13,
        marginBottom: 24,
        fontFamily: 'Trebuchet MS, sans-serif',
      }}>
        Pull admin meeting hours from your
        calendar, add manual time, and submit
        your monthly timesheet for IU.
      </p>

      <Card accent={C.teal}>
        <Label>Calendar Pull Complete</Label>
        <Source>
          Source: IU Outlook Calendar · April 2026
        </Source>
        <div style={{ marginTop: 12 }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: 12,
          }}>
            <thead>
              <tr style={{
                background: C.lgray,
              }}>
                {['Date', 'Meeting', 'Hours']
                  .map(h => (
                  <th key={h} style={{
                    padding: '8px 12px',
                    textAlign: 'left' as const,
                    fontFamily:
                      'Courier New, monospace',
                    fontSize: 9,
                    textTransform:
                      'uppercase' as const,
                    color: C.slate,
                    letterSpacing: '0.06em',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {meetings.map((m, i) => (
                <tr key={i} style={{
                  borderBottom:
                    `1px solid ${C.border}`,
                  background: i % 2 === 0
                    ? C.white : C.cream,
                }}>
                  <td style={{
                    padding: '8px 12px',
                    color: C.slate, fontSize: 12,
                    fontFamily:
                      'Courier New, monospace',
                  }}>
                    {m.date}
                  </td>
                  <td style={{
                    padding: '8px 12px',
                    color: C.navy,
                    fontWeight: 600,
                    fontSize: 12,
                    fontFamily:
                      'Trebuchet MS, sans-serif',
                  }}>
                    {m.name}
                  </td>
                  <td style={{
                    padding: '8px 12px',
                    color: C.teal,
                    fontWeight: 700,
                    fontSize: 12,
                    fontFamily:
                      'Georgia, serif',
                  }}>
                    {m.hours.toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{
            marginTop: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 12px',
            background: C.lgray,
            borderRadius: 8,
          }}>
            <div style={{ flex: 1 }}>
              <div style={{
                fontFamily:
                  'Courier New, monospace',
                fontSize: 10,
                color: C.slate,
                marginBottom: 2,
                textTransform: 'uppercase' as const,
              }}>
                Additional hours
              </div>
              <div style={{
                fontSize: 11, color: C.slate,
                fontFamily:
                  'Trebuchet MS, sans-serif',
              }}>
                Time not captured on calendar.
                Enter manually.
              </div>
            </div>
            <input
              type="number"
              min="0"
              step="0.5"
              value={extraHours}
              onChange={e =>
                setExtraHours(e.target.value)}
              style={{
                width: 80,
                padding: '7px 10px',
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                fontSize: 13, color: C.navy,
                fontFamily:
                  'Trebuchet MS, sans-serif',
              }} />
          </div>

          <button
            type="button"
            onClick={() => setGenerated(true)}
            disabled={generated}
            style={{
              marginTop: 12,
              padding: '8px 20px',
              background: generated
                ? C.lgray : C.teal,
              color: generated
                ? C.slate : C.white,
              border: 'none', borderRadius: 8,
              fontSize: 12, fontWeight: 700,
              cursor: generated
                ? 'default' : 'pointer',
              fontFamily:
                'Trebuchet MS, sans-serif',
            }}>
            {generated
              ? 'Generated ✓'
              : 'Generate Timesheet'}
          </button>
        </div>
      </Card>

      {generated && (
        <Card accent={C.navy}>
          <Label>Timesheet Preview</Label>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8, marginBottom: 16,
          }}>
            {[
              ['Month', 'April 2026'],
              ['Name', 'Dr. Raj Vuppalanchi'],
              ['Title',
                'Director of Clinical Research'],
              ['Calendar Hours',
                `${calendarHours.toFixed(1)} hrs`],
              ['Additional Hours',
                `${extra.toFixed(1)} hrs`],
              ['Total This Month',
                `${totalHours.toFixed(1)} hrs`],
              ['Allocated This Year',
                `${allocated} hrs`],
              ['Claimed to Date',
                `${claimedToDate} hrs`],
            ].map(([k, v]) => (
              <div key={k} style={{
                background: C.lgray,
                borderRadius: 8,
                padding: '8px 12px',
              }}>
                <div style={{
                  fontFamily:
                    'Courier New, monospace',
                  fontSize: 9,
                  textTransform: 'uppercase' as const,
                  color: C.slate,
                  marginBottom: 2,
                }}>
                  {k}
                </div>
                <div style={{
                  fontSize: 13, fontWeight: 600,
                  color: C.navy,
                  fontFamily:
                    'Trebuchet MS, sans-serif',
                }}>
                  {v}
                </div>
              </div>
            ))}
          </div>

          <div style={{
            background: C.navy,
            borderRadius: 10,
            padding: '14px 18px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 4,
          }}>
            <div style={{
              fontFamily: 'Georgia, serif',
              fontSize: 15, color: C.mint,
            }}>
              Hours Remaining This Year
            </div>
            <div style={{
              fontFamily: 'Georgia, serif',
              fontSize: 28, fontWeight: 800,
              color: remaining < 10
                ? C.coral : C.white,
            }}>
              {remaining.toFixed(1)}
            </div>
          </div>

          <ApproveReject
            onApprove={handleApprove}
            onReject={handleReject}
            approved={approved}
            rejected={rejected}
          />
          {auditLine && (
            <AuditLine text={auditLine} />
          )}
        </Card>
      )}
    </div>
  );
}

function SafetyJob() {
  const [query, setQuery] = useState('');
  const [generated, setGenerated] =
    useState(false);
  const [approved, setApproved] =
    useState(false);
  const [rejected, setRejected] =
    useState(false);
  const [auditLine, setAuditLine] =
    useState('');
  const now = new Date().toLocaleString();

  function handleApprove() {
    setApproved(true);
    setAuditLine(
      `Action logged: Saved to Research File ` +
      `by Dr. Raj Vuppalanchi · ${now}`
    );
  }

  function handleReject() {
    setRejected(true);
    setAuditLine(
      `Action logged: Discarded by ` +
      `Dr. Raj Vuppalanchi · ${now}`
    );
  }

  return (
    <div>
      <h2 style={{
        fontFamily: 'Georgia, serif',
        color: C.navy, marginBottom: 4,
        fontSize: 22,
      }}>
        Drug Safety Intelligence Brief
      </h2>
      <p style={{
        color: C.slate, fontSize: 13,
        marginBottom: 24,
        fontFamily: 'Trebuchet MS, sans-serif',
      }}>
        Enter a drug name or safety event.
        The system retrieves a structured
        intelligence brief with sourced citations
        for your review.
      </p>

      <Card accent={C.slate}>
        <Label>Drug or Event Search</Label>
        <div style={{
          display: 'flex', gap: 10,
          marginTop: 6,
        }}>
          <input
            type="text"
            value={query}
            onChange={e =>
              setQuery(e.target.value)}
            placeholder="e.g. Fialuridine, troglitazone, bromfenac..."
            style={{
              flex: 1,
              padding: '8px 12px',
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              fontSize: 13, color: C.navy,
              fontFamily:
                'Trebuchet MS, sans-serif',
            }} />
          <button
            type="button"
            onClick={() => setGenerated(true)}
            disabled={
              !query.trim() || generated
            }
            style={{
              padding: '8px 20px',
              background:
                !query.trim() || generated
                  ? C.lgray : C.teal,
              color:
                !query.trim() || generated
                  ? C.slate : C.white,
              border: 'none', borderRadius: 8,
              fontSize: 12, fontWeight: 700,
              cursor:
                !query.trim() || generated
                  ? 'default' : 'pointer',
              fontFamily:
                'Trebuchet MS, sans-serif',
            }}>
            {generated
              ? 'Generated ✓'
              : 'Run Intelligence Brief'}
          </button>
        </div>
      </Card>

      {generated && (
        <Card accent={C.coral}>
          <div style={{
            fontFamily: 'Georgia, serif',
            fontSize: 16, fontWeight: 700,
            color: C.navy, marginBottom: 16,
          }}>
            Drug Safety Intelligence Brief
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8, marginBottom: 16,
          }}>
            {[
              ['Drug', 'Fialuridine (FIAU)'],
              ['Event Date', '1993'],
              ['Classification',
                'Hepatotoxicity, mitochondrial'],
              ['Status', 'Trial halted'],
            ].map(([k, v]) => (
              <div key={k} style={{
                background: C.lgray,
                borderRadius: 8,
                padding: '8px 12px',
              }}>
                <div style={{
                  fontFamily:
                    'Courier New, monospace',
                  fontSize: 9,
                  textTransform: 'uppercase' as const,
                  color: C.slate,
                  marginBottom: 2,
                }}>
                  {k}
                </div>
                <div style={{
                  fontSize: 13, fontWeight: 600,
                  color: C.navy,
                  fontFamily:
                    'Trebuchet MS, sans-serif',
                }}>
                  {v}
                </div>
              </div>
            ))}
          </div>

          <div style={{
            marginBottom: 16,
          }}>
            <div style={{
              fontFamily: 'Courier New, monospace',
              fontSize: 10,
              textTransform: 'uppercase' as const,
              color: C.coral,
              letterSpacing: '0.08em',
              marginBottom: 8,
            }}>
              What Happened
            </div>
            <p style={{
              fontSize: 13, color: C.navy,
              lineHeight: 1.7,
              fontFamily: 'Trebuchet MS, sans-serif',
              marginBottom: 10,
            }}>
              Fialuridine was an antiviral compound
              being evaluated for chronic hepatitis B
              in a Phase II trial at the NIH Clinical
              Center. In 1993, five of fifteen
              patients developed severe lactic
              acidosis and hepatic failure. Seven
              patients required liver transplants and
              five died. The trial was halted
              immediately.
            </p>
            <p style={{
              fontSize: 13, color: C.navy,
              lineHeight: 1.7,
              fontFamily: 'Trebuchet MS, sans-serif',
            }}>
              Post-trial investigation determined
              that FIAU caused mitochondrial toxicity
              through incorporation into mitochondrial
              DNA, disrupting oxidative
              phosphorylation. Standard preclinical
              animal models had not predicted this
              toxicity because rodents and dogs do
              not incorporate nucleoside analogues
              into mitochondrial DNA the way humans
              do. The case became a landmark example
              of the limitations of animal models in
              predicting human mitochondrial toxicity.
            </p>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{
              fontFamily: 'Courier New, monospace',
              fontSize: 10,
              textTransform: 'uppercase' as const,
              color: C.slate,
              letterSpacing: '0.08em',
              marginBottom: 8,
            }}>
              Sources Reviewed
            </div>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 12,
            }}>
              <thead>
                <tr style={{
                  background: C.lgray,
                }}>
                  {['Source', 'Type', 'Year']
                    .map(h => (
                    <th key={h} style={{
                      padding: '8px 12px',
                      textAlign: 'left' as const,
                      fontFamily:
                        'Courier New, monospace',
                      fontSize: 9,
                      textTransform:
                        'uppercase' as const,
                      color: C.slate,
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['NIH Clinical Center Report',
                    'Government', '1994'],
                  ['New England Journal of Medicine',
                    'Peer Review', '1995'],
                  ['FDA Drug Safety Communication',
                    'Regulatory', '1994'],
                ].map(([s, t, y], i) => (
                  <tr key={i} style={{
                    borderBottom:
                      `1px solid ${C.border}`,
                    background: i % 2 === 0
                      ? C.white : C.cream,
                  }}>
                    <td style={{
                      padding: '8px 12px',
                      color: C.navy,
                      fontWeight: 600,
                      fontFamily:
                        'Trebuchet MS, sans-serif',
                    }}>
                      {s}
                    </td>
                    <td style={{
                      padding: '8px 12px',
                      color: C.slate,
                      fontFamily:
                        'Courier New, monospace',
                      fontSize: 11,
                    }}>
                      {t}
                    </td>
                    <td style={{
                      padding: '8px 12px',
                      color: C.slate,
                      fontFamily:
                        'Courier New, monospace',
                      fontSize: 11,
                    }}>
                      {y}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{
              fontFamily: 'Courier New, monospace',
              fontSize: 10,
              textTransform: 'uppercase' as const,
              color: C.slate,
              letterSpacing: '0.08em',
              marginBottom: 8,
            }}>
              Gaps in Public Record
            </div>
            <p style={{
              fontSize: 13, color: C.navy,
              lineHeight: 1.7,
              fontFamily: 'Trebuchet MS, sans-serif',
            }}>
              The public record does not include
              internal NIH deliberations about
              continuing the trial after early
              signals, the full informed consent
              documentation, or the complete
              autopsy findings for the five patients
              who died. Endpoint News reporting on
              trial oversight decisions and IRB
              communications from this period would
              add significant context to the
              regulatory timeline.
            </p>
          </div>

          <div style={{
            display: 'flex', gap: 10,
            marginTop: 16,
          }}>
            <button
              type="button"
              onClick={handleApprove}
              disabled={approved || rejected}
              style={{
                padding: '9px 22px',
                background: approved
                  ? C.green : C.teal,
                color: C.white,
                border: 'none', borderRadius: 8,
                fontSize: 13, fontWeight: 700,
                cursor: approved || rejected
                  ? 'default' : 'pointer',
                fontFamily:
                  'Trebuchet MS, sans-serif',
              }}>
              {approved
                ? 'Saved ✓'
                : 'Save to Research File'}
            </button>
            <button
              type="button"
              onClick={handleReject}
              disabled={approved || rejected}
              style={{
                padding: '9px 22px',
                background: rejected
                  ? C.lgray : '#F05F5712',
                color: rejected
                  ? C.slate : C.coral,
                border: `1px solid ${rejected
                  ? C.border : C.coral}`,
                borderRadius: 8,
                fontSize: 13, fontWeight: 600,
                cursor: approved || rejected
                  ? 'default' : 'pointer',
                fontFamily:
                  'Trebuchet MS, sans-serif',
              }}>
              {rejected ? 'Discarded' : 'Discard'}
            </button>
          </div>
          {auditLine && (
            <AuditLine text={auditLine} />
          )}
        </Card>
      )}
    </div>
  );
}

export function DrRajDemo() {
  const [activeJob, setActiveJob] =
    useState<Job>('invoice');

  const jobs: { id: Job; label: string }[] = [
    { id: 'invoice',
      label: 'Invoice Generator' },
    { id: 'timesheet',
      label: 'Directorship Timesheet' },
    { id: 'safety',
      label: 'Drug Safety Brief' },
    { id: 'drug_council',
      label: 'Drug Safety Council' },
    { id: 'nurse_council',
      label: 'Patient Education Council' },
  ];

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      background: C.cream,
    }}>

      {/* Left sidebar */}
      <div style={{
        width: 220, minWidth: 220,
        background: C.navy,
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
      }}>
        <div style={{
          padding: '20px 16px 16px',
          borderBottom:
            '1px solid rgba(200,232,229,0.12)',
        }}>
          <div style={{
            fontFamily: 'Georgia, serif',
            fontSize: 15, fontWeight: 700,
            color: C.teal, marginBottom: 2,
          }}>
            Dr. Raj Demo
          </div>
          <div style={{
            fontFamily: 'Courier New, monospace',
            fontSize: 10, color: C.slate,
          }}>
            Decision Intelligence Preview
          </div>
        </div>

        <nav style={{
          flex: 1, padding: '10px 8px',
        }}>
          {jobs.map(j => {
            const active = activeJob === j.id;
            return (
              <button
                type="button"
                key={j.id}
                onClick={() =>
                  setActiveJob(j.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '10px 12px',
                  marginBottom: 2,
                  background: active
                    ? 'rgba(59,191,191,0.12)'
                    : 'transparent',
                  borderLeft: active
                    ? `3px solid ${C.teal}`
                    : '3px solid transparent',
                  border: 'none',
                  color: active
                    ? C.mint : C.slate,
                  fontSize: 12,
                  fontWeight: active ? 600 : 400,
                  cursor: 'pointer',
                  textAlign: 'left' as const,
                  fontFamily:
                    'Trebuchet MS, sans-serif',
                  transition: 'all 0.15s',
                }}>
                {j.label}
              </button>
            );
          })}
        </nav>

        <div style={{
          padding: '12px 16px',
          borderTop:
            '1px solid rgba(200,232,229,0.10)',
          fontFamily: 'Courier New, monospace',
          fontSize: 9, color: C.slate,
          lineHeight: 1.5,
        }}>
          Built by Dr. Data Decision
          Intelligence LLC
        </div>
      </div>

      {/* Right panel */}
      <div style={{
        flex: 1, overflowY: 'auto',
        padding: '32px 36px',
        background: C.cream,
      }}>
        {activeJob === 'invoice' &&
          <InvoiceJob />}
        {activeJob === 'timesheet' &&
          <TimesheetJob />}
        {activeJob === 'safety' &&
          <SafetyJob />}
        {activeJob === 'drug_council' && (
          <DrugSafetyCouncil />
        )}
        {activeJob === 'nurse_council' && (
          <NurseCouncil />
        )}
      </div>
    </div>
  );
}
