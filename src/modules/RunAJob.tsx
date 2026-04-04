import { useState, useEffect, useCallback } from 'react';
import { getDb } from '../services/db';
import { enqueueJob } from '../services/jobQueueService';
import { v4 as uuidv4 } from 'uuid';

interface JobItem {
  job_id: string;
  category: string;
  name: string;
  input_description: string | null;
  output_description: string | null;
  price_low: number | null;
  price_high: number | null;
}

interface Contact {
  contact_id: string;
  full_name: string;
  company: string | null;
}

interface QueueRow {
  queue_id: string;
  job_id: string;
  status: string;
  created_at: string;
  output_text: string | null;
  error_message: string | null;
}

const CATEGORIES = [
  { id: 'communicate', label: 'Communicate' },
  { id: 'document',    label: 'Document'    },
  { id: 'extract',     label: 'Extract'     },
  { id: 'patterns',    label: 'Patterns'    },
  { id: 'knowledge',   label: 'Knowledge'   },
];

const CAT_COLOR: Record<string, string> = {
  communicate: 'var(--teal)',
  document:    'var(--navy)',
  extract:     'var(--gold)',
  patterns:    'var(--coral)',
  knowledge:   '#6B5EA8',
};

export function RunAJob() {
  const [category, setCategory] = useState('communicate');
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selected, setSelected] = useState<JobItem | null>(null);
  const [input, setInput] = useState('');
  const [contactId, setContactId] = useState('');
  const [queue, setQueue] = useState<QueueRow[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [correcting, setCorrecting] = useState<string | null>(null);
  const [correction, setCorrection] = useState('');

  useEffect(() => { loadJobs(); loadContacts(); }, []);
  useEffect(() => { loadJobs(); }, [category]);

  const pollQueue = useCallback(async () => {
    try {
      const db = await getDb();
      const rows = await db.select<QueueRow[]>(
        `SELECT queue_id, job_id, status, created_at,
                output_text, error_message
         FROM job_queue
         ORDER BY created_at DESC LIMIT 20`
      );
      setQueue(rows);
    } catch {}
  }, []);

  useEffect(() => {
    pollQueue();
    const t = setInterval(pollQueue, 2000);
    return () => clearInterval(t);
  }, [pollQueue]);

  async function loadJobs() {
    const db = await getDb();
    const rows = await db.select<JobItem[]>(
      `SELECT job_id, category, name,
              input_description, output_description,
              price_low, price_high
       FROM jobs_menu
       WHERE active = 1 AND category = ?
       ORDER BY name`,
      [category]
    );
    setJobs(rows);
  }

  async function loadContacts() {
    const db = await getDb();
    const rows = await db.select<Contact[]>(
      `SELECT contact_id, full_name, company
       FROM contacts
       WHERE status != 'inactive'
       ORDER BY full_name`
    );
    setContacts(rows);
  }

  async function handleQueue() {
    if (!selected || !input.trim()) return;
    await enqueueJob(
      selected.job_id,
      input.trim(),
      contactId || undefined
    );
    setInput('');
    setContactId('');
    pollQueue();
  }

  async function handleCopy(text: string, id: string) {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  async function handleSaveToContent(
    output: string, jobName: string
  ) {
    const db = await getDb();
    await db.execute(
      `INSERT INTO content_queue
         (content_id, type, title, draft_text, status)
       VALUES (?, ?, ?, ?, 'queued')`,
      [uuidv4(), 'job_output', jobName, output]
    );
  }

  async function handleCorrect(queueId: string) {
    if (!correction.trim()) return;
    const db = await getDb();
    await db.execute(
      `INSERT INTO exceptions
         (exception_id, job_id, wrong_output,
          correct_output, reason)
       SELECT ?, job_id, output_text, ?, 'user_correction'
       FROM job_queue WHERE queue_id = ?`,
      [uuidv4(), correction.trim(), queueId]
    );
    await db.execute(
      `INSERT INTO audit_log
         (log_id, action, entity_type, entity_id, details)
       VALUES (?, 'correction_logged', 'job_queue', ?, ?)`,
      [uuidv4(), queueId, 'User correction submitted']
    );
    setCorrecting(null);
    setCorrection('');
  }

  const color = CAT_COLOR[category] ?? 'var(--teal)';

  return (
    <div style={{ padding: 32 }}>
      <h2 style={{ marginBottom: 4 }}>Run a Job</h2>
      <p style={{
        color: 'var(--slate)', fontSize: 13,
        marginBottom: 24,
      }}>
        Select a job. Paste your input.
        Add to queue. Output appears below.
      </p>

      {/* Category tabs */}
      <div style={{
        display: 'flex', gap: 6,
        marginBottom: 20, flexWrap: 'wrap',
      }}>
        {CATEGORIES.map(cat => (
          <button key={cat.id}
            onClick={() => {
              setCategory(cat.id);
              setSelected(null);
              setInput('');
            }}
            style={{
              padding: '6px 16px',
              borderRadius: 20,
              border: `1px solid ${category === cat.id
                ? CAT_COLOR[cat.id] : 'var(--mgray)'}`,
              background: category === cat.id
                ? CAT_COLOR[cat.id] : 'transparent',
              color: category === cat.id
                ? 'var(--white)' : 'var(--slate)',
              fontSize: 12, fontWeight: 600,
              cursor: 'pointer',
            }}>
            {cat.label}
          </button>
        ))}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 20, marginBottom: 32,
      }}>

        {/* Job cards */}
        <div>
          <div className="label" style={{ marginBottom: 10 }}>
            {CATEGORIES.find(c => c.id === category)?.label} jobs
          </div>
          {jobs.map(job => (
            <div key={job.job_id}
              onClick={() => setSelected(job)}
              style={{
                background: 'var(--white)',
                border: `1px solid ${selected?.job_id === job.job_id
                  ? color : 'var(--mgray)'}`,
                borderLeft: `4px solid ${selected?.job_id === job.job_id
                  ? color : 'var(--mgray)'}`,
                borderRadius: 10,
                padding: '12px 14px',
                marginBottom: 8,
                cursor: 'pointer',
                transition: 'border 0.15s',
              }}>
              <div style={{
                fontSize: 13, fontWeight: 700,
                color: 'var(--navy)', marginBottom: 4,
              }}>
                {job.name}
              </div>
              <div style={{
                display: 'flex', gap: 8,
                flexDirection: 'column',
              }}>
                <div style={{ fontSize: 11 }}>
                  <span className="label">IN </span>
                  <span style={{ color: 'var(--slate)' }}>
                    {job.input_description}
                  </span>
                </div>
                <div style={{ fontSize: 11 }}>
                  <span className="label"
                    style={{ color }}>OUT </span>
                  <span style={{
                    color: 'var(--navy)', fontWeight: 600,
                  }}>
                    {job.output_description}
                  </span>
                </div>
              </div>
              {job.price_low && (
                <div style={{
                  fontSize: 10, color: 'var(--slate)',
                  marginTop: 6,
                  fontFamily: 'Courier New, monospace',
                }}>
                  ${job.price_low}–${job.price_high}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Runner panel */}
        <div>
          <div className="label" style={{ marginBottom: 10 }}>
            {selected ? selected.name : 'Select a job'}
          </div>

          {!selected ? (
            <div style={{
              background: 'var(--lgray)',
              borderRadius: 10,
              padding: '20px 16px',
              fontSize: 13, color: 'var(--slate)',
              textAlign: 'center',
            }}>
              Click a job on the left to run it.
            </div>
          ) : (
            <div>
              {/* Contact selector */}
              <div style={{ marginBottom: 10 }}>
                <div className="label" style={{ marginBottom: 4 }}>
                  Link to contact (optional)
                </div>
                <select
                  value={contactId}
                  onChange={e => setContactId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '7px 10px',
                    border: '1px solid var(--mgray)',
                    borderRadius: 8,
                    fontSize: 12,
                    color: 'var(--navy)',
                    background: 'var(--white)',
                  }}>
                  <option value="">No contact</option>
                  {contacts.map(c => (
                    <option key={c.contact_id}
                      value={c.contact_id}>
                      {c.full_name}
                      {c.company ? ` — ${c.company}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Input */}
              <div className="label" style={{ marginBottom: 4 }}>
                Your input — {selected.input_description}
              </div>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={`Paste ${selected.input_description?.toLowerCase() ?? 'input'} here...`}
                rows={10}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid var(--mgray)',
                  borderRadius: 8,
                  fontSize: 12,
                  color: 'var(--navy)',
                  resize: 'vertical',
                  fontFamily: 'Trebuchet MS, sans-serif',
                  lineHeight: 1.6,
                  marginBottom: 10,
                }} />

              <button
                onClick={handleQueue}
                disabled={!input.trim()}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: input.trim()
                    ? color : 'var(--mgray)',
                  color: input.trim()
                    ? 'var(--white)' : 'var(--slate)',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 13, fontWeight: 700,
                  cursor: input.trim()
                    ? 'pointer' : 'default',
                }}>
                Add to Queue
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Queue */}
      {queue.length > 0 && (
        <div>
          <div className="label" style={{ marginBottom: 12 }}>
            Job Queue — recent runs
          </div>
          {queue.map(row => (
            <div key={row.queue_id} style={{
              background: 'var(--white)',
              border: '1px solid var(--mgray)',
              borderLeft: `4px solid ${
                row.status === 'done' ? 'var(--green)'
                : row.status === 'failed' ? 'var(--coral)'
                : row.status === 'running' ? 'var(--gold)'
                : 'var(--mgray)'}`,
              borderRadius: 10,
              padding: '12px 16px',
              marginBottom: 8,
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: row.output_text ? 8 : 0,
              }}>
                <div>
                  <span style={{
                    fontSize: 12, fontWeight: 700,
                    color: 'var(--navy)',
                  }}>
                    {row.job_id.replace(/_/g, ' ')}
                  </span>
                  <span style={{
                    fontSize: 10, marginLeft: 8,
                    fontFamily: 'Courier New, monospace',
                    color: row.status === 'done'
                      ? 'var(--green)'
                      : row.status === 'failed'
                      ? 'var(--coral)'
                      : row.status === 'running'
                      ? 'var(--gold)'
                      : 'var(--slate)',
                  }}>
                    {row.status}
                  </span>
                </div>
                <span style={{
                  fontSize: 10, color: 'var(--slate)',
                  fontFamily: 'Courier New, monospace',
                }}>
                  {row.created_at.slice(0, 16)}
                </span>
              </div>

              {row.status === 'failed' && row.error_message && (
                <div style={{
                  fontSize: 11, color: 'var(--coral)',
                  fontFamily: 'Courier New, monospace',
                  marginTop: 4,
                }}>
                  {row.error_message}
                </div>
              )}

              {row.output_text && (
                <div>
                  <pre style={{
                    fontSize: 12, color: 'var(--navy)',
                    lineHeight: 1.7,
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'Trebuchet MS, sans-serif',
                    background: 'var(--lgray)',
                    borderRadius: 8,
                    padding: '10px 12px',
                    marginBottom: 8,
                    maxHeight: 300,
                    overflowY: 'auto',
                  }}>
                    {row.output_text}
                  </pre>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => handleCopy(
                        row.output_text!, row.queue_id
                      )}
                      style={{
                        padding: '5px 14px',
                        background: copied === row.queue_id
                          ? 'var(--green2)' : 'var(--teal2)',
                        border: 'none', borderRadius: 6,
                        fontSize: 11, fontWeight: 600,
                        color: copied === row.queue_id
                          ? 'var(--green)' : 'var(--navy)',
                        cursor: 'pointer',
                      }}>
                      {copied === row.queue_id
                        ? 'Copied ✓' : 'Copy'}
                    </button>
                    <button
                      onClick={() => handleSaveToContent(
                        row.output_text!,
                        row.job_id.replace(/_/g, ' ')
                      )}
                      style={{
                        padding: '5px 14px',
                        background: 'var(--gold2)',
                        border: 'none', borderRadius: 6,
                        fontSize: 11, fontWeight: 600,
                        color: 'var(--gold)',
                        cursor: 'pointer',
                      }}>
                      Save to Content Queue
                    </button>
                    <button
                      onClick={() => setCorrecting(
                        correcting === row.queue_id
                          ? null : row.queue_id
                      )}
                      style={{
                        padding: '5px 14px',
                        background: 'var(--coral2)',
                        border: 'none', borderRadius: 6,
                        fontSize: 11, fontWeight: 600,
                        color: 'var(--coral)',
                        cursor: 'pointer',
                      }}>
                      Correct this
                    </button>
                  </div>

                  {correcting === row.queue_id && (
                    <div style={{ marginTop: 8 }}>
                      <textarea
                        value={correction}
                        onChange={e =>
                          setCorrection(e.target.value)}
                        placeholder="Paste the correct output here..."
                        rows={4}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          border: '1px solid var(--coral)',
                          borderRadius: 8,
                          fontSize: 12,
                          marginBottom: 6,
                          fontFamily:
                            'Trebuchet MS, sans-serif',
                        }} />
                      <button
                        onClick={() =>
                          handleCorrect(row.queue_id)}
                        style={{
                          padding: '5px 14px',
                          background: 'var(--coral)',
                          color: 'var(--white)',
                          border: 'none', borderRadius: 6,
                          fontSize: 11, fontWeight: 700,
                          cursor: 'pointer',
                        }}>
                        Log Correction
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
