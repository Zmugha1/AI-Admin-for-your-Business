import { useState, useEffect } from 'react';
import { getDb } from '../services/db';
import { v4 as uuidv4 } from 'uuid';

interface PromptRow {
  prompt_id: string;
  job_id: string;
  version: number;
  system_template: string;
  user_template: string;
  is_active: number;
  notes: string | null;
  created_at: string;
}

const JOB_LABELS: Record<string, string> = {
  follow_up_email:  'Follow-Up Email',
  linkedin_post:    'LinkedIn Post',
  blog_builder:     'Blog Post Builder',
  meeting_summary:  'Meeting Summary',
  pain_extractor:   'Pain Point Extractor',
  re_engagement:    'Re-Engagement Message',
  action_extractor: 'Action Item Extractor',
  doc_synthesizer:  'Document Synthesizer',
  key_points_reader:'Key Points Reader',
  workshop_outline: 'Workshop Outline',
};

export function MyPrompts() {
  const [prompts, setPrompts] = useState<PromptRow[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editing, setEditing] = useState<{
    system: string;
    user: string;
    notes: string;
  } | null>(null);
  const [history, setHistory] = useState<Record<string, PromptRow[]>>({});
  const [showHistory, setShowHistory] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const db = await getDb();
    const rows = await db.select<PromptRow[]>(
      `SELECT prompt_id, job_id, version,
              system_template, user_template,
              is_active, notes, created_at
       FROM prompts
       WHERE is_active = 1
       ORDER BY job_id`
    );
    setPrompts(rows);
  }

  async function loadHistory(jobId: string) {
    const db = await getDb();
    const rows = await db.select<PromptRow[]>(
      `SELECT prompt_id, job_id, version,
              system_template, user_template,
              is_active, notes, created_at
       FROM prompts
       WHERE job_id = ?
       ORDER BY version DESC`,
      [jobId]
    );
    setHistory(prev => ({ ...prev, [jobId]: rows }));
    setShowHistory(prev => (prev === jobId ? null : jobId));
  }

  function startEdit(p: PromptRow) {
    setExpanded(p.job_id);
    setEditing({
      system: p.system_template,
      user: p.user_template,
      notes: p.notes ?? '',
    });
  }

  async function saveNewVersion(p: PromptRow) {
    if (!editing) return;
    const db = await getDb();

    await db.execute(
      `UPDATE prompts SET is_active = 0
       WHERE job_id = ?`,
      [p.job_id]
    );

    const newId = uuidv4();
    await db.execute(
      `INSERT INTO prompts
         (prompt_id, job_id, version,
          system_template, user_template,
          is_active, notes)
       VALUES (?, ?, ?, ?, ?, 1, ?)`,
      [
        newId,
        p.job_id,
        p.version + 1,
        editing.system,
        editing.user,
        editing.notes || null,
      ]
    );

    await db.execute(
      `INSERT INTO audit_log
         (log_id, action, entity_type,
          entity_id, details)
       VALUES (?, 'prompt_versioned', 'prompts', ?, ?)`,
      [
        uuidv4(),
        newId,
        `Job: ${p.job_id} — v${p.version + 1}`,
      ]
    );

    setSaved(p.job_id);
    setTimeout(() => setSaved(null), 2000);
    setExpanded(null);
    setEditing(null);
    await load();
  }

  async function restoreVersion(p: PromptRow) {
    const db = await getDb();
    await db.execute(
      `UPDATE prompts SET is_active = 0
       WHERE job_id = ?`,
      [p.job_id]
    );
    await db.execute(
      `UPDATE prompts SET is_active = 1
       WHERE prompt_id = ?`,
      [p.prompt_id]
    );
    await db.execute(
      `INSERT INTO audit_log
         (log_id, action, entity_type,
          entity_id, details)
       VALUES (?, 'prompt_restored', 'prompts', ?, ?)`,
      [
        uuidv4(),
        p.prompt_id,
        `Restored v${p.version} for ${p.job_id}`,
      ]
    );
    setShowHistory(null);
    await load();
  }

  return (
    <div style={{ padding: 32 }}>
      <h2 style={{ marginBottom: 4 }}>My Prompts</h2>
      <p style={{
        color: 'var(--slate)', fontSize: 13,
        marginBottom: 24,
      }}>
        Every job prompt — versioned and editable.
        Save a new version any time. Restore any
        previous version instantly.
      </p>

      {prompts.map(p => {
        const isExpanded = expanded === p.job_id;
        const isSaved = saved === p.job_id;
        const label =
          JOB_LABELS[p.job_id] ?? p.job_id;

        return (
          <div key={p.prompt_id} style={{
            background: 'var(--white)',
            border: `1px solid ${isExpanded
              ? 'var(--teal)' : 'var(--mgray)'}`,
            borderLeft: `4px solid ${isExpanded
              ? 'var(--teal)' : 'var(--mgray)'}`,
            borderRadius: 12,
            marginBottom: 12,
            overflow: 'hidden',
          }}>

            {/* Header row */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '14px 18px',
            }}>
              <div>
                <div style={{
                  fontSize: 14, fontWeight: 700,
                  color: 'var(--navy)',
                }}>
                  {label}
                </div>
                <div style={{
                  fontSize: 10,
                  color: 'var(--slate)',
                  fontFamily: 'Courier New, monospace',
                  marginTop: 2,
                }}>
                  v{p.version} · active
                  {p.notes ? ` · ${p.notes}` : ''}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => loadHistory(p.job_id)}
                  style={{
                    padding: '5px 12px',
                    background: 'var(--lgray)',
                    border: 'none', borderRadius: 6,
                    fontSize: 11, color: 'var(--slate)',
                    cursor: 'pointer',
                  }}>
                  History
                </button>
                <button
                  onClick={() => {
                    if (isExpanded) {
                      setExpanded(null);
                      setEditing(null);
                    } else {
                      startEdit(p);
                    }
                  }}
                  style={{
                    padding: '5px 12px',
                    background: isExpanded
                      ? 'var(--mgray)' : 'var(--teal)',
                    color: isExpanded
                      ? 'var(--slate)' : 'var(--white)',
                    border: 'none', borderRadius: 6,
                    fontSize: 11, fontWeight: 600,
                    cursor: 'pointer',
                  }}>
                  {isExpanded ? 'Cancel' : 'Edit'}
                </button>
              </div>
            </div>

            {/* Edit panel */}
            {isExpanded && editing && (
              <div style={{
                padding: '0 18px 18px',
                borderTop: '1px solid var(--mgray)',
                paddingTop: 16,
              }}>
                <div className="label"
                  style={{ marginBottom: 4 }}>
                  System template
                </div>
                <textarea
                  value={editing.system}
                  onChange={e => setEditing({
                    ...editing, system: e.target.value
                  })}
                  rows={10}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--mgray)',
                    borderRadius: 8,
                    fontSize: 11,
                    fontFamily: 'Courier New, monospace',
                    lineHeight: 1.6,
                    marginBottom: 12,
                    color: 'var(--ink)',
                    resize: 'vertical',
                  }} />

                <div className="label"
                  style={{ marginBottom: 4 }}>
                  User template
                </div>
                <textarea
                  value={editing.user}
                  onChange={e => setEditing({
                    ...editing, user: e.target.value
                  })}
                  rows={5}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--mgray)',
                    borderRadius: 8,
                    fontSize: 11,
                    fontFamily: 'Courier New, monospace',
                    lineHeight: 1.6,
                    marginBottom: 12,
                    color: 'var(--ink)',
                    resize: 'vertical',
                  }} />

                <div className="label"
                  style={{ marginBottom: 4 }}>
                  Notes (optional)
                </div>
                <input
                  type="text"
                  value={editing.notes}
                  onChange={e => setEditing({
                    ...editing, notes: e.target.value
                  })}
                  placeholder="What changed in this version?"
                  style={{
                    width: '100%',
                    padding: '7px 10px',
                    border: '1px solid var(--mgray)',
                    borderRadius: 8,
                    fontSize: 12,
                    marginBottom: 12,
                    color: 'var(--navy)',
                  }} />

                <button
                  onClick={() => saveNewVersion(p)}
                  style={{
                    padding: '8px 20px',
                    background: isSaved
                      ? 'var(--green)' : 'var(--teal)',
                    color: 'var(--white)',
                    border: 'none', borderRadius: 8,
                    fontSize: 12, fontWeight: 700,
                    cursor: 'pointer',
                  }}>
                  {isSaved
                    ? 'Saved ✓'
                    : `Save as v${p.version + 1}`}
                </button>
              </div>
            )}

            {/* Version history */}
            {showHistory === p.job_id &&
              history[p.job_id] && (
              <div style={{
                borderTop: '1px solid var(--mgray)',
                padding: '12px 18px',
                background: 'var(--lgray)',
              }}>
                <div className="label"
                  style={{ marginBottom: 8 }}>
                  Version history
                </div>
                {history[p.job_id].map(h => (
                  <div key={h.prompt_id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '6px 0',
                    borderBottom:
                      '1px solid var(--mgray)',
                  }}>
                    <div>
                      <span style={{
                        fontSize: 12,
                        fontWeight: h.is_active
                          ? 700 : 400,
                        color: h.is_active
                          ? 'var(--teal)'
                          : 'var(--slate)',
                        fontFamily:
                          'Courier New, monospace',
                      }}>
                        v{h.version}
                        {h.is_active ? ' · active' : ''}
                      </span>
                      <span style={{
                        fontSize: 10,
                        color: 'var(--slate)',
                        marginLeft: 10,
                      }}>
                        {h.created_at.slice(0, 16)}
                      </span>
                      {h.notes && (
                        <span style={{
                          fontSize: 10,
                          color: 'var(--slate)',
                          marginLeft: 10,
                        }}>
                          {h.notes}
                        </span>
                      )}
                    </div>
                    {!h.is_active && (
                      <button
                        onClick={() => restoreVersion(h)}
                        style={{
                          padding: '3px 10px',
                          background: 'var(--teal2)',
                          border: 'none',
                          borderRadius: 6,
                          fontSize: 10,
                          fontWeight: 600,
                          color: 'var(--navy)',
                          cursor: 'pointer',
                        }}>
                        Restore
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
