import { useState, useCallback } from 'react';

type DemoTab = 'invoice' | 'timesheet' | 'brief';

const MEETINGS_APRIL = [
  { date: 'April 1', name: 'Division Leadership Meeting', hours: 1.0 },
  { date: 'April 7', name: 'Faculty Senate Subcommittee', hours: 0.5 },
  { date: 'April 14', name: 'Division Leadership Meeting', hours: 1.0 },
  { date: 'April 21', name: 'Research Compliance Review', hours: 1.5 },
] as const;

const CALENDAR_TOTAL = 4.0;
const ALLOCATED_YEAR = 120;
const CLAIMED_TO_DATE = 47.5;

function formatAuditTimestamp(): string {
  return new Date().toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function DrRajDemo() {
  const [tab, setTab] = useState<DemoTab>('invoice');

  return (
    <div className="flex min-h-screen bg-[#FEFAF5]">
      <aside className="flex w-[260px] shrink-0 flex-col bg-[#2D4459] px-4 py-6">
        <h1 className="font-['Georgia',serif] text-xl font-bold text-[#FEFAF5]">
          Dr. Raj Demo
        </h1>
        <p className="mt-1 font-['Courier_New',monospace] text-xs text-[#7A8F95]">
          Decision Intelligence Preview
        </p>
        <nav className="mt-8 flex flex-1 flex-col gap-1">
          <SidebarBtn
            active={tab === 'invoice'}
            onClick={() => setTab('invoice')}
            label="Invoice Generator"
          />
          <SidebarBtn
            active={tab === 'timesheet'}
            onClick={() => setTab('timesheet')}
            label="Directorship Timesheet"
          />
          <SidebarBtn
            active={tab === 'brief'}
            onClick={() => setTab('brief')}
            label="Drug Safety Brief"
          />
        </nav>
        <p className="mt-auto font-['Courier_New',monospace] text-[10px] leading-relaxed text-[#7A8F95]">
          Built by Dr. Data Decision Intelligence LLC
        </p>
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto p-8">
        {tab === 'invoice' && <JobInvoice />}
        {tab === 'timesheet' && <JobTimesheet />}
        {tab === 'brief' && <JobBrief />}
      </main>
    </div>
  );
}

function SidebarBtn({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-r-lg px-3 py-2.5 text-left font-['Trebuchet_MS','Segoe_UI',sans-serif] text-sm transition-colors ${
        active
          ? 'border-l-4 border-[#3BBFBF] bg-[#C8E8E5] text-[#2D4459]'
          : 'border-l-4 border-transparent bg-transparent text-[#C8E8E5] hover:bg-[#2D4459]/80'
      }`}
    >
      {label}
    </button>
  );
}

function JobInvoice() {
  const [prepHours, setPrepHours] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [auditLine, setAuditLine] = useState<string | null>(null);

  const meetingHours = 2;
  const rate = 450;
  const prep = parseFloat(prepHours) || 0;
  const totalHours = meetingHours + prep;
  const total = totalHours * rate;

  const logApproval = useCallback((approved: boolean) => {
    setAuditLine(
      `Action logged: ${approved ? 'Approved' : 'Rejected'} by Dr. Raj Vuppalanchi, ${formatAuditTimestamp()}`
    );
  }, []);

  return (
    <div>
      <h2 className="font-['Georgia',serif] text-2xl font-bold text-[#2D4459]">
        Consulting Invoice Generator
      </h2>
      <p className="mt-2 max-w-2xl font-['Trebuchet_MS','Segoe_UI',sans-serif] text-sm text-[#7A8F95]">
        Draft an invoice from a calendar meeting and your contract rate, then approve before it is treated as final.
      </p>

      <div className="mt-8 space-y-4">
        <div className="rounded-lg border-2 border-[#C8E8E5] bg-white p-4 shadow-sm">
          <p className="font-['Courier_New',monospace] text-[10px] uppercase tracking-wide text-[#7A8F95]">
            Meeting Detected
          </p>
          <p className="mt-2 font-['Trebuchet_MS','Segoe_UI',sans-serif] text-[#2D4459]">
            <span className="font-semibold">Helix Pharma Inc.</span>
            {' · '}
            DSMB Review Call
          </p>
          <p className="mt-1 font-['Trebuchet_MS','Segoe_UI',sans-serif] text-sm text-[#7A8F95]">
            March 18, 2026 · 2 hours
          </p>
          <p className="mt-3 font-['Courier_New',monospace] text-xs text-[#7A8F95]">
            Source: Google Calendar
          </p>
        </div>

        <div className="rounded-lg border-2 border-[#C8E8E5] bg-white p-4 shadow-sm">
          <p className="font-['Courier_New',monospace] text-[10px] uppercase tracking-wide text-[#7A8F95]">
            Contract Rate Pulled
          </p>
          <p className="mt-2 font-['Trebuchet_MS','Segoe_UI',sans-serif] text-lg font-semibold text-[#2D4459]">
            $450/hour
          </p>
          <p className="mt-2 font-['Courier_New',monospace] text-xs text-[#7A8F95]">
            Source: Helix Pharma Agreement 2025.pdf
          </p>
        </div>

        <div className="rounded-lg border-2 border-[#C8E8E5] bg-white p-4 shadow-sm">
          <label
            htmlFor="prep-hours"
            className="block font-['Courier_New',monospace] text-xs text-[#7A8F95]"
          >
            How many hours did you spend preparing for this meeting?
          </label>
          <input
            id="prep-hours"
            type="number"
            min={0}
            step={0.25}
            value={prepHours}
            onChange={e => setPrepHours(e.target.value)}
            className="mt-2 w-32 rounded-md border border-[#C8E8E5] px-3 py-2 font-['Trebuchet_MS','Segoe_UI',sans-serif] text-[#2D4459]"
            placeholder="0"
          />
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="mt-4 rounded-lg bg-[#3BBFBF] px-5 py-2 font-['Trebuchet_MS','Segoe_UI',sans-serif] text-sm font-bold text-white hover:opacity-90"
          >
            Calculate Invoice
          </button>
        </div>

        {showPreview && (
          <div className="rounded-lg border-2 border-[#C8E8E5] bg-white p-5 shadow-sm">
            <p className="font-['Courier_New',monospace] text-[10px] uppercase text-[#7A8F95]">
              Invoice Preview
            </p>
            <ul className="mt-3 space-y-1 font-['Trebuchet_MS','Segoe_UI',sans-serif] text-sm text-[#2D4459]">
              <li>Meeting hours: 2.0</li>
              <li>Prep hours: {prepHours || '0'}</li>
              <li>Total hours: {totalHours.toFixed(2)}</li>
              <li>Rate: $450/hour</li>
              <li className="pt-2 text-base font-bold">
                Invoice total: ${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </li>
              <li className="pt-2">Bill to: Helix Pharma Inc.</li>
              <li>From: Dr. Data Decision Intelligence LLC</li>
              <li>Billing contact: invoices@helixpharma.com</li>
              <li>Invoice date: March 18, 2026</li>
              <li>Due date: April 17, 2026 (30 days)</li>
            </ul>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => logApproval(true)}
                className="rounded-lg bg-[#3BBFBF] px-5 py-2 font-['Trebuchet_MS','Segoe_UI',sans-serif] text-sm font-bold text-white hover:opacity-90"
              >
                Approve and Send
              </button>
              <button
                type="button"
                onClick={() => logApproval(false)}
                className="rounded-lg bg-[#F05F57] px-5 py-2 font-['Trebuchet_MS','Segoe_UI',sans-serif] text-sm font-bold text-white hover:opacity-90"
              >
                Reject and Edit
              </button>
            </div>
          </div>
        )}

        {auditLine && (
          <p className="font-['Courier_New',monospace] text-xs text-[#2D4459]">
            {auditLine}
          </p>
        )}
      </div>
    </div>
  );
}

function JobTimesheet() {
  const [extraHours, setExtraHours] = useState('0');
  const [showPreview, setShowPreview] = useState(false);
  const [auditLine, setAuditLine] = useState<string | null>(null);

  const extra = parseFloat(extraHours) || 0;
  const totalHours = CALENDAR_TOTAL + extra;
  const remaining = ALLOCATED_YEAR - CLAIMED_TO_DATE - totalHours;

  const logApproval = useCallback((approved: boolean) => {
    setAuditLine(
      `Action logged: ${approved ? 'Approved' : 'Rejected'} by Dr. Raj Vuppalanchi, ${formatAuditTimestamp()}`
    );
  }, []);

  return (
    <div>
      <h2 className="font-['Georgia',serif] text-2xl font-bold text-[#2D4459]">
        Directorship Hours Timesheet
      </h2>
      <p className="mt-2 max-w-2xl font-['Trebuchet_MS','Segoe_UI',sans-serif] text-sm text-[#7A8F95]">
        Pull April admin meetings from the calendar, add uncaptured time, then submit for approval.
      </p>

      <div className="mt-8 space-y-4">
        <div className="rounded-lg border-2 border-[#C8E8E5] bg-white p-4 shadow-sm">
          <p className="font-['Courier_New',monospace] text-[10px] uppercase text-[#7A8F95]">
            Calendar Pull Complete
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full border-collapse font-['Trebuchet_MS','Segoe_UI',sans-serif] text-sm">
              <thead>
                <tr className="border-b border-[#E0E6E8] text-left text-[#7A8F95]">
                  <th className="py-2 pr-4 font-['Courier_New',monospace] text-xs font-normal">
                    Date
                  </th>
                  <th className="py-2 pr-4 font-['Courier_New',monospace] text-xs font-normal">
                    Meeting Name
                  </th>
                  <th className="py-2 font-['Courier_New',monospace] text-xs font-normal">
                    Hours
                  </th>
                </tr>
              </thead>
              <tbody className="text-[#2D4459]">
                {MEETINGS_APRIL.map(row => (
                  <tr key={row.date} className="border-b border-[#F4F7F8]">
                    <td className="py-2 pr-4">{row.date}</td>
                    <td className="py-2 pr-4">{row.name}</td>
                    <td className="py-2">{row.hours}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 font-['Courier_New',monospace] text-xs text-[#7A8F95]">
            Source: IU Outlook Calendar, April 2026
          </p>

          <div className="mt-4 flex flex-wrap items-end gap-4 border-t border-[#C8E8E5] pt-4">
            <div>
              <label
                htmlFor="extra-hours"
                className="block font-['Courier_New',monospace] text-xs text-[#7A8F95]"
              >
                Additional hours from email or other work
              </label>
              <input
                id="extra-hours"
                type="number"
                min={0}
                step={0.25}
                value={extraHours}
                onChange={e => setExtraHours(e.target.value)}
                className="mt-1 w-28 rounded-md border border-[#C8E8E5] px-3 py-2 font-['Trebuchet_MS','Segoe_UI',sans-serif] text-[#2D4459]"
              />
            </div>
            <p className="max-w-md font-['Trebuchet_MS','Segoe_UI',sans-serif] text-xs text-[#7A8F95]">
              Time not captured on calendar. Enter manually.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="mt-4 rounded-lg bg-[#3BBFBF] px-5 py-2 font-['Trebuchet_MS','Segoe_UI',sans-serif] text-sm font-bold text-white hover:opacity-90"
          >
            Generate Timesheet
          </button>
        </div>

        {showPreview && (
          <div className="rounded-lg border-2 border-[#C8E8E5] bg-white p-5 shadow-sm">
            <p className="font-['Courier_New',monospace] text-[10px] uppercase text-[#7A8F95]">
              Timesheet Preview
            </p>
            <ul className="mt-3 space-y-2 font-['Trebuchet_MS','Segoe_UI',sans-serif] text-sm text-[#2D4459]">
              <li>Month: April 2026</li>
              <li>Name: Dr. Raj Vuppalanchi</li>
              <li>Title: Director of Clinical Research</li>
            </ul>
            <ul className="mt-3 space-y-1 border-t border-[#E0E6E8] pt-3 font-['Trebuchet_MS','Segoe_UI',sans-serif] text-sm text-[#2D4459]">
              {MEETINGS_APRIL.map(row => (
                <li key={row.date}>
                  {row.date}: {row.name} ({row.hours} hr)
                </li>
              ))}
              <li>Manual / other: {extra.toFixed(2)} hr</li>
              <li className="pt-2 font-bold">Total hours: {totalHours.toFixed(2)}</li>
              <li>Allocated hours this year: {ALLOCATED_YEAR}</li>
              <li>Hours claimed to date: {CLAIMED_TO_DATE}</li>
              <li className="text-[#C8974A]">
                Hours remaining after this month: {remaining.toFixed(2)}
              </li>
            </ul>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => logApproval(true)}
                className="rounded-lg bg-[#3BBFBF] px-5 py-2 font-['Trebuchet_MS','Segoe_UI',sans-serif] text-sm font-bold text-white hover:opacity-90"
              >
                Approve and Submit
              </button>
              <button
                type="button"
                onClick={() => logApproval(false)}
                className="rounded-lg bg-[#F05F57] px-5 py-2 font-['Trebuchet_MS','Segoe_UI',sans-serif] text-sm font-bold text-white hover:opacity-90"
              >
                Reject and Edit
              </button>
            </div>
          </div>
        )}

        {auditLine && (
          <p className="font-['Courier_New',monospace] text-xs text-[#2D4459]">
            {auditLine}
          </p>
        )}
      </div>
    </div>
  );
}

function JobBrief() {
  const [query, setQuery] = useState('');
  const [showBrief, setShowBrief] = useState(false);
  const [auditLine, setAuditLine] = useState<string | null>(null);

  const logAction = useCallback((saved: boolean) => {
    setAuditLine(
      `Action logged: ${saved ? 'Saved to research file' : 'Discarded'} by Dr. Raj Vuppalanchi, ${formatAuditTimestamp()}`
    );
  }, []);

  return (
    <div>
      <h2 className="font-['Georgia',serif] text-2xl font-bold text-[#2D4459]">
        Hepatotoxicity Intelligence Brief
      </h2>
      <p className="mt-2 max-w-2xl font-['Trebuchet_MS','Segoe_UI',sans-serif] text-sm text-[#7A8F95]">
        Run a structured drug safety brief from your query, then save or discard after review.
      </p>

      <div className="mt-8 space-y-4">
        <div className="rounded-lg border-2 border-[#C8E8E5] bg-white p-4 shadow-sm">
          <label
            htmlFor="drug-query"
            className="block font-['Courier_New',monospace] text-xs text-[#7A8F95]"
          >
            Enter drug name or safety event
          </label>
          <input
            id="drug-query"
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="e.g. Fialuridine, troglitazone, bromfenac..."
            className="mt-2 w-full max-w-xl rounded-md border border-[#C8E8E5] px-3 py-2 font-['Trebuchet_MS','Segoe_UI',sans-serif] text-[#2D4459] placeholder:text-[#7A8F95]/70"
          />
          <button
            type="button"
            onClick={() => setShowBrief(true)}
            className="mt-4 rounded-lg bg-[#3BBFBF] px-5 py-2 font-['Trebuchet_MS','Segoe_UI',sans-serif] text-sm font-bold text-white hover:opacity-90"
          >
            Run Intelligence Brief
          </button>
        </div>

        {showBrief && (
          <div className="rounded-lg border-2 border-[#C8E8E5] bg-white p-6 shadow-sm">
            <h3 className="font-['Georgia',serif] text-lg font-bold tracking-wide text-[#2D4459]">
              DRUG SAFETY INTELLIGENCE BRIEF
            </h3>
            <p className="mt-3 font-['Trebuchet_MS','Segoe_UI',sans-serif] text-sm text-[#2D4459]">
              Drug: Fialuridine (FIAU)
            </p>
            <p className="font-['Trebuchet_MS','Segoe_UI',sans-serif] text-sm text-[#2D4459]">
              Event Date: 1993
            </p>
            <p className="font-['Trebuchet_MS','Segoe_UI',sans-serif] text-sm text-[#2D4459]">
              Classification: Hepatotoxicity, mitochondrial injury
            </p>

            <h4 className="mt-6 font-['Georgia',serif] text-base font-bold text-[#2D4459]">
              WHAT HAPPENED
            </h4>
            <div className="mt-2 space-y-3 font-['Trebuchet_MS','Segoe_UI',sans-serif] text-sm leading-relaxed text-[#2D4459]">
              <p>
                In 1993, a phase I study of fialuridine (FIAU) for chronic hepatitis B at the NIH
                produced severe, delayed hepatotoxicity with lactic acidosis and hepatic failure in
                several participants. The toxicity was linked to mitochondrial injury in
                hepatocytes. The trial was stopped and dosing did not resume.
              </p>
              <p>
                The event reshaped how nucleoside analogs were monitored in early-phase studies and
                remains a standard teaching case for drug-induced liver injury with mitochondrial
                mechanisms. Regulatory and clinical follow-up emphasized prolonged observation after
                exposure, not only immediate laboratory trends.
              </p>
            </div>

            <h4 className="mt-6 font-['Georgia',serif] text-base font-bold text-[#2D4459]">
              SOURCES REVIEWED
            </h4>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full max-w-2xl border-collapse font-['Trebuchet_MS','Segoe_UI',sans-serif] text-sm">
                <thead>
                  <tr className="border-b border-[#E0E6E8] text-left">
                    <th className="py-2 pr-4 font-['Courier_New',monospace] text-xs font-normal text-[#7A8F95]">
                      Source name
                    </th>
                    <th className="py-2 pr-4 font-['Courier_New',monospace] text-xs font-normal text-[#7A8F95]">
                      Type
                    </th>
                    <th className="py-2 font-['Courier_New',monospace] text-xs font-normal text-[#7A8F95]">
                      Year
                    </th>
                  </tr>
                </thead>
                <tbody className="text-[#2D4459]">
                  <tr className="border-b border-[#F4F7F8]">
                    <td className="py-2 pr-4">NIH Clinical Center Report</td>
                    <td className="py-2 pr-4">Government</td>
                    <td className="py-2">1994</td>
                  </tr>
                  <tr className="border-b border-[#F4F7F8]">
                    <td className="py-2 pr-4">New England Journal of Medicine</td>
                    <td className="py-2 pr-4">Peer Review</td>
                    <td className="py-2">1995</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">FDA Drug Safety Communication</td>
                    <td className="py-2 pr-4">Regulatory</td>
                    <td className="py-2">1994</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h4 className="mt-6 font-['Georgia',serif] text-base font-bold text-[#2D4459]">
              GAPS IN PUBLIC RECORD
            </h4>
            <p className="mt-2 max-w-3xl font-['Trebuchet_MS','Segoe_UI',sans-serif] text-sm leading-relaxed text-[#2D4459]">
              Dockets and internal sponsor memos are often summarized in public documents but not
              released in full. Endpoint News and similar trade reporting can add timing of board
              decisions, financing pressure, and pipeline reprioritization that do not appear in the
              peer-reviewed literature alone.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => logAction(true)}
                className="rounded-lg bg-[#3BBFBF] px-5 py-2 font-['Trebuchet_MS','Segoe_UI',sans-serif] text-sm font-bold text-white hover:opacity-90"
              >
                Save to Research File
              </button>
              <button
                type="button"
                onClick={() => logAction(false)}
                className="rounded-lg bg-[#F05F57] px-5 py-2 font-['Trebuchet_MS','Segoe_UI',sans-serif] text-sm font-bold text-white hover:opacity-90"
              >
                Discard
              </button>
            </div>
          </div>
        )}

        {auditLine && (
          <p className="font-['Courier_New',monospace] text-xs text-[#2D4459]">
            {auditLine}
          </p>
        )}
      </div>
    </div>
  );
}
