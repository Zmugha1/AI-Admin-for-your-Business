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

const verticalContent: Record<string, {
  pain: string;
  solution: string;
  whatYouGet: string[];
  roiHours: string;
  roiValue: string;
  milestone1: string;
  milestone2: string;
  phase1Tasks: string[];
  phase2Tasks: string[];
  phase3Tasks: string[];
  successCriteria: string;
  statusCompleted: string[];
  statusInProgress: string[];
}> = {
  'Chiropractic': {
    pain: 'Currently spending 6+ hours/week manually writing medical necessity letters and insurance authorization requests for each patient.',
    solution: 'Insurance Authorization Document Builder — generates pre-filled medical necessity letters, prior authorization requests, and appeal letters from patient diagnosis codes and treatment plans.',
    whatYouGet: [
      'Medical Necessity Letter generator — pre-filled from diagnosis + treatment plan',
      'Prior Authorization Request builder — insurance-ready in 2 minutes',
      'Appeal Letter generator — denied claims responded to in one click',
      'Patient visit summary dashboard — who is due, who is overdue',
      'Insurance follow-up tracker — nothing falls through the cracks',
    ],
    roiHours: '6–8 hours/week',
    roiValue: '$2,400–$3,200/month in recovered staff time',
    milestone1: 'Insurance document templates configured for your top 5 payers',
    milestone2: 'Full delivery — all document types live, staff trained',
    phase1Tasks: [
      '☐ Map top 5 insurance payers and their requirements',
      '☐ Collect 3 sample medical necessity letters for template training',
      '☐ Document diagnosis code patterns used most frequently',
      '☐ Define appeal letter triggers and language',
    ],
    phase2Tasks: [
      '☐ Build medical necessity letter generator',
      '☐ Build prior authorization request template',
      '☐ Build appeal letter generator',
      '☐ Configure patient visit dashboard signals',
    ],
    phase3Tasks: [
      '☐ Staff walkthrough — generate first 5 live letters',
      '☐ Dr. Webb UAT — confirms letters are submission-ready',
      '☐ Documentation delivered',
      '☐ Retainer invoice sent',
    ],
    successCriteria: 'Dr. Webb generates a submission-ready insurance letter in under 3 minutes without staff assistance.',
    statusCompleted: [
      'Discovery session complete — top 5 payers mapped',
      'Sample letters reviewed — template structure confirmed',
      'Diagnosis code library loaded',
    ],
    statusInProgress: [
      'Medical necessity letter generator — first draft in review',
      'Prior authorization template — in configuration',
    ],
  },
  'Therapeutic Services': {
    pain: 'Running four disconnected systems — EHR, billing, scheduling, and client notes — with no single view of which clients need attention today.',
    solution: 'Unified Practice Dashboard — one morning view that surfaces missed sessions, overdue billing, declining engagement signals, and care plan milestones across all systems.',
    whatYouGet: [
      'Morning Brief — missed sessions, overdue billing, engagement alerts in one view',
      'Client Health Signals — declining attendance, payment gaps, care plan stalls',
      'Session Notes Dashboard — outstanding notes flagged before they age out',
      'Billing Status Tracker — who owes what and how long it has been outstanding',
      'Care Plan Milestone tracker — which clients are on track vs falling behind',
    ],
    roiHours: '8–10 hours/week',
    roiValue: '$3,200–$4,000/month in recovered clinical and admin time',
    milestone1: 'Morning Brief configured — all four systems surfaced in one view',
    milestone2: 'Full delivery — all signal types live, Dr. Patel trained',
    phase1Tasks: [
      '☐ Map all four systems and their data outputs',
      '☐ Define which signals matter most to Dr. Patel',
      '☐ Identify top 3 reasons clients fall through the cracks',
      '☐ Define engagement threshold — what counts as declining',
    ],
    phase2Tasks: [
      '☐ Build unified Morning Brief — missed sessions + billing + notes',
      '☐ Configure client health score algorithm',
      '☐ Build care plan milestone tracker',
      '☐ Configure billing status signals',
    ],
    phase3Tasks: [
      '☐ Dr. Patel UAT — confirms signals match reality',
      '☐ Staff walkthrough — all signal types demonstrated',
      '☐ Documentation delivered',
      '☐ Retainer invoice sent',
    ],
    successCriteria: 'Dr. Patel opens one screen each morning and knows exactly which clients need a call before she sees her first patient.',
    statusCompleted: [
      'Discovery session complete — four systems mapped',
      'Signal priorities confirmed with Dr. Patel',
      'Engagement threshold defined — 2 missed sessions in 30 days',
    ],
    statusInProgress: [
      'Morning Brief configuration — billing + scheduling feeds in progress',
      'Client health score algorithm — first draft in review',
    ],
  },
  'Legal Advisory': {
    pain: 'Managing 40+ active matters with documents rebuilt from scratch every time — client intake summaries, matter status updates, and billing narratives taking 8+ hours/week.',
    solution: 'Matter Intelligence Dashboard — generates client intake summaries, matter status updates, and billing narratives from matter data. Every document pre-filled. Every matter tracked.',
    whatYouGet: [
      'Matter Status Update generator — client-ready in 2 minutes',
      'Client Intake Summary builder — pre-filled from intake form data',
      'Billing Narrative generator — time entries converted to professional descriptions',
      'Matter Health Dashboard — deadlines, next steps, outstanding items',
      'Client Communication tracker — who has not heard from you this week',
    ],
    roiHours: '8–12 hours/week',
    roiValue: '$4,000–$6,000/month in recovered billable time',
    milestone1: 'Matter status update and billing narrative generators live',
    milestone2: 'Full delivery — all document types live, matter dashboard configured',
    phase1Tasks: [
      '☐ Review 5 sample matter status updates for template patterns',
      '☐ Map billing narrative structure across matter types',
      '☐ Define matter health signals — what makes a matter at risk',
      '☐ Identify top 3 client communication gaps',
    ],
    phase2Tasks: [
      '☐ Build matter status update generator',
      '☐ Build billing narrative generator',
      '☐ Build client intake summary template',
      '☐ Configure matter health dashboard signals',
    ],
    phase3Tasks: [
      '☐ James Okonkwo UAT — generates first 5 live documents',
      '☐ Confirms billing narratives are submission-ready',
      '☐ Documentation delivered',
      '☐ Retainer invoice sent',
    ],
    successCriteria: 'James generates a complete matter status update in under 3 minutes and never rebuilds a billing narrative from scratch again.',
    statusCompleted: [
      'Discovery session complete — matter types mapped',
      'Sample documents reviewed — template structure confirmed',
      'Billing narrative patterns documented',
    ],
    statusInProgress: [
      'Matter status update generator — first draft in review',
      'Billing narrative template — in configuration',
    ],
  },
  'Financial Advisory': {
    pain: 'Managing 55 clients with no system tracking who is due for annual review, who has unanswered questions, and no way to generate planning summaries without rebuilding from scratch.',
    solution: 'Client Review Intelligence Dashboard — tracks annual review cycles, surfaces unanswered client questions, and generates financial planning summaries and meeting prep briefs from client data.',
    whatYouGet: [
      'Annual Review Tracker — who is due, overdue, and scheduled',
      'Meeting Prep Brief generator — pre-filled from client portfolio data',
      'Financial Planning Summary builder — ready for client signature',
      'Client Question tracker — nothing goes unanswered past 48 hours',
      'Portfolio Health signals — which clients need a proactive call',
    ],
    roiHours: '6–10 hours/week',
    roiValue: '$2,400–$4,000/month in recovered planning time',
    milestone1: 'Annual review tracker and meeting prep brief generator live',
    milestone2: 'Full delivery — all document types live, Sandra trained',
    phase1Tasks: [
      '☐ Map annual review cycle across all 55 clients',
      '☐ Review 3 sample meeting prep briefs for template patterns',
      '☐ Define portfolio health signals — what triggers a proactive call',
      '☐ Document financial planning summary structure',
    ],
    phase2Tasks: [
      '☐ Build annual review tracker with overdue signals',
      '☐ Build meeting prep brief generator',
      '☐ Build financial planning summary template',
      '☐ Configure client question tracker',
    ],
    phase3Tasks: [
      '☐ Sandra Kowalski UAT — generates first 5 live documents',
      '☐ Confirms meeting prep briefs match her planning process',
      '☐ Documentation delivered',
      '☐ Retainer invoice sent',
    ],
    successCriteria: 'Sandra opens her dashboard Monday morning and knows exactly which of her 55 clients needs attention this week without hunting through spreadsheets.',
    statusCompleted: [
      'Discovery session complete — review cycles mapped',
      'Sample briefs reviewed — template structure confirmed',
      'Portfolio health signals defined',
    ],
    statusInProgress: [
      'Annual review tracker — client data loading in progress',
      'Meeting prep brief generator — first draft in review',
    ],
  },
};

