import { useState, useEffect } from 'react';
import { getDb } from '../services/db';
import { v4 as uuidv4 } from 'uuid';

interface IdentityRow {
  full_name: string;
  credentials: string | null;
  title: string | null;
  company: string | null;
  location: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  linkedin: string | null;
  bni_chapter: string | null;
  bio_short: string | null;
  bio_long: string | null;
  resume_text: string | null;
  dissertation_summary: string | null;
  frameworks_summary: string | null;
  pricing_model: string | null;
  stz_framework_summary: string | null;
}

const FIELDS: {
  key: keyof IdentityRow;
  label: string;
  type: 'input' | 'textarea';
  rows?: number;
  placeholder: string;
}[] = [
  { key: 'full_name',    label: 'Full Name',
    type: 'input',
    placeholder: 'Dr. Zubia Mughal' },
  { key: 'credentials', label: 'Credentials',
    type: 'input',
    placeholder: 'Ed.D.' },
  { key: 'title',       label: 'Title',
    type: 'input',
    placeholder: 'AI Transformation Lead | Founder' },
  { key: 'company',     label: 'Company',
    type: 'input',
    placeholder: 'Dr. Data Decision Intelligence LLC' },
  { key: 'location',    label: 'Location',
    type: 'input',
    placeholder: 'Milwaukee, WI' },
  { key: 'email',       label: 'Email',
    type: 'input',
    placeholder: 'zubiamL4L@gmail.com' },
  { key: 'phone',       label: 'Phone',
    type: 'input',
    placeholder: '414-544-7777' },
  { key: 'website',     label: 'Website',
    type: 'input',
    placeholder: 'drdatadecisionintelligence.com' },
  { key: 'linkedin',    label: 'LinkedIn',
    type: 'input',
    placeholder: 'linkedin.com/in/zubiamughal' },
  { key: 'bni_chapter', label: 'BNI Chapter',
    type: 'input',
    placeholder: 'Revenue by Referrals' },
  { key: 'bio_short',
    label: 'Bio — Short (injected into every prompt)',
    type: 'textarea', rows: 4,
    placeholder: '2-3 sentences. What you do, who you serve, what makes you different.' },
  { key: 'bio_long',
    label: 'Bio — Long',
    type: 'textarea', rows: 8,
    placeholder: 'Full professional bio.' },
  { key: 'resume_text',
    label: 'Resume / Career History',
    type: 'textarea', rows: 10,
    placeholder: 'Paste your resume text here. Used for positioning and proposal generation.' },
  { key: 'dissertation_summary',
    label: 'Dissertation Summary',
    type: 'textarea', rows: 6,
    placeholder: 'Summarize your Ed.D. dissertation and its relevance to your practice.' },
  { key: 'frameworks_summary',
    label: 'Frameworks and Methodology',
    type: 'textarea', rows: 6,
    placeholder: 'Describe the STZ Framework, your methodology, and how you apply it.' },
  { key: 'pricing_model',
    label: 'Pricing Model',
    type: 'textarea', rows: 6,
    placeholder: 'The Spark $1,499 — The Pulse $3,500 + $199/mo — The Vault $7,500 + $349/mo — The Scale $499/quarter' },
  { key: 'stz_framework_summary',
    label: 'STZ Framework Summary',
    type: 'textarea', rows: 8,
    placeholder: 'The Skill Threshold Zone explained in your own words. This is injected when generating thought leadership content.' },
];

