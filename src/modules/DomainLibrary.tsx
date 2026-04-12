import {
  useState,
  useEffect,
  type CSSProperties,
} from 'react';
import {
  getAllDocuments,
  addDocument,
  chunkAndEmbed,
  deleteDocument,
  retrieveRelevantChunks,
  DOC_TYPES,
  STZ_LAYERS,
  type DomainDocument,
  type RetrievedChunk,
} from '../services/domainService';

const C = {
  navy:   '#2D4459',
  teal:   '#3BBFBF',
  mint:   '#C8E8E5',
  coral:  '#F05F57',
  gold:   '#C8974A',
  slate:  '#7A8F95',
  cream:  '#FEFAF5',
  white:  '#FFFFFF',
  green:  '#3A7D5C',
  lgray:  '#F4F7F8',
  border: '#C8E8E5',
};

type LibraryTab = 'library' | 'add' | 'search';

export function DomainLibrary() {
  const [docs, setDocs] =
    useState<DomainDocument[]>([]);
  const [tab, setTab] = useState<LibraryTab>(
    'library'
  );
  const [loading, setLoading] = useState(true);
  const [embedding, setEmbedding] =
    useState<string | null>(null);
  const [embedProgress, setEmbedProgress] =
    useState(0);
  const [searchQuery, setSearchQuery] =
    useState('');
  const [searchResults, setSearchResults] =
    useState<RetrievedChunk[]>([]);
  const [searching, setSearching] =
    useState(false);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    title: '',
    doc_type: 'dissertation',
    raw_text: '',
    stz_layer: 'General',
    tags: '',
    notes: '',
  });

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const d = await getAllDocuments();
      setDocs(d);
    } catch (err) {
      console.error('DomainLibrary load:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    if (!form.title.trim() ||
        !form.raw_text.trim()) return;

    try {
      const docId = await addDocument(
        form.title.trim(),
        form.doc_type,
        form.raw_text.trim(),
        null,
        null,
        form.stz_layer || null,
        form.tags || null,
        form.notes || null,
      );

      setForm({
        title: '',
        doc_type: 'dissertation',
        raw_text: '',
        stz_layer: 'General',
        tags: '',
        notes: '',
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      setTab('library');
      await load();

      // Auto-embed after adding
      setEmbedding(docId);
      setEmbedProgress(0);
      const doc = await getAllDocuments();
      const added = doc.find(
        d => d.doc_id === docId
      );
      if (added?.raw_text) {
        await chunkAndEmbed(
          docId,
          added.raw_text,
          (pct) => setEmbedProgress(pct),
        );
      }
      setEmbedding(null);
      await load();
    } catch (err) {
      console.error('Add document:', err);
    }
  }

  async function handleEmbed(doc: DomainDocument) {
    if (!doc.raw_text) return;
    setEmbedding(doc.doc_id);
    setEmbedProgress(0);
    try {
      await chunkAndEmbed(
        doc.doc_id,
        doc.raw_text,
        (pct) => setEmbedProgress(pct),
      );
      await load();
    } catch (err) {
      console.error('Embed failed:', err);
    } finally {
      setEmbedding(null);
    }
  }

  async function handleDelete(docId: string) {
    try {
      await deleteDocument(docId);
      await load();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  }

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const results =
        await retrieveRelevantChunks(
          searchQuery.trim(), 8
        );
      setSearchResults(results);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setSearching(false);
    }
  }

  const inputStyle: CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    fontSize: 13,
    color: C.navy,
    background: C.white,
    fontFamily: 'Trebuchet MS, sans-serif',
    boxSizing: 'border-box',
  };

  const labelStyle: CSSProperties = {
    fontFamily: 'Courier New, monospace',
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: C.slate,
    marginBottom: 4,
    display: 'block',
  };

  if (loading) {
    return (
      <div style={{
        padding: 32,
        color: C.slate,
        fontSize: 12,
        fontFamily: 'Courier New, monospace',
      }}>
        Loading domain library...
      </div>
    );
  }

  const embeddedCount =
    docs.filter(d => d.embedded).length;
  const totalChunks = docs.reduce(
    (s, d) => s + d.chunk_count, 0
  );

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
          <h2 style={{
            fontFamily: 'Georgia, serif',
            color: C.navy,
            marginBottom: 4,
            fontSize: 24,
          }}>
            Domain Library
          </h2>
          <p style={{
            color: C.slate,
            fontSize: 13,
            fontFamily: 'Trebuchet MS, sans-serif',
          }}>
            Your expertise encoded.
            Every job draws from this library.
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns:
          'repeat(auto-fit, minmax(140px,1fr))',
        gap: 12,
        marginBottom: 24,
      }}>
        {[
          ['Documents', docs.length,
            C.navy],
          ['Embedded', embeddedCount,
            C.green],
          ['Total Chunks', totalChunks,
            C.teal],
          ['Pending Embed',
            docs.length - embeddedCount,
            docs.length - embeddedCount > 0
              ? C.coral : C.slate],
        ].map(([label, value, color]) => (
          <div key={String(label)} style={{
            background: C.white,
            border: `1px solid ${C.border}`,
            borderTop:
              `3px solid ${String(color)}`,
            borderRadius: 12,
            padding: '14px 16px',
          }}>
            <div style={{
              fontFamily: 'Courier New, monospace',
              fontSize: 9,
              color: C.slate,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: 4,
            }}>
              {label}
            </div>
            <div style={{
              fontSize: 24,
              fontWeight: 800,
              color: String(color),
              fontFamily: 'Georgia, serif',
            }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: 8,
        marginBottom: 20,
      }}>
        {[
          ['library', 'My Library'],
          ['add', 'Add Document'],
          ['search', 'Semantic Search'],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() =>
              setTab(id as LibraryTab)}
            style={{
              padding: '7px 18px',
              borderRadius: 20,
              border: `1px solid ${
                tab === id
                  ? C.teal : C.border}`,
              background: tab === id
                ? C.teal : 'transparent',
              color: tab === id
                ? C.white : C.slate,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily:
                'Trebuchet MS, sans-serif',
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* LIBRARY TAB */}
      {tab === 'library' && (
        <div>
          {docs.length === 0 ? (
            <div style={{
              background: C.lgray,
              borderRadius: 12,
              padding: '32px 24px',
              textAlign: 'center',
              color: C.slate,
              fontSize: 13,
              fontFamily:
                'Trebuchet MS, sans-serif',
            }}>
              <div style={{
                fontSize: 13,
                fontWeight: 600,
                color: C.navy,
                marginBottom: 8,
              }}>
                No documents yet
              </div>
              <div style={{ marginBottom: 16 }}>
                Add your dissertation, STZ
                framework, 2026 paper, and
                16 career clusters to get started.
              </div>
              <button
                type="button"
                onClick={() => setTab('add')}
                style={{
                  padding: '8px 20px',
                  background: C.teal,
                  color: C.white,
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}>
                Add First Document
              </button>
            </div>
          ) : (
            <div>
              {docs.map(doc => (
                <div key={doc.doc_id} style={{
                  background: C.white,
                  border: `1px solid ${C.border}`,
                  borderLeft: `4px solid ${
                    doc.embedded
                      ? C.green : C.gold}`,
                  borderRadius: 12,
                  padding: '16px 18px',
                  marginBottom: 10,
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: C.navy,
                        fontFamily:
                          'Georgia, serif',
                        marginBottom: 4,
                      }}>
                        {doc.title}
                      </div>
                      <div style={{
                        display: 'flex',
                        gap: 8,
                        flexWrap: 'wrap',
                        marginBottom: 8,
                      }}>
                        <span style={{
                          fontFamily:
                            'Courier New, monospace',
                          fontSize: 9,
                          background: C.lgray,
                          border:
                            `1px solid ${C.border}`,
                          borderRadius: 10,
                          padding: '2px 8px',
                          color: C.slate,
                          textTransform:
                            'uppercase',
                        }}>
                          {doc.doc_type}
                        </span>
                        {doc.stz_layer ? (
                          <span style={{
                            fontFamily:
                              'Courier New, monospace',
                            fontSize: 9,
                            background:
                              '#3BBFBF18',
                            border:
                              `1px solid ${C.teal}`,
                            borderRadius: 10,
                            padding: '2px 8px',
                            color: C.teal,
                          }}>
                            {doc.stz_layer}
                          </span>
                        ) : null}
                        <span style={{
                          fontFamily:
                            'Courier New, monospace',
                          fontSize: 9,
                          color: doc.embedded
                            ? C.green : C.gold,
                        }}>
                          {doc.embedded
                            ? `${doc.chunk_count} chunks embedded`
                            : 'Not embedded'}
                        </span>
                      </div>
                      <div style={{
                        fontSize: 11,
                        color: C.slate,
                        fontFamily:
                          'Trebuchet MS, sans-serif',
                      }}>
                        {doc.word_count.toLocaleString()} words
                        {doc.notes &&
                          ` · ${doc.notes}`}
                      </div>
                    </div>

                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                      marginLeft: 16,
                      flexShrink: 0,
                    }}>
                      {!doc.embedded ? (
                        <button
                          type="button"
                          onClick={() =>
                            void handleEmbed(doc)}
                          disabled={
                            embedding === doc.doc_id
                          }
                          style={{
                            padding: '6px 14px',
                            background:
                              embedding === doc.doc_id
                                ? C.lgray : C.teal,
                            color:
                              embedding === doc.doc_id
                                ? C.slate : C.white,
                            border: 'none',
                            borderRadius: 8,
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer',
                            fontFamily:
                              'Trebuchet MS, sans-serif',
                          }}>
                          {embedding === doc.doc_id
                            ? `${embedProgress}%`
                            : 'Embed'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            void handleEmbed(doc)}
                          disabled={
                            embedding === doc.doc_id
                          }
                          style={{
                            padding: '6px 14px',
                            background: 'transparent',
                            border:
                              `1px solid ${C.teal}`,
                            color: C.teal,
                            borderRadius: 8,
                            fontSize: 11,
                            cursor: 'pointer',
                            fontFamily:
                              'Trebuchet MS, sans-serif',
                          }}>
                          {embedding === doc.doc_id
                            ? `${embedProgress}%`
                            : 'Re-embed'}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          void handleDelete(doc.doc_id)}
                        style={{
                          padding: '6px 14px',
                          background: '#F05F5712',
                          border:
                            `1px solid ${C.coral}`,
                          color: C.coral,
                          borderRadius: 8,
                          fontSize: 11,
                          cursor: 'pointer',
                          fontFamily:
                            'Trebuchet MS, sans-serif',
                        }}>
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Embed progress bar */}
                  {embedding === doc.doc_id ? (
                    <div style={{
                      marginTop: 10,
                      background: C.lgray,
                      borderRadius: 4,
                      height: 6,
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        width: `${embedProgress}%`,
                        height: '100%',
                        background: C.teal,
                        transition:
                          'width 0.3s ease',
                      }} />
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ADD DOCUMENT TAB */}
      {tab === 'add' && (
        <div style={{
          background: C.white,
          border: `1px solid ${C.border}`,
          borderTop: `4px solid ${C.teal}`,
          borderRadius: 12,
          padding: '24px 28px',
          maxWidth: 700,
        }}>
          <div style={{
            fontSize: 14,
            fontWeight: 700,
            color: C.navy,
            fontFamily: 'Georgia, serif',
            marginBottom: 20,
          }}>
            Add Document to Domain Library
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 16,
            marginBottom: 16,
          }}>
            <div style={{
              gridColumn: '1 / -1',
            }}>
              <label style={labelStyle}>
                Document Title
              </label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm({
                  ...form, title: e.target.value
                })}
                placeholder="e.g. STZ Framework v2.0"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>
                Document Type
              </label>
              <select
                value={form.doc_type}
                onChange={e => setForm({
                  ...form,
                  doc_type: e.target.value
                })}
                style={inputStyle}>
                {DOC_TYPES.map(t => (
                  <option key={t} value={t}>
                    {t.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>
                STZ Layer
              </label>
              <select
                value={form.stz_layer}
                onChange={e => setForm({
                  ...form,
                  stz_layer: e.target.value
                })}
                style={inputStyle}>
                {STZ_LAYERS.map(l => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>

            <div style={{
              gridColumn: '1 / -1',
            }}>
              <label style={labelStyle}>
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={form.tags}
                onChange={e => setForm({
                  ...form, tags: e.target.value
                })}
                placeholder="e.g. STZ, VTCO, dissertation"
                style={inputStyle}
              />
            </div>

            <div style={{
              gridColumn: '1 / -1',
            }}>
              <label style={labelStyle}>
                Notes
              </label>
              <input
                type="text"
                value={form.notes}
                onChange={e => setForm({
                  ...form, notes: e.target.value
                })}
                placeholder="Optional notes about this document"
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>
              Document Text
            </label>
            <div style={{
              fontSize: 11,
              color: C.slate,
              fontFamily:
                'Trebuchet MS, sans-serif',
              marginBottom: 6,
            }}>
              Paste the full text of your document.
              The system will chunk and embed it
              automatically after saving.
            </div>
            <textarea
              value={form.raw_text}
              onChange={e => setForm({
                ...form,
                raw_text: e.target.value
              })}
              rows={12}
              placeholder="Paste document text here..."
              style={{
                ...inputStyle,
                resize: 'vertical',
                lineHeight: 1.6,
              }}
            />
            <div style={{
              fontFamily: 'Courier New, monospace',
              fontSize: 10,
              color: C.slate,
              marginTop: 4,
            }}>
              {form.raw_text
                .split(/\s+/)
                .filter(Boolean).length
              } words
            </div>
          </div>

          <div style={{
            display: 'flex',
            gap: 10,
          }}>
            <button
              type="button"
              onClick={() => void handleAdd()}
              disabled={
                !form.title.trim() ||
                !form.raw_text.trim() ||
                embedding !== null
              }
              style={{
                padding: '9px 24px',
                background:
                  saved ? C.green :
                  (!form.title.trim() ||
                   !form.raw_text.trim())
                    ? C.lgray : C.teal,
                color:
                  (!form.title.trim() ||
                   !form.raw_text.trim())
                    ? C.slate : C.white,
                border: 'none',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily:
                  'Trebuchet MS, sans-serif',
              }}>
              {saved
                ? 'Saved and Embedding...'
                : 'Save and Embed'}
            </button>
            <button
              type="button"
              onClick={() => setTab('library')}
              style={{
                padding: '9px 16px',
                background: C.lgray,
                border: 'none',
                borderRadius: 8,
                fontSize: 12,
                color: C.slate,
                cursor: 'pointer',
                fontFamily:
                  'Trebuchet MS, sans-serif',
              }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* SEMANTIC SEARCH TAB */}
      {tab === 'search' && (
        <div>
          <div style={{
            background: C.white,
            border: `1px solid ${C.border}`,
            borderTop: `4px solid ${C.navy}`,
            borderRadius: 12,
            padding: '20px 24px',
            marginBottom: 20,
          }}>
            <div style={{
              fontSize: 13,
              fontWeight: 700,
              color: C.navy,
              fontFamily: 'Georgia, serif',
              marginBottom: 4,
            }}>
              Semantic Search
            </div>
            <div style={{
              fontSize: 12,
              color: C.slate,
              marginBottom: 14,
              fontFamily:
                'Trebuchet MS, sans-serif',
            }}>
              Search your domain library by
              meaning, not just keywords.
              Ask a question or describe
              a concept.
            </div>
            <div style={{
              display: 'flex',
              gap: 10,
            }}>
              <input
                type="text"
                value={searchQuery}
                onChange={e =>
                  setSearchQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    void handleSearch();
                  }
                }}
                placeholder="e.g. How does STZ layer 1 define expert reasoning?"
                style={{
                  ...inputStyle,
                  flex: 1,
                }}
              />
              <button
                type="button"
                onClick={() => void handleSearch()}
                disabled={
                  searching ||
                  !searchQuery.trim()
                }
                style={{
                  padding: '8px 20px',
                  background: searching
                    ? C.lgray : C.navy,
                  color: searching
                    ? C.slate : C.white,
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: searching
                    ? 'default' : 'pointer',
                  fontFamily:
                    'Trebuchet MS, sans-serif',
                  flexShrink: 0,
                }}>
                {searching
                  ? 'Searching...'
                  : 'Search'}
              </button>
            </div>
          </div>

          {searchResults.length > 0 ? (
            <div>
              <div style={{
                fontFamily:
                  'Courier New, monospace',
                fontSize: 10,
                color: C.slate,
                marginBottom: 12,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}>
                {searchResults.length} relevant
                chunks found
              </div>
              {searchResults.map((r, i) => (
                <div key={`${r.doc_id}-${r.chunk_index}-${i}`} style={{
                  background: C.white,
                  border: `1px solid ${C.border}`,
                  borderLeft: `4px solid ${C.teal}`,
                  borderRadius: 10,
                  padding: '14px 16px',
                  marginBottom: 10,
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: 8,
                  }}>
                    <div style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: C.navy,
                      fontFamily:
                        'Georgia, serif',
                    }}>
                      {r.doc_title}
                    </div>
                    <div style={{
                      fontFamily:
                        'Courier New, monospace',
                      fontSize: 10,
                      color: r.similarity > 0.7
                        ? C.green
                        : r.similarity > 0.5
                        ? C.gold : C.slate,
                      fontWeight: 700,
                    }}>
                      {(r.similarity * 100)
                        .toFixed(0)}% match
                    </div>
                  </div>
                  <div style={{
                    fontSize: 12,
                    color: C.navy,
                    lineHeight: 1.6,
                    fontFamily:
                      'Trebuchet MS, sans-serif',
                  }}>
                    {r.chunk_text}
                  </div>
                  <div style={{
                    fontFamily:
                      'Courier New, monospace',
                    fontSize: 9,
                    color: C.slate,
                    marginTop: 8,
                  }}>
                    Chunk {r.chunk_index + 1}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {searchResults.length === 0 &&
           searchQuery && !searching ? (
            <div style={{
              background: C.lgray,
              borderRadius: 10,
              padding: '20px 24px',
              textAlign: 'center',
              fontSize: 13,
              color: C.slate,
              fontFamily:
                'Trebuchet MS, sans-serif',
            }}>
              No results found. Try a different
              query or add more documents to
              your library first.
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
