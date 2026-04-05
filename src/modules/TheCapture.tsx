import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { getDb } from '../services/db';
import { v4 as uuidv4 } from 'uuid';

interface AhaMoment {
  aha_id: string;
  raw_input: string;
  key_insight: string | null;
  stz_layer: number | null;
  domain_area: string | null;
  source_title: string | null;
  content_worthy: number;
  created_at: string;
}

const LAYER_LABELS: Record<number, string> = {
  1: 'L1 Prompts',
  2: 'L2 Skills',
  3: 'L3 Agents',
  4: 'L4 Contracts',
  5: 'L5 Evaluation',
};

const LAYER_COLORS: Record<number, string> = {
  1: 'var(--teal)',
  2: 'var(--navy)',
  3: 'var(--gold)',
  4: 'var(--coral)',
  5: '#6B5EA8',
};

export function TheCapture() {
  const [input, setInput] = useState('');
  const [sourceTitle, setSourceTitle] = useState('');
  const [processing, setProcessing] = useState(false);
  const [recent, setRecent] = useState<AhaMoment[]>([]);
  const [justSaved, setJustSaved] = useState(false);
  const [error, setError] = useState<string | null>(
    null
  );

  useEffect(() => { loadRecent(); }, []);

  async function loadRecent() {
    try {
      const db = await getDb();
      const rows = await db.select<AhaMoment[]>(
        `SELECT aha_id, raw_input, key_insight,
                stz_layer, domain_area,
                source_title, content_worthy,
                created_at
         FROM aha_moments
         ORDER BY created_at DESC LIMIT 10`
      );
      setRecent(rows);
    } catch (err) {
      console.error('TheCapture load error:', err);
    }
  }

  async function handleCapture() {
    if (!input.trim()) return;
    setProcessing(true);
    setError(null);

    try {
      const db = await getDb();

      const identity = await db.select<{
        full_name: string;
        bio_short: string | null;
      }[]>(
        `SELECT full_name, bio_short
         FROM identity WHERE id = 'zubia'`
      );

      const identityStr = identity.length > 0
        ? `${identity[0].full_name}. ${identity[0].bio_short ?? ''}`
        : 'Dr. Zubia Mughal, AI Transformation Lead.';

      const systemPrompt =
        `You are an intelligence extraction system for ${identityStr}

Your job is to extract structured intelligence from raw input.

Always respond with ONLY this exact format — no extra text:

INSIGHT: [one sentence capturing the core idea]
LAYER: [1, 2, 3, 4, or 5 — which STZ layer this connects to, or 0 if none]
DOMAIN: [one word or short phrase — the domain area]
CONTENT: [YES or NO — is this worth turning into a LinkedIn post or blog?]

STZ Layer Guide:
L1 Prompts — how experts think, reasoning style, vocabulary
L2 Skills — discrete operations, steps, named processes
L3 Agents — workflows, triggers, automation, sequences
L4 Contracts — boundaries, approvals, what AI handles vs human
L5 Evaluation — quality, correction, improvement, measurement`;

      const userPrompt =
        `Extract intelligence from this input:\n\n${input.trim()}`;

      const raw = await invoke<string>(
        'ollama_generate',
        {
          prompt: userPrompt,
          system: systemPrompt,
        }
      );

      let keyInsight: string | null = null;
      let stzLayer: number | null = null;
      let domainArea: string | null = null;
      let contentWorthy = 0;

      const lines = raw.split('\n');
      for (const line of lines) {
        if (line.startsWith('INSIGHT:')) {
          keyInsight = line
            .replace('INSIGHT:', '').trim();
        } else if (line.startsWith('LAYER:')) {
          const n = parseInt(
            line.replace('LAYER:', '').trim()
          );
          stzLayer = n >= 1 && n <= 5 ? n : null;
        } else if (line.startsWith('DOMAIN:')) {
          domainArea = line
            .replace('DOMAIN:', '').trim();
        } else if (line.startsWith('CONTENT:')) {
          contentWorthy = line
            .includes('YES') ? 1 : 0;
        }
      }

      const ahaId = uuidv4();
      await db.execute(
        `INSERT INTO aha_moments
           (aha_id, raw_input, input_type,
            key_insight, stz_layer, domain_area,
            source_title, content_worthy)
         VALUES (?, ?, 'text', ?, ?, ?, ?, ?)`,
        [
          ahaId,
          input.trim(),
          keyInsight,
          stzLayer,
          domainArea,
          sourceTitle.trim() || null,
          contentWorthy,
        ]
      );

      await db.execute(
        `INSERT INTO audit_log
           (log_id, action, entity_type,
            entity_id, details)
         VALUES (?, 'aha_captured',
                 'aha_moments', ?, ?)`,
        [
          uuidv4(), ahaId,
          `Insight: ${keyInsight ?? 'extracted'}`,
        ]
      );

      setInput('');
      setSourceTitle('');
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 3000);
      await loadRecent();

    } catch (err) {
      setError(String(err));
    } finally {
      setProcessing(false);
    }
  }

  async function sendToContentQueue(
    aha: AhaMoment
  ) {
    const db = await getDb();
    await db.execute(
      `INSERT INTO content_queue
         (content_id, type, title, topic,
          status, draft_text)
       VALUES (?, 'linkedin', ?, ?, 'queued', ?)`,
      [
        uuidv4(),
        aha.key_insight ?? 'Untitled',
        aha.domain_area ?? '',
        aha.raw_input,
      ]
    );
    await loadRecent();
  }

  return (
    <div style={{ padding: 32, maxWidth: 800 }}>

      {/* Header */}
      <h2 style={{ marginBottom: 4 }}>
        The Capture
      </h2>
      <p style={{
        color: 'var(--slate)', fontSize: 13,
        marginBottom: 24,
      }}>
        You read something. You thought of something.
        Get it in before it disappears.
        The system extracts the insight,
        tags it to your STZ layers,
        and builds your knowledge graph.
      </p>

      {/* Input panel */}
      <div style={{
        background: 'var(--white)',
        border: '1px solid var(--mgray)',
        borderLeft: '4px solid var(--gold)',
        borderRadius: 12,
        padding: '20px 22px',
        marginBottom: 24,
      }}>
        <div className="label"
          style={{ marginBottom: 6 }}>
          What did you just read, think, or discover?
        </div>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Paste an article paragraph, a quote, a thought, a client observation, a research finding... anything that just clicked for you."
          rows={6}
          style={{
            width: '100%',
            padding: '10px 12px',
            border: '1px solid var(--mgray)',
            borderRadius: 8,
            fontSize: 13,
            color: 'var(--navy)',
            resize: 'vertical',
            fontFamily:
              'Trebuchet MS, Segoe UI, sans-serif',
            lineHeight: 1.6,
            marginBottom: 12,
          }} />

        <div style={{
          display: 'flex', gap: 10,
          alignItems: 'center', flexWrap: 'wrap',
        }}>
          <input
            type="text"
            value={sourceTitle}
            onChange={e =>
              setSourceTitle(e.target.value)}
            placeholder="Source title (optional)"
            style={{
              flex: 1, minWidth: 200,
              padding: '8px 12px',
              border: '1px solid var(--mgray)',
              borderRadius: 8,
              fontSize: 12,
              color: 'var(--navy)',
            }} />

          <button
            onClick={handleCapture}
            disabled={!input.trim() || processing}
            style={{
              padding: '9px 24px',
              background: processing
                ? 'var(--mgray)'
                : justSaved
                ? 'var(--green)'
                : 'var(--gold)',
              color: input.trim() && !processing
                ? 'var(--white)' : 'var(--slate)',
              border: 'none', borderRadius: 8,
              fontSize: 13, fontWeight: 700,
              cursor: input.trim() && !processing
                ? 'pointer' : 'default',
              minWidth: 140,
            }}>
            {processing
              ? 'Extracting...'
              : justSaved
              ? 'Captured ✓'
              : 'Capture + Extract'}
          </button>
        </div>

        {error && (
          <div style={{
            marginTop: 10, fontSize: 11,
            color: 'var(--coral)',
            fontFamily: 'Courier New, monospace',
          }}>
            {error}
          </div>
        )}
      </div>

      {/* Recent captures */}
      {recent.length > 0 && (
        <div>
          <div className="label"
            style={{ marginBottom: 12 }}>
            Recent captures
          </div>
          {recent.map(aha => (
            <div key={aha.aha_id} style={{
              background: 'var(--white)',
              border: '1px solid var(--mgray)',
              borderLeft: `4px solid ${
                aha.stz_layer
                  ? LAYER_COLORS[aha.stz_layer]
                  : 'var(--mgray)'}`,
              borderRadius: 10,
              padding: '14px 16px',
              marginBottom: 10,
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: 12,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: 13, fontWeight: 700,
                    color: 'var(--navy)',
                    marginBottom: 4,
                    lineHeight: 1.4,
                  }}>
                    {aha.key_insight ??
                      'Processing...'}
                  </div>
                  <div style={{
                    display: 'flex',
                    gap: 8, flexWrap: 'wrap',
                    marginBottom: 6,
                  }}>
                    {aha.stz_layer != null &&
                      aha.stz_layer >= 1 &&
                      aha.stz_layer <= 5 && (
                      <span style={{
                        fontSize: 9,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 20,
                        background:
                          `${LAYER_COLORS[aha.stz_layer]}18`,
                        color:
                          LAYER_COLORS[aha.stz_layer],
                        fontFamily:
                          'Courier New, monospace',
                      }}>
                        {LAYER_LABELS[aha.stz_layer]}
                      </span>
                    )}
                    {aha.domain_area && (
                      <span style={{
                        fontSize: 9,
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: 20,
                        background: 'var(--lgray)',
                        color: 'var(--slate)',
                        fontFamily:
                          'Courier New, monospace',
                      }}>
                        {aha.domain_area}
                      </span>
                    )}
                    {aha.source_title && (
                      <span style={{
                        fontSize: 9,
                        color: 'var(--slate)',
                        fontStyle: 'italic',
                      }}>
                        {aha.source_title}
                      </span>
                    )}
                  </div>
                  <div style={{
                    fontSize: 11,
                    color: 'var(--slate)',
                    lineHeight: 1.5,
                    maxHeight: 60,
                    overflow: 'hidden',
                  }}>
                    {aha.raw_input.slice(0, 200)}
                    {aha.raw_input.length > 200
                      ? '...' : ''}
                  </div>
                </div>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6, flexShrink: 0,
                }}>
                  <span style={{
                    fontSize: 9,
                    color: 'var(--slate)',
                    fontFamily:
                      'Courier New, monospace',
                    textAlign: 'right',
                  }}>
                    {aha.created_at.slice(0, 10)}
                  </span>
                  {aha.content_worthy === 1 && (
                    <button
                      onClick={() =>
                        sendToContentQueue(aha)}
                      style={{
                        padding: '4px 10px',
                        background: 'var(--teal2)',
                        border: 'none',
                        borderRadius: 6,
                        fontSize: 10,
                        fontWeight: 700,
                        color: 'var(--navy)',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}>
                      → Content Queue
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {recent.length === 0 && (
        <div style={{
          background: 'var(--lgray)',
          borderRadius: 10,
          padding: '20px 24px',
          textAlign: 'center',
          fontSize: 13,
          color: 'var(--slate)',
        }}>
          No captures yet. Paste something above
          and hit Capture + Extract.
        </div>
      )}
    </div>
  );
}