export function MyIdentity() {
  const [form, setForm] = useState<IdentityRow>({
    full_name: '',
    credentials: '',
    title: '',
    company: '',
    location: '',
    email: '',
    phone: '',
    website: '',
    linkedin: '',
    bni_chapter: '',
    bio_short: '',
    bio_long: '',
    resume_text: '',
    dissertation_summary: '',
    frameworks_summary: '',
    pricing_model: '',
    stz_framework_summary: '',
  });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const db = await getDb();
      const rows = await db.select<IdentityRow[]>(
        `SELECT full_name, credentials, title,
                company, location, email, phone,
                website, linkedin, bni_chapter,
                bio_short, bio_long, resume_text,
                dissertation_summary,
                frameworks_summary, pricing_model,
                stz_framework_summary
         FROM identity WHERE id = 'zubia'`
      );
      if (rows.length > 0) {
        const r = rows[0];
        setForm({
          full_name: r.full_name ?? '',
          credentials: r.credentials ?? '',
          title: r.title ?? '',
          company: r.company ?? '',
          location: r.location ?? '',
          email: r.email ?? '',
          phone: r.phone ?? '',
          website: r.website ?? '',
          linkedin: r.linkedin ?? '',
          bni_chapter: r.bni_chapter ?? '',
          bio_short: r.bio_short ?? '',
          bio_long: r.bio_long ?? '',
          resume_text: r.resume_text ?? '',
          dissertation_summary:
            r.dissertation_summary ?? '',
          frameworks_summary:
            r.frameworks_summary ?? '',
          pricing_model: r.pricing_model ?? '',
          stz_framework_summary:
            r.stz_framework_summary ?? '',
        });
      }
    } catch (err) {
      console.error('MyIdentity load error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    const db = await getDb();
    await db.execute(
      `UPDATE identity SET
         full_name = ?,
         credentials = ?,
         title = ?,
         company = ?,
         location = ?,
         email = ?,
         phone = ?,
         website = ?,
         linkedin = ?,
         bni_chapter = ?,
         bio_short = ?,
         bio_long = ?,
         resume_text = ?,
         dissertation_summary = ?,
         frameworks_summary = ?,
         pricing_model = ?,
         stz_framework_summary = ?,
         updated_at = datetime('now')
       WHERE id = 'zubia'`,
      [
        form.full_name,
        form.credentials || null,
        form.title || null,
        form.company || null,
        form.location || null,
        form.email || null,
        form.phone || null,
        form.website || null,
        form.linkedin || null,
        form.bni_chapter || null,
        form.bio_short || null,
        form.bio_long || null,
        form.resume_text || null,
        form.dissertation_summary || null,
        form.frameworks_summary || null,
        form.pricing_model || null,
        form.stz_framework_summary || null,
      ]
    );
    await db.execute(
      `INSERT INTO audit_log
         (log_id, action, entity_type,
          entity_id, details)
       VALUES (?, 'identity_updated', 'identity',
               'zubia', 'Identity fields saved')`,
      [uuidv4()]
    );
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

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
    <div style={{ padding: 32, maxWidth: 760 }}>
      <h2 style={{ marginBottom: 4 }}>My Identity</h2>
      <p style={{
        color: 'var(--slate)', fontSize: 13,
        marginBottom: 6,
      }}>
        Everything here is injected into every job
        system prompt. The more complete this is,
        the more every output sounds like you.
      </p>
      <div style={{
        background: 'var(--teal3)',
        border: '1px solid var(--teal2)',
        borderRadius: 8,
        padding: '10px 14px',
        fontSize: 11,
        color: 'var(--navy)',
        marginBottom: 28,
        fontFamily: 'Courier New, monospace',
      }}>
        Start with Bio Short — it is the most
        important field. Every job reads it first.
      </div>

      {FIELDS.map(f => (
        <div key={f.key} style={{ marginBottom: 18 }}>
          <div className="label"
            style={{ marginBottom: 5 }}>
            {f.label}
          </div>
          {f.type === 'input' ? (
            <input
              type="text"
              value={form[f.key] ?? ''}
              onChange={e => setForm({
                ...form, [f.key]: e.target.value
              })}
              placeholder={f.placeholder}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid var(--mgray)',
                borderRadius: 8,
                fontSize: 13,
                color: 'var(--navy)',
                background: 'var(--white)',
              }} />
          ) : (
            <textarea
              value={form[f.key] ?? ''}
              onChange={e => setForm({
                ...form, [f.key]: e.target.value
              })}
              placeholder={f.placeholder}
              rows={f.rows ?? 4}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid var(--mgray)',
                borderRadius: 8,
                fontSize: 13,
                color: 'var(--navy)',
                background: 'var(--white)',
                resize: 'vertical',
                fontFamily:
                  'Trebuchet MS, Segoe UI, sans-serif',
                lineHeight: 1.6,
              }} />
          )}
        </div>
      ))}

      <button
        onClick={save}
        style={{
          padding: '10px 28px',
          background: saved
            ? 'var(--green)' : 'var(--teal)',
          color: 'var(--white)',
          border: 'none', borderRadius: 8,
          fontSize: 13, fontWeight: 700,
          cursor: 'pointer',
          position: 'sticky',
          bottom: 24,
        }}>
        {saved ? 'Saved ✓' : 'Save Identity'}
      </button>
    </div>
  );
}
