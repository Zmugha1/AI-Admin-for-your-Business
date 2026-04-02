import { useState } from 'react';
import { clients } from '../data/mockData';

const C = {
  navy:'#2D4459', teal:'#3BBFBF', coral:'#F05F57',
  burnt:'#C8613F', slate:'#7A8F95', mint:'#C8E8E5',
  cream:'#FEFAF5', white:'#ffffff', border:'#C8E8E5',
};

const docTypes = [
  {
    id: 'proposal',
    label: 'Proposal',
    icon: '📋',
    description: 'Tier recommendation + investment + ROI projection',
    color: C.teal,
    bg: '#C8E8E530',
  },
  {
    id: 'sow',
    label: 'Statement of Work',
    icon: '📄',
    description: 'Milestones, deliverables, acceptance criteria, payment schedule',
    color: C.navy,
    bg: '#2D445910',
  },
  {
    id: 'invoice',
    label: 'Invoice',
    icon: '💰',
    description: 'Line items, amounts, due date, payment terms',
    color: C.burnt,
    bg: '#E8A99A30',
  },
  {
    id: 'project_plan',
    label: 'Project Plan',
    icon: '🗂️',
    description: 'Phases, tasks, timeline, owner assignments',
    color: C.slate,
    bg: '#F4F7F8',
  },
  {
    id: 'status_update',
    label: 'Status Update',
    icon: '📊',
    description: 'Progress summary, risks, next steps — ready to send',
    color: '#6B5EA8',
    bg: '#6B5EA810',
  },
];

