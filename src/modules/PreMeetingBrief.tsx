import {
  useState,
  useEffect,
  useCallback,
} from 'react';
import type { CSSProperties } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { getDb } from '../services/db';
import { v4 as uuidv4 } from 'uuid';
import { enqueueJob } from '../services/jobQueueService';

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

export interface Contact {
  contact_id: string;
  full_name: string;
  company: string | null;
  role: string | null;
  vertical: string | null;
  email: string | null;
  pipeline_stage: string;
  tier: string;
  last_contact: string | null;
  notes: string | null;
  life_context: string | null;
  business_context: string | null;
  communication_style: string | null;
  topics_to_raise: string | null;
  topics_to_avoid: string | null;
  last_meeting_summary: string | null;
}

type ExtractedContext = {
  life_details?: string[];
  business_details?: string[];
  concerns_expressed?: string[];
  topics_discussed?: string[];
  follow_up_items?: string[];
  communication_observations?: string[];
} | null;

const BRIEF_SECTIONS = [
  'WHO THIS PERSON IS',
  'WHAT TO BRING UP',
  'WHAT TO LISTEN FOR',
  'ONE ANALOGY THAT MIGHT LAND',
  'WHAT NOT TO DO',
  'OPEN QUESTIONS',
] as const;

function appendBlock(
  existing: string | null,
  block: string
): string {
  const t = block.trim();
  if (!t) return existing ?? '';
  if (!existing?.trim()) return t;
  return `${existing.trim()}\n\n${t}`;
}

function arrLines(
  label: string,
  items: unknown
): string {
  if (!Array.isArray(items) || items.length === 0) {
    return '';
  }
  const lines = items
    .filter((x): x is string => typeof x === 'string')
    .map(s => s.trim())
    .filter(Boolean);
  if (lines.length === 0) return '';
  return `${label}:\n${lines.map(l => `• ${l}`).join('\n')}`;
}

function parseExtractedJson(
  raw: string
): ExtractedContext {
  const trimmed = raw.trim();
  let jsonStr = trimmed;
  const fence = trimmed.match(
    /```(?:json)?\s*([\s\S]*?)```/
  );
  if (fence) jsonStr = fence[1].trim();
  const start = jsonStr.indexOf('{');
  const end = jsonStr.lastIndexOf('}');
  if (start >= 0 && end > start) {
    jsonStr = jsonStr.slice(start, end + 1);
  }
  try {
    const p = JSON.parse(jsonStr) as Record<
      string,
      unknown
    >;
    return {
      life_details: Array.isArray(p.life_details)
        ? (p.life_details as string[])
        : [],
      business_details: Array.isArray(
        p.business_details
      )
        ? (p.business_details as string[])
        : [],
      concerns_expressed: Array.isArray(
        p.concerns_expressed
      )
        ? (p.concerns_expressed as string[])
        : [],
      topics_discussed: Array.isArray(
        p.topics_discussed
      )
        ? (p.topics_discussed as string[])
        : [],
      follow_up_items: Array.isArray(
        p.follow_up_items
      )
        ? (p.follow_up_items as string[])
        : [],
      communication_observations: Array.isArray(
        p.communication_observations
      )
        ? (p.communication_observations as string[])
        : [],
    };
  } catch {
    return null;
  }
}

function parseBriefSections(
  text: string
): { header: string; body: string }[] {
  const out: { header: string; body: string }[] = [];
  for (let i = 0; i < BRIEF_SECTIONS.length; i++) {
    const h = BRIEF_SECTIONS[i];
    const next = BRIEF_SECTIONS[i + 1];
    const start = text.indexOf(h);
    if (start < 0) continue;
    const bodyStart = start + h.length;
    const end = next
      ? text.indexOf(next, bodyStart)
      : text.length;
    const body =
      end < 0
        ? text.slice(bodyStart).trim()
        : text.slice(bodyStart, end).trim();
    out.push({ header: h, body });
  }
  return out;
}

function tierPillStyle(tier: string): CSSProperties {
  const t = (tier || '').toLowerCase();
  let bg = C.slate;
  if (t.includes('spark')) bg = C.gold;
  else if (t.includes('build')) bg = C.teal;
  else if (t.includes('pulse')) bg = C.navy;
  return {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 10,
    fontSize: 9,
    fontFamily: 'Courier New, monospace',
    background: bg,
    color: C.white,
    marginLeft: 6,
  };
}

