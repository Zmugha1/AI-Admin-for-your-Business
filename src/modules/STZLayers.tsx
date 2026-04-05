import { useState, useEffect } from 'react';
import { getDb } from '../services/db';
import { v4 as uuidv4 } from 'uuid';
import {
  RadialBarChart, RadialBar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip,
  LineChart, Line,
} from 'recharts';

interface STZRow {
  id: string;
  layer: number;
  layer_name: string;
  question_num: number;
  question_text: string;
  probe_text: string | null;
  answer: string;
  builds_file: string | null;
  completed: number;
}

interface AhaMoment {
  aha_id: string;
  key_insight: string | null;
  stz_layer: number | null;
  domain_area: string | null;
  created_at: string;
}

interface JobRun {
  run_at: string;
  quality_score: number | null;
}

const LAYERS = [
  {
    num: 1, name: 'Prompts',
    color: 'var(--teal)',
    description: 'Teaching the system how you think',
  },
  {
    num: 2, name: 'Skills',
    color: 'var(--navy)',
    description: 'Breaking your expertise into named steps',
  },
  {
    num: 3, name: 'Agents',
    color: 'var(--gold)',
    description: 'Sequencing skills into automated workflows',
  },
  {
    num: 4, name: 'Contracts',
    color: 'var(--coral)',
    description: 'Defining what AI handles vs what you approve',
  },
  {
    num: 5, name: 'Evaluation',
    color: '#6B5EA8',
    description: 'Keeping you in the loop and improving over time',
  },
];

type View = 'questions' | 'graph';

