import { useState, useEffect, type CSSProperties } from 'react';
import { getDb } from '../services/db';
import { v4 as uuidv4 } from 'uuid';

interface Contact {
  contact_id: string;
  full_name: string;
  company: string | null;
  role: string | null;
  vertical: string | null;
  email: string | null;
  phone: string | null;
  linkedin: string | null;
  source: string | null;
  status: string;
  zone_position: string | null;
  last_contact: string | null;
  next_action: string | null;
  next_action_date: string | null;
  notes: string | null;
  bni_member: number;
  gone_quiet: number;
}

type ContactFormState = Omit<
  Contact,
  'contact_id' | 'bni_member' | 'gone_quiet'
>;

const STATUS_COLOR: Record<string, string> = {
  prospect:  'var(--gold)',
  active:    'var(--teal)',
  paused:    'var(--slate)',
  closed:    'var(--mgray)',
  inactive:  'var(--mgray)',
};

const STATUS_BG: Record<string, string> = {
  prospect:  '#C8974A18',
  active:    '#3BBFBF18',
  paused:    '#F4F7F8',
  closed:    '#F4F7F8',
  inactive:  '#F4F7F8',
};

const STATUSES = [
  'prospect', 'active', 'paused', 'closed',
];

const VERTICALS = [
  'Coaching', 'Marketing Agency', 'Consulting',
  'Legal Advisory', 'Financial Advisory',
  'Chiropractic', 'Therapeutic Services',
  'Healthcare', 'Technology', 'Other',
];

const SOURCES = [
  'BNI', 'Referral', 'LinkedIn', 'Website',
  'Conference', 'Cold Outreach', 'Other',
];

const BLANK: ContactFormState = {
  full_name: '',
  company: '',
  role: '',
  vertical: '',
  email: '',
  phone: '',
  linkedin: '',
  source: '',
  status: 'prospect',
  zone_position: '',
  last_contact: '',
  next_action: '',
  next_action_date: '',
  notes: '',
};

const EDIT_FIELDS = [
  ['Full Name', 'full_name', 'text'],
  ['Company', 'company', 'text'],
  ['Role', 'role', 'text'],
  ['Email', 'email', 'email'],
  ['Phone', 'phone', 'text'],
  ['LinkedIn', 'linkedin', 'text'],
  ['Last Contact', 'last_contact', 'date'],
  ['Next Action Date', 'next_action_date', 'date'],
] as const;

