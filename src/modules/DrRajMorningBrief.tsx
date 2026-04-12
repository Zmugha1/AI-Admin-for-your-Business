import {
  useState,
  useEffect,
  useRef,
  type CSSProperties,
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
  green: '#3A7D5C',
};

type MorningBriefProps = {
  onOpenCouncil?: () => void;
};

export function DrRajMorningBrief(
  props?: MorningBriefProps
) {
  const { onOpenCouncil } = props ?? {};
  const [prepHelixOpen, setPrepHelixOpen] =
    useState(false);
  const [prepHelixFade, setPrepHelixFade] =
    useState(0);
  const [prepSenateOpen, setPrepSenateOpen] =
    useState(false);
  const [prepSenateFade, setPrepSenateFade] =
    useState(0);
  const [reminderOpen, setReminderOpen] =
    useState(false);
  const [reminderApproved, setReminderApproved] =
    useState(false);
  const [reminderAudit, setReminderAudit] =
    useState('');
  const [briefPhase, setBriefPhase] = useState<
    'idle' | 'generating' | 'ready'
  >('idle');
  const briefTimer = useRef<
    ReturnType<typeof setTimeout> | undefined
  >(undefined);
  const [timesheetOpen, setTimesheetOpen] =
    useState(false);
  const [timesheetSubmitted, setTimesheetSubmitted] =
    useState(false);
  const [timesheetAudit, setTimesheetAudit] =
    useState('');

  useEffect(() => {
    if (prepHelixOpen) {
      setPrepHelixFade(0);
      const t = window.setTimeout(
        () => setPrepHelixFade(1),
        30
      );
      return () => clearTimeout(t);
    }
    setPrepHelixFade(0);
  }, [prepHelixOpen]);

  useEffect(() => {
    if (prepSenateOpen) {
      setPrepSenateFade(0);
      const t = window.setTimeout(
        () => setPrepSenateFade(1),
        30
      );
      return () => clearTimeout(t);
    }
    setPrepSenateFade(0);
  }, [prepSenateOpen]);

  useEffect(
    () => () => {
      if (briefTimer.current)
        clearTimeout(briefTimer.current);
    },
    []
  );

  function startBriefGen() {
    if (briefPhase !== 'idle') return;
    setBriefPhase('generating');
    briefTimer.current = setTimeout(() => {
      setBriefPhase('ready');
    }, 1500);
  }

  const sectionLabel: CSSProperties = {
    fontFamily: 'Courier New, monospace',
    fontSize: 10,
    color: C.slate,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    marginBottom: 10,
  };

  return (
    <div
      style={{
        minHeight: '100%',
        boxSizing: 'border-box',
        background: C.cream,
        padding: 32,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 16,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: 24,
              fontWeight: 700,
              color: C.navy,
              marginBottom: 4,
            }}
          >
            Good morning, Dr. Raj.
          </div>
          <div
            style={{
              fontFamily: 'Trebuchet MS, sans-serif',
              fontSize: 13,
              color: C.slate,
            }}
          >
            Monday, April 14, 2026
          </div>
        </div>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: '#3A7D5C18',
            border: '1px solid #3A7D5C',
            padding: '4px 12px',
            borderRadius: 20,
            fontFamily: 'Courier New, monospace',
            fontSize: 10,
            color: C.green,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: C.green,
              flexShrink: 0,
            }}
          />
          All systems ready
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          marginBottom: 28,
        }}
      >
        <span
          style={{
            fontFamily: 'Courier New, monospace',
            fontSize: 10,
            fontWeight: 700,
            padding: '4px 14px',
            borderRadius: 20,
            marginRight: 8,
            marginBottom: 8,
            background: '#3BBFBF18',
            border: '1px solid #3BBFBF',
            color: C.teal,
          }}
        >
          2 meetings today
        </span>
        <span
          style={{
            fontFamily: 'Courier New, monospace',
            fontSize: 10,
            fontWeight: 700,
            padding: '4px 14px',
            borderRadius: 20,
            marginRight: 8,
            marginBottom: 8,
            background: '#F05F5718',
            border: '1px solid #F05F57',
            color: C.coral,
          }}
        >
          1 invoice overdue
        </span>
        <span
          style={{
            fontFamily: 'Courier New, monospace',
            fontSize: 10,
            fontWeight: 700,
            padding: '4px 14px',
            borderRadius: 20,
            marginRight: 8,
            marginBottom: 8,
            background: '#F05F5718',
            border: '1px solid #F05F57',
            color: '#F05F57',
          }}
        >
          Timesheet due in 5 days
        </span>
      </div>

      {/* Panel 1 */}
      <div style={sectionLabel}>
        {"TODAY'S MEETINGS"}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          marginBottom: 32,
        }}
      >
        {/* Meeting card 1 */}
        <div>
          <div
            style={{
              border: `1px solid ${C.mint}`,
              borderLeft: `4px solid ${C.teal}`,
              background: C.white,
              borderRadius: 12,
              padding: '16px 18px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 4,
              }}
            >
              <span
                style={{
                  fontFamily: 'Courier New, monospace',
                  fontSize: 11,
                  color: C.slate,
                }}
              >
                10:00 AM
              </span>
              <span
                style={{
                  background: C.mint,
                  color: C.navy,
                  fontFamily: 'Courier New, monospace',
                  fontSize: 9,
                  padding: '2px 8px',
                  borderRadius: 10,
                }}
              >
                2 hrs
              </span>
            </div>
            <div
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: 15,
                fontWeight: 700,
                color: C.navy,
                margin: '4px 0',
              }}
            >
              DSMB Review Call
            </div>
            <div
              style={{
                fontFamily: 'Trebuchet MS, sans-serif',
                fontSize: 12,
                color: C.slate,
                marginBottom: 10,
              }}
            >
              Helix Pharma Inc.
            </div>
            <div style={{ marginBottom: 6 }}>
              <div
                style={{
                  fontFamily: 'Courier New, monospace',
                  fontSize: 9,
                  color: C.slate,
                  marginBottom: 2,
                }}
              >
                CONTRACT RATE
              </div>
              <div
                style={{
                  fontFamily: 'Trebuchet MS, sans-serif',
                  fontSize: 13,
                  fontWeight: 700,
                  color: C.teal,
                }}
              >
                $450/hour
              </div>
            </div>
            <div
              style={{
                fontFamily: 'Courier New, monospace',
                fontSize: 9,
                color: C.teal,
                marginBottom: 12,
              }}
            >
              Source: Helix Pharma Agreement 2025.pdf
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
                  setPrepHelixOpen(v => !v)
                }
                style={{
                  padding: '6px 16px',
                  background: C.teal,
                  color: C.white,
                  border: 'none',
                  borderRadius: 8,
                  fontFamily: 'Trebuchet MS, sans-serif',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Prepare
              </button>
              <button
                type="button"
                style={{
                  padding: '6px 16px',
                  background: 'transparent',
                  border: `1px solid ${C.teal}`,
                  color: C.teal,
                  borderRadius: 8,
                  fontFamily: 'Trebuchet MS, sans-serif',
                  fontSize: 11,
                  cursor: 'pointer',
                }}
              >
                Generate Invoice
              </button>
            </div>
          </div>
          {prepHelixOpen ? (
            <div
              style={{
                position: 'relative',
                marginTop: 10,
                background: C.navy,
                borderRadius: 12,
                padding: '20px 24px',
                opacity: prepHelixFade,
                transition: 'opacity 0.4s ease-in',
              }}
            >
              <button
                type="button"
                onClick={() => setPrepHelixOpen(false)}
                aria-label="Close"
                style={{
                  position: 'absolute',
                  top: 12,
                  right: 14,
                  background: 'none',
                  border: 'none',
                  color: C.white,
                  fontSize: 18,
                  lineHeight: 1,
                  cursor: 'pointer',
                  padding: 4,
                }}
              >
                ×
              </button>
              <div
                style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: 14,
                  fontWeight: 700,
                  color: C.cream,
                  marginBottom: 16,
                  paddingRight: 24,
                }}
              >
                Pre-Meeting Intelligence Brief
              </div>
              <div style={{ marginBottom: 12 }}>
                <div
                  style={{
                    fontFamily: 'Courier New, monospace',
                    fontSize: 9,
                    color: C.mint,
                    marginBottom: 4,
                  }}
                >
                  VENDOR
                </div>
                <div
                  style={{
                    fontFamily: 'Trebuchet MS, sans-serif',
                    fontSize: 12,
                    color: C.cream,
                    lineHeight: 1.5,
                  }}
                >
                  Helix Pharma Inc., DSMB Advisory
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <div
                  style={{
                    fontFamily: 'Courier New, monospace',
                    fontSize: 9,
                    color: C.mint,
                    marginBottom: 4,
                  }}
                >
                  LAST MEETING
                </div>
                <div
                  style={{
                    fontFamily: 'Trebuchet MS, sans-serif',
                    fontSize: 12,
                    color: C.cream,
                    lineHeight: 1.5,
                  }}
                >
                  March 18, 2026, DSMB Review, Invoice
                  sent $900, Paid
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontFamily: 'Courier New, monospace',
                    fontSize: 9,
                    color: C.mint,
                    marginBottom: 4,
                  }}
                >
                  SUGGESTED PREP
                </div>
                <div
                  style={{
                    fontFamily: 'Trebuchet MS, sans-serif',
                    fontSize: 12,
                    color: C.cream,
                    lineHeight: 1.55,
                  }}
                >
                  Review March 18 meeting notes. Confirm
                  agenda items for today. Check if prior
                  invoice was received.
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Meeting card 2 */}
        <div>
          <div
            style={{
              border: `1px solid ${C.mint}`,
              borderLeft: `4px solid ${C.gold}`,
              background: C.white,
              borderRadius: 12,
              padding: '16px 18px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 4,
              }}
            >
              <span
                style={{
                  fontFamily: 'Courier New, monospace',
                  fontSize: 11,
                  color: C.slate,
                }}
              >
                2:00 PM
              </span>
              <span
                style={{
                  background: C.mint,
                  color: C.navy,
                  fontFamily: 'Courier New, monospace',
                  fontSize: 9,
                  padding: '2px 8px',
                  borderRadius: 10,
                }}
              >
                1 hr
              </span>
            </div>
            <div
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: 15,
                fontWeight: 700,
                color: C.navy,
                margin: '4px 0',
              }}
            >
              Faculty Senate Subcommittee
            </div>
            <div
              style={{
                fontFamily: 'Trebuchet MS, sans-serif',
                fontSize: 12,
                color: C.slate,
                marginBottom: 10,
              }}
            >
              IU School of Medicine
            </div>
            <div
              style={{
                background: '#C8974A12',
                border: `1px solid ${C.gold}`,
                borderRadius: 8,
                padding: '6px 10px',
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  fontFamily: 'Courier New, monospace',
                  fontSize: 9,
                  color: C.gold,
                  marginBottom: 4,
                }}
              >
                NO RATE LINKED
              </div>
              <div
                style={{
                  fontFamily: 'Trebuchet MS, sans-serif',
                  fontSize: 10,
                  color: C.slate,
                }}
              >
                Link contract before meeting
              </div>
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
                  setPrepSenateOpen(v => !v)
                }
                style={{
                  padding: '6px 16px',
                  background: C.gold,
                  color: C.white,
                  border: 'none',
                  borderRadius: 8,
                  fontFamily: 'Trebuchet MS, sans-serif',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Prepare
              </button>
              <button
                type="button"
                style={{
                  padding: '6px 16px',
                  background: 'transparent',
                  border: `1px solid ${C.gold}`,
                  color: C.gold,
                  borderRadius: 8,
                  fontFamily: 'Trebuchet MS, sans-serif',
                  fontSize: 11,
                  cursor: 'pointer',
                }}
              >
                Link Contract
              </button>
            </div>
          </div>
          {prepSenateOpen ? (
            <div
              style={{
                position: 'relative',
                marginTop: 10,
                background: C.navy,
                borderRadius: 12,
                padding: '20px 24px',
                opacity: prepSenateFade,
                transition: 'opacity 0.4s ease-in',
              }}
            >
              <button
                type="button"
                onClick={() => setPrepSenateOpen(false)}
                aria-label="Close"
                style={{
                  position: 'absolute',
                  top: 12,
                  right: 14,
                  background: 'none',
                  border: 'none',
                  color: C.white,
                  fontSize: 18,
                  cursor: 'pointer',
                  padding: 4,
                }}
              >
                ×
              </button>
              <div
                style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: 14,
                  fontWeight: 700,
                  color: C.cream,
                  marginBottom: 16,
                  paddingRight: 24,
                }}
              >
                Pre-Meeting Intelligence Brief
              </div>
              <div style={{ marginBottom: 12 }}>
                <div
                  style={{
                    fontFamily: 'Courier New, monospace',
                    fontSize: 9,
                    color: C.mint,
                    marginBottom: 4,
                  }}
                >
                  VENDOR
                </div>
                <div
                  style={{
                    fontFamily: 'Trebuchet MS, sans-serif',
                    fontSize: 12,
                    color: C.cream,
                  }}
                >
                  IU School of Medicine, Faculty Senate
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <div
                  style={{
                    fontFamily: 'Courier New, monospace',
                    fontSize: 9,
                    color: C.mint,
                    marginBottom: 4,
                  }}
                >
                  LAST MEETING
                </div>
                <div
                  style={{
                    fontFamily: 'Trebuchet MS, sans-serif',
                    fontSize: 12,
                    color: C.cream,
                  }}
                >
                  April 7, 2026, Subcommittee planning
                  session, notes filed
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontFamily: 'Courier New, monospace',
                    fontSize: 9,
                    color: C.mint,
                    marginBottom: 4,
                  }}
                >
                  SUGGESTED PREP
                </div>
                <div
                  style={{
                    fontFamily: 'Trebuchet MS, sans-serif',
                    fontSize: 12,
                    color: C.cream,
                    lineHeight: 1.55,
                  }}
                >
                  Link a contract rate before billing.
                  Review agenda packet from clerk.
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Panel 2 */}
      <div style={sectionLabel}>
        OUTSTANDING INVOICES
      </div>
      <div style={{ marginBottom: 32 }}>
        {/* Invoice 1 */}
        <div style={{ marginBottom: 8 }}>
          <div
            style={{
              background: C.white,
              border: `1px solid ${C.mint}`,
              borderLeft: `4px solid ${C.coral}`,
              borderRadius: 10,
              padding: '12px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div style={{ flex: '1 1 160px' }}>
              <div
                style={{
                  fontFamily: 'Trebuchet MS, sans-serif',
                  fontSize: 13,
                  fontWeight: 700,
                  color: C.navy,
                }}
              >
                Helix Pharma Inc.
              </div>
              <div
                style={{
                  fontFamily: 'Courier New, monospace',
                  fontSize: 10,
                  color: C.slate,
                  marginTop: 2,
                }}
              >
                INV-2026-003, March 18, 2026
              </div>
            </div>
            <div
              style={{
                textAlign: 'center',
                flex: '0 1 140px',
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
                $900.00
              </div>
              <div
                style={{
                  fontFamily: 'Courier New, monospace',
                  fontSize: 10,
                  color: C.coral,
                  marginTop: 2,
                }}
              >
                Due March 18, 27 days overdue
              </div>
            </div>
            <div>
              <button
                type="button"
                onClick={() =>
                  setReminderOpen(v => !v)
                }
                style={{
                  background: '#F05F5712',
                  border: `1px solid ${C.coral}`,
                  color: C.coral,
                  padding: '6px 14px',
                  borderRadius: 8,
                  fontFamily: 'Trebuchet MS, sans-serif',
                  fontSize: 11,
                  cursor: 'pointer',
                }}
              >
                Send Reminder
              </button>
            </div>
          </div>
          {reminderOpen ? (
            <div
              style={{
                background: '#FEFAF5',
                border: `1px solid ${C.coral}`,
                borderRadius: 10,
                padding: '14px 18px',
                marginTop: 8,
              }}
            >
              <div
                style={{
                  fontFamily: 'Courier New, monospace',
                  fontSize: 9,
                  color: C.coral,
                  marginBottom: 10,
                }}
              >
                REMINDER EMAIL DRAFT
              </div>
              <div
                style={{
                  background: C.white,
                  border: `1px solid ${C.mint}`,
                  borderRadius: 8,
                  padding: 12,
                  fontFamily: 'Trebuchet MS, sans-serif',
                  fontSize: 12,
                  color: C.navy,
                  lineHeight: 1.7,
                  marginBottom: 12,
                }}
              >
                Subject: Invoice Follow-Up, INV-2026-003
                <br />
                <br />
                Dear Helix Pharma Accounts Team,
                <br />
                <br />
                I wanted to follow up on Invoice
                INV-2026-003 dated March 18, 2026 for
                $900.00, which was due on March 18,
                2026.
                <br />
                <br />
                Please let me know if you have any
                questions or need the invoice resent. I
                am happy to assist.
                <br />
                <br />
                Best regards,
                <br />
                Dr. Raj Vuppalanchi
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  flexWrap: 'wrap',
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setReminderApproved(true);
                    const ts = new Date().toISOString();
                    setReminderAudit(
                      'Action logged: Reminder approved, ' +
                        'Dr. Raj Vuppalanchi, ' +
                        ts
                    );
                  }}
                  disabled={reminderApproved}
                  style={{
                    padding: '8px 18px',
                    background: reminderApproved
                      ? C.slate
                      : C.teal,
                    color: C.white,
                    border: 'none',
                    borderRadius: 8,
                    fontFamily: 'Trebuchet MS, sans-serif',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: reminderApproved
                      ? 'default'
                      : 'pointer',
                  }}
                >
                  Approve and Send
                </button>
                <button
                  type="button"
                  style={{
                    padding: '8px 18px',
                    background: 'transparent',
                    border: `1px solid ${C.slate}`,
                    color: C.slate,
                    borderRadius: 8,
                    fontFamily: 'Trebuchet MS, sans-serif',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  Edit
                </button>
              </div>
              {reminderAudit ? (
                <div
                  style={{
                    fontFamily: 'Courier New, monospace',
                    fontSize: 10,
                    color: C.slate,
                    marginTop: 12,
                  }}
                >
                  {reminderAudit}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Invoice 2 */}
        <div
          style={{
            background: C.white,
            border: `1px solid ${C.mint}`,
            borderLeft: `4px solid ${C.gold}`,
            borderRadius: 10,
            padding: '12px 16px',
            marginBottom: 8,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ flex: '1 1 160px' }}>
            <div
              style={{
                fontFamily: 'Trebuchet MS, sans-serif',
                fontSize: 13,
                fontWeight: 700,
                color: C.navy,
              }}
            >
              BioNova Therapeutics
            </div>
            <div
              style={{
                fontFamily: 'Courier New, monospace',
                fontSize: 10,
                color: C.slate,
                marginTop: 2,
              }}
            >
              INV-2026-004, March 25, 2026
            </div>
          </div>
          <div
            style={{
              textAlign: 'center',
              flex: '0 1 160px',
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
              $1,350.00
            </div>
            <div
              style={{
                fontFamily: 'Courier New, monospace',
                fontSize: 10,
                color: C.gold,
                marginTop: 2,
              }}
            >
              Due April 24, 10 days remaining
            </div>
          </div>
          <div>
            <button
              type="button"
              style={{
                padding: '6px 14px',
                background: 'transparent',
                border: `1px solid ${C.gold}`,
                color: C.gold,
                borderRadius: 8,
                fontFamily: 'Trebuchet MS, sans-serif',
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              View Invoice
            </button>
          </div>
        </div>

        {/* Invoice 3 */}
        <div
          style={{
            background: C.white,
            border: `1px solid ${C.mint}`,
            borderLeft: `4px solid ${C.green}`,
            borderRadius: 10,
            padding: '12px 16px',
            marginBottom: 8,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ flex: '1 1 160px' }}>
            <div
              style={{
                fontFamily: 'Trebuchet MS, sans-serif',
                fontSize: 13,
                fontWeight: 700,
                color: C.navy,
              }}
            >
              Vertex Pharmaceuticals
            </div>
            <div
              style={{
                fontFamily: 'Courier New, monospace',
                fontSize: 10,
                color: C.slate,
                marginTop: 2,
              }}
            >
              INV-2026-002, March 10, 2026
            </div>
          </div>
          <div
            style={{
              textAlign: 'center',
              flex: '0 1 140px',
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
              $2,250.00
            </div>
            <div
              style={{
                fontFamily: 'Courier New, monospace',
                fontSize: 10,
                color: C.green,
                marginTop: 2,
              }}
            >
              Paid April 1, 2026
            </div>
          </div>
          <div>
            <button
              type="button"
              style={{
                padding: '4px 12px',
                background: 'transparent',
                border: `1px solid ${C.slate}`,
                color: C.slate,
                borderRadius: 8,
                fontFamily: 'Trebuchet MS, sans-serif',
                fontSize: 10,
                cursor: 'pointer',
              }}
            >
              View
            </button>
          </div>
        </div>
      </div>

      {/* Panel 3 */}
      <div style={sectionLabel}>
        UPCOMING DSMB DEADLINES
      </div>
      <div style={{ marginBottom: 32 }}>
        <div
          style={{
            background: C.white,
            border: `1px solid ${C.mint}`,
            borderLeft: `4px solid ${C.navy}`,
            borderRadius: 12,
            padding: '16px 18px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: 14,
                fontWeight: 700,
                color: C.navy,
                marginBottom: 4,
              }}
            >
              BioNova Phase III DSMB
            </div>
            <div
              style={{
                fontFamily: 'Trebuchet MS, sans-serif',
                fontSize: 12,
                color: C.slate,
                marginBottom: 8,
              }}
            >
              April 28, 2026
            </div>
            <span
              style={{
                display: 'inline-block',
                background: '#2D445918',
                border: `1px solid ${C.navy}`,
                color: C.navy,
                fontFamily: 'Courier New, monospace',
                fontSize: 9,
                padding: '3px 10px',
                borderRadius: 20,
              }}
            >
              14 days away
            </span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div
              style={{
                fontFamily: 'Courier New, monospace',
                fontSize: 9,
                color: C.slate,
                marginBottom: 4,
              }}
            >
              BRIEF STATUS
            </div>
            <div
              style={{
                fontFamily: 'Courier New, monospace',
                fontSize: 10,
                color: C.coral,
                marginBottom: 10,
              }}
            >
              Not generated
            </div>
            <button
              type="button"
              onClick={startBriefGen}
              disabled={briefPhase !== 'idle'}
              style={{
                padding: '8px 16px',
                background: C.navy,
                color: C.cream,
                border: 'none',
                borderRadius: 8,
                fontFamily: 'Trebuchet MS, sans-serif',
                fontSize: 11,
                fontWeight: 700,
                cursor:
                  briefPhase !== 'idle'
                    ? 'default'
                    : 'pointer',
                opacity:
                  briefPhase !== 'idle' ? 0.7 : 1,
              }}
            >
              Generate Intelligence Brief
            </button>
          </div>
        </div>
        {briefPhase !== 'idle' ? (
          <div
            style={{
              marginTop: 10,
              background: C.navy,
              borderRadius: 12,
              padding: '20px 24px',
            }}
          >
            {briefPhase === 'generating' ? (
              <div
                style={{
                  fontFamily: 'Trebuchet MS, sans-serif',
                  fontSize: 13,
                  color: C.cream,
                  lineHeight: 1.6,
                }}
              >
                Generating Drug Safety Council brief for
                BioNova Phase III trial...
              </div>
            ) : (
              <>
                <div
                  style={{
                    fontFamily: 'Trebuchet MS, sans-serif',
                    fontSize: 13,
                    color: C.cream,
                    lineHeight: 1.6,
                    marginBottom: 14,
                  }}
                >
                  Brief ready. Open Drug Safety Council
                  to review four-agent analysis.
                </div>
                <button
                  type="button"
                  onClick={() => onOpenCouncil?.()}
                  style={{
                    padding: '8px 18px',
                    background: C.teal,
                    color: C.white,
                    border: 'none',
                    borderRadius: 8,
                    fontFamily: 'Trebuchet MS, sans-serif',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Open Council
                </button>
              </>
            )}
          </div>
        ) : null}
      </div>

      {/* Panel 4 */}
      <div
        style={{
          background: '#F05F5712',
          border: `1px solid ${C.coral}`,
          borderRadius: 10,
          padding: '12px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 12,
        }}
      >
        <div>
          <span
            style={{
              display: 'inline-block',
              background: '#F05F5720',
              border: `1px solid ${C.coral}`,
              color: C.coral,
              fontFamily: 'Courier New, monospace',
              fontSize: 9,
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: 20,
            }}
          >
            ACTION REQUIRED
          </span>
          <div
            style={{
              fontFamily: 'Trebuchet MS, sans-serif',
              fontSize: 12,
              color: C.navy,
              marginTop: 4,
            }}
          >
            April directorship timesheet due in 5 days.
          </div>
          <div
            style={{
              fontFamily: 'Trebuchet MS, sans-serif',
              fontSize: 11,
              color: C.slate,
              marginTop: 4,
            }}
          >
            4.0 hours logged from calendar. Add manual
            hours before submitting.
          </div>
        </div>
        <button
          type="button"
          onClick={() => setTimesheetOpen(true)}
          style={{
            background: C.coral,
            color: C.white,
            padding: '8px 18px',
            borderRadius: 8,
            border: 'none',
            fontFamily: 'Trebuchet MS, sans-serif',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Generate Timesheet
        </button>
      </div>
      {timesheetOpen ? (
        <div
          style={{
            background: C.navy,
            borderRadius: 12,
            padding: '20px 24px',
            marginBottom: 8,
          }}
        >
          <div
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: 14,
              fontWeight: 700,
              color: C.cream,
              marginBottom: 14,
            }}
          >
            April 2026 Directorship Timesheet (preview)
          </div>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 12,
              marginBottom: 16,
            }}
          >
            <thead>
              <tr
                style={{
                  background: 'rgba(255,255,255,0.08)',
                }}
              >
                {['Date', 'Activity', 'Hours'].map(
                  h => (
                    <th
                      key={h}
                      style={{
                        textAlign: 'left',
                        padding: '8px 10px',
                        fontFamily:
                          'Courier New, monospace',
                        fontSize: 9,
                        color: C.mint,
                        textTransform: 'uppercase',
                      }}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {[
                [
                  'Apr 1, 2026',
                  'Division Leadership Meeting',
                  '1.0',
                ],
                [
                  'Apr 7, 2026',
                  'Faculty Senate Subcommittee',
                  '0.5',
                ],
                [
                  'Apr 14, 2026',
                  'Division Leadership Meeting',
                  '1.0',
                ],
                [
                  'Apr 21, 2026',
                  'Research Compliance Review',
                  '1.5',
                ],
              ].map(([d, a, h], i) => (
                <tr
                  key={d}
                  style={{
                    borderBottom:
                      '1px solid rgba(200,232,229,0.2)',
                    background:
                      i % 2 === 0
                        ? 'transparent'
                        : 'rgba(255,255,255,0.04)',
                  }}
                >
                  <td
                    style={{
                      padding: '8px 10px',
                      color: C.cream,
                      fontFamily:
                        'Courier New, monospace',
                    }}
                  >
                    {d}
                  </td>
                  <td
                    style={{
                      padding: '8px 10px',
                      color: C.cream,
                      fontFamily:
                        'Trebuchet MS, sans-serif',
                    }}
                  >
                    {a}
                  </td>
                  <td
                    style={{
                      padding: '8px 10px',
                      color: C.teal,
                      fontWeight: 700,
                      fontFamily: 'Georgia, serif',
                    }}
                  >
                    {h}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div
            style={{
              fontFamily: 'Trebuchet MS, sans-serif',
              fontSize: 12,
              color: C.cream,
              marginBottom: 14,
            }}
          >
            Total calendar hours: 4.0. Add manual rows
            in IU portal before final submit.
          </div>
          <button
            type="button"
            onClick={() => {
              setTimesheetSubmitted(true);
              setTimesheetAudit(
                'Action logged: Timesheet approved for ' +
                  'submit, Dr. Raj Vuppalanchi, ' +
                  new Date().toISOString()
              );
            }}
            disabled={timesheetSubmitted}
            style={{
              padding: '8px 18px',
              background: timesheetSubmitted
                ? C.slate
                : C.teal,
              color: C.white,
              border: 'none',
              borderRadius: 8,
              fontFamily: 'Trebuchet MS, sans-serif',
              fontSize: 12,
              fontWeight: 700,
              cursor: timesheetSubmitted
                ? 'default'
                : 'pointer',
            }}
          >
            Approve and Submit
          </button>
          {timesheetAudit ? (
            <div
              style={{
                fontFamily: 'Courier New, monospace',
                fontSize: 10,
                color: C.mint,
                marginTop: 12,
              }}
            >
              {timesheetAudit}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