export function STZLayers() {
  const [view, setView] = useState<View>('questions');
  const [activeLayer, setActiveLayer] = useState(1);
  const [questions, setQuestions] = useState<Record<number, STZRow[]>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [ahas, setAhas] = useState<AhaMoment[]>([]);
  const [jobRuns, setJobRuns] = useState<JobRun[]>([]);
  const [voiceDepth, setVoiceDepth] = useState<
    { name: string; chars: number }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    try {
      const db = await getDb();

      const rows = await db.select<STZRow[]>(
        `SELECT id, layer, layer_name, question_num,
                question_text, probe_text, answer,
                builds_file, completed
         FROM stz_config
         ORDER BY layer, question_num`
      );
      const grouped: Record<number, STZRow[]> = {};
      const initDrafts: Record<string, string> = {};
      for (const row of rows) {
        if (!grouped[row.layer]) {
          grouped[row.layer] = [];
        }
        grouped[row.layer].push(row);
        initDrafts[row.id] = row.answer ?? '';
      }
      setQuestions(grouped);
      setDrafts(initDrafts);

      const ahaRows = await db.select<AhaMoment[]>(
        `SELECT aha_id, key_insight, stz_layer,
                domain_area, created_at
         FROM aha_moments
         ORDER BY created_at DESC LIMIT 20`
      );
      setAhas(ahaRows);

      const runRows = await db.select<JobRun[]>(
        `SELECT run_at, quality_score
         FROM job_runs
         ORDER BY run_at ASC LIMIT 30`
      );
      setJobRuns(runRows);

      const vl = await db.select<{
        id: string; content: string;
      }[]>(
        `SELECT id, content FROM voice_library
         ORDER BY id`
      );
      setVoiceDepth(vl.map(v => ({
        name: v.id.replace(/_/g, ' '),
        chars: (v.content ?? '').length,
      })));

    } catch (err) {
      console.error('STZLayers load error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function saveAnswer(row: STZRow) {
    const answer = drafts[row.id] ?? '';
    const db = await getDb();

    await db.execute(
      `UPDATE stz_config
       SET answer = ?,
           completed = ?,
           updated_at = datetime('now')
       WHERE id = ?`,
      [answer, answer.trim().length > 0 ? 1 : 0, row.id]
    );

    if (row.layer === 1) {
      const voiceMap: Record<string, string> = {
        q01: 'reasoning_style',
        q02: 'terminology',
        q03: 'output_templates',
        q04: 'edge_case_library',
        q05: 'quality_criteria',
      };
      const voiceId = voiceMap[row.id];
      if (voiceId) {
        await db.execute(
          `UPDATE voice_library
           SET content = ?,
               updated_at = datetime('now')
           WHERE id = ?`,
          [answer, voiceId]
        );
      }
    }

    await db.execute(
      `INSERT INTO audit_log
         (log_id, action, entity_type,
          entity_id, details)
       VALUES (?, 'stz_answer_saved',
               'stz_config', ?, ?)`,
      [
        uuidv4(), row.id,
        `Layer ${row.layer} Q${row.question_num} saved`,
      ]
    );

    setSaved(prev => ({ ...prev, [row.id]: true }));
    setTimeout(() => {
      setSaved(prev => ({ ...prev, [row.id]: false }));
    }, 2000);
    await loadAll();
  }

  async function exportLayer(layerNum: number) {
    const rows = questions[layerNum] ?? [];
    const text = rows.map(r =>
      `Q${r.question_num}: ${r.question_text}\n\n` +
      `A: ${r.answer || '(not yet answered)'}\n\n---`
    ).join('\n\n');
    await navigator.clipboard.writeText(text);
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

  const ahaByLayer = LAYERS.map(l => ({
    name: `L${l.num}`,
    count: ahas.filter(
      a => a.stz_layer === l.num
    ).length,
    fill: l.color,
  }));

  const qualityData = jobRuns.map((r, i) => ({
    run: i + 1,
    score: r.quality_score ?? 0,
  }));

  const layerMeta = LAYERS.find(
    l => l.num === activeLayer
  )!;
  const layerRows = questions[activeLayer] ?? [];
  const completed = layerRows.filter(
    r => r.completed === 1
  ).length;
  const pct = layerRows.length > 0
    ? Math.round((completed / layerRows.length) * 100)
    : 0;

  return (
    <div style={{ padding: 32 }}>

      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
      }}>
        <div>
          <h2 style={{ marginBottom: 4 }}>
            My STZ Layers
          </h2>
          <p style={{
            color: 'var(--slate)', fontSize: 13,
          }}>
            Your expertise being encoded.
            Layer by layer.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['questions', 'graph'] as View[]).map(v => (
            <button key={v}
              onClick={() => setView(v)}
              style={{
                padding: '7px 16px',
                borderRadius: 20,
                border: `1px solid ${view === v
                  ? 'var(--teal)' : 'var(--mgray)'}`,
                background: view === v
                  ? 'var(--teal)' : 'transparent',
                color: view === v
                  ? 'var(--white)' : 'var(--slate)',
                fontSize: 12, fontWeight: 600,
                cursor: 'pointer',
              }}>
              {v === 'questions'
                ? 'Questions' : 'Knowledge Graph'}
            </button>
          ))}
        </div>
      </div>

      {/* KNOWLEDGE GRAPH VIEW */}
      {view === 'graph' && (
        <div>

          {/* STZ completion rings */}
          <div style={{
            background: 'var(--white)',
            border: '1px solid var(--mgray)',
            borderRadius: 12,
            padding: '20px 24px',
            marginBottom: 20,
          }}>
            <div className="label"
              style={{ marginBottom: 16 }}>
              STZ Layer Completion
            </div>
            <div style={{
              display: 'flex', gap: 16,
              flexWrap: 'wrap',
            }}>
              {LAYERS.map(l => {
                const lRows = questions[l.num] ?? [];
                const done = lRows.filter(
                  r => r.completed === 1
                ).length;
                const pctL = lRows.length > 0
                  ? Math.round(
                    (done / lRows.length) * 100
                  ) : 0;
                return (
                  <div key={l.num}
                    onClick={() => {
                      setView('questions');
                      setActiveLayer(l.num);
                    }}
                    style={{
                      textAlign: 'center',
                      cursor: 'pointer',
                      flex: '1 1 120px',
                    }}>
                    <ResponsiveContainer
                      width="100%" height={100}>
                      <RadialBarChart
                        innerRadius="60%"
                        outerRadius="100%"
                        data={[{
                          value: pctL, fill: l.color,
                        }]}
                        startAngle={90}
                        endAngle={-270}>
                        <RadialBar
                          dataKey="value"
                          cornerRadius={4}
                          background={{
                            fill: 'var(--lgray)',
                          }} />
                      </RadialBarChart>
                    </ResponsiveContainer>
                    <div style={{
                      fontSize: 18, fontWeight: 800,
                      color: l.color,
                      marginTop: -8,
                    }}>
                      {pctL}%
                    </div>
                    <div style={{
                      fontSize: 11, fontWeight: 700,
                      color: 'var(--navy)',
                      marginTop: 2,
                    }}>
                      L{l.num} {l.name}
                    </div>
                    <div style={{
                      fontSize: 10,
                      color: 'var(--slate)',
                    }}>
                      {done}/{lRows.length} answered
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 16, marginBottom: 16,
          }}>

            {/* Voice library depth */}
            <div style={{
              background: 'var(--white)',
              border: '1px solid var(--mgray)',
              borderRadius: 12,
              padding: '18px 20px',
            }}>
              <div className="label"
                style={{ marginBottom: 12 }}>
                Voice Library Depth
              </div>
              {voiceDepth.length === 0 ? (
                <div style={{
                  fontSize: 12,
                  color: 'var(--slate)',
                }}>
                  Answer Layer 1 questions to build
                  your voice library.
                </div>
              ) : (
                <ResponsiveContainer
                  width="100%" height={160}>
                  <BarChart data={voiceDepth}
                    layout="vertical">
                    <XAxis type="number"
                      tick={{ fontSize: 9 }}
                      tickFormatter={v =>
                        `${v} chars`} />
                    <YAxis type="category"
                      dataKey="name" width={100}
                      tick={{ fontSize: 9 }} />
                    <Tooltip
                      formatter={(value) =>
                        [`${value ?? ''} characters`, 'Depth']}
                      contentStyle={{
                        fontSize: 11,
                        borderRadius: 8,
                      }} />
                    <Bar dataKey="chars"
                      fill="var(--teal)"
                      radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Aha moments by layer */}
            <div style={{
              background: 'var(--white)',
              border: '1px solid var(--mgray)',
              borderRadius: 12,
              padding: '18px 20px',
            }}>
              <div className="label"
                style={{ marginBottom: 12 }}>
                Aha Moments by STZ Layer
              </div>
              {ahas.length === 0 ? (
                <div style={{
                  fontSize: 12,
                  color: 'var(--slate)',
                }}>
                  Use The Capture to log your ahas.
                  They will appear here tagged by layer.
                </div>
              ) : (
                <ResponsiveContainer
                  width="100%" height={160}>
                  <BarChart data={ahaByLayer}>
                    <XAxis dataKey="name"
                      tick={{ fontSize: 10 }} />
                    <YAxis
                      tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{
                        fontSize: 11,
                        borderRadius: 8,
                      }} />
                    <Bar dataKey="count"
                      radius={[4, 4, 0, 0]}>
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Job quality trend */}
          {qualityData.length > 0 && (
            <div style={{
              background: 'var(--white)',
              border: '1px solid var(--mgray)',
              borderRadius: 12,
              padding: '18px 20px',
              marginBottom: 16,
            }}>
              <div className="label"
                style={{ marginBottom: 12 }}>
                Output Quality Trend
              </div>
              <ResponsiveContainer
                width="100%" height={140}>
                <LineChart data={qualityData}>
                  <XAxis dataKey="run"
                    tick={{ fontSize: 10 }}
                    label={{
                      value: 'Job run',
                      position: 'insideBottom',
                      fontSize: 10,
                    }} />
                  <YAxis domain={[0, 5]}
                    tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      fontSize: 11,
                      borderRadius: 8,
                    }} />
                  <Line type="monotone"
                    dataKey="score"
                    stroke="var(--teal)"
                    strokeWidth={2}
                    dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Recent ahas */}
          {ahas.length > 0 && (
            <div style={{
              background: 'var(--white)',
              border: '1px solid var(--mgray)',
              borderRadius: 12,
              padding: '18px 20px',
            }}>
              <div className="label"
                style={{ marginBottom: 12 }}>
                Recent Captures
              </div>
              {ahas.slice(0, 5).map(a => (
                <div key={a.aha_id} style={{
                  borderLeft:
                    '3px solid var(--gold)',
                  paddingLeft: 10,
                  marginBottom: 10,
                }}>
                  <div style={{
                    fontSize: 12,
                    color: 'var(--navy)',
                    fontWeight: 600,
                    marginBottom: 2,
                  }}>
                    {a.key_insight ??
                      'Processing...'}
                  </div>
                  <div style={{
                    fontSize: 10,
                    color: 'var(--slate)',
                    fontFamily:
                      'Courier New, monospace',
                  }}>
                    {a.stz_layer
                      ? `L${a.stz_layer} · ` : ''}
                    {a.domain_area ?? ''}
                    {' · '}
                    {a.created_at.slice(0, 10)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* QUESTIONS VIEW */}
      {view === 'questions' && (
        <div>
          {/* Layer tabs */}
          <div style={{
            display: 'flex', gap: 6,
            marginBottom: 20, flexWrap: 'wrap',
          }}>
            {LAYERS.map(l => {
              const lRows = questions[l.num] ?? [];
              const done = lRows.filter(
                r => r.completed === 1
              ).length;
              const isActive = activeLayer === l.num;
              return (
                <button key={l.num}
                  onClick={() => setActiveLayer(l.num)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 20,
                    border: `1px solid ${isActive
                      ? l.color : 'var(--mgray)'}`,
                    background: isActive
                      ? l.color : 'transparent',
                    color: isActive
                      ? 'var(--white)'
                      : 'var(--slate)',
                    fontSize: 12, fontWeight: 600,
                    cursor: 'pointer',
                  }}>
                  L{l.num} {l.name}
                  <span style={{
                    marginLeft: 6,
                    fontSize: 10, opacity: 0.8,
                  }}>
                    {done}/{lRows.length}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Layer header */}
          <div style={{
            background: 'var(--white)',
            border: '1px solid var(--mgray)',
            borderRadius: 12,
            padding: '14px 18px',
            marginBottom: 20,
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center', gap: 20,
            }}>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: 13, fontWeight: 700,
                  color: layerMeta.color,
                  marginBottom: 2,
                }}>
                  Layer {activeLayer} —{' '}
                  {layerMeta.name}
                </div>
                <div style={{
                  fontSize: 11,
                  color: 'var(--slate)',
                  marginBottom: 8,
                }}>
                  {layerMeta.description}
                </div>
                <div className="label"
                  style={{ marginBottom: 4 }}>
                  {completed} of {layerRows.length}{' '}
                  answered · {pct}% complete
                </div>
                <div style={{
                  height: 6,
                  background: 'var(--lgray)',
                  borderRadius: 3,
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${pct}%`,
                    background: layerMeta.color,
                    borderRadius: 3,
                    transition: 'width 0.3s ease',
                  }} />
                </div>
              </div>
              {completed === layerRows.length &&
                layerRows.length > 0 && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6, flexShrink: 0,
                }}>
                  <div style={{
                    fontSize: 11, fontWeight: 700,
                    color: layerMeta.color,
                    textAlign: 'center',
                  }}>
                    Layer Complete ✓
                  </div>
                  <button
                    onClick={() =>
                      exportLayer(activeLayer)}
                    style={{
                      padding: '5px 14px',
                      background: layerMeta.color,
                      color: 'var(--white)',
                      border: 'none',
                      borderRadius: 20,
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}>
                    Copy to Clipboard
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Questions */}
          {layerRows.map((row, idx) => {
            const isSaved = saved[row.id];
            const hasAnswer =
              (drafts[row.id] ?? '').trim().length > 0;

            return (
              <div key={row.id} style={{
                background: 'var(--white)',
                border: `1px solid ${row.completed
                  ? layerMeta.color
                  : 'var(--mgray)'}`,
                borderLeft: `4px solid ${
                  row.completed
                    ? layerMeta.color
                    : 'var(--mgray)'}`,
                borderRadius: 12,
                padding: '18px 20px',
                marginBottom: 16,
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: 10,
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: 10,
                      color: layerMeta.color,
                      fontFamily:
                        'Courier New, monospace',
                      marginBottom: 4,
                      fontWeight: 700,
                    }}>
                      Q{idx + 1}
                      {row.builds_file
                        ? ` · builds ${row.builds_file}`
                        : ''}
                    </div>
                    <div style={{
                      fontSize: 14, fontWeight: 600,
                      color: 'var(--navy)',
                      lineHeight: 1.5,
                      marginBottom:
                        row.probe_text ? 6 : 0,
                    }}>
                      {row.question_text}
                    </div>
                    {row.probe_text && (
                      <div style={{
                        fontSize: 12,
                        color: 'var(--slate)',
                        fontStyle: 'italic',
                        lineHeight: 1.5,
                      }}>
                        {row.probe_text}
                      </div>
                    )}
                  </div>
                  {row.completed === 1 && (
                    <span style={{
                      fontSize: 10, fontWeight: 700,
                      color: layerMeta.color,
                      marginLeft: 12, flexShrink: 0,
                      fontFamily:
                        'Courier New, monospace',
                    }}>
                      answered ✓
                    </span>
                  )}
                </div>

                <textarea
                  value={drafts[row.id] ?? ''}
                  onChange={e => setDrafts(prev => ({
                    ...prev,
                    [row.id]: e.target.value,
                  }))}
                  placeholder="Type your answer here. Be specific. Tell stories. The more detail you give, the better the system reasons in your voice."
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
                    marginBottom: 10,
                  }} />

                <button
                  onClick={() => saveAnswer(row)}
                  disabled={!hasAnswer}
                  style={{
                    padding: '7px 18px',
                    background: isSaved
                      ? 'var(--green)'
                      : hasAnswer
                      ? layerMeta.color
                      : 'var(--mgray)',
                    color: hasAnswer || isSaved
                      ? 'var(--white)'
                      : 'var(--slate)',
                    border: 'none', borderRadius: 8,
                    fontSize: 12, fontWeight: 700,
                    cursor: hasAnswer
                      ? 'pointer' : 'default',
                  }}>
                  {isSaved
                    ? 'Saved ✓' : 'Save Answer'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
