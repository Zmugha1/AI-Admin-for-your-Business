import { useState, useEffect, useCallback } from 'react';
import { getDb } from '../services/db';
import { enqueueJob } from '../services/jobQueueService';
import { v4 as uuidv4 } from 'uuid';

export interface Contact {
  contact_id: string;
  full_name: string;
  company: string | null;
  role: string | null;
  vertical: string | null;
  email: string | null;
  phone: string | null;
  linkedin: string | null;
  status: string;
  pipeline_stage: string;
  tier: string;
  mrr: number;
  health_score: string;
  days_in_stage: number;
  next_action: string | null;
  next_action_date: string | null;
  last_contact: string | null;
  proposal_sent_date: string | null;
  contract_signed_date: string | null;
  build_start_date: string | null;
  go_live_date: string | null;
  notes: string | null;
}

export interface ClientMeeting {
  meeting_id: string;
  contact_id: string;
  meeting_date: string | null;
  meeting_type: string;
  outcome: string | null;
  transcript_text: string | null;
  summary_generated: number;
  followup_sent: number;
  prep_completed: number;
  notes: string | null;
}

export interface ClientDocument {
  document_id: string;
  contact_id: string;
  document_type: string;
  title: string | null;
  status: string;
  value: number;
  sent_date: string | null;
  signed_date: string | null;
  notes: string | null;
}

export interface ClientReminder {
  reminder_id: string;
  contact_id: string | null;
  reminder_date: string;
  message: string;
  priority: string;
  completed: number;
  recurring: number;
}

export interface Testimonial {
  testimonial_id: string;
  contact_id: string;
  request_sent: number;
  received_date: string | null;
  testimonial_text: string | null;
  published: number;
  published_where: string | null;
}

export interface ClientFinancial {
  financial_id: string;
  contact_id: string;
  pricing_model: string;
  retainer_active: number;
  retainer_amount: number;
  build_fee: number;
  build_fee_paid: number;
  total_revenue: number;
  offered_price: number;
  suggested_price: number;
}

export interface JobPricing {
  pricing_id: string;
  contact_id: string;
  job_name: string;
  suggested_price: number;
  offered_price: number;
  included: number;
}

interface ClientContentRow {
  content_id: string;
  contact_id: string | null;
  content_type: string;
  title: string | null;
  body: string | null;
  status: string;
  notes: string | null;
}

const PIPELINE_STAGES = [
  { value: 'prospect', label: 'Prospect' },
  { value: 'spark_scheduled', label: 'Spark Scheduled' },
  { value: 'spark_complete', label: 'Spark Complete' },
  { value: 'pulse_demo', label: 'Pulse Demo' },
  { value: 'proposal_sent', label: 'Proposal Sent' },
  { value: 'contract_signed', label: 'Contract Signed' },
  { value: 'active_client', label: 'Active Client' },
];

const TIERS = [
  { value: 'pulse', label: 'Pulse', color: '#3BBFBF' },
  { value: 'vault', label: 'Vault', color: '#2D4459' },
  { value: 'scale', label: 'Scale', color: '#C8974A' },
];

const HEALTH_SCORES = [
  { value: 'green', label: 'Healthy', color: '#3A7D5C' },
  { value: 'gold', label: 'Attention', color: '#C8974A' },
  { value: 'coral', label: 'At Risk', color: '#F05F57' },
];

const MEETING_TYPES = [
  'spark', 'pulse_demo', 'check_in',
  'project_review', 'upsell', 'other',
];

const DOCUMENT_TYPES = [
  'proposal', 'contract', 'sow',
  'project_plan', 'invoice', 'other',
];

const DOC_STATUSES = [
  'draft', 'sent', 'signed', 'paid', 'rejected',
];

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
  lgray: '#F4F7F8',
};

const labelStyle: React.CSSProperties = {
  fontFamily: 'Courier New, monospace',
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: C.slate,
  marginBottom: 4,
};

function cardStyle(): React.CSSProperties {
  return {
    background: C.white,
    border: `1px solid ${C.mint}`,
    borderRadius: 12,
    padding: '16px 20px',
    marginBottom: 14,
  };
}

async function audit(
  db: Awaited<ReturnType<typeof getDb>>,
  action: string,
  entityType: string,
  entityId: string,
  details: string
) {
  await db.execute(
    `INSERT INTO audit_log
       (log_id, action, entity_type, entity_id, details)
     VALUES (?, ?, ?, ?, ?)`,
    [uuidv4(), action, entityType, entityId, details]
  );
}

function daysSinceUpdated(updatedAt: string | null): number {
  if (!updatedAt) return 0;
  const t = new Date(updatedAt.replace(' ', 'T')).getTime();
  if (Number.isNaN(t)) return 0;
  return Math.max(0, Math.floor((Date.now() - t) / 86400000));
}