const getVerticalContent = (vertical: string) => {
  return verticalContent[vertical] || {
    pain: 'Managing practice operations manually with no unified system.',
    solution: 'Pulse Business Admin dashboard configured for your practice.',
    whatYouGet: [
      'Morning Brief — know who needs attention in 60 seconds',
      'Business Goals — revenue tracking against your target',
      'Client Intelligence — every client organized and current',
      'Health Interventions — signals before they become problems',
      'My Practice — patterns learned over time',
    ],
    roiHours: '8–12 hours/week',
    roiValue: '$3,200–$4,800/month in recovered time',
    milestone1: 'Dashboard configuration complete — all five pages live',
    milestone2: 'Full delivery — client trained, documentation complete',
    phase1Tasks: [
      '☐ STZ SME Interview (25 questions)',
      '☐ Map client data to five Pulse pages',
      '☐ Confirm terminology and vocabulary',
      '☐ Define success criteria',
    ],
    phase2Tasks: [
      '☐ Configure Morning Brief signals',
      '☐ Set Business Goals targets',
      '☐ Load Client Intelligence data',
      '☐ Configure Health Interventions',
    ],
    phase3Tasks: [
      '☐ Client walkthrough — all five pages',
      '☐ Live signal test with real data',
      '☐ Client opens independently (UAT)',
      '☐ Documentation delivered',
    ],
    successCriteria: 'Client opens Morning Brief daily without a reminder by Day 30.',
    statusCompleted: [
      'Discovery session complete — data mapped',
      'Signal priorities confirmed',
    ],
    statusInProgress: [
      'Dashboard configuration in progress',
      'Signal thresholds being calibrated',
    ],
  };
};

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
    : monthlyValue === 199 ? 3500 : 3500;
  const vc = getVerticalContent(vertical);

  switch (docType) {
    case 'proposal':
      return `PROPOSAL
Dr. Data Decision Intelligence LLC
Prepared for: ${clientName} — ${company}
Date: ${today}
Vertical: ${vertical}

─────────────────────────────────────
THE PROBLEM WE ARE SOLVING
─────────────────────────────────────
${vc.pain}

─────────────────────────────────────
RECOMMENDED SOLUTION
─────────────────────────────────────
${vc.solution}

─────────────────────────────────────
WHAT YOU GET
─────────────────────────────────────
${vc.whatYouGet.map(w => `• ${w}`).join('\n')}

─────────────────────────────────────
INVESTMENT
─────────────────────────────────────
Build Fee:         $${buildFee.toLocaleString()}
Monthly Retainer:  $199/month
Annual Value:      $2,388/year

─────────────────────────────────────
ROI PROJECTION
─────────────────────────────────────
Hours saved per week:     ${vc.roiHours}
Value of recovered time:  ${vc.roiValue}
Payback period:           < 30 days

─────────────────────────────────────
This proposal is valid for 30 days from ${today}.

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
${vc.solution}

─────────────────────────────────────
MILESTONES & PAYMENT SCHEDULE
─────────────────────────────────────
Milestone 1: ${vc.milestone1}
  Due: Day 5
  Payment: $${Math.round(buildFee * 0.5).toLocaleString()}
  Acceptance: ${clientName} confirms outputs
  match their practice workflow

Milestone 2: ${vc.milestone2}
  Due: Day 14
  Payment: $${Math.round(buildFee * 0.5).toLocaleString()}
  Acceptance: ${clientName} completes UAT
  independently and confirms accuracy

─────────────────────────────────────
ONGOING RETAINER
─────────────────────────────────────
Monthly: $199/month
Includes: Support, updates, quarterly review

─────────────────────────────────────
TERMS
─────────────────────────────────────
- Payment due within 15 days of milestone
- Client owns all their data — no cloud storage
- Either party may terminate with 30 days notice

Agreed by: _______________________
${clientName} — ${today}`;

    case 'invoice': {
      const invNum = `INV-2026-${String(Math.floor(Math.random() * 900) + 100)}`;
      const due = new Date();
      due.setDate(due.getDate() + 15);
      const dueStr = due.toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      });
      return `INVOICE
Dr. Data Decision Intelligence LLC
414-544-7777 | zubiamL4L@gmail.com

Invoice #:  ${invNum}
Date:       ${today}
Due:        ${dueStr}

Bill To:
${clientName}
${company}

─────────────────────────────────────
LINE ITEMS
─────────────────────────────────────
Description                          Amount
─────────────────────────────────────
Pulse Business Admin — Build Fee
  ${vertical} vertical configuration    $${buildFee.toLocaleString()}

Monthly Retainer — April 2026           $199

─────────────────────────────────────
TOTAL DUE: $${(buildFee + 199).toLocaleString()}
─────────────────────────────────────

Payment Terms: Net 15
Make checks payable to:
Dr. Data Decision Intelligence LLC

Thank you for your business.`;
    }

    case 'project_plan':
      return `PROJECT PLAN
Dr. Data Decision Intelligence LLC
Client: ${clientName} — ${company}
Start Date: ${today}

─────────────────────────────────────
PHASE 1 — DISCOVERY (Days 1–3)
─────────────────────────────────────
${vc.phase1Tasks.join('\n')}
Owner: Zubia Mughal

─────────────────────────────────────
PHASE 2 — CONFIGURATION (Days 4–8)
─────────────────────────────────────
${vc.phase2Tasks.join('\n')}
Owner: Zubia Mughal

─────────────────────────────────────
PHASE 3 — DELIVERY (Days 9–14)
─────────────────────────────────────
${vc.phase3Tasks.join('\n')}
Owner: Zubia Mughal + ${clientName}

─────────────────────────────────────
SUCCESS CRITERIA
─────────────────────────────────────
${vc.successCriteria}`;

    case 'status_update':
      return `STATUS UPDATE
Dr. Data Decision Intelligence LLC
Client: ${clientName} — ${company}
Date: ${today}

─────────────────────────────────────
OVERALL STATUS: ON TRACK ✓
─────────────────────────────────────

COMPLETED THIS WEEK
${vc.statusCompleted.map(s => `• ${s}`).join('\n')}

IN PROGRESS
${vc.statusInProgress.map(s => `• ${s}`).join('\n')}

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