const generateContent = (
  docType: string,
  clientName: string,
  company: string,
  vertical: string,
  monthlyValue: number
) => {
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
  const buildFee = monthlyValue === 349 ? 7500
    : monthlyValue === 199 ? 3500 : 1499;

  switch (docType) {
    case 'proposal':
      return `PROPOSAL
Dr. Data Decision Intelligence LLC
Prepared for: ${clientName} — ${company}
Date: ${today}
Vertical: ${vertical}

─────────────────────────────────────
RECOMMENDED TIER
─────────────────────────────────────
Based on your practice profile and goals,
we recommend The Pulse — web-based decision
intelligence dashboard configured for your ${vertical} practice.

INVESTMENT
Build Fee:         $${buildFee.toLocaleString()}
Monthly Retainer:  $${monthlyValue}/month
Annual Value:      $${(monthlyValue * 12).toLocaleString()}/year

ROI PROJECTION
Hours saved per week:     8–12 hours
Value of recovered time:  $3,200–$4,800/month
Payback period:           < 30 days

─────────────────────────────────────
WHAT YOU GET
─────────────────────────────────────
- Morning Brief — know who needs attention in 60 seconds
- Business Goals — revenue tracking against your target
- Client Intelligence — every client organized and current
- Health Interventions — signals before they become problems
- My Practice — patterns learned over time

This proposal is valid for 30 days from ${today}.

─────────────────────────────────────
Zubia Mughal, Ed.D.
Dr. Data Decision Intelligence LLC
zubiamL4L@gmail.com | 414-544-7777`;

    case 'sow':
      return `STATEMENT OF WORK
Dr. Data Decision Intelligence LLC
Client: ${clientName} — ${company}
Date: ${today}

─────────────────────────────────────
SCOPE OF WORK
─────────────────────────────────────
Build and deploy a Pulse Business Admin dashboard
configured for the ${vertical} vertical.

MILESTONES & PAYMENT SCHEDULE
─────────────────────────────────────
Milestone 1: Discovery + Configuration
  Deliverable: STZ profile complete, data mapped
  Due: Day 3
  Payment: $${Math.round(buildFee * 0.5).toLocaleString()}
  Acceptance: Client confirms all five pages
  reflect their practice accurately

Milestone 2: Full Delivery
  Deliverable: Dashboard live, client trained,
  documentation complete
  Due: Day 10
  Payment: $${Math.round(buildFee * 0.5).toLocaleString()}
  Acceptance: Client opens Morning Brief
  independently and confirms signals are accurate

ONGOING RETAINER
  Monthly: $${monthlyValue}/month
  Includes: Support, updates, quarterly review

─────────────────────────────────────
TERMS
─────────────────────────────────────
- Payment due within 15 days of milestone completion
- Client owns all their data — no cloud storage
- Either party may terminate with 30 days notice

Agreed by: _______________________
${clientName} — ${today}`;

    case 'invoice':
      const invNum = `INV-2026-${String(Math.floor(Math.random() * 900) + 100)}`;
      const due = new Date();
      due.setDate(due.getDate() + 15);
      const dueStr = due.toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      });
      return `INVOICE
Dr. Data Decision Intelligence LLC
414-544-7777 | zubiamL4L@gmail.com

Invoice #: ${invNum}
Date: ${today}
Due: ${dueStr}

Bill To:
${clientName}
${company}

─────────────────────────────────────
LINE ITEMS
─────────────────────────────────────
Description                        Amount
─────────────────────────────────────
Pulse Business Admin               $${buildFee.toLocaleString()}
  Build fee — ${vertical} vertical
  configuration + deployment

Monthly Retainer — ${today.split(' ')[1]}     $${monthlyValue}
  Ongoing support + updates

─────────────────────────────────────
TOTAL DUE: $${(buildFee + monthlyValue).toLocaleString()}
─────────────────────────────────────

Payment Terms: Net 15
Make checks payable to:
Dr. Data Decision Intelligence LLC

Thank you for your business.`;

    case 'project_plan':
      return `PROJECT PLAN
Dr. Data Decision Intelligence LLC
Client: ${clientName} — ${company}
Start Date: ${today}

─────────────────────────────────────
PHASE 1 — DISCOVERY (Days 1–2)
─────────────────────────────────────
☐ STZ SME Interview (25 questions)
☐ Map client data to five Pulse pages
☐ Confirm terminology and vocabulary
☐ Define success criteria
Owner: Zubia Mughal

─────────────────────────────────────
PHASE 2 — CONFIGURATION (Days 3–5)
─────────────────────────────────────
☐ Configure Morning Brief signals
☐ Set Business Goals targets
☐ Load Client Intelligence data
☐ Configure Health Interventions
☐ Populate My Practice baseline
Owner: Zubia Mughal

─────────────────────────────────────
PHASE 3 — DELIVERY (Days 6–10)
─────────────────────────────────────
☐ Client walkthrough — all five pages
☐ Live signal test with real data
☐ Client opens independently (UAT)
☐ Documentation delivered
☐ Retainer invoice sent
Owner: Zubia Mughal + ${clientName}

─────────────────────────────────────
SUCCESS CRITERIA
─────────────────────────────────────
${clientName} opens Morning Brief daily
without a reminder by Day 30.`;

    case 'status_update':
      return `STATUS UPDATE
Dr. Data Decision Intelligence LLC
Client: ${clientName} — ${company}
Date: ${today}

─────────────────────────────────────
OVERALL STATUS: ON TRACK ✓
─────────────────────────────────────

COMPLETED THIS WEEK
- Dashboard configuration — ${vertical} vertical complete
- Morning Brief signals tested with live data
- Client Intelligence populated — all contacts loaded
- Business Goals targets confirmed

IN PROGRESS
- Health Interventions threshold calibration
- My Practice baseline data entry

RISKS & FLAGS
- None at this time

NEXT STEPS
- ${clientName} UAT session — scheduled
- Final delivery + handoff documentation
- Retainer invoice to follow on delivery

─────────────────────────────────────
Questions? Reply to this message or
call 414-544-7777.

Zubia Mughal, Ed.D.
Dr. Data Decision Intelligence LLC`;

    default:
      return '';
  }
};