function formatMoney(n: number): string {
  return `$${Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export function ClientCard({
  contactId,
  onClose,
}: {
  contactId: string;
  onClose: () => void;
}) {
  const [contact, setContact] = useState<Contact | null>(null);
  const [contactUpdatedAt, setContactUpdatedAt] = useState<string | null>(null);
  const [meetings, setMeetings] = useState<ClientMeeting[]>([]);
  const [documents, setDocuments] = useState<ClientDocument[]>([]);
  const [reminders, setReminders] = useState<ClientReminder[]>([]);
  const [testimonial, setTestimonial] = useState<Testimonial | null>(null);
  const [financial, setFinancial] = useState<ClientFinancial | null>(null);
  const [jobPricing, setJobPricing] = useState<JobPricing[]>([]);
  const [contentItems, setContentItems] = useState<ClientContentRow[]>([]);
  const [nextMeeting, setNextMeeting] = useState<{
    title: string | null;
    start_time: string | null;
  } | null>(null);

  const [activeTab, setActiveTab] = useState<
    'overview' | 'meetings' | 'documents' | 'content' | 'financial'
  >('overview');
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [editingOverview, setEditingOverview] = useState(false);
  const [queueHint, setQueueHint] = useState('');

  const [expandedMeetingId, setExpandedMeetingId] = useState<string | null>(
    null
  );

  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [meetingForm, setMeetingForm] = useState({
    meeting_date: '',
    meeting_type: 'spark',
    outcome: '',
    notes: '',
  });

  const [showDocForm, setShowDocForm] = useState(false);
  const [docForm, setDocForm] = useState({
    document_type: 'proposal',
    title: '',
    status: 'draft',
    value: '',
    sent_date: '',
    signed_date: '',
    notes: '',
  });
  const [editingDocId, setEditingDocId] = useState<string | null>(null);

  const [showContentForm, setShowContentForm] = useState(false);
  const [contentForm, setContentForm] = useState({
    content_type: 'blog',
    title: '',
    status: 'not_started',
    notes: '',
  });
  const [editingContentId, setEditingContentId] = useState<string | null>(null);

  const [showReminderForm, setShowReminderForm] = useState(false);
  const [reminderForm, setReminderForm] = useState({
    message: '',
    reminder_date: '',
    priority: 'normal',
    recurring: false,
    recurring_days: '7',
  });

  const [showJobForm, setShowJobForm] = useState(false);
  const [jobForm, setJobForm] = useState({
    job_name: '',
    suggested_price: '',
    offered_price: '',
    included: 1,
  });

  const [showCompletedReminders, setShowCompletedReminders] =
    useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const db = await getDb();
      const cRows = await db.select<
        (Contact & { updated_at?: string | null })[]
      >(
        `SELECT contact_id, full_name, company, role, vertical,
                email, phone, linkedin, status,
                COALESCE(pipeline_stage, 'prospect') AS pipeline_stage,
                COALESCE(tier, 'pulse') AS tier,
                COALESCE(mrr, 0) AS mrr,
                COALESCE(health_score, 'green') AS health_score,
                COALESCE(days_in_stage, 0) AS days_in_stage,
                next_action, next_action_date, last_contact,
                proposal_sent_date, contract_signed_date,
                build_start_date, go_live_date, notes,
                updated_at
         FROM contacts WHERE contact_id = ?`,
        [contactId]
      );
      if (cRows.length === 0) {
        setContact(null);
        return;
      }
      const row = cRows[0];
      setContactUpdatedAt(row.updated_at ?? null);
      setContact({
        contact_id: row.contact_id,
        full_name: row.full_name,
        company: row.company,
        role: row.role,
        vertical: row.vertical,
        email: row.email,
        phone: row.phone,
        linkedin: row.linkedin,
        status: row.status,
        pipeline_stage: row.pipeline_stage,
        tier: row.tier,
        mrr: Number(row.mrr),
        health_score: row.health_score,
        days_in_stage: Number(row.days_in_stage),
        next_action: row.next_action,
        next_action_date: row.next_action_date,
        last_contact: row.last_contact,
        proposal_sent_date: row.proposal_sent_date,
        contract_signed_date: row.contract_signed_date,
        build_start_date: row.build_start_date,
        go_live_date: row.go_live_date,
        notes: row.notes,
      });

      const m = await db.select<ClientMeeting[]>(
        `SELECT meeting_id, contact_id, meeting_date, meeting_type,
                outcome, transcript_text,
                summary_generated, followup_sent, prep_completed, notes
         FROM client_meetings
         WHERE contact_id = ?
         ORDER BY meeting_date DESC, datetime(created_at) DESC`,
        [contactId]
      );
      setMeetings(m);

      const d = await db.select<ClientDocument[]>(
        `SELECT document_id, contact_id, document_type, title, status,
                COALESCE(value, 0) AS value,
                sent_date, signed_date, notes
         FROM client_documents WHERE contact_id = ?
         ORDER BY datetime(created_at) DESC`,
        [contactId]
      );
      setDocuments(d);

      const r = await db.select<ClientReminder[]>(
        `SELECT reminder_id, contact_id, reminder_date, message,
                priority, completed, recurring
         FROM client_reminders
         WHERE contact_id = ?
         ORDER BY reminder_date ASC`,
        [contactId]
      );
      setReminders(r);

      const t = await db.select<
        (Testimonial & { request_sent_date?: string | null })[]
      >(
        `SELECT testimonial_id, contact_id, request_sent,
                received_date, testimonial_text, published,
                published_where, request_sent_date
         FROM testimonials
         WHERE contact_id = ?
         ORDER BY datetime(created_at) DESC LIMIT 1`,
        [contactId]
      );
      if (t.length > 0) {
        setTestimonial({
          testimonial_id: t[0].testimonial_id,
          contact_id: t[0].contact_id,
          request_sent: t[0].request_sent,
          received_date: t[0].received_date,
          testimonial_text: t[0].testimonial_text,
          published: t[0].published,
          published_where: t[0].published_where,
        });
      } else {
        setTestimonial(null);
      }

      const f = await db.select<
        (ClientFinancial & {
          retainer_billing_date?: string | null;
          build_fee_paid_date?: string | null;
        })[]
      >(
        `SELECT financial_id, contact_id,
                COALESCE(pricing_model, 'per_job') AS pricing_model,
                retainer_active,
                COALESCE(retainer_amount, 0) AS retainer_amount,
                COALESCE(build_fee, 0) AS build_fee,
                build_fee_paid,
                COALESCE(total_revenue, 0) AS total_revenue,
                COALESCE(offered_price, 0) AS offered_price,
                COALESCE(suggested_price, 0) AS suggested_price
         FROM client_financials WHERE contact_id = ?`,
        [contactId]
      );
      setFinancial(f.length > 0 ? f[0] : null);

      const jp = await db.select<JobPricing[]>(
        `SELECT pricing_id, contact_id, job_name,
                COALESCE(suggested_price, 0) AS suggested_price,
                COALESCE(offered_price, 0) AS offered_price,
                COALESCE(included, 1) AS included
         FROM client_jobs_pricing
         WHERE contact_id = ?
         ORDER BY datetime(created_at) ASC`,
        [contactId]
      );
      setJobPricing(jp);

      const ct = await db.select<ClientContentRow[]>(
        `SELECT content_id, contact_id, content_type, title, body,
                status, notes
         FROM client_content
         WHERE contact_id = ?
         ORDER BY datetime(created_at) DESC`,
        [contactId]
      );
      setContentItems(ct);

      const ev = await db.select<{ title: string | null; start_time: string | null }[]>(
        `SELECT title, start_time FROM calendar_events
         WHERE contact_id = ?
           AND (start_time IS NULL OR start_time >= datetime('now'))
         ORDER BY start_time ASC LIMIT 1`,
        [contactId]
      );
      setNextMeeting(ev.length > 0 ? ev[0] : null);
    } catch (e) {
      console.error('ClientCard load', e);
    } finally {
      setLoading(false);
    }
  }, [contactId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  async function saveOverview() {
    if (!contact) return;
    const db = await getDb();
    await db.execute(
      `UPDATE contacts SET
         pipeline_stage = ?, tier = ?, mrr = ?, health_score = ?,
         next_action = ?, next_action_date = ?, last_contact = ?,
         proposal_sent_date = ?, contract_signed_date = ?,
         build_start_date = ?, go_live_date = ?,
         notes = ?, updated_at = datetime('now')
       WHERE contact_id = ?`,
      [
        contact.pipeline_stage,
        contact.tier,
        contact.mrr,
        contact.health_score,
        contact.next_action || null,
        contact.next_action_date || null,
        contact.last_contact || null,
        contact.proposal_sent_date || null,
        contact.contract_signed_date || null,
        contact.build_start_date || null,
        contact.go_live_date || null,
        contact.notes || null,
        contact.contact_id,
      ]
    );
    await audit(
      db,
      'contact_updated',
      'contacts',
      contact.contact_id,
      'Overview fields updated'
    );
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setEditingOverview(false);
    await loadAll();
  }

  async function addMeeting() {
    const db = await getDb();
    const id = uuidv4();
    await db.execute(
      `INSERT INTO client_meetings
         (meeting_id, contact_id, meeting_date, meeting_type,
          outcome, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        id,
        contactId,
        meetingForm.meeting_date || null,
        meetingForm.meeting_type,
        meetingForm.outcome || null,
        meetingForm.notes || null,
      ]
    );
    await audit(db, 'meeting_added', 'client_meetings', id, 'New meeting');
    setShowMeetingForm(false);
    setMeetingForm({
      meeting_date: '',
      meeting_type: 'spark',
      outcome: '',
      notes: '',
    });
    await loadAll();
  }

  async function updateMeeting(
    meetingId: string,
    patch: Partial<ClientMeeting>
  ) {
    const db = await getDb();
    const cur = meetings.find(m => m.meeting_id === meetingId);
    if (!cur) return;
    const next = { ...cur, ...patch };
    await db.execute(
      `UPDATE client_meetings SET
         meeting_date = ?, meeting_type = ?, outcome = ?,
         transcript_text = ?, summary_generated = ?,
         followup_sent = ?, prep_completed = ?, notes = ?,
         updated_at = datetime('now')
       WHERE meeting_id = ?`,
      [
        next.meeting_date,
        next.meeting_type,
        next.outcome,
        next.transcript_text,
        next.summary_generated,
        next.followup_sent,
        next.prep_completed,
        next.notes,
        meetingId,
      ]
    );
    await audit(
      db,
      'meeting_updated',
      'client_meetings',
      meetingId,
      'Meeting row updated'
    );
    await loadAll();
  }

  async function saveMeetingTranscript(meetingId: string, text: string) {
    await updateMeeting(meetingId, { transcript_text: text });
  }

  async function addDocument() {
    const db = await getDb();
    const id = uuidv4();
    await db.execute(
      `INSERT INTO client_documents
         (document_id, contact_id, document_type, title, status,
          value, sent_date, signed_date, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        contactId,
        docForm.document_type,
        docForm.title || null,
        docForm.status,
        parseFloat(docForm.value) || 0,
        docForm.sent_date || null,
        docForm.signed_date || null,
        docForm.notes || null,
      ]
    );
    await audit(db, 'document_added', 'client_documents', id, docForm.title ?? '');
    setShowDocForm(false);
    setDocForm({
      document_type: 'proposal',
      title: '',
      status: 'draft',
      value: '',
      sent_date: '',
      signed_date: '',
      notes: '',
    });
    setEditingDocId(null);
    await loadAll();
  }

  async function updateDocument(doc: ClientDocument) {
    const db = await getDb();
    await db.execute(
      `UPDATE client_documents SET
         document_type = ?, title = ?, status = ?, value = ?,
         sent_date = ?, signed_date = ?, notes = ?,
         updated_at = datetime('now')
       WHERE document_id = ?`,
      [
        doc.document_type,
        doc.title,
        doc.status,
        doc.value,
        doc.sent_date,
        doc.signed_date,
        doc.notes,
        doc.document_id,
      ]
    );
    await audit(
      db,
      'document_updated',
      'client_documents',
      doc.document_id,
      'Document updated'
    );
    setEditingDocId(null);
    await loadAll();
  }

  async function deleteDocument(documentId: string) {
    if (!window.confirm('Delete this document?')) return;
    const db = await getDb();
    await db.execute(
      `DELETE FROM client_documents WHERE document_id = ?`,
      [documentId]
    );
    await audit(
      db,
      'document_deleted',
      'client_documents',
      documentId,
      'Document removed'
    );
    await loadAll();
  }

  async function addContentRow() {
    const db = await getDb();
    const id = uuidv4();
    await db.execute(
      `INSERT INTO client_content
         (content_id, contact_id, content_type, title, body, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        contactId,
        contentForm.content_type,
        contentForm.title || null,
        null,
        contentForm.status,
        contentForm.notes || null,
      ]
    );
    await audit(db, 'content_added', 'client_content', id, contentForm.title ?? '');
    setShowContentForm(false);
    setContentForm({
      content_type: 'blog',
      title: '',
      status: 'not_started',
      notes: '',
    });
    setEditingContentId(null);
    await loadAll();
  }

  async function updateContentRow(row: ClientContentRow) {
    const db = await getDb();
    await db.execute(
      `UPDATE client_content SET
         content_type = ?, title = ?, status = ?, notes = ?,
         updated_at = datetime('now')
       WHERE content_id = ?`,
      [row.content_type, row.title, row.status, row.notes, row.content_id]
    );
    await audit(
      db,
      'content_updated',
      'client_content',
      row.content_id,
      'Content updated'
    );
    setEditingContentId(null);
    await loadAll();
  }

  async function deleteContentRow(contentId: string) {
    if (!window.confirm('Delete this content item?')) return;
    const db = await getDb();
    await db.execute(
      `DELETE FROM client_content WHERE content_id = ?`,
      [contentId]
    );
    await audit(
      db,
      'content_deleted',
      'client_content',
      contentId,
      'Content removed'
    );
    await loadAll();
  }

  async function requestTestimonial() {
    if (!contact) return;
    const input = `Request a testimonial outreach email for:\n${contact.full_name}\n${contact.company ?? ''}`;
    await enqueueJob('follow_up_email', input, contactId);
    setQueueHint('Testimonial request added to job queue');
    setTimeout(() => setQueueHint(''), 4000);
    const db = await getDb();
    const existing = testimonial;
    if (existing) {
      await db.execute(
        `UPDATE testimonials SET request_sent = 1,
             request_sent_date = datetime('now')
         WHERE testimonial_id = ?`,
        [existing.testimonial_id]
      );
    } else {
      const tid = uuidv4();
      await db.execute(
        `INSERT INTO testimonials
           (testimonial_id, contact_id, request_sent,
            request_sent_date)
         VALUES (?, ?, 1, datetime('now'))`,
        [tid, contactId]
      );
    }
    await audit(
      db,
      'testimonial_requested',
      'testimonials',
      contactId,
      'Queued follow_up_email for testimonial'
    );
    await loadAll();
  }

  async function saveTestimonial() {
    if (!testimonial) return;
    const db = await getDb();
    await db.execute(
      `UPDATE testimonials SET
         testimonial_text = ?, published = ?, published_where = ?,
         received_date = COALESCE(?, received_date)
       WHERE testimonial_id = ?`,
      [
        testimonial.testimonial_text,
        testimonial.published,
        testimonial.published_where || null,
        testimonial.received_date || null,
        testimonial.testimonial_id,
      ]
    );
    await audit(
      db,
      'testimonial_updated',
      'testimonials',
      testimonial.testimonial_id,
      'Testimonial saved'
    );
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    await loadAll();
  }

  async function ensureFinancial(): Promise<ClientFinancial> {
    if (financial) return financial;
    const db = await getDb();
    const fid = uuidv4();
    await db.execute(
      `INSERT INTO client_financials
         (financial_id, contact_id, pricing_model,
          retainer_active, retainer_amount, build_fee,
          build_fee_paid, total_revenue, offered_price,
          suggested_price)
       VALUES (?, ?, 'per_job', 0, 0, 0, 0, 0, 0, 0)`,
      [fid, contactId]
    );
    await audit(
      db,
      'financial_created',
      'client_financials',
      fid,
      'Financial row created'
    );
    const f: ClientFinancial = {
      financial_id: fid,
      contact_id: contactId,
      pricing_model: 'per_job',
      retainer_active: 0,
      retainer_amount: 0,
      build_fee: 0,
      build_fee_paid: 0,
      total_revenue: 0,
      offered_price: 0,
      suggested_price: 0,
    };
    setFinancial(f);
    return f;
  }

  async function saveFinancial(patch: Partial<ClientFinancial>) {
    const f = await ensureFinancial();
    const db = await getDb();
    const next = { ...f, ...patch };
    await db.execute(
      `UPDATE client_financials SET
         pricing_model = ?, retainer_active = ?, retainer_amount = ?,
         build_fee = ?, build_fee_paid = ?, total_revenue = ?,
         offered_price = ?, suggested_price = ?,
         retainer_billing_date = COALESCE(?, retainer_billing_date),
         updated_at = datetime('now')
       WHERE financial_id = ?`,
      [
        next.pricing_model,
        next.retainer_active,
        next.retainer_amount,
        next.build_fee,
        next.build_fee_paid,
        next.total_revenue,
        next.offered_price,
        next.suggested_price,
        (patch as { retainer_billing_date?: string }).retainer_billing_date ??
          null,
        next.financial_id,
      ]
    );
    await audit(
      db,
      'financial_updated',
      'client_financials',
      next.financial_id,
      'Financial updated'
    );
    await loadAll();
  }

  async function addJobPricing() {
    const db = await getDb();
    const pid = uuidv4();
    const jobKey = uuidv4();
    await db.execute(
      `INSERT INTO client_jobs_pricing
         (pricing_id, contact_id, job_id, job_name,
          suggested_price, offered_price, included)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        pid,
        contactId,
        jobKey,
        jobForm.job_name || 'Engagement job',
        parseFloat(jobForm.suggested_price) || 0,
        parseFloat(jobForm.offered_price) || 0,
        jobForm.included,
      ]
    );
    await audit(
      db,
      'job_pricing_added',
      'client_jobs_pricing',
      pid,
      jobForm.job_name
    );
    setShowJobForm(false);
    setJobForm({
      job_name: '',
      suggested_price: '',
      offered_price: '',
      included: 1,
    });
    await loadAll();
  }

  async function updateJobRow(row: JobPricing) {
    const db = await getDb();
    await db.execute(
      `UPDATE client_jobs_pricing SET
         job_name = ?, suggested_price = ?, offered_price = ?,
         included = ?
       WHERE pricing_id = ?`,
      [
        row.job_name,
        row.suggested_price,
        row.offered_price,
        row.included,
        row.pricing_id,
      ]
    );
    await audit(
      db,
      'job_pricing_updated',
      'client_jobs_pricing',
      row.pricing_id,
      'Job pricing updated'
    );
    await loadAll();
  }

  async function deleteJobRow(pricingId: string) {
    if (!window.confirm('Remove this job row?')) return;
    const db = await getDb();
    await db.execute(
      `DELETE FROM client_jobs_pricing WHERE pricing_id = ?`,
      [pricingId]
    );
    await audit(
      db,
      'job_pricing_deleted',
      'client_jobs_pricing',
      pricingId,
      'Job pricing removed'
    );
    await loadAll();
  }

  async function addReminder() {
    const db = await getDb();
    const id = uuidv4();
    await db.execute(
      `INSERT INTO client_reminders
         (reminder_id, contact_id, reminder_date, message,
          priority, recurring, recurring_days, completed)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        id,
        contactId,
        reminderForm.reminder_date,
        reminderForm.message,
        reminderForm.priority,
        reminderForm.recurring ? 1 : 0,
        reminderForm.recurring
          ? parseInt(reminderForm.recurring_days, 10) || 0
          : 0,
      ]
    );
    await audit(db, 'reminder_added', 'client_reminders', id, reminderForm.message);
    setShowReminderForm(false);
    setReminderForm({
      message: '',
      reminder_date: '',
      priority: 'normal',
      recurring: false,
      recurring_days: '7',
    });
    await loadAll();
  }

  async function dismissReminder(reminderId: string) {
    const db = await getDb();
    await db.execute(
      `UPDATE client_reminders SET completed = 1,
           completed_date = datetime('now')
       WHERE reminder_id = ?`,
      [reminderId]
    );
    await audit(
      db,
      'reminder_completed',
      'client_reminders',
      reminderId,
      'Dismissed'
    );
    await loadAll();
  }

  const inputBase: React.CSSProperties = {
    border: `1px solid ${C.mint}`,
    borderRadius: 8,
    padding: '8px 12px',
    fontSize: 13,
    color: C.navy,
    fontFamily: 'Trebuchet MS, sans-serif',
    width: '100%',
    boxSizing: 'border-box',
  };

  const btnTeal: React.CSSProperties = {
    padding: '8px 16px',
    background: C.teal,
    color: C.white,
    border: 'none',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'Trebuchet MS, sans-serif',
  };

  const tabs: { id: typeof activeTab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'meetings', label: 'Meetings' },
    { id: 'documents', label: 'Documents' },
    { id: 'content', label: 'Content' },
    { id: 'financial', label: 'Financial' },
  ];

  const totalSuggested = jobPricing
    .filter(j => j.included === 1)
    .reduce((s, j) => s + j.suggested_price, 0);
  const totalOffered = jobPricing
    .filter(j => j.included === 1)
    .reduce((s, j) => s + j.offered_price, 0);

  const fRow = financial;
  const revenueDisplay =
    (fRow?.build_fee_paid === 1 ? fRow.build_fee : 0) +
    jobPricing.filter(j => j.included === 1).reduce((s, j) => s + j.offered_price, 0);

  const healthDot =
    HEALTH_SCORES.find(h => h.value === contact?.health_score)?.color ?? C.slate;

  if (loading) {
    return (
      <div style={{
        padding: 40, color: C.slate,
        fontFamily: 'Courier New, monospace',
        fontSize: 12,
      }}>
        Loading...
      </div>
    );
  }

  if (!contact) {
    return (
      <div style={{ padding: 40, color: C.coral }}>
        Contact not found.
        <button type="button" onClick={onClose} style={{ ...btnTeal, marginLeft: 12 }}>
          Close
        </button>
      </div>
    );
  }

  const daysShown = daysSinceUpdated(contactUpdatedAt);

  return (
    <div style={{
      background: C.cream,
      minHeight: '100%',
      position: 'relative',
      fontFamily: 'Trebuchet MS, sans-serif',
    }}>
      <button
        type="button"
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          width: 36,
          height: 36,
          borderRadius: 8,
          border: `1px solid ${C.mint}`,
          background: C.white,
          color: C.navy,
          fontSize: 18,
          cursor: 'pointer',
          lineHeight: 1,
          zIndex: 2,
        }}
        aria-label="Close"
      >
        ×
      </button>

      <div style={{ padding: '20px 24px 12px', paddingRight: 52 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <h1 style={{
            fontFamily: 'Georgia, serif',
            fontSize: 24,
            color: C.navy,
            margin: 0,
          }}>
            {contact.full_name}
          </h1>
          <span style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: healthDot,
          }} />
          <span style={{
            fontSize: 11,
            padding: '4px 10px',
            borderRadius: 20,
            background: C.lgray,
            color: C.navy,
            fontWeight: 600,
          }}>
            {contact.status}
          </span>
        </div>
        <div style={{ fontSize: 14, color: C.slate, marginTop: 4 }}>
          {contact.company ?? ''}
        </div>
      </div>

      <div style={{
        display: 'flex',
        gap: 4,
        padding: '0 20px 12px',
        borderBottom: `1px solid ${C.mint}`,
        flexWrap: 'wrap',
      }}>
        {tabs.map(t => {
          const on = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                border: on ? 'none' : `1px solid ${C.mint}`,
                background: on ? C.teal : 'transparent',
                color: on ? C.white : C.slate,
                fontSize: 12,
                fontWeight: on ? 700 : 500,
                cursor: 'pointer',
                fontFamily: 'Trebuchet MS, sans-serif',
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div style={{ padding: 24, background: C.cream }}>
        {queueHint && (
          <div style={{
            marginBottom: 12,
            padding: 10,
            background: '#3BBFBF22',
            borderRadius: 8,
            fontSize: 12,
            color: C.navy,
          }}>
            {queueHint}
          </div>
        )}

        {activeTab === 'overview' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 12 }}>
              {!editingOverview ? (
                <button
                  type="button"
                  style={btnTeal}
                  onClick={() => setEditingOverview(true)}
                >
                  Edit
                </button>
              ) : (
                <>
                  <button type="button" style={btnTeal} onClick={saveOverview}>
                    {saved ? 'Saved' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingOverview(false);
                      loadAll();
                    }}
                    style={{
                      ...btnTeal,
                      background: C.lgray,
                      color: C.slate,
                    }}
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>

            <div style={cardStyle()}>
              <div style={labelStyle}>Contact</div>
              <div style={{ fontSize: 13, color: C.navy, marginBottom: 8 }}>
                <div><span style={labelStyle}>Vertical</span> {contact.vertical ?? 'None'}</div>
                {contact.email && (
                  <div style={{ marginTop: 6 }}>
                    <a href={`mailto:${contact.email}`} style={{ color: C.teal }}>
                      {contact.email}
                    </a>
                  </div>
                )}
                {contact.phone && <div style={{ marginTop: 4 }}>{contact.phone}</div>}
                {contact.linkedin && (
                  <div style={{ marginTop: 4 }}>
                    <a href={contact.linkedin.startsWith('http') ? contact.linkedin : `https://${contact.linkedin}`} target="_blank" rel="noreferrer" style={{ color: C.teal }}>
                      LinkedIn
                    </a>
                  </div>
                )}
              </div>
              <div style={labelStyle}>Next meeting (calendar)</div>
              <div style={{ fontSize: 13, color: C.navy }}>
                {nextMeeting?.start_time
                  ? `${nextMeeting.title ?? 'Meeting'} · ${nextMeeting.start_time}`
                  : 'No upcoming event linked'}
              </div>
              <div style={labelStyle}>Days in current stage (since last update)</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.navy }}>
                {daysShown} days
              </div>
            </div>

            <div style={cardStyle()}>
              <div style={labelStyle}>Pipeline stage</div>
              {editingOverview ? (
                <select
                  value={contact.pipeline_stage}
                  onChange={e => setContact({
                    ...contact,
                    pipeline_stage: e.target.value,
                  })}
                  style={inputBase}
                >
                  {PIPELINE_STAGES.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              ) : (
                <div style={{ fontSize: 14, fontWeight: 600, color: C.navy }}>
                  {PIPELINE_STAGES.find(p => p.value === contact.pipeline_stage)?.label ?? contact.pipeline_stage}
                </div>
              )}

              <div style={{ ...labelStyle, marginTop: 12 }}>Tier</div>
              {editingOverview ? (
                <select
                  value={contact.tier}
                  onChange={e => setContact({ ...contact, tier: e.target.value })}
                  style={inputBase}
                >
                  {TIERS.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              ) : (
                <span style={{
                  display: 'inline-block',
                  padding: '6px 12px',
                  borderRadius: 20,
                  background: TIERS.find(t => t.value === contact.tier)?.color ?? C.teal,
                  color: C.white,
                  fontSize: 12,
                  fontWeight: 700,
                }}>
                  {TIERS.find(t => t.value === contact.tier)?.label ?? contact.tier}
                </span>
              )}

              <div style={{ ...labelStyle, marginTop: 12 }}>Health</div>
              {editingOverview ? (
                <select
                  value={contact.health_score}
                  onChange={e => setContact({
                    ...contact,
                    health_score: e.target.value,
                  })}
                  style={inputBase}
                >
                  {HEALTH_SCORES.map(h => (
                    <option key={h.value} value={h.value}>{h.label}</option>
                  ))}
                </select>
              ) : (
                <span style={{
                  display: 'inline-block',
                  padding: '6px 14px',
                  borderRadius: 20,
                  background: HEALTH_SCORES.find(h => h.value === contact.health_score)?.color ?? C.green,
                  color: C.white,
                  fontSize: 12,
                  fontWeight: 700,
                }}>
                  {HEALTH_SCORES.find(h => h.value === contact.health_score)?.label ?? contact.health_score}
                </span>
              )}

              <div style={{ ...labelStyle, marginTop: 12 }}>Monthly revenue ($)</div>
              {editingOverview ? (
                <input
                  type="number"
                  value={contact.mrr}
                  onChange={e => setContact({
                    ...contact,
                    mrr: parseFloat(e.target.value) || 0,
                  })}
                  style={inputBase}
                />
              ) : (
                <div style={{ fontSize: 18, fontWeight: 700, color: C.navy }}>
                  {formatMoney(contact.mrr)}
                </div>
              )}

              {[
                ['Next action', 'next_action', 'text'],
                ['Next action date', 'next_action_date', 'date'],
                ['Last contact', 'last_contact', 'date'],
                ['Proposal sent', 'proposal_sent_date', 'date'],
                ['Contract signed', 'contract_signed_date', 'date'],
                ['Build start', 'build_start_date', 'date'],
                ['Go live', 'go_live_date', 'date'],
              ].map(([lab, key, typ]) => (
                <div key={key} style={{ marginTop: 12 }}>
                  <div style={labelStyle}>{lab}</div>
                  {editingOverview ? (
                    <input
                      type={typ as 'text' | 'date'}
                      value={String(
                        (contact as unknown as Record<string, string | null>)[key] ?? ''
                      )}
                      onChange={e => setContact({
                        ...contact,
                        [key]: e.target.value || null,
                      } as Contact)}
                      style={inputBase}
                    />
                  ) : (
                    <div style={{ fontSize: 13, color: C.navy }}>
                      {(contact as unknown as Record<string, string | null>)[key] ?? ''}
                    </div>
                  )}
                </div>
              ))}

              <div style={{ marginTop: 12 }}>
                <div style={labelStyle}>Notes</div>
                {editingOverview ? (
                  <textarea
                    rows={4}
                    value={contact.notes ?? ''}
                    onChange={e => setContact({
                      ...contact,
                      notes: e.target.value || null,
                    })}
                    style={{ ...inputBase, resize: 'vertical', minHeight: 72 }}
                  />
                ) : (
                  <div style={{ fontSize: 13, color: C.navy, lineHeight: 1.5 }}>
                    {contact.notes ?? ''}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'meetings' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
              <button
                type="button"
                style={btnTeal}
                onClick={() => setShowMeetingForm(!showMeetingForm)}
              >
                Add meeting
              </button>
            </div>
            {showMeetingForm && (
              <div style={cardStyle()}>
                <div style={labelStyle}>New meeting</div>
                <input
                  type="date"
                  value={meetingForm.meeting_date}
                  onChange={e => setMeetingForm({ ...meetingForm, meeting_date: e.target.value })}
                  style={{ ...inputBase, marginBottom: 8 }}
                />
                <select
                  value={meetingForm.meeting_type}
                  onChange={e => setMeetingForm({ ...meetingForm, meeting_type: e.target.value })}
                  style={{ ...inputBase, marginBottom: 8 }}
                >
                  {MEETING_TYPES.map(mt => (
                    <option key={mt} value={mt}>{mt}</option>
                  ))}
                </select>
                <input
                  placeholder="Outcome"
                  value={meetingForm.outcome}
                  onChange={e => setMeetingForm({ ...meetingForm, outcome: e.target.value })}
                  style={{ ...inputBase, marginBottom: 8 }}
                />
                <textarea
                  placeholder="Notes"
                  value={meetingForm.notes}
                  onChange={e => setMeetingForm({ ...meetingForm, notes: e.target.value })}
                  style={{ ...inputBase, marginBottom: 8 }}
                  rows={3}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" style={btnTeal} onClick={addMeeting}>Save meeting</button>
                  <button type="button" onClick={() => setShowMeetingForm(false)} style={{ ...btnTeal, background: C.lgray, color: C.slate }}>Cancel</button>
                </div>
              </div>
            )}
            {meetings.map(m => {
              const exp = expandedMeetingId === m.meeting_id;
              return (
                <div key={m.meeting_id} style={cardStyle()}>
                  <div style={{
                    fontFamily: 'Georgia, serif',
                    fontSize: 16,
                    color: C.navy,
                    fontWeight: 700,
                  }}>
                    {m.meeting_date ?? 'No date'}
                  </div>
                  <div style={{
                    fontFamily: 'Courier New, monospace',
                    fontSize: 11,
                    color: C.slate,
                    marginTop: 4,
                  }}>
                    {m.meeting_type}
                  </div>
                  {m.outcome && <div style={{ marginTop: 6, fontSize: 13 }}>{m.outcome}</div>}
                  {m.notes && <div style={{ marginTop: 6, fontSize: 12, color: C.slate }}>{m.notes}</div>}
                  <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                    {(['prep_completed', 'summary_generated', 'followup_sent'] as const).map(field => {
                      const on = m[field] === 1;
                      const label = field === 'prep_completed' ? 'Prep' : field === 'summary_generated' ? 'Summary' : 'Follow-up';
                      return (
                        <button
                          key={field}
                          type="button"
                          onClick={() => updateMeeting(m.meeting_id, {
                            [field]: on ? 0 : 1,
                          })}
                          style={{
                            padding: '6px 10px',
                            borderRadius: 8,
                            border: 'none',
                            fontSize: 11,
                            cursor: 'pointer',
                            background: on
                              ? (field === 'prep_completed' ? C.green : C.teal)
                              : C.lgray,
                            color: on ? C.white : C.slate,
                          }}
                        >
                          {label}{on ? ' ✓' : ''}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={() => setExpandedMeetingId(exp ? null : m.meeting_id)}
                    style={{ ...btnTeal, marginTop: 10, fontSize: 11 }}
                  >
                    {exp ? 'Collapse' : 'Expand transcript'}
                  </button>
                  {exp && (
                    <div style={{ marginTop: 12 }}>
                      <textarea
                        placeholder="Paste meeting transcript here"
                        value={m.transcript_text ?? ''}
                        onChange={e => {
                          const v = e.target.value;
                          setMeetings(prev => prev.map(x =>
                            x.meeting_id === m.meeting_id
                              ? { ...x, transcript_text: v }
                              : x
                          ));
                        }}
                        style={{ ...inputBase, minHeight: 120, marginBottom: 8 }}
                      />
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        <button
                          type="button"
                          style={btnTeal}
                          onClick={async () => {
                            const text = m.transcript_text ?? '';
                            if (!text.trim()) return;
                            await enqueueJob('meeting_summary', text, contactId);
                            setQueueHint('Added to job queue');
                            setTimeout(() => setQueueHint(''), 3000);
                          }}
                        >
                          Run meeting summary
                        </button>
                        <button
                          type="button"
                          style={btnTeal}
                          onClick={async () => {
                            const text = m.transcript_text ?? '';
                            if (!text.trim()) return;
                            await enqueueJob('pain_extractor', text, contactId);
                            setQueueHint('Added to job queue');
                            setTimeout(() => setQueueHint(''), 3000);
                          }}
                        >
                          Run pain point extractor
                        </button>
                        <button
                          type="button"
                          onClick={() => saveMeetingTranscript(m.meeting_id, m.transcript_text ?? '')}
                          style={{ ...btnTeal, background: C.lgray, color: C.slate }}
                        >
                          Save transcript
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'documents' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
              <button type="button" style={btnTeal} onClick={() => { setShowDocForm(true); setEditingDocId(null); }}>
                Add document
              </button>
            </div>
            {showDocForm && !editingDocId && (
              <div style={cardStyle()}>
                <div style={labelStyle}>New document</div>
                <select value={docForm.document_type} onChange={e => setDocForm({ ...docForm, document_type: e.target.value })} style={{ ...inputBase, marginBottom: 8 }}>
                  {DOCUMENT_TYPES.map(dt => <option key={dt} value={dt}>{dt}</option>)}
                </select>
                <input placeholder="Title" value={docForm.title} onChange={e => setDocForm({ ...docForm, title: e.target.value })} style={{ ...inputBase, marginBottom: 8 }} />
                <select value={docForm.status} onChange={e => setDocForm({ ...docForm, status: e.target.value })} style={{ ...inputBase, marginBottom: 8 }}>
                  {DOC_STATUSES.map(ds => <option key={ds} value={ds}>{ds}</option>)}
                </select>
                <input type="number" placeholder="Value" value={docForm.value} onChange={e => setDocForm({ ...docForm, value: e.target.value })} style={{ ...inputBase, marginBottom: 8 }} />
                <input type="date" value={docForm.sent_date} onChange={e => setDocForm({ ...docForm, sent_date: e.target.value })} style={{ ...inputBase, marginBottom: 8 }} />
                <input type="date" value={docForm.signed_date} onChange={e => setDocForm({ ...docForm, signed_date: e.target.value })} style={{ ...inputBase, marginBottom: 8 }} />
                <textarea value={docForm.notes} onChange={e => setDocForm({ ...docForm, notes: e.target.value })} style={{ ...inputBase, marginBottom: 8 }} rows={3} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" style={btnTeal} onClick={addDocument}>Save document</button>
                  <button type="button" onClick={() => setShowDocForm(false)} style={{ ...btnTeal, background: C.lgray, color: C.slate }}>Cancel</button>
                </div>
              </div>
            )}
            {documents.map(doc => {
              const statusBg: Record<string, string> = {
                draft: C.slate,
                sent: C.gold,
                signed: C.teal,
                paid: C.green,
                rejected: C.coral,
              };
              const edit = editingDocId === doc.document_id;
              return (
                <div key={doc.document_id} style={cardStyle()}>
                  {!edit ? (
                    <>
                      <div style={{ fontWeight: 700, color: C.navy, fontSize: 15 }}>{doc.title ?? 'Untitled'}</div>
                      <span style={{ fontFamily: 'Courier New, monospace', fontSize: 10, color: C.slate }}>{doc.document_type}</span>
                      <span style={{
                        marginLeft: 8,
                        padding: '4px 10px',
                        borderRadius: 20,
                        background: statusBg[doc.status] ?? C.slate,
                        color: C.white,
                        fontSize: 11,
                      }}>
                        {doc.status}
                      </span>
                      {doc.value > 0 && <div style={{ marginTop: 6 }}>{formatMoney(doc.value)}</div>}
                      {doc.sent_date && <div style={{ fontSize: 12, marginTop: 4 }}>Sent: {doc.sent_date}</div>}
                      {doc.signed_date && <div style={{ fontSize: 12 }}>Signed: {doc.signed_date}</div>}
                      {doc.notes && <div style={{ marginTop: 6, fontSize: 12 }}>{doc.notes}</div>}
                      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                        <button type="button" style={btnTeal} onClick={() => { setEditingDocId(doc.document_id); setShowDocForm(false); }}>Edit</button>
                        <button type="button" style={{ ...btnTeal, background: C.coral }} onClick={() => deleteDocument(doc.document_id)}>Delete</button>
                      </div>
                    </>
                  ) : (
                    <DocEditForm
                      doc={doc}
                      onSave={updateDocument}
                      onCancel={() => setEditingDocId(null)}
                      inputBase={inputBase}
                      btnTeal={btnTeal}
                      C={C}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'content' && (
          <div>
            <div style={labelStyle}>Content</div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
              <button type="button" style={btnTeal} onClick={() => setShowContentForm(true)}>Add content</button>
            </div>
            {showContentForm && (
              <div style={cardStyle()}>
                <select value={contentForm.content_type} onChange={e => setContentForm({ ...contentForm, content_type: e.target.value })} style={{ ...inputBase, marginBottom: 8 }}>
                  {['blog', 'linkedin', 'bni_pitch', 'workshop', 'paper_reference'].map(x => (
                    <option key={x} value={x}>{x}</option>
                  ))}
                </select>
                <input placeholder="Title" value={contentForm.title} onChange={e => setContentForm({ ...contentForm, title: e.target.value })} style={{ ...inputBase, marginBottom: 8 }} />
                <select value={contentForm.status} onChange={e => setContentForm({ ...contentForm, status: e.target.value })} style={{ ...inputBase, marginBottom: 8 }}>
                  {['not_started', 'in_progress', 'done', 'published'].map(x => (
                    <option key={x} value={x}>{x}</option>
                  ))}
                </select>
                <textarea value={contentForm.notes} onChange={e => setContentForm({ ...contentForm, notes: e.target.value })} style={{ ...inputBase, marginBottom: 8 }} rows={3} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" style={btnTeal} onClick={addContentRow}>Save</button>
                  <button type="button" onClick={() => setShowContentForm(false)} style={{ ...btnTeal, background: C.lgray, color: C.slate }}>Cancel</button>
                </div>
              </div>
            )}
            {contentItems.map(row => (
              <ContentRowEditor
                key={row.content_id}
                row={row}
                editingContentId={editingContentId}
                setEditingContentId={setEditingContentId}
                updateContentRow={updateContentRow}
                deleteContentRow={deleteContentRow}
                inputBase={inputBase}
                btnTeal={btnTeal}
                C={C}
              />
            ))}

            <div style={{ ...labelStyle, marginTop: 24 }}>Testimonials</div>
            {!testimonial ? (
              <button type="button" style={btnTeal} onClick={requestTestimonial}>
                Request testimonial
              </button>
            ) : (
              <div style={cardStyle()}>
                {testimonial.request_sent === 1 && (
                  <div style={{ fontSize: 12, color: C.slate, marginBottom: 8 }}>Request sent</div>
                )}
                {testimonial.received_date && (
                  <div style={{ fontSize: 12, marginBottom: 8 }}>Received: {testimonial.received_date}</div>
                )}
                <textarea
                  placeholder="Testimonial text"
                  value={testimonial.testimonial_text ?? ''}
                  onChange={e => setTestimonial({
                    ...testimonial,
                    testimonial_text: e.target.value,
                  })}
                  style={{ ...inputBase, minHeight: 80, marginBottom: 8 }}
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 8 }}>
                  <input
                    type="checkbox"
                    checked={testimonial.published === 1}
                    onChange={e => setTestimonial({
                      ...testimonial,
                      published: e.target.checked ? 1 : 0,
                    })}
                  />
                  Published
                </label>
                <input
                  placeholder="Published where"
                  value={testimonial.published_where ?? ''}
                  onChange={e => setTestimonial({
                    ...testimonial,
                    published_where: e.target.value || null,
                  })}
                  style={{ ...inputBase, marginBottom: 8 }}
                />
                <button type="button" style={btnTeal} onClick={saveTestimonial}>Save testimonial</button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'financial' && (
          <FinancialTab
            financial={financial}
            ensureFinancial={ensureFinancial}
            saveFinancial={saveFinancial}
            jobPricing={jobPricing}
            showJobForm={showJobForm}
            setShowJobForm={setShowJobForm}
            jobForm={jobForm}
            setJobForm={setJobForm}
            addJobPricing={addJobPricing}
            updateJobRow={updateJobRow}
            deleteJobRow={deleteJobRow}
            totalSuggested={totalSuggested}
            totalOffered={totalOffered}
            revenueDisplay={revenueDisplay}
            reminders={reminders}
            showReminderForm={showReminderForm}
            setShowReminderForm={setShowReminderForm}
            reminderForm={reminderForm}
            setReminderForm={setReminderForm}
            addReminder={addReminder}
            dismissReminder={dismissReminder}
            showCompletedReminders={showCompletedReminders}
            setShowCompletedReminders={setShowCompletedReminders}
            inputBase={inputBase}
            btnTeal={btnTeal}
            C={C}
            formatMoney={formatMoney}
          />
        )}
      </div>
    </div>
  );
}

function DocEditForm({
  doc,
  onSave,
  onCancel,
  inputBase,
  btnTeal,
  C,
}: {
  doc: ClientDocument;
  onSave: (d: ClientDocument) => void;
  onCancel: () => void;
  inputBase: React.CSSProperties;
  btnTeal: React.CSSProperties;
  C: Record<string, string>;
}) {
  const [d, setD] = useState(doc);
  return (
    <>
      <select value={d.document_type} onChange={e => setD({ ...d, document_type: e.target.value })} style={{ ...inputBase, marginBottom: 8 }}>
        {DOCUMENT_TYPES.map(dt => <option key={dt} value={dt}>{dt}</option>)}
      </select>
      <input value={d.title ?? ''} onChange={e => setD({ ...d, title: e.target.value })} style={{ ...inputBase, marginBottom: 8 }} />
      <select value={d.status} onChange={e => setD({ ...d, status: e.target.value })} style={{ ...inputBase, marginBottom: 8 }}>
        {DOC_STATUSES.map(ds => <option key={ds} value={ds}>{ds}</option>)}
      </select>
      <input type="number" value={d.value} onChange={e => setD({ ...d, value: parseFloat(e.target.value) || 0 })} style={{ ...inputBase, marginBottom: 8 }} />
      <input type="date" value={d.sent_date ?? ''} onChange={e => setD({ ...d, sent_date: e.target.value || null })} style={{ ...inputBase, marginBottom: 8 }} />
      <input type="date" value={d.signed_date ?? ''} onChange={e => setD({ ...d, signed_date: e.target.value || null })} style={{ ...inputBase, marginBottom: 8 }} />
      <textarea value={d.notes ?? ''} onChange={e => setD({ ...d, notes: e.target.value || null })} style={{ ...inputBase, marginBottom: 8 }} rows={3} />
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" style={btnTeal} onClick={() => onSave(d)}>Save</button>
        <button type="button" onClick={onCancel} style={{ ...btnTeal, background: C.lgray, color: C.slate }}>Cancel</button>
      </div>
    </>
  );
}

function ContentRowEditor({
  row,
  editingContentId,
  setEditingContentId,
  updateContentRow,
  deleteContentRow,
  inputBase,
  btnTeal,
  C,
}: {
  row: ClientContentRow;
  editingContentId: string | null;
  setEditingContentId: (id: string | null) => void;
  updateContentRow: (r: ClientContentRow) => void;
  deleteContentRow: (id: string) => void;
  inputBase: React.CSSProperties;
  btnTeal: React.CSSProperties;
  C: Record<string, string>;
}) {
  const [local, setLocal] = useState(row);
  const edit = editingContentId === row.content_id;
  if (edit) {
    return (
      <div style={cardStyle()}>
        <select value={local.content_type} onChange={e => setLocal({ ...local, content_type: e.target.value })} style={{ ...inputBase, marginBottom: 8 }}>
          {['blog', 'linkedin', 'bni_pitch', 'workshop', 'paper_reference'].map(x => (
            <option key={x} value={x}>{x}</option>
          ))}
        </select>
        <input value={local.title ?? ''} onChange={e => setLocal({ ...local, title: e.target.value })} style={{ ...inputBase, marginBottom: 8 }} />
        <select value={local.status} onChange={e => setLocal({ ...local, status: e.target.value })} style={{ ...inputBase, marginBottom: 8 }}>
          {['not_started', 'in_progress', 'done', 'published'].map(x => (
            <option key={x} value={x}>{x}</option>
          ))}
        </select>
        <textarea value={local.notes ?? ''} onChange={e => setLocal({ ...local, notes: e.target.value })} style={{ ...inputBase, marginBottom: 8 }} rows={2} />
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" style={btnTeal} onClick={() => updateContentRow(local)}>Save</button>
          <button type="button" onClick={() => setEditingContentId(null)} style={{ ...btnTeal, background: C.lgray, color: C.slate }}>Cancel</button>
        </div>
      </div>
    );
  }
  return (
    <div style={cardStyle()}>
      <div style={{ fontWeight: 700, color: C.navy }}>{local.title ?? 'Untitled'}</div>
      <span style={{ fontFamily: 'Courier New, monospace', fontSize: 10, color: C.slate }}>{local.content_type}</span>
      <span style={{ marginLeft: 8, fontSize: 11, padding: '3px 8px', background: C.lgray, borderRadius: 12 }}>{local.status}</span>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button type="button" style={btnTeal} onClick={() => { setLocal(row); setEditingContentId(row.content_id); }}>Edit</button>
        <button type="button" style={{ ...btnTeal, background: C.coral }} onClick={() => deleteContentRow(row.content_id)}>Delete</button>
      </div>
    </div>
  );
}

function FinancialTab({
  financial,
  ensureFinancial,
  saveFinancial,
  jobPricing,
  showJobForm,
  setShowJobForm,
  jobForm,
  setJobForm,
  addJobPricing,
  updateJobRow,
  deleteJobRow,
  totalSuggested,
  totalOffered,
  revenueDisplay,
  reminders,
  showReminderForm,
  setShowReminderForm,
  reminderForm,
  setReminderForm,
  addReminder,
  dismissReminder,
  showCompletedReminders,
  setShowCompletedReminders,
  inputBase,
  btnTeal,
  C,
  formatMoney,
}: {
  financial: ClientFinancial | null;
  ensureFinancial: () => Promise<ClientFinancial>;
  saveFinancial: (p: Partial<ClientFinancial> & { retainer_billing_date?: string }) => Promise<void>;
  jobPricing: JobPricing[];
  showJobForm: boolean;
  setShowJobForm: (v: boolean) => void;
  jobForm: { job_name: string; suggested_price: string; offered_price: string; included: number };
  setJobForm: React.Dispatch<React.SetStateAction<typeof jobForm>>;
  addJobPricing: () => Promise<void>;
  updateJobRow: (r: JobPricing) => Promise<void>;
  deleteJobRow: (id: string) => Promise<void>;
  totalSuggested: number;
  totalOffered: number;
  revenueDisplay: number;
  reminders: ClientReminder[];
  showReminderForm: boolean;
  setShowReminderForm: (v: boolean) => void;
  reminderForm: { message: string; reminder_date: string; priority: string; recurring: boolean; recurring_days: string };
  setReminderForm: React.Dispatch<React.SetStateAction<typeof reminderForm>>;
  addReminder: () => Promise<void>;
  dismissReminder: (id: string) => Promise<void>;
  showCompletedReminders: boolean;
  setShowCompletedReminders: (v: boolean) => void;
  inputBase: React.CSSProperties;
  btnTeal: React.CSSProperties;
  C: Record<string, string>;
  formatMoney: (n: number) => string;
}) {
  const [localFin, setLocalFin] = useState<ClientFinancial | null>(financial);
  useEffect(() => { setLocalFin(financial); }, [financial]);

  const f = localFin;

  const activeRem = reminders.filter(r => r.completed === 0);
  const doneRem = reminders.filter(r => r.completed === 1);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <div style={cardStyle()}>
        <div style={labelStyle}>Pricing model</div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
          <label style={{ fontSize: 13 }}>
            <input
              type="radio"
              name="pm"
              checked={(f?.pricing_model ?? 'per_job') === 'per_job'}
              onChange={() => {
                void ensureFinancial().then(nf => {
                  setLocalFin({ ...nf, pricing_model: 'per_job', retainer_active: 0 });
                  void saveFinancial({ pricing_model: 'per_job', retainer_active: 0 });
                });
              }}
            />
            {' '}Per-job
          </label>
          <label style={{ fontSize: 13 }}>
            <input
              type="radio"
              name="pm"
              checked={(f?.retainer_active ?? 0) === 1}
              onChange={() => {
                void ensureFinancial().then(nf => {
                  setLocalFin({ ...nf, pricing_model: 'retainer', retainer_active: 1 });
                  void saveFinancial({ pricing_model: 'retainer', retainer_active: 1 });
                });
              }}
            />
            {' '}Retainer
          </label>
        </div>
        {(f?.retainer_active ?? 0) === 1 && (
          <>
            <div style={labelStyle}>Retainer amount ($)</div>
            <input
              type="number"
              value={f?.retainer_amount ?? 0}
              onChange={e => setLocalFin(prev => prev
                ? { ...prev, retainer_amount: parseFloat(e.target.value) || 0 }
                : prev)}
              style={{ ...inputBase, marginBottom: 8 }}
            />
            <div style={labelStyle}>Billing date</div>
            <input
              type="date"
              value={(f as { retainer_billing_date?: string })?.retainer_billing_date ?? ''}
              onChange={e => setLocalFin(prev => prev
                ? { ...prev, retainer_billing_date: e.target.value } as ClientFinancial & { retainer_billing_date?: string }
                : prev)}
              style={{ ...inputBase, marginBottom: 8 }}
            />
            <button
              type="button"
              style={btnTeal}
              onClick={() => f && saveFinancial({
                retainer_amount: f.retainer_amount,
                retainer_active: 1,
                pricing_model: 'retainer',
                retainer_billing_date: (f as { retainer_billing_date?: string }).retainer_billing_date,
              })}
            >
              Save retainer
            </button>
          </>
        )}
      </div>

      <div style={cardStyle()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={labelStyle}>Jobs in this engagement</div>
          <button type="button" style={btnTeal} onClick={() => setShowJobForm(true)}>Add job</button>
        </div>
        {showJobForm && (
          <div style={{ marginTop: 12, padding: 12, background: C.lgray, borderRadius: 8 }}>
            <input placeholder="Job name" value={jobForm.job_name} onChange={e => setJobForm({ ...jobForm, job_name: e.target.value })} style={{ ...inputBase, marginBottom: 8 }} />
            <input type="number" placeholder="Suggested" value={jobForm.suggested_price} onChange={e => setJobForm({ ...jobForm, suggested_price: e.target.value })} style={{ ...inputBase, marginBottom: 8 }} />
            <input type="number" placeholder="Offered" value={jobForm.offered_price} onChange={e => setJobForm({ ...jobForm, offered_price: e.target.value })} style={{ ...inputBase, marginBottom: 8 }} />
            <label style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>
              <input type="checkbox" checked={jobForm.included === 1} onChange={e => setJobForm({ ...jobForm, included: e.target.checked ? 1 : 0 })} />
              {' '}Included
            </label>
            <button type="button" style={btnTeal} onClick={() => addJobPricing()}>Save job</button>
          </div>
        )}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12, fontSize: 12 }}>
          <thead>
            <tr style={{ background: C.lgray }}>
              <th style={{ textAlign: 'left', padding: 8 }}>Job</th>
              <th style={{ textAlign: 'right', padding: 8 }}>Suggested</th>
              <th style={{ textAlign: 'right', padding: 8 }}>Offered</th>
              <th style={{ padding: 8 }}>Incl.</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {jobPricing.map(j => (
              <JobPricingRow
                key={j.pricing_id}
                j={j}
                updateJobRow={updateJobRow}
                deleteJobRow={deleteJobRow}
                inputBase={inputBase}
                C={C}
              />
            ))}
            <tr>
              <td style={{ padding: 8, fontWeight: 700 }}>Totals</td>
              <td style={{ padding: 8, textAlign: 'right' }}>{formatMoney(totalSuggested)}</td>
              <td style={{ padding: 8, textAlign: 'right', color: C.teal, fontWeight: 700 }}>{formatMoney(totalOffered)}</td>
              <td colSpan={2} />
            </tr>
          </tbody>
        </table>
        {totalOffered < totalSuggested && (
          <div style={{ fontSize: 12, color: C.green, marginTop: 8 }}>
            Savings vs suggested: {formatMoney(totalSuggested - totalOffered)}
          </div>
        )}
      </div>

      <div style={cardStyle()}>
        <div style={labelStyle}>Build fee</div>
        <input
          type="number"
          value={f?.build_fee ?? 0}
          onChange={e => setLocalFin(prev => prev
            ? { ...prev, build_fee: parseFloat(e.target.value) || 0 }
            : prev)}
          style={{ ...inputBase, marginBottom: 8 }}
        />
        <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <input
            type="checkbox"
            checked={(f?.build_fee_paid ?? 0) === 1}
            onChange={e => setLocalFin(prev => prev
              ? { ...prev, build_fee_paid: e.target.checked ? 1 : 0 }
              : prev)}
          />
          Build fee paid
        </label>
        {(f?.build_fee_paid ?? 0) === 1 && (
          <div style={{ display: 'inline-block', padding: '6px 12px', background: C.green, color: C.white, borderRadius: 20, fontSize: 11, marginBottom: 8 }}>
            Paid
          </div>
        )}
        <button
          type="button"
          style={btnTeal}
          onClick={() => f && saveFinancial({
            build_fee: f.build_fee,
            build_fee_paid: f.build_fee_paid,
          })}
        >
          Save build fee
        </button>
      </div>

      <div style={cardStyle()}>
        <div style={labelStyle}>Total revenue (display)</div>
        <div style={{ fontFamily: 'Georgia, serif', fontSize: 28, color: C.navy, fontWeight: 800 }}>
          {formatMoney(revenueDisplay)}
        </div>
      </div>

      <div style={cardStyle()}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div style={labelStyle}>Reminders and follow-ups</div>
          <button type="button" style={btnTeal} onClick={() => setShowReminderForm(true)}>Add reminder</button>
        </div>
        {showReminderForm && (
          <div style={{ marginTop: 12, padding: 12, background: C.lgray, borderRadius: 8 }}>
            <input placeholder="Message" value={reminderForm.message} onChange={e => setReminderForm({ ...reminderForm, message: e.target.value })} style={{ ...inputBase, marginBottom: 8 }} />
            <input type="date" value={reminderForm.reminder_date} onChange={e => setReminderForm({ ...reminderForm, reminder_date: e.target.value })} style={{ ...inputBase, marginBottom: 8 }} />
            <select value={reminderForm.priority} onChange={e => setReminderForm({ ...reminderForm, priority: e.target.value })} style={{ ...inputBase, marginBottom: 8 }}>
              <option value="normal">normal</option>
              <option value="high">high</option>
              <option value="urgent">urgent</option>
            </select>
            <label style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>
              <input type="checkbox" checked={reminderForm.recurring} onChange={e => setReminderForm({ ...reminderForm, recurring: e.target.checked })} />
              {' '}Recurring
            </label>
            {reminderForm.recurring && (
              <input type="number" placeholder="Every X days" value={reminderForm.recurring_days} onChange={e => setReminderForm({ ...reminderForm, recurring_days: e.target.value })} style={{ ...inputBase, marginBottom: 8 }} />
            )}
            <button type="button" style={btnTeal} onClick={() => addReminder()}>Save reminder</button>
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingTop: 12, flexWrap: 'nowrap' }}>
          {(showCompletedReminders ? reminders : activeRem).map(r => {
            const due = r.reminder_date <= today;
            const bg = due ? C.coral : C.gold;
            return (
              <div
                key={r.reminder_id}
                style={{
                  flex: '0 0 auto',
                  background: bg,
                  color: C.white,
                  borderRadius: 20,
                  padding: '10px 14px',
                  fontSize: 12,
                  maxWidth: 260,
                  position: 'relative',
                  paddingRight: 28,
                }}
              >
                {r.message} · {r.reminder_date}
                <button
                  type="button"
                  onClick={() => dismissReminder(r.reminder_id)}
                  style={{
                    position: 'absolute',
                    top: 6,
                    right: 8,
                    border: 'none',
                    background: 'transparent',
                    color: C.white,
                    cursor: 'pointer',
                    fontSize: 14,
                  }}
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
        <label style={{ fontSize: 12, marginTop: 12, display: 'block' }}>
          <input type="checkbox" checked={showCompletedReminders} onChange={e => setShowCompletedReminders(e.target.checked)} />
          {' '}Show completed
        </label>
        {showCompletedReminders && doneRem.length > 0 && (
          <div style={{ fontSize: 11, color: C.slate, marginTop: 8 }}>
            {doneRem.length} completed
          </div>
        )}
      </div>
    </div>
  );
}

function JobPricingRow({
  j,
  updateJobRow,
  deleteJobRow,
  inputBase,
  C,
}: {
  j: JobPricing;
  updateJobRow: (r: JobPricing) => void;
  deleteJobRow: (id: string) => void;
  inputBase: React.CSSProperties;
  C: Record<string, string>;
}) {
  const [row, setRow] = useState(j);
  useEffect(() => { setRow(j); }, [j]);
  return (
    <tr>
      <td style={{ padding: 8 }}>
        <input value={row.job_name} onChange={e => setRow({ ...row, job_name: e.target.value })} style={{ ...inputBase, width: '100%' }} />
      </td>
      <td style={{ padding: 8 }}>
        <input type="number" value={row.suggested_price} onChange={e => setRow({ ...row, suggested_price: parseFloat(e.target.value) || 0 })} style={{ ...inputBase, width: 96, textAlign: 'right' }} />
      </td>
      <td style={{ padding: 8 }}>
        <input type="number" value={row.offered_price} onChange={e => setRow({ ...row, offered_price: parseFloat(e.target.value) || 0 })} style={{ ...inputBase, width: 96, textAlign: 'right' }} />
      </td>
      <td style={{ padding: 8, textAlign: 'center' }}>
        <input type="checkbox" checked={row.included === 1} onChange={e => setRow({ ...row, included: e.target.checked ? 1 : 0 })} />
      </td>
      <td style={{ padding: 8 }}>
        <button type="button" style={{ fontSize: 10, padding: '4px 8px', cursor: 'pointer' }} onClick={() => updateJobRow(row)}>Save</button>
        <button type="button" style={{ fontSize: 10, marginLeft: 4, color: C.coral, cursor: 'pointer', border: 'none', background: 'none' }} onClick={() => deleteJobRow(row.pricing_id)}>Del</button>
      </td>
    </tr>
  );
}