async function loadPromptAndIdentity(): Promise<{
  system: string;
  userTpl: string;
  version: number;
}> {
  const db = await getDb();
  const prompts = await db.select<
    {
      system_template: string;
      user_template: string;
      version: number;
    }[]
  >(
    `SELECT system_template, user_template, version
     FROM prompts
     WHERE prompt_id = 'p_pre_meeting_brief_v1'
       AND is_active = 1
     LIMIT 1`
  );
  if (prompts.length === 0) {
    throw new Error(
      'Pre-meeting prompt not found'
    );
  }
  const identity = await db.select<
    {
      full_name: string;
      title: string;
      bio_short: string;
    }[]
  >(
    `SELECT full_name, title, bio_short
     FROM identity WHERE id = 'zubia'`
  );
  const identityStr =
    identity.length > 0
      ? `${identity[0].full_name}, ${identity[0].title}. ${identity[0].bio_short ?? ''}`
      : 'Dr. Zubia Mughal, AI Transformation Lead, Dr. Data Decision Intelligence LLC.';
  const system = prompts[0].system_template.replace(
    '{{identity}}',
    identityStr
  );
  return {
    system,
    userTpl: prompts[0].user_template,
    version: prompts[0].version,
  };
}

export function PreMeetingBrief({
  preselectedContactId,
}: {
  preselectedContactId?: string;
}) {
  const [contacts, setContacts] = useState<
    Contact[]
  >([]);
  const [selectedContactId, setSelectedContactId] =
    useState('');
  const [selectedContact, setSelectedContact] =
    useState<Contact | null>(null);
  const [transcript, setTranscript] = useState('');
  const [extractedContext, setExtractedContext] =
    useState<ExtractedContext>(null);
  const [extracting, setExtracting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [briefOutput, setBriefOutput] = useState('');
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [saved, setSaved] = useState(false);
  const [transcriptExtractedOk, setTranscriptExtractedOk] =
    useState(false);
  const [newProspectMode, setNewProspectMode] =
    useState(false);
  const [newProspectName, setNewProspectName] =
    useState('');
  const [newProspectCompany, setNewProspectCompany] =
    useState('');
  const [newProspectRole, setNewProspectRole] =
    useState('');
  const [newProspectConnection, setNewProspectConnection] =
    useState('');
  const [newProspectNotes, setNewProspectNotes] =
    useState('');
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState('');

  const [lifeContext, setLifeContext] = useState('');
  const [businessContext, setBusinessContext] =
    useState('');
  const [communicationStyle, setCommunicationStyle] =
    useState('');
  const [topicsRaise, setTopicsRaise] = useState('');
  const [topicsAvoid, setTopicsAvoid] = useState('');
  const [lastMeetingSummary, setLastMeetingSummary] =
    useState('');

  const loadContactById = useCallback(
    async (id: string) => {
      if (!id) {
        setSelectedContact(null);
        return;
      }
      const db = await getDb();
      const rows = await db.select<Contact[]>(
        `SELECT contact_id, full_name, company, role,
                vertical, email, pipeline_stage, tier,
                last_contact, notes, life_context,
                business_context, communication_style,
                topics_to_raise, topics_to_avoid,
                last_meeting_summary
         FROM contacts WHERE contact_id = ?`,
        [id]
      );
      const c = rows[0] ?? null;
      setSelectedContact(c);
      if (c) {
        setLifeContext(c.life_context ?? '');
        setBusinessContext(c.business_context ?? '');
        setCommunicationStyle(
          c.communication_style ?? ''
        );
        setTopicsRaise(c.topics_to_raise ?? '');
        setTopicsAvoid(c.topics_to_avoid ?? '');
        setLastMeetingSummary(
          c.last_meeting_summary ?? ''
        );
      }
    },
    []
  );

  const loadContacts = useCallback(async () => {
    setLoading(true);
    try {
      const db = await getDb();
      const list = await db.select<Contact[]>(
        `SELECT contact_id, full_name, company, role,
                vertical, email, pipeline_stage, tier,
                last_contact, notes, life_context,
                business_context, communication_style,
                topics_to_raise, topics_to_avoid,
                last_meeting_summary
         FROM contacts
         ORDER BY full_name ASC`
      );
      setContacts(list);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadContacts();
  }, [loadContacts]);

  useEffect(() => {
    if (
      preselectedContactId &&
      !loading &&
      contacts.length > 0
    ) {
      setSelectedContactId(preselectedContactId);
      void loadContactById(preselectedContactId);
    }
  }, [
    preselectedContactId,
    loading,
    contacts.length,
    loadContactById,
  ]);

  useEffect(() => {
    if (selectedContact) {
      setLifeContext(selectedContact.life_context ?? '');
      setBusinessContext(
        selectedContact.business_context ?? ''
      );
      setCommunicationStyle(
        selectedContact.communication_style ?? ''
      );
      setTopicsRaise(
        selectedContact.topics_to_raise ?? ''
      );
      setTopicsAvoid(
        selectedContact.topics_to_avoid ?? ''
      );
      setLastMeetingSummary(
        selectedContact.last_meeting_summary ?? ''
      );
    }
  }, [selectedContact?.contact_id]);

  function buildBriefInput(c: Contact | null): string {
    if (!c) {
      return '';
    }
    const ctxCount = [
      c.life_context,
      c.business_context,
      c.communication_style,
      c.topics_to_raise,
      c.topics_to_avoid,
      c.last_meeting_summary,
    ].filter(v => v && String(v).trim()).length;
    void ctxCount;
    return [
      `Contact: ${c.full_name}, ${c.role ?? ''} at ${c.company ?? ''}`.trim(),
      `Vertical: ${c.vertical ?? 'Not set'}`,
      `Pipeline stage: ${c.pipeline_stage ?? 'Not set'}`,
      `Last contact: ${c.last_contact ?? 'Not set'}`,
      '',
      `Life context: ${c.life_context?.trim() || 'Not set'}`,
      `Business context: ${c.business_context?.trim() || 'Not set'}`,
      `Communication style: ${c.communication_style?.trim() || 'Not set'}`,
      `Topics to raise: ${c.topics_to_raise?.trim() || 'Not set'}`,
      `Topics to avoid: ${c.topics_to_avoid?.trim() || 'Not set'}`,
      `Last meeting summary: ${c.last_meeting_summary?.trim() || 'Not set'}`,
      `Notes: ${c.notes?.trim() || 'None'}`,
    ].join('\n');
  }

  function buildBriefInputFromDrafts(
    c: Contact | null
  ): string {
    if (!c) return '';
    const merged: Contact = {
      ...c,
      life_context: lifeContext || null,
      business_context: businessContext || null,
      communication_style: communicationStyle || null,
      topics_to_raise: topicsRaise || null,
      topics_to_avoid: topicsAvoid || null,
      last_meeting_summary: lastMeetingSummary || null,
    };
    return buildBriefInput(merged);
  }

  async function saveContextFields() {
    if (!selectedContactId || !selectedContact) {
      setStatusMsg('Select a contact first');
      return;
    }
    const db = await getDb();
    await db.execute(
      `UPDATE contacts SET
        life_context = ?,
        business_context = ?,
        communication_style = ?,
        topics_to_raise = ?,
        topics_to_avoid = ?,
        last_meeting_summary = ?,
        updated_at = datetime('now')
       WHERE contact_id = ?`,
      [
        lifeContext.trim() || null,
        businessContext.trim() || null,
        communicationStyle.trim() || null,
        topicsRaise.trim() || null,
        topicsAvoid.trim() || null,
        lastMeetingSummary.trim() || null,
        selectedContactId,
      ]
    );
    await db.execute(
      `INSERT INTO audit_log
        (log_id, action, entity_type, entity_id, details)
       VALUES (?, 'context_saved', 'contacts', ?, ?)`,
      [
        uuidv4(),
        selectedContactId,
        'Pre-meeting stored context updated',
      ]
    );
    setStatusMsg('Context saved');
    await loadContactById(selectedContactId);
    await loadContacts();
  }

  async function handleExtractTranscript() {
    if (!transcript.trim()) {
      setStatusMsg('Paste a transcript first');
      return;
    }
    setExtracting(true);
    setStatusMsg('');
    try {
      const system = `You are extracting relationship intelligence from a meeting transcript. Extract and return JSON only with these exact keys: life_details array of strings, business_details array of strings, concerns_expressed array of strings, topics_discussed array of strings, follow_up_items array of strings, communication_observations array of strings. Return JSON only. No preamble. No explanation.`;
      const raw = await invoke<string>(
        'ollama_generate',
        {
          prompt: transcript.trim(),
          system,
        }
      );
      const parsed = parseExtractedJson(raw);
      setExtractedContext(parsed);
      setTranscriptExtractedOk(parsed != null);
    } catch (e) {
      setStatusMsg(String(e));
      setExtractedContext(null);
    } finally {
      setExtracting(false);
    }
  }

  async function mergeExtractedIntoContact() {
    if (
      !extractedContext ||
      !selectedContactId ||
      !selectedContact
    ) {
      return;
    }
    const e = extractedContext;
    let lc = lifeContext;
    let bc = businessContext;
    let tr = topicsRaise;
    let ta = topicsAvoid;
    let lm = lastMeetingSummary;
    let cs = communicationStyle;

    const ld = arrLines('Life details', e.life_details);
    if (ld) lc = appendBlock(lc, ld);
    const bd = arrLines(
      'Business details',
      e.business_details
    );
    if (bd) bc = appendBlock(bc, bd);
    const ce = arrLines(
      'Concerns',
      e.concerns_expressed
    );
    if (ce) bc = appendBlock(bc, ce);
    const td = arrLines(
      'Topics discussed',
      e.topics_discussed
    );
    if (td) tr = appendBlock(tr, td);
    const fu = arrLines(
      'Follow-up items',
      e.follow_up_items
    );
    if (fu) lm = appendBlock(lm, fu);
    const co = arrLines(
      'Communication',
      e.communication_observations
    );
    if (co) cs = appendBlock(cs, co);

    setLifeContext(lc);
    setBusinessContext(bc);
    setTopicsRaise(tr);
    setTopicsAvoid(ta);
    setLastMeetingSummary(lm);
    setCommunicationStyle(cs);

    const db = await getDb();
    await db.execute(
      `UPDATE contacts SET
        life_context = ?,
        business_context = ?,
        communication_style = ?,
        topics_to_raise = ?,
        topics_to_avoid = ?,
        last_meeting_summary = ?,
        updated_at = datetime('now')
       WHERE contact_id = ?`,
      [
        lc.trim() || null,
        bc.trim() || null,
        cs.trim() || null,
        tr.trim() || null,
        ta.trim() || null,
        lm.trim() || null,
        selectedContactId,
      ]
    );
    await db.execute(
      `INSERT INTO audit_log
        (log_id, action, entity_type, entity_id, details)
       VALUES (?, 'context_merged', 'contacts', ?, ?)`,
      [
        uuidv4(),
        selectedContactId,
        'Transcript extraction merged into context',
      ]
    );
    setExtractedContext(null);
    setStatusMsg('Context updated');
    await loadContactById(selectedContactId);
  }

  async function handleGenerateBrief() {
    const c = selectedContact;
    if (!c || !selectedContactId) {
      setStatusMsg('Select a contact first');
      return;
    }
    setGenerating(true);
    setStatusMsg('');
    setSaved(false);
    const inputText = buildBriefInputFromDrafts(c);
    const db = await getDb();
    const queueId = uuidv4();
    const { system, userTpl, version } =
      await loadPromptAndIdentity();
    const userPrompt = userTpl.replace(
      '{{input}}',
      inputText
    );
    try {
      await db.execute(
        `INSERT INTO job_queue
          (queue_id, job_id, contact_id, input_text, status)
         VALUES (?, 'pre_meeting_brief', ?, ?, 'pending')`,
        [queueId, selectedContactId, inputText]
      );
      await db.execute(
        `UPDATE job_queue
         SET status = 'running',
             started_at = datetime('now')
         WHERE queue_id = ?`,
        [queueId]
      );
      const output = await invoke<string>(
        'ollama_generate',
        {
          prompt: userPrompt,
          system,
        }
      );
      await db.execute(
        `UPDATE job_queue
         SET status = 'done',
             output_text = ?,
             completed_at = datetime('now'),
             prompt_version = ?
         WHERE queue_id = ?`,
        [output, version, queueId]
      );
      setBriefOutput(output);
      setStep(4);
    } catch (err) {
      await db.execute(
        `UPDATE job_queue
         SET status = 'failed',
             error_message = ?,
             completed_at = datetime('now')
         WHERE queue_id = ?`,
        [String(err), queueId]
      );
      setStatusMsg(String(err));
    } finally {
      setGenerating(false);
    }
  }

  async function handleNewProspectPersona() {
    const name = newProspectName.trim();
    if (!name) {
      setStatusMsg('Name is required');
      return;
    }
    setStatusMsg('');
    const db = await getDb();
    const id = uuidv4();
    const notesCombined = [
      newProspectConnection.trim(),
      newProspectNotes.trim(),
    ]
      .filter(Boolean)
      .join('\n\n');
    await db.execute(
      `INSERT INTO contacts
        (contact_id, full_name, company, role, notes,
         pipeline_stage, tier)
       VALUES (?, ?, ?, ?, ?, 'prospect', 'pulse')`,
      [
        id,
        name,
        newProspectCompany.trim() || null,
        newProspectRole.trim() || null,
        notesCombined || null,
      ]
    );
    await loadContacts();
    setSelectedContactId(id);
    await loadContactById(id);
    const inputStr =
      'NEW PROSPECT MODE\n' +
      `Name: ${name}\n` +
      `Company: ${newProspectCompany.trim() || 'n/a'}\n` +
      `Role: ${newProspectRole.trim() || 'n/a'}\n` +
      `How connected: ${newProspectConnection.trim() || 'n/a'}\n` +
      `What you already know:\n${newProspectNotes.trim() || 'n/a'}`;
    await enqueueJob('pre_meeting_brief', inputStr, id);
    setNewProspectMode(false);
    setStep(3);
  }

  async function saveToAha() {
    if (!briefOutput.trim() || !selectedContact) {
      return;
    }
    const db = await getDb();
    const ahaId = uuidv4();
    await db.execute(
      `INSERT INTO aha_moments
        (aha_id, raw_input, input_type, key_insight,
         stz_layer, source_title, content_worthy)
       VALUES (?, ?, 'pre_meeting_brief', ?, 3, ?, 0)`,
      [
        ahaId,
        briefOutput.trim(),
        `Pre-Meeting Brief: ${selectedContact.full_name}`,
        'pre_meeting_brief',
      ]
    );
    setSaved(true);
    setStatusMsg('Saved to Aha Moments');
  }

  async function saveToClientMeetings() {
    if (!briefOutput.trim() || !selectedContactId) {
      return;
    }
    const db = await getDb();
    const mid = uuidv4();
    await db.execute(
      `INSERT INTO client_meetings
        (meeting_id, contact_id, meeting_type, outcome,
         prep_text, prep_completed, meeting_date)
       VALUES (?, ?, 'preparation', ?, ?, 1, date('now'))`,
      [
        mid,
        selectedContactId,
        'Pre-meeting brief generated',
        briefOutput.trim(),
      ]
    );
    await db.execute(
      `INSERT INTO audit_log
        (log_id, action, entity_type, entity_id, details)
       VALUES (?, 'meeting_prep_saved', 'client_meetings', ?, ?)`,
      [
        uuidv4(),
        mid,
        'Pre-meeting brief stored',
      ]
    );
    setSaved(true);
    setStatusMsg('Saved to client record');
  }

  function startOver() {
    setStep(1);
    setBriefOutput('');
    setTranscript('');
    setExtractedContext(null);
    setTranscriptExtractedOk(false);
    setStatusMsg('');
    setSaved(false);
    setGenerating(false);
    setExtracting(false);
    setNewProspectMode(false);
    setNewProspectName('');
    setNewProspectCompany('');
    setNewProspectRole('');
    setNewProspectConnection('');
    setNewProspectNotes('');
    if (!preselectedContactId) {
      setSelectedContactId('');
      setSelectedContact(null);
    } else {
      setSelectedContactId(preselectedContactId);
      void loadContactById(preselectedContactId);
    }
  }

  const stepLabels: Record<number, string> = {
    1: 'Select Contact',
    2: 'Add Context',
    3: 'Generate Brief',
    4: 'Review and Save',
  };

  const populatedContextCount = selectedContact
    ? [
        lifeContext,
        businessContext,
        communicationStyle,
        topicsRaise,
        topicsAvoid,
        lastMeetingSummary,
      ].filter(s => s.trim()).length
    : 0;

  const sections = parseBriefSections(briefOutput);

  if (loading && contacts.length === 0) {
    return (
      <div
        style={{
          padding: 32,
          background: C.cream,
          fontFamily: 'Trebuchet MS, sans-serif',
          color: C.slate,
        }}
      >
        Loading contacts...
      </div>
    );
  }

  return (
    <div
      style={{
        background: C.cream,
        padding: 32,
        minHeight: '100%',
        boxSizing: 'border-box',
        fontFamily: 'Trebuchet MS, sans-serif',
      }}
    >
      <h1
        style={{
          fontFamily: 'Georgia, serif',
          fontSize: 24,
          color: C.navy,
          margin: '0 0 8px',
        }}
      >
        Pre-Meeting Intelligence Brief
      </h1>
      <p
        style={{
          fontSize: 13,
          color: C.slate,
          margin: '0 0 20px',
        }}
      >
        Prepare for any meeting using stored context and
        your STZ voice layer.
      </p>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          marginBottom: 24,
        }}
      >
        {([1, 2, 3, 4] as const).map(s => {
          const done = step > s;
          const active = step === s;
          return (
            <div
              key={s}
              style={{
                padding: '4px 14px',
                borderRadius: 20,
                fontSize: 11,
                fontFamily: 'Courier New, monospace',
                background: active
                  ? C.teal
                  : done
                  ? C.green
                  : C.lgray,
                color:
                  active || done ? C.white : C.slate,
              }}
            >
              {s} {stepLabels[s]}
            </div>
          );
        })}
      </div>

      {statusMsg ? (
        <div
          style={{
            marginBottom: 12,
            fontSize: 12,
            color: C.navy,
          }}
        >
          {statusMsg}
        </div>
      ) : null}

      {step === 1 && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                marginRight: 16,
                fontSize: 13,
                color: C.navy,
              }}
            >
              <input
                type="radio"
                checked={!newProspectMode}
                onChange={() =>
                  setNewProspectMode(false)
                }
              />{' '}
              Existing Contact
            </label>
            <label
              style={{ fontSize: 13, color: C.navy }}
            >
              <input
                type="radio"
                checked={newProspectMode}
                onChange={() =>
                  setNewProspectMode(true)
                }
              />{' '}
              New Prospect
            </label>
          </div>

          {!newProspectMode ? (
            <div>
              <select
                value={selectedContactId}
                onChange={e => {
                  const id = e.target.value;
                  setSelectedContactId(id);
                  void loadContactById(id);
                }}
                style={{
                  minWidth: 280,
                  padding: 8,
                  border: `1px solid ${C.mint}`,
                  borderRadius: 8,
                  fontSize: 13,
                }}
              >
                <option value="">
                  Select a contact...
                </option>
                {contacts.map(c => (
                  <option
                    key={c.contact_id}
                    value={c.contact_id}
                  >
                    {c.full_name}
                    {c.company
                      ? ` - ${c.company}`
                      : ''}
                  </option>
                ))}
              </select>

              {selectedContact ? (
                <div
                  style={{
                    marginTop: 16,
                    maxWidth: 560,
                    background: C.white,
                    border: `1px solid ${C.mint}`,
                    borderRadius: 10,
                    padding: '14px 18px',
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
                    {selectedContact.full_name}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: C.slate,
                      marginTop: 4,
                    }}
                  >
                    {selectedContact.company ?? ''}
                    {selectedContact.role
                      ? ` · ${selectedContact.role}`
                      : ''}
                  </div>
                  <div
                    style={{ marginTop: 8 }}
                  >
                    <span
                      style={{
                        fontFamily:
                          'Courier New, monospace',
                        fontSize: 9,
                        color: C.slate,
                        textTransform: 'uppercase',
                      }}
                    >
                      {selectedContact.pipeline_stage?.replace(
                        /_/g,
                        ' '
                      ) ?? 'stage'}
                    </span>
                    <span
                      style={tierPillStyle(
                        selectedContact.tier
                      )}
                    >
                      {selectedContact.tier}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: C.slate,
                      marginTop: 6,
                    }}
                  >
                    Last contact:{' '}
                    {selectedContact.last_contact ??
                      'Unknown'}
                  </div>
                  {(selectedContact.life_context ||
                    selectedContact.business_context) && (
                    <div
                      style={{
                        marginTop: 10,
                        background: C.lgray,
                        padding: 10,
                        borderRadius: 8,
                        fontSize: 12,
                        color: C.slate,
                        fontStyle: 'italic',
                      }}
                    >
                      {selectedContact.life_context
                        ? `${selectedContact.life_context.slice(0, 200)}${selectedContact.life_context.length > 200 ? '...' : ''}`
                        : ''}
                      {selectedContact.life_context &&
                      selectedContact.business_context
                        ? '\n\n'
                        : ''}
                      {selectedContact.business_context
                        ? `${selectedContact.business_context.slice(0, 200)}${selectedContact.business_context.length > 200 ? '...' : ''}`
                        : ''}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    style={{
                      marginTop: 14,
                      padding: '8px 20px',
                      background: C.teal,
                      color: C.white,
                      border: 'none',
                      borderRadius: 8,
                      cursor: 'pointer',
                      fontSize: 13,
                    }}
                  >
                    Next
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <div style={{ maxWidth: 480 }}>
              <Field
                label="Name"
                required
                value={newProspectName}
                onChange={setNewProspectName}
              />
              <Field
                label="Company"
                value={newProspectCompany}
                onChange={setNewProspectCompany}
              />
              <Field
                label="Role"
                value={newProspectRole}
                onChange={setNewProspectRole}
              />
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  color: C.navy,
                  marginBottom: 4,
                }}
              >
                How connected
              </label>
              <input
                type="text"
                value={newProspectConnection}
                onChange={e =>
                  setNewProspectConnection(
                    e.target.value
                  )
                }
                placeholder="Met at BNI, referred by..."
                style={{
                  width: '100%',
                  padding: 8,
                  marginBottom: 12,
                  border: `1px solid ${C.mint}`,
                  borderRadius: 8,
                  boxSizing: 'border-box',
                }}
              />
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  color: C.navy,
                  marginBottom: 4,
                }}
              >
                What you already know
              </label>
              <textarea
                value={newProspectNotes}
                onChange={e =>
                  setNewProspectNotes(e.target.value)
                }
                rows={5}
                style={{
                  width: '100%',
                  padding: 8,
                  marginBottom: 12,
                  border: `1px solid ${C.mint}`,
                  borderRadius: 8,
                  boxSizing: 'border-box',
                }}
              />
              <button
                type="button"
                onClick={() =>
                  void handleNewProspectPersona()
                }
                style={{
                  padding: '10px 22px',
                  background: C.teal,
                  color: C.white,
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 14,
                }}
              >
                Generate Persona
              </button>
            </div>
          )}
        </div>
      )}

      {step === 2 && selectedContact && (
        <div>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 24,
            }}
          >
            <div
              style={{
                flex: '1 1 320px',
                minWidth: 280,
              }}
            >
              <div
                style={{
                  fontFamily: 'Courier New, monospace',
                  fontSize: 10,
                  textTransform: 'uppercase',
                  color: C.slate,
                  marginBottom: 12,
                }}
              >
                Stored Context
              </div>
              <CtxArea
                label="Life Context"
                placeholder="Personal details, family, hobbies, life events"
                value={lifeContext}
                onChange={setLifeContext}
              />
              <CtxArea
                label="Business Context"
                placeholder="Current challenges, goals, recent wins, concerns"
                value={businessContext}
                onChange={setBusinessContext}
              />
              <CtxArea
                label="Communication Style"
                placeholder="How they prefer to communicate, what resonates"
                value={communicationStyle}
                onChange={setCommunicationStyle}
              />
              <CtxArea
                label="Topics to Raise"
                placeholder="Items to bring up in this meeting"
                value={topicsRaise}
                onChange={setTopicsRaise}
              />
              <CtxArea
                label="Topics to Avoid"
                placeholder="Sensitive areas, things that went wrong before"
                value={topicsAvoid}
                onChange={setTopicsAvoid}
              />
              <CtxArea
                label="Last Meeting Summary"
                placeholder="What happened last time you met"
                value={lastMeetingSummary}
                onChange={setLastMeetingSummary}
              />
              <button
                type="button"
                onClick={() => void saveContextFields()}
                style={{
                  marginTop: 8,
                  padding: '8px 18px',
                  background: C.slate,
                  color: C.white,
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                Save Context
              </button>
            </div>

            <div
              style={{
                flex: '1 1 320px',
                minWidth: 280,
              }}
            >
              <div
                style={{
                  fontFamily: 'Courier New, monospace',
                  fontSize: 10,
                  textTransform: 'uppercase',
                  color: C.slate,
                  marginBottom: 12,
                }}
              >
                Optional Transcript
              </div>
              <p
                style={{
                  fontSize: 12,
                  color: C.slate,
                  margin: '0 0 10px',
                }}
              >
                Paste a meeting transcript to extract
                additional context.
              </p>
              <textarea
                value={transcript}
                onChange={e =>
                  setTranscript(e.target.value)
                }
                rows={10}
                placeholder="Paste meeting transcript here. Ollama will extract relationship intelligence automatically."
                style={{
                  width: '100%',
                  padding: 10,
                  border: `1px solid ${C.mint}`,
                  borderRadius: 8,
                  boxSizing: 'border-box',
                  fontSize: 13,
                }}
              />
              <button
                type="button"
                disabled={extracting}
                onClick={() =>
                  void handleExtractTranscript()
                }
                style={{
                  marginTop: 10,
                  padding: '8px 18px',
                  background: C.teal,
                  color: C.white,
                  border: 'none',
                  borderRadius: 8,
                  cursor: extracting
                    ? 'wait'
                    : 'pointer',
                  fontSize: 13,
                }}
              >
                {extracting
                  ? 'Extracting...'
                  : 'Extract Context'}
              </button>

              {extractedContext ? (
                <div
                  style={{
                    marginTop: 16,
                    padding: 14,
                    background: C.white,
                    border: `1px solid ${C.teal}`,
                    borderRadius: 10,
                  }}
                >
                  <div
                    style={{
                      fontFamily:
                        'Courier New, monospace',
                      fontSize: 10,
                      textTransform: 'uppercase',
                      color: C.teal,
                      letterSpacing: '0.1em',
                      marginBottom: 10,
                    }}
                  >
                    Extracted Context
                  </div>
                  <ExtractedBlock
                    label="Life details"
                    items={extractedContext.life_details}
                  />
                  <ExtractedBlock
                    label="Business details"
                    items={
                      extractedContext.business_details
                    }
                  />
                  <ExtractedBlock
                    label="Concerns expressed"
                    items={
                      extractedContext.concerns_expressed
                    }
                  />
                  <ExtractedBlock
                    label="Topics discussed"
                    items={
                      extractedContext.topics_discussed
                    }
                  />
                  <ExtractedBlock
                    label="Follow-up items"
                    items={
                      extractedContext.follow_up_items
                    }
                  />
                  <ExtractedBlock
                    label="Communication"
                    items={
                      extractedContext.communication_observations
                    }
                  />
                  <div
                    style={{
                      display: 'flex',
                      gap: 10,
                      marginTop: 12,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        void mergeExtractedIntoContact()
                      }
                      style={{
                        padding: '6px 14px',
                        background: C.teal,
                        color: C.white,
                        border: 'none',
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontSize: 12,
                      }}
                    >
                      Confirm and Save
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setExtractedContext(null)
                      }
                      style={{
                        padding: '6px 14px',
                        background: C.coral,
                        color: C.white,
                        border: 'none',
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontSize: 12,
                      }}
                    >
                      Discard
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setStep(3)}
            style={{
              marginTop: 20,
              padding: '10px 22px',
              background: C.teal,
              color: C.white,
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            Next
          </button>
        </div>
      )}

      {step === 3 && selectedContact && (
        <div>
          <div
            style={{
              maxWidth: 560,
              background: C.white,
              border: `1px solid ${C.mint}`,
              borderRadius: 10,
              padding: '16px 18px',
              marginBottom: 20,
            }}
          >
            <div
              style={{
                fontSize: 14,
                color: C.navy,
                fontWeight: 600,
              }}
            >
              {selectedContact.full_name}
              {selectedContact.company
                ? ` · ${selectedContact.company}`
                : ''}
            </div>
            <div
              style={{
                fontSize: 12,
                color: C.slate,
                marginTop: 8,
              }}
            >
              Context fields populated:{' '}
              {populatedContextCount} / 6
            </div>
            <div
              style={{
                fontSize: 12,
                color: C.slate,
                marginTop: 4,
              }}
            >
              Transcript extracted:{' '}
              {transcriptExtractedOk ? 'yes' : 'no'}
            </div>
          </div>

          {generating ? (
            <div
              style={{
                padding: 24,
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: C.teal,
                  margin: '0 auto 12px',
                  animation: 'pm-pulse 1s ease-in-out infinite',
                }}
              />
              <style>
                {`@keyframes pm-pulse {
                  0%, 100% { opacity: 0.35; transform: scale(1); }
                  50% { opacity: 1; transform: scale(1.15); }
                }`}
              </style>
              <p
                style={{
                  fontSize: 13,
                  color: C.slate,
                  fontStyle: 'italic',
                  margin: 0,
                }}
              >
                Generating your brief... Ollama is
                reasoning over your context.
              </p>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => void handleGenerateBrief()}
              style={{
                padding: '14px 28px',
                background: C.teal,
                color: C.white,
                border: 'none',
                borderRadius: 10,
                cursor: 'pointer',
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              Generate Brief
            </button>
          )}
        </div>
      )}

      {step === 4 && (
        <div>
          <div
            style={{
              background: C.white,
              border: `1px solid ${C.mint}`,
              borderLeft: `4px solid ${C.teal}`,
              borderRadius: 12,
              padding: '24px 28px',
              marginBottom: 20,
              fontFamily: 'Trebuchet MS, sans-serif',
              fontSize: 14,
              color: C.navy,
              lineHeight: 1.8,
            }}
          >
            {sections.length > 0 ? (
              sections.map((sec, i) => (
                <div key={sec.header}>
                  {i > 0 ? (
                    <div
                      style={{
                        borderTop: `1px solid ${C.mint}`,
                        margin: '16px 0',
                      }}
                    />
                  ) : null}
                  <div
                    style={{
                      fontFamily:
                        'Courier New, monospace',
                      fontSize: 10,
                      textTransform: 'uppercase',
                      color: C.teal,
                      letterSpacing: '0.1em',
                      marginBottom: 8,
                    }}
                  >
                    {sec.header}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      lineHeight: 1.7,
                      color: C.navy,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {sec.body}
                  </div>
                </div>
              ))
            ) : (
              <div
                style={{
                  whiteSpace: 'pre-wrap',
                  fontSize: 13,
                  lineHeight: 1.7,
                }}
              >
                {briefOutput}
              </div>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 10,
            }}
          >
            <button
              type="button"
              onClick={() => void saveToAha()}
              style={{
                padding: '8px 16px',
                background: C.teal,
                color: C.white,
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              Save to Aha Moments
            </button>
            <button
              type="button"
              onClick={() =>
                void saveToClientMeetings()
              }
              style={{
                padding: '8px 16px',
                background: C.teal,
                color: C.white,
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              Save to Client Meetings
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              style={{
                padding: '8px 16px',
                background: C.slate,
                color: C.white,
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              Print
            </button>
            <button
              type="button"
              onClick={startOver}
              style={{
                padding: '8px 16px',
                background: C.slate,
                color: C.white,
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              Start Over
            </button>
          </div>
          {saved ? (
            <div
              style={{
                marginTop: 12,
                fontSize: 12,
                color: C.green,
              }}
            >
              Record saved.
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <>
      <label
        style={{
          display: 'block',
          fontSize: 12,
          color: C.navy,
          marginBottom: 4,
        }}
      >
        {label}
        {required ? ' *' : ''}
      </label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: 8,
          marginBottom: 12,
          border: `1px solid ${C.mint}`,
          borderRadius: 8,
          boxSizing: 'border-box',
        }}
      />
    </>
  );
}

function CtxArea({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label
        style={{
          display: 'block',
          fontSize: 11,
          color: C.navy,
          marginBottom: 4,
        }}
      >
        {label}
      </label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        style={{
          width: '100%',
          padding: 8,
          border: `1px solid ${C.mint}`,
          borderRadius: 8,
          boxSizing: 'border-box',
          fontSize: 12,
        }}
      />
    </div>
  );
}

function ExtractedBlock({
  label,
  items,
}: {
  label: string;
  items?: string[];
}) {
  if (!items || items.length === 0) return null;
  return (
    <div style={{ marginBottom: 8 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: C.navy,
        }}
      >
        {label}
      </div>
      <ul
        style={{
          margin: '4px 0 0',
          paddingLeft: 18,
          fontSize: 12,
          color: C.slate,
        }}
      >
        {items.map((x, i) => (
          <li key={i}>{x}</li>
        ))}
      </ul>
    </div>
  );
}