export const Documents = () => {
  const [selectedClient, setSelectedClient] = useState(clients[0].id);
  const [generated, setGenerated] = useState<Record<string, string>>({});
  const [active, setActive] = useState<string | null>(null);

  const client = clients.find(c => c.id === selectedClient)!;

  const handleGenerate = (docId: string) => {
    const content = generateContent(
      docId,
      client.name,
      client.company,
      client.vertical,
      client.monthlyValue || 199,
    );
    setGenerated(prev => ({ ...prev, [docId]: content }));
    setActive(docId);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div style={{
      padding: '28px 32px', background: C.cream,
      minHeight: '100vh',
    }}>
      <div style={{
        fontSize: 20, fontWeight: 700,
        color: C.navy, marginBottom: 4,
      }}>
        Documents
      </div>
      <div style={{ fontSize: 13, color: C.slate, marginBottom: 24 }}>
        Generate client documents in one click.
        Pre-filled from your client data. You edit and approve.
      </div>

      {/* Client selector */}
      <div style={{
        background: C.white, border: `1px solid ${C.border}`,
        borderRadius: 12, padding: '14px 18px',
        marginBottom: 24, display: 'flex',
        alignItems: 'center', gap: 16,
      }}>
        <div style={{
          fontSize: 12, fontWeight: 600,
          color: C.slate, minWidth: 80,
        }}>
          Generate for:
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {clients.map(c => (
            <button key={c.id}
              onClick={() => {
                setSelectedClient(c.id);
                setGenerated({});
                setActive(null);
              }}
              style={{
                padding: '6px 14px', borderRadius: 20,
                border: `1px solid ${selectedClient === c.id
                  ? C.teal : C.border}`,
                background: selectedClient === c.id
                  ? C.mint : 'transparent',
                color: selectedClient === c.id ? C.teal : C.slate,
                fontSize: 12,
                fontWeight: selectedClient === c.id ? 700 : 400,
                cursor: 'pointer',
              }}>
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: active ? '1fr 1fr' : '1fr',
        gap: 20,
      }}>

        {/* Document type buttons */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          {docTypes.map(doc => (
            <div key={doc.id} style={{
              background: C.white,
              border: `1px solid ${active === doc.id
                ? doc.color : C.border}`,
              borderLeft: `4px solid ${doc.color}`,
              borderRadius: 12,
              padding: '16px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              transition: 'border 0.15s',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 22 }}>{doc.icon}</span>
                <div>
                  <div style={{
                    fontSize: 14, fontWeight: 700, color: C.navy,
                  }}>
                    {doc.label}
                  </div>
                  <div style={{
                    fontSize: 11, color: C.slate, marginTop: 2,
                  }}>
                    {doc.description}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleGenerate(doc.id)}
                style={{
                  padding: '8px 18px',
                  background: active === doc.id ? doc.color : C.teal,
                  color: '#fff', border: 'none',
                  borderRadius: 8, fontSize: 12,
                  fontWeight: 700, cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'background 0.15s',
                }}>
                {generated[doc.id] ? 'Regenerate' : 'Generate'}
              </button>
            </div>
          ))}
        </div>

        {/* Preview panel */}
        {active && generated[active] && (
          <div style={{
            background: C.white,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '75vh',
          }}>
            <div style={{
              padding: '14px 18px',
              borderBottom: `1px solid ${C.border}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div style={{
                fontSize: 13, fontWeight: 700, color: C.navy,
              }}>
                {docTypes.find(d => d.id === active)?.label} —{' '}
                {client.name}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => handleCopy(generated[active])}
                  style={{
                    padding: '6px 14px',
                    background: C.mint,
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 11,
                    fontWeight: 700,
                    color: C.teal,
                    cursor: 'pointer',
                  }}>
                  Copy
                </button>
                <button
                  onClick={() => setActive(null)}
                  style={{
                    padding: '6px 14px',
                    background: '#F4F7F8',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 11,
                    color: C.slate,
                    cursor: 'pointer',
                  }}>
                  Close
                </button>
              </div>
            </div>
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '18px 20px',
            }}>
              <pre style={{
                fontSize: 12, color: C.navy,
                lineHeight: 1.7, whiteSpace: 'pre-wrap',
                fontFamily: 'inherit', margin: 0,
              }}>
                {generated[active]}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