export function MyPipeline() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selected, setSelected] = useState<Contact | null>(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<ContactFormState>({ ...BLANK });
  const [editMode, setEditMode] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load(): Promise<Contact[]> {
    let rows: Contact[] = [];
    try {
      const db = await getDb();
      rows = await db.select<Contact[]>(
        `SELECT contact_id, full_name, company,
                role, vertical, email, phone,
                linkedin, source, status,
                zone_position, last_contact,
                next_action, next_action_date,
                notes, bni_member, gone_quiet
         FROM contacts
         WHERE status != 'inactive'
         ORDER BY gone_quiet DESC,
                  last_contact ASC,
                  full_name ASC`
      );
      setContacts(rows);
    } catch (err) {
      console.error('MyPipeline load error:', err);
    } finally {
      setLoading(false);
    }
    return rows;
  }

  async function addContact() {
    if (!form.full_name.trim()) return;
    const db = await getDb();
    const id = uuidv4();
    await db.execute(
      `INSERT INTO contacts
         (contact_id, full_name, company, role,
          vertical, email, phone, linkedin,
          source, status, zone_position,
          last_contact, next_action,
          next_action_date, notes,
          bni_member, gone_quiet)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,0,0)`,
      [
        id,
        form.full_name.trim(),
        form.company || null,
        form.role || null,
        form.vertical || null,
        form.email || null,
        form.phone || null,
        form.linkedin || null,
        form.source || null,
        form.status,
        form.zone_position || null,
        form.last_contact || null,
        form.next_action || null,
        form.next_action_date || null,
        form.notes || null,
      ]
    );
    await db.execute(
      `INSERT INTO audit_log
         (log_id, action, entity_type,
          entity_id, details)
       VALUES (?, 'contact_added',
               'contacts', ?, ?)`,
      [uuidv4(), id, form.full_name.trim()]
    );
    setForm({ ...BLANK });
    setShowAdd(false);
    await load();
  }

  async function saveEdit() {
    if (!selected) return;
    const db = await getDb();
    await db.execute(
      `UPDATE contacts SET
         full_name = ?, company = ?, role = ?,
         vertical = ?, email = ?, phone = ?,
         linkedin = ?, source = ?, status = ?,
         zone_position = ?, last_contact = ?,
         next_action = ?, next_action_date = ?,
         notes = ?, updated_at = datetime('now')
       WHERE contact_id = ?`,
      [
        form.full_name.trim(),
        form.company || null,
        form.role || null,
        form.vertical || null,
        form.email || null,
        form.phone || null,
        form.linkedin || null,
        form.source || null,
        form.status,
        form.zone_position || null,
        form.last_contact || null,
        form.next_action || null,
        form.next_action_date || null,
        form.notes || null,
        selected.contact_id,
      ]
    );
    await db.execute(
      `INSERT INTO audit_log
         (log_id, action, entity_type,
          entity_id, details)
       VALUES (?, 'contact_updated',
               'contacts', ?, ?)`,
      [
        uuidv4(),
        selected.contact_id,
        form.full_name.trim(),
      ]
    );
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setEditMode(false);
    const refreshed = await load();
    const updated = refreshed.find(
      c => c.contact_id === selected.contact_id
    );
    if (updated) setSelected(updated);
  }

  async function toggleGoneQuiet(c: Contact) {
    const db = await getDb();
    const newVal = c.gone_quiet === 1 ? 0 : 1;
    await db.execute(
      `UPDATE contacts SET gone_quiet = ?,
         updated_at = datetime('now')
       WHERE contact_id = ?`,
      [newVal, c.contact_id]
    );
    await db.execute(
      `INSERT INTO audit_log
         (log_id, action, entity_type,
          entity_id, details)
       VALUES (?, 'gone_quiet_toggled',
               'contacts', ?, ?)`,
      [
        uuidv4(), c.contact_id,
        `gone_quiet → ${newVal}`,
      ]
    );
    await load();
  }

  function startEdit(c: Contact) {
    setForm({
      full_name: c.full_name,
      company: c.company ?? '',
      role: c.role ?? '',
      vertical: c.vertical ?? '',
      email: c.email ?? '',
      phone: c.phone ?? '',
      linkedin: c.linkedin ?? '',
      source: c.source ?? '',
      status: c.status,
      zone_position: c.zone_position ?? '',
      last_contact: c.last_contact ?? '',
      next_action: c.next_action ?? '',
      next_action_date: c.next_action_date ?? '',
      notes: c.notes ?? '',
    });
    setEditMode(true);
  }

  const filtered = contacts.filter(c => {
    const matchFilter =
      filter === 'all' ||
      (filter === 'quiet' && c.gone_quiet === 1) ||
      c.status === filter;
    const matchSearch =
      c.full_name.toLowerCase().includes(
        search.toLowerCase()
      ) ||
      (c.company ?? '').toLowerCase().includes(
        search.toLowerCase()
      );
    return matchFilter && matchSearch;
  });

  const inputStyle: CSSProperties = {
    width: '100%',
    padding: '7px 10px',
    border: '1px solid var(--mgray)',
    borderRadius: 8,
    fontSize: 12,
    color: 'var(--navy)',
    background: 'var(--white)',
    marginBottom: 10,
  };

  const selectStyle: CSSProperties = { ...inputStyle };

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

      {/* Left panel — list */}
      <div style={{
        width: 280, minWidth: 280,
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
              My Pipeline
              <span style={{
                marginLeft: 6, fontSize: 10,
                color: 'var(--slate)',
                fontFamily: 'Courier New, monospace',
              }}>
                {contacts.length} contacts
              </span>
            </div>
            <button
              onClick={() => {
                setShowAdd(!showAdd);
                setForm({ ...BLANK });
              }}
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

          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name or company..."
            style={{
              width: '100%',
              padding: '7px 10px',
              border: '1px solid var(--mgray)',
              borderRadius: 8,
              fontSize: 12, color: 'var(--navy)',
              marginBottom: 8,
              boxSizing: 'border-box',
            }} />

          <div style={{
            display: 'flex', gap: 4,
            flexWrap: 'wrap',
          }}>
            {[
              'all', 'prospect', 'active',
              'paused', 'quiet',
            ].map(f => (
              <button key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '3px 8px',
                  borderRadius: 20,
                  border: `1px solid ${
                    filter === f
                      ? 'var(--teal)'
                      : 'var(--mgray)'}`,
                  background: filter === f
                    ? 'var(--teal2)'
                    : 'transparent',
                  color: filter === f
                    ? 'var(--teal)'
                    : 'var(--slate)',
                  fontSize: 10,
                  fontWeight: filter === f ? 700 : 400,
                  cursor: 'pointer',
                }}>
                {f === 'quiet'
                  ? '⚠ gone quiet' : f}
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
              No contacts found.
            </div>
          )}
          {filtered.map(c => (
            <div key={c.contact_id}
              onClick={() => {
                setSelected(c);
                setEditMode(false);
              }}
              style={{
                padding: '11px 16px',
                cursor: 'pointer',
                borderBottom:
                  '1px solid var(--lgray)',
                borderLeft:
                  selected?.contact_id ===
                  c.contact_id
                    ? '3px solid var(--teal)'
                    : '3px solid transparent',
                background:
                  selected?.contact_id ===
                  c.contact_id
                    ? 'rgba(59,191,191,0.05)'
                    : 'transparent',
              }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}>
                <div style={{
                  fontSize: 13, fontWeight: 600,
                  color: 'var(--navy)',
                }}>
                  {c.gone_quiet === 1 && (
                    <span style={{
                      color: 'var(--coral)',
                      marginRight: 4,
                    }}>⚠</span>
                  )}
                  {c.full_name}
                </div>
                <span style={{
                  fontSize: 9, fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: 20,
                  background: STATUS_BG[c.status]
                    ?? '#F4F7F8',
                  color: STATUS_COLOR[c.status]
                    ?? 'var(--slate)',
                }}>
                  {c.status}
                </span>
              </div>
              <div style={{
                fontSize: 11,
                color: 'var(--slate)',
                marginTop: 2,
              }}>
                {c.company ?? ''}
                {c.vertical
                  ? ` · ${c.vertical}` : ''}
              </div>
              {c.next_action && (
                <div style={{
                  fontSize: 10,
                  color: 'var(--gold)',
                  marginTop: 3,
                  fontWeight: 600,
                }}>
                  → {c.next_action}
                </div>
              )}
              {c.last_contact && (
                <div style={{
                  fontSize: 10,
                  color: 'var(--slate)',
                  marginTop: 2,
                  fontFamily:
                    'Courier New, monospace',
                }}>
                  last: {c.last_contact}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — detail or add form */}
      <div style={{
        flex: 1, overflowY: 'auto',
        padding: '28px 32px',
      }}>

        {/* Add contact form */}
        {showAdd && (
          <div style={{
            background: 'var(--white)',
            border: '1px solid var(--mgray)',
            borderTop: '4px solid var(--teal)',
            borderRadius: 12,
            padding: '22px 24px',
            maxWidth: 600,
          }}>
            <h3 style={{ marginBottom: 16 }}>
              Add Contact
            </h3>

            <div className="label"
              style={{ marginBottom: 4 }}>
              Full Name *
            </div>
            <input type="text"
              value={form.full_name}
              onChange={e => setForm({
                ...form,
                full_name: e.target.value,
              })}
              placeholder="Full name"
              style={inputStyle} />

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 10,
            }}>
              <div>
                <div className="label"
                  style={{ marginBottom: 4 }}>
                  Company
                </div>
                <input type="text"
                  value={form.company ?? ''}
                  onChange={e => setForm({
                    ...form, company: e.target.value,
                  })}
                  placeholder="Company"
                  style={inputStyle} />
              </div>
              <div>
                <div className="label"
                  style={{ marginBottom: 4 }}>
                  Role
                </div>
                <input type="text"
                  value={form.role ?? ''}
                  onChange={e => setForm({
                    ...form, role: e.target.value,
                  })}
                  placeholder="Role or title"
                  style={inputStyle} />
              </div>
              <div>
                <div className="label"
                  style={{ marginBottom: 4 }}>
                  Vertical
                </div>
                <select
                  value={form.vertical ?? ''}
                  onChange={e => setForm({
                    ...form,
                    vertical: e.target.value,
                  })}
                  style={selectStyle}>
                  <option value="">
                    Select vertical
                  </option>
                  {VERTICALS.map(v => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div className="label"
                  style={{ marginBottom: 4 }}>
                  Source
                </div>
                <select
                  value={form.source ?? ''}
                  onChange={e => setForm({
                    ...form, source: e.target.value,
                  })}
                  style={selectStyle}>
                  <option value="">
                    Select source
                  </option>
                  {SOURCES.map(s => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div className="label"
                  style={{ marginBottom: 4 }}>
                  Email
                </div>
                <input type="email"
                  value={form.email ?? ''}
                  onChange={e => setForm({
                    ...form, email: e.target.value,
                  })}
                  placeholder="Email"
                  style={inputStyle} />
              </div>
              <div>
                <div className="label"
                  style={{ marginBottom: 4 }}>
                  Phone
                </div>
                <input type="text"
                  value={form.phone ?? ''}
                  onChange={e => setForm({
                    ...form, phone: e.target.value,
                  })}
                  placeholder="Phone"
                  style={inputStyle} />
              </div>
              <div>
                <div className="label"
                  style={{ marginBottom: 4 }}>
                  Status
                </div>
                <select
                  value={form.status}
                  onChange={e => setForm({
                    ...form, status: e.target.value,
                  })}
                  style={selectStyle}>
                  {STATUSES.map(s => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div className="label"
                  style={{ marginBottom: 4 }}>
                  Last Contact
                </div>
                <input type="date"
                  value={form.last_contact ?? ''}
                  onChange={e => setForm({
                    ...form,
                    last_contact: e.target.value,
                  })}
                  style={inputStyle} />
              </div>
            </div>

            <div className="label"
              style={{ marginBottom: 4 }}>
              Next Action
            </div>
            <input type="text"
              value={form.next_action ?? ''}
              onChange={e => setForm({
                ...form,
                next_action: e.target.value,
              })}
              placeholder="What is the next step?"
              style={inputStyle} />

            <div className="label"
              style={{ marginBottom: 4 }}>
              Next Action Date
            </div>
            <input type="date"
              value={form.next_action_date ?? ''}
              onChange={e => setForm({
                ...form,
                next_action_date: e.target.value,
              })}
              style={inputStyle} />

            <div className="label"
              style={{ marginBottom: 4 }}>
              Notes
            </div>
            <textarea
              value={form.notes ?? ''}
              onChange={e => setForm({
                ...form, notes: e.target.value,
              })}
              rows={3}
              placeholder="Context, signals, observations..."
              style={{
                ...inputStyle,
                resize: 'vertical',
                fontFamily:
                  'Trebuchet MS, sans-serif',
                lineHeight: 1.5,
              }} />

            <div style={{
              display: 'flex', gap: 8,
              marginTop: 4,
            }}>
              <button
                onClick={addContact}
                disabled={!form.full_name.trim()}
                style={{
                  padding: '8px 20px',
                  background:
                    form.full_name.trim()
                      ? 'var(--teal)'
                      : 'var(--mgray)',
                  color: 'var(--white)',
                  border: 'none', borderRadius: 8,
                  fontSize: 12, fontWeight: 700,
                  cursor: form.full_name.trim()
                    ? 'pointer' : 'default',
                }}>
                Save Contact
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

        {/* Contact detail */}
        {!showAdd && selected && (
          <div style={{ maxWidth: 620 }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: 20,
            }}>
              <div>
                <h2 style={{ marginBottom: 2 }}>
                  {selected.gone_quiet === 1 && (
                    <span style={{
                      color: 'var(--coral)',
                      marginRight: 6,
                    }}>⚠</span>
                  )}
                  {selected.full_name}
                </h2>
                <div style={{
                  fontSize: 13,
                  color: 'var(--slate)',
                }}>
                  {selected.company ?? ''}
                  {selected.role
                    ? ` · ${selected.role}` : ''}
                  {selected.vertical
                    ? ` · ${selected.vertical}` : ''}
                </div>
              </div>
              <div style={{
                display: 'flex', gap: 8,
              }}>
                <button
                  onClick={() =>
                    toggleGoneQuiet(selected)}
                  style={{
                    padding: '6px 12px',
                    background:
                      selected.gone_quiet === 1
                        ? '#F05F5718'
                        : 'var(--lgray)',
                    border: `1px solid ${
                      selected.gone_quiet === 1
                        ? 'var(--coral)'
                        : 'var(--mgray)'}`,
                    borderRadius: 8,
                    fontSize: 11,
                    color: selected.gone_quiet === 1
                      ? 'var(--coral)'
                      : 'var(--slate)',
                    cursor: 'pointer',
                  }}>
                  {selected.gone_quiet === 1
                    ? '⚠ Gone Quiet'
                    : 'Mark Gone Quiet'}
                </button>
                <button
                  onClick={() => {
                    startEdit(selected);
                  }}
                  style={{
                    padding: '6px 14px',
                    background: 'var(--teal)',
                    color: 'var(--white)',
                    border: 'none', borderRadius: 8,
                    fontSize: 11, fontWeight: 700,
                    cursor: 'pointer',
                  }}>
                  Edit
                </button>
              </div>
            </div>

            {!editMode ? (
              <div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 10, marginBottom: 16,
                }}>
                  {([
                    ['Status', selected.status],
                    ['Source', selected.source],
                    ['Email', selected.email],
                    ['Phone', selected.phone],
                    ['Last Contact',
                      selected.last_contact],
                    ['Zone Position',
                      selected.zone_position],
                  ] as const).map(([k, v]) => v ? (
                    <div key={k} style={{
                      background: 'var(--lgray)',
                      borderRadius: 8,
                      padding: '8px 12px',
                    }}>
                      <div className="label"
                        style={{ marginBottom: 2 }}>
                        {k}
                      </div>
                      <div style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: 'var(--navy)',
                      }}>
                        {v}
                      </div>
                    </div>
                  ) : null)}
                </div>

                {selected.next_action && (
                  <div style={{
                    background: '#C8974A10',
                    border:
                      '1px solid var(--gold)',
                    borderRadius: 10,
                    padding: '12px 16px',
                    marginBottom: 12,
                  }}>
                    <div className="label"
                      style={{ marginBottom: 4 }}>
                      Next Action
                    </div>
                    <div style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--navy)',
                    }}>
                      {selected.next_action}
                    </div>
                    {selected.next_action_date && (
                      <div style={{
                        fontSize: 11,
                        color: 'var(--gold)',
                        marginTop: 2,
                        fontFamily:
                          'Courier New, monospace',
                      }}>
                        Due: {selected.next_action_date}
                      </div>
                    )}
                  </div>
                )}

                {selected.notes && (
                  <div style={{
                    background: 'var(--white)',
                    border: '1px solid var(--mgray)',
                    borderLeft:
                      '4px solid var(--teal)',
                    borderRadius: 10,
                    padding: '12px 16px',
                  }}>
                    <div className="label"
                      style={{ marginBottom: 6 }}>
                      Notes
                    </div>
                    <div style={{
                      fontSize: 13,
                      color: 'var(--navy)',
                      lineHeight: 1.6,
                    }}>
                      {selected.notes}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 10,
                }}>
                  {EDIT_FIELDS.map(([label, fieldKey, inputType]) => (
                    <div key={fieldKey}>
                      <div className="label"
                        style={{ marginBottom: 4 }}>
                        {label}
                      </div>
                      <input
                        type={inputType}
                        value={form[fieldKey] ?? ''}
                        onChange={e => setForm({
                          ...form,
                          [fieldKey]: e.target.value,
                        })}
                        style={inputStyle} />
                    </div>
                  ))}
                </div>

                <div className="label"
                  style={{ marginBottom: 4 }}>
                  Status
                </div>
                <select
                  value={form.status}
                  onChange={e => setForm({
                    ...form, status: e.target.value,
                  })}
                  style={selectStyle}>
                  {STATUSES.map(s => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>

                <div className="label"
                  style={{ marginBottom: 4 }}>
                  Next Action
                </div>
                <input type="text"
                  value={form.next_action ?? ''}
                  onChange={e => setForm({
                    ...form,
                    next_action: e.target.value,
                  })}
                  style={inputStyle} />

                <div className="label"
                  style={{ marginBottom: 4 }}>
                  Notes
                </div>
                <textarea
                  value={form.notes ?? ''}
                  onChange={e => setForm({
                    ...form, notes: e.target.value,
                  })}
                  rows={4}
                  style={{
                    ...inputStyle,
                    resize: 'vertical',
                    fontFamily:
                      'Trebuchet MS, sans-serif',
                    lineHeight: 1.5,
                  }} />

                <div style={{
                  display: 'flex',
                  gap: 8, marginTop: 4,
                }}>
                  <button
                    onClick={saveEdit}
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
                    {saved ? 'Saved ✓' : 'Save'}
                  </button>
                  <button
                    onClick={() =>
                      setEditMode(false)}
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
          </div>
        )}

        {!showAdd && !selected && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '60%',
            flexDirection: 'column', gap: 12,
          }}>
            <div style={{
              fontSize: 32, color: 'var(--teal2)',
            }}>
              👤
            </div>
            <div style={{
              fontSize: 13, color: 'var(--slate)',
            }}>
              Select a contact or add a new one.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
