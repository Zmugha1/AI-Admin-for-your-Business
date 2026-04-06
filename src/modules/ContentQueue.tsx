import { useState, useEffect } from 'react';
import { getDb } from '../services/db';
import { v4 as uuidv4 } from 'uuid';

interface ContentItem {
  content_id: string;
  type: string;
  title: string | null;
  topic: string | null;
  status: string;
  draft_text: string | null;
  published_url: string | null;
  scheduled_date: string | null;
  created_at: string;
}

const TYPE_COLOR: Record<string, string> = {
  linkedin:    'var(--teal)',
  blog:        'var(--navy)',
  newsletter:  'var(--gold)',
  job_output:  'var(--slate)',
  other:       'var(--slate)',
};

const STATUS_COLOR: Record<string, string> = {
  queued:    'var(--gold)',
  draft:     'var(--teal)',
  published: 'var(--green)',
};

const STATUS_BG: Record<string, string> = {
  queued:    '#C8974A18',
  draft:     '#3BBFBF18',
  published: '#3A7D5C18',
};

const TYPES = [
  'linkedin', 'blog', 'newsletter',
  'job_output', 'other',
];

const STATUSES = ['queued', 'draft', 'published'];

export function ContentQueue() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [selected, setSelected] = useState<ContentItem | null>(null);
  const [filterType, setFilterType] =
    useState('all');
  const [filterStatus, setFilterStatus] =
    useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [editDraft, setEditDraft] =
    useState(false);
  const [draftText, setDraftText] = useState('');
  const [pubUrl, setPubUrl] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newTopic, setNewTopic] = useState('');
  const [newType, setNewType] =
    useState('linkedin');
  const [newDate, setNewDate] = useState('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => { load(); }, []);

  async function load(): Promise<ContentItem[]> {
    let rows: ContentItem[] = [];
    try {
      const db = await getDb();
      rows = await db.select<ContentItem[]>(
        `SELECT content_id, type, title, topic,
                status, draft_text, published_url,
                scheduled_date, created_at
         FROM content_queue
         ORDER BY
           CASE status
             WHEN 'queued' THEN 1
             WHEN 'draft' THEN 2
             WHEN 'published' THEN 3
           END,
           created_at DESC`
      );
      setItems(rows);
    } catch (err) {
      console.error('ContentQueue load:', err);
    } finally {
      setLoading(false);
    }
    return rows;
  }

  async function addItem() {
    if (!newTitle.trim() && !newTopic.trim()) return;
    const db = await getDb();
    const id = uuidv4();
    await db.execute(
      `INSERT INTO content_queue
         (content_id, type, title, topic,
          status, scheduled_date)
       VALUES (?, ?, ?, ?, 'queued', ?)`,
      [
        id,
        newType,
        newTitle.trim() || null,
        newTopic.trim() || null,
        newDate || null,
      ]
    );
    await db.execute(
      `INSERT INTO audit_log
         (log_id, action, entity_type,
          entity_id, details)
       VALUES (?, 'content_added',
               'content_queue', ?, ?)`,
      [
        uuidv4(), id,
        newTitle.trim() || newTopic.trim(),
      ]
    );
    setNewTitle('');
    setNewTopic('');
    setNewType('linkedin');
    setNewDate('');
    setShowAdd(false);
    await load();
  }

  async function saveDraft(item: ContentItem) {
    const db = await getDb();
    await db.execute(
      `UPDATE content_queue
       SET draft_text = ?,
           status = 'draft',
           updated_at = datetime('now')
       WHERE content_id = ?`,
      [draftText, item.content_id]
    );
    await db.execute(
      `INSERT INTO audit_log
         (log_id, action, entity_type,
          entity_id, details)
       VALUES (?, 'draft_saved',
               'content_queue', ?, ?)`,
      [uuidv4(), item.content_id, item.title ?? '']
    );
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setEditDraft(false);
    const refreshed = await load();
    const updated = refreshed.find(
      i => i.content_id === item.content_id
    );
    if (updated) setSelected(updated);
  }

  async function markPublished(item: ContentItem) {
    const db = await getDb();
    await db.execute(
      `UPDATE content_queue
       SET status = 'published',
           published_url = ?,
           updated_at = datetime('now')
       WHERE content_id = ?`,
      [pubUrl || null, item.content_id]
    );
    await db.execute(
      `INSERT INTO audit_log
         (log_id, action, entity_type,
          entity_id, details)
       VALUES (?, 'content_published',
               'content_queue', ?, ?)`,
      [uuidv4(), item.content_id, item.title ?? '']
    );
    setPubUrl('');
    await load();
    setSelected(null);
  }

  async function deleteItem(item: ContentItem) {
    const db = await getDb();
    await db.execute(
      `DELETE FROM content_queue
       WHERE content_id = ?`,
      [item.content_id]
    );
    await db.execute(
      `INSERT INTO audit_log
         (log_id, action, entity_type,
          entity_id, details)
       VALUES (?, 'content_deleted',
               'content_queue', ?, ?)`,
      [uuidv4(), item.content_id, item.title ?? '']
    );
    setSelected(null);
    await load();
  }

  async function copyDraft(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const filtered = items.filter(i => {
    const mt = filterType === 'all' ||
      i.type === filterType;
    const ms = filterStatus === 'all' ||
      i.status === filterStatus;
    return mt && ms;
  });

  if (loading) {
    return (
      <div style={{
        padding: 32, color: 'var(--slate)',
        fontSize: 12,
        fontFamily: 'Courier New, monospace',
      }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex', height: '100vh',
      background: 'var(--cream)',
    }}>

      {/* Left panel */}
      <div style={{
        width: 300, minWidth: 300,
        background: 'var(--white)',
        borderRight: '1px solid var(--mgray)',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{
          padding: '16px',
          borderBottom: '1px solid var(--mgray)',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 10,
          }}>
            <div style={{
              fontSize: 13, fontWeight: 700,
              color: 'var(--navy)',
            }}>
              Content Queue
              <span style={{
                marginLeft: 6, fontSize: 10,
                color: 'var(--slate)',
                fontFamily: 'Courier New, monospace',
              }}>
                {items.length} items
              </span>
            </div>
            <button
              onClick={() => setShowAdd(!showAdd)}
              style={{
                padding: '5px 12px',
                background: 'var(--teal)',
                color: 'var(--white)',
                border: 'none', borderRadius: 8,
                fontSize: 11, fontWeight: 700,
                cursor: 'pointer',
              }}>
              + Add
            </button>
          </div>

          {/* Type filter */}
          <div style={{
            display: 'flex', gap: 4,
            flexWrap: 'wrap', marginBottom: 6,
          }}>
            {['all', ...TYPES].map(t => (
              <button key={t}
                onClick={() => setFilterType(t)}
                style={{
                  padding: '2px 8px',
                  borderRadius: 20,
                  border: `1px solid ${
                    filterType === t
                      ? TYPE_COLOR[t] ??
                        'var(--teal)'
                      : 'var(--mgray)'}`,
                  background: filterType === t
                    ? `${TYPE_COLOR[t] ??
                      'var(--teal)'}18`
                    : 'transparent',
                  color: filterType === t
                    ? TYPE_COLOR[t] ??
                      'var(--teal)'
                    : 'var(--slate)',
                  fontSize: 10, fontWeight: 600,
                  cursor: 'pointer',
                }}>
                {t}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <div style={{
            display: 'flex', gap: 4,
            flexWrap: 'wrap',
          }}>
            {['all', ...STATUSES].map(s => (
              <button key={s}
                onClick={() => setFilterStatus(s)}
                style={{
                  padding: '2px 8px',
                  borderRadius: 20,
                  border: `1px solid ${
                    filterStatus === s
                      ? STATUS_COLOR[s] ??
                        'var(--slate)'
                      : 'var(--mgray)'}`,
                  background: filterStatus === s
                    ? STATUS_BG[s] ?? '#F4F7F8'
                    : 'transparent',
                  color: filterStatus === s
                    ? STATUS_COLOR[s] ??
                      'var(--slate)'
                    : 'var(--slate)',
                  fontSize: 10, fontWeight: 600,
                  cursor: 'pointer',
                }}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <div style={{
          flex: 1, overflowY: 'auto',
        }}>
          {filtered.length === 0 && (
            <div style={{
              padding: 20, fontSize: 12,
              color: 'var(--slate)',
              textAlign: 'center',
            }}>
              No content found.
            </div>
          )}
          {filtered.map(item => (
            <div key={item.content_id}
              onClick={() => {
                setSelected(item);
                setEditDraft(false);
                setDraftText(
                  item.draft_text ?? ''
                );
                setPubUrl(
                  item.published_url ?? ''
                );
              }}
              style={{
                padding: '11px 16px',
                cursor: 'pointer',
                borderBottom:
                  '1px solid var(--lgray)',
                borderLeft:
                  selected?.content_id ===
                  item.content_id
                    ? '3px solid var(--teal)'
                    : '3px solid transparent',
                background:
                  selected?.content_id ===
                  item.content_id
                    ? 'rgba(59,191,191,0.05)'
                    : 'transparent',
              }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 4,
              }}>
                <div style={{
                  fontSize: 12, fontWeight: 600,
                  color: 'var(--navy)',
                  lineHeight: 1.3,
                  flex: 1, marginRight: 8,
                }}>
                  {item.title ??
                    item.topic ?? 'Untitled'}
                </div>
                <span style={{
                  fontSize: 9, fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: 20,
                  background:
                    STATUS_BG[item.status] ??
                    '#F4F7F8',
                  color:
                    STATUS_COLOR[item.status] ??
                    'var(--slate)',
                  flexShrink: 0,
                }}>
                  {item.status}
                </span>
              </div>
              <div style={{
                display: 'flex', gap: 6,
                alignItems: 'center',
              }}>
                <span style={{
                  fontSize: 9, fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: 20,
                  background:
                    `${TYPE_COLOR[item.type] ??
                    'var(--slate)'}18`,
                  color:
                    TYPE_COLOR[item.type] ??
                    'var(--slate)',
                  fontFamily:
                    'Courier New, monospace',
                }}>
                  {item.type}
                </span>
                {item.scheduled_date && (
                  <span style={{
                    fontSize: 9,
                    color: 'var(--slate)',
                    fontFamily:
                      'Courier New, monospace',
                  }}>
                    {item.scheduled_date}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div style={{
        flex: 1, overflowY: 'auto',
        padding: '28px 32px',
      }}>

        {/* Add form */}
        {showAdd && (
          <div style={{
            background: 'var(--white)',
            border: '1px solid var(--mgray)',
            borderTop: '4px solid var(--teal)',
            borderRadius: 12,
            padding: '20px 24px',
            maxWidth: 560, marginBottom: 24,
          }}>
            <div style={{
              fontSize: 13, fontWeight: 700,
              color: 'var(--navy)', marginBottom: 14,
            }}>
              Add Content Item
            </div>

            <div className="label"
              style={{ marginBottom: 4 }}>
              Title
            </div>
            <input type="text"
              value={newTitle}
              onChange={e =>
                setNewTitle(e.target.value)}
              placeholder="Content title"
              style={{
                width: '100%',
                padding: '7px 10px',
                border: '1px solid var(--mgray)',
                borderRadius: 8,
                fontSize: 12,
                color: 'var(--navy)',
                marginBottom: 10,
              }} />

            <div className="label"
              style={{ marginBottom: 4 }}>
              Topic or angle
            </div>
            <input type="text"
              value={newTopic}
              onChange={e =>
                setNewTopic(e.target.value)}
              placeholder="What is this piece about?"
              style={{
                width: '100%',
                padding: '7px 10px',
                border: '1px solid var(--mgray)',
                borderRadius: 8,
                fontSize: 12,
                color: 'var(--navy)',
                marginBottom: 10,
              }} />

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 10, marginBottom: 12,
            }}>
              <div>
                <div className="label"
                  style={{ marginBottom: 4 }}>
                  Type
                </div>
                <select
                  value={newType}
                  onChange={e =>
                    setNewType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '7px 10px',
                    border:
                      '1px solid var(--mgray)',
                    borderRadius: 8,
                    fontSize: 12,
                    color: 'var(--navy)',
                  }}>
                  {TYPES.map(t => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div className="label"
                  style={{ marginBottom: 4 }}>
                  Scheduled Date
                </div>
                <input type="date"
                  value={newDate}
                  onChange={e =>
                    setNewDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '7px 10px',
                    border:
                      '1px solid var(--mgray)',
                    borderRadius: 8,
                    fontSize: 12,
                    color: 'var(--navy)',
                  }} />
              </div>
            </div>

            <div style={{
              display: 'flex', gap: 8,
            }}>
              <button
                onClick={addItem}
                disabled={
                  !newTitle.trim() &&
                  !newTopic.trim()
                }
                style={{
                  padding: '8px 20px',
                  background:
                    newTitle.trim() ||
                    newTopic.trim()
                      ? 'var(--teal)'
                      : 'var(--mgray)',
                  color: 'var(--white)',
                  border: 'none', borderRadius: 8,
                  fontSize: 12, fontWeight: 700,
                  cursor: 'pointer',
                }}>
                Add to Queue
              </button>
              <button
                onClick={() => setShowAdd(false)}
                style={{
                  padding: '8px 16px',
                  background: 'var(--lgray)',
                  border: 'none', borderRadius: 8,
                  fontSize: 12,
                  color: 'var(--slate)',
                  cursor: 'pointer',
                }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Content detail */}
        {selected && !showAdd && (
          <div style={{ maxWidth: 620 }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: 16,
            }}>
              <div>
                <div style={{
                  display: 'flex',
                  gap: 8, marginBottom: 6,
                }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 20,
                    background:
                      `${TYPE_COLOR[selected.type]
                      ?? 'var(--slate)'}18`,
                    color:
                      TYPE_COLOR[selected.type] ??
                      'var(--slate)',
                    fontFamily:
                      'Courier New, monospace',
                  }}>
                    {selected.type}
                  </span>
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 20,
                    background:
                      STATUS_BG[selected.status]
                      ?? '#F4F7F8',
                    color:
                      STATUS_COLOR[selected.status]
                      ?? 'var(--slate)',
                  }}>
                    {selected.status}
                  </span>
                </div>
                <h3 style={{ marginBottom: 2 }}>
                  {selected.title ??
                    selected.topic ?? 'Untitled'}
                </h3>
                {selected.topic &&
                  selected.title && (
                  <div style={{
                    fontSize: 12,
                    color: 'var(--slate)',
                  }}>
                    {selected.topic}
                  </div>
                )}
              </div>
              <div style={{
                display: 'flex', gap: 6,
              }}>
                {selected.status !== 'published' && (
                  <button
                    onClick={() => {
                      setEditDraft(!editDraft);
                      setDraftText(
                        selected.draft_text ?? ''
                      );
                    }}
                    style={{
                      padding: '6px 12px',
                      background: editDraft
                        ? 'var(--mgray)'
                        : 'var(--teal)',
                      color: editDraft
                        ? 'var(--slate)'
                        : 'var(--white)',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 11, fontWeight: 700,
                      cursor: 'pointer',
                    }}>
                    {editDraft
                      ? 'Cancel' : 'Edit Draft'}
                  </button>
                )}
                <button
                  onClick={() =>
                    deleteItem(selected)}
                  style={{
                    padding: '6px 12px',
                    background: '#F05F5712',
                    border:
                      '1px solid var(--coral)',
                    borderRadius: 8,
                    fontSize: 11,
                    color: 'var(--coral)',
                    cursor: 'pointer',
                  }}>
                  Delete
                </button>
              </div>
            </div>

            {/* Draft editor */}
            {editDraft && (
              <div style={{ marginBottom: 16 }}>
                <div className="label"
                  style={{ marginBottom: 4 }}>
                  Draft
                </div>
                <textarea
                  value={draftText}
                  onChange={e =>
                    setDraftText(e.target.value)}
                  rows={12}
                  placeholder="Write or paste your draft here..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--mgray)',
                    borderRadius: 8,
                    fontSize: 13,
                    color: 'var(--navy)',
                    resize: 'vertical',
                    fontFamily:
                      'Trebuchet MS, sans-serif',
                    lineHeight: 1.6,
                    marginBottom: 10,
                  }} />
                <button
                  onClick={() =>
                    saveDraft(selected)}
                  style={{
                    padding: '8px 20px',
                    background: saved
                      ? 'var(--green)'
                      : 'var(--teal)',
                    color: 'var(--white)',
                    border: 'none', borderRadius: 8,
                    fontSize: 12, fontWeight: 700,
                    cursor: 'pointer',
                  }}>
                  {saved ? 'Saved ✓' : 'Save Draft'}
                </button>
              </div>
            )}

            {/* Existing draft */}
            {!editDraft && selected.draft_text && (
              <div style={{
                background: 'var(--lgray)',
                borderRadius: 10,
                padding: '14px 16px',
                marginBottom: 16,
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8,
                }}>
                  <div className="label">
                    Draft
                  </div>
                  <button
                    onClick={() =>
                      copyDraft(
                        selected.draft_text!
                      )}
                    style={{
                      padding: '4px 10px',
                      background: copied
                        ? 'var(--green2)'
                        : 'var(--teal2)',
                      border: 'none',
                      borderRadius: 6,
                      fontSize: 10, fontWeight: 700,
                      color: copied
                        ? 'var(--green)'
                        : 'var(--navy)',
                      cursor: 'pointer',
                    }}>
                    {copied ? 'Copied ✓' : 'Copy'}
                  </button>
                </div>
                <pre style={{
                  fontSize: 12,
                  color: 'var(--navy)',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  fontFamily:
                    'Trebuchet MS, sans-serif',
                  maxHeight: 300,
                  overflowY: 'auto',
                }}>
                  {selected.draft_text}
                </pre>
              </div>
            )}

            {/* Publish */}
            {selected.status !== 'published' && (
              <div style={{
                background: 'var(--white)',
                border: '1px solid var(--mgray)',
                borderTop:
                  '3px solid var(--green)',
                borderRadius: 10,
                padding: '14px 16px',
              }}>
                <div className="label"
                  style={{ marginBottom: 6 }}>
                  Mark as Published
                </div>
                <input type="text"
                  value={pubUrl}
                  onChange={e =>
                    setPubUrl(e.target.value)}
                  placeholder="Published URL (optional)"
                  style={{
                    width: '100%',
                    padding: '7px 10px',
                    border: '1px solid var(--mgray)',
                    borderRadius: 8,
                    fontSize: 12,
                    color: 'var(--navy)',
                    marginBottom: 8,
                  }} />
                <button
                  onClick={() =>
                    markPublished(selected)}
                  style={{
                    padding: '7px 16px',
                    background: 'var(--green)',
                    color: 'var(--white)',
                    border: 'none', borderRadius: 8,
                    fontSize: 12, fontWeight: 700,
                    cursor: 'pointer',
                  }}>
                  Mark Published ✓
                </button>
              </div>
            )}

            {selected.published_url && (
              <div style={{
                marginTop: 12, fontSize: 12,
                color: 'var(--teal)',
              }}>
                Published:{' '}
                <a
                  href={selected.published_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    color: 'var(--teal)',
                  }}>
                  {selected.published_url}
                </a>
              </div>
            )}
          </div>
        )}

        {!selected && !showAdd && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '60%',
            flexDirection: 'column', gap: 12,
          }}>
            <div style={{
              fontSize: 32,
              color: 'var(--teal2)',
            }}>
              📝
            </div>
            <div style={{
              fontSize: 13,
              color: 'var(--slate)',
            }}>
              Select an item or add new content.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
