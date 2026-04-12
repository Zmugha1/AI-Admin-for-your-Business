import { useState, useEffect, useCallback, useMemo } from 'react';
import { openUrl } from '@tauri-apps/plugin-opener';
import { getDb } from '../services/db';
import { v4 as uuidv4 } from 'uuid';

/**
 * Opens http(s) URLs in the default browser.
 * Same behavior as `import { open } from '@tauri-apps/plugin-shell'` for URLs; uses `plugin-opener` because `plugin-shell` is not in this app yet.
 */
async function openArticleUrl(url: string | null | undefined) {
  if (!url) return;
  await openUrl(url);
}

const RSS_SOURCES = [
  {
    id: 'mit_tech',
    name: 'MIT Technology Review',
    url: 'https://www.technologyreview.com/feed/',
    category: 'AI Technology',
    active: true,
  },
  {
    id: 'venturebeat',
    name: 'VentureBeat AI',
    url: 'https://venturebeat.com/feed/',
    category: 'AI Industry',
    active: true,
  },
  {
    id: 'elearning',
    name: 'eLearning Industry',
    url: 'https://elearningindustry.com/feed',
    category: 'Learning and Development',
    active: true,
  },
  {
    id: 'inside_higher_ed',
    name: 'Inside Higher Ed',
    url: 'https://www.insidehighered.com/rss.xml',
    category: 'Higher Education',
    active: true,
  },
  {
    id: 'edsurge',
    name: 'EdSurge',
    url: 'https://www.edsurge.com/news.rss',
    category: 'Education Technology',
    active: true,
  },
  {
    id: 'towards_ds',
    name: 'Towards Data Science',
    url: 'https://towardsdatascience.com/feed',
    category: 'Data Science',
    active: true,
  },
  {
    id: 'hbr',
    name: 'Harvard Business Review',
    url: 'https://hbr.org/rss/all',
    category: 'Leadership',
    active: true,
  },
  {
    id: 'arxiv_ai',
    name: 'Arxiv AI',
    url: 'https://arxiv.org/rss/cs.AI',
    category: 'AI Research',
    active: true,
  },
  {
    id: 'smallbiz',
    name: 'SmallBizTrends',
    url: 'https://smallbiztrends.com/feed',
    category: 'Small Business',
    active: true,
  },
  {
    id: 'ai_business',
    name: 'AI Business',
    url: 'https://aibusiness.com/rss.xml',
    category: 'AI for Business',
    active: true,
  },
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

/** Aggregated RSS row for the News Feed tab (rss2json). */
interface RssItem {
  id: string;
  title: string;
  link: string;
  description: string;
  pubDate: string;
  source: string;
  category: string;
}

interface ResearchArticle {
  article_id: string;
  title: string;
  authors: string | null;
  source: string;
  source_type: string;
  year: number | null;
  abstract: string | null;
  url: string | null;
  doi: string | null;
  stz_layer: string | null;
  status: string;
  notes: string | null;
  saved_at: string;
}

interface SearchHit {
  id: string;
  title: string;
  authors: string;
  year: number | null;
  abstract: string | null;
  url: string | null;
  source_type: 'pubmed' | 'eric' | 'semantic';
}

function truncate(s: string | null, n: number): string {
  if (!s) return '';
  const t = s.trim();
  return t.length <= n ? t : `${t.slice(0, n)}…`;
}

async function searchPubMed(query: string): Promise<SearchHit[]> {
  const es = await fetch(
    `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&retmax=10&term=${encodeURIComponent(query)}`
  );
  const ej = (await es.json()) as {
    esearchresult?: { idlist?: string[] };
  };
  const idlist = ej.esearchresult?.idlist ?? [];
  if (idlist.length === 0) return [];

  const sm = await fetch(
    `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=${idlist.join(',')}`
  );
  const smj = (await sm.json()) as {
    result?: Record<string, unknown> & { uids?: string[] };
  };
  const result = smj.result;
  if (!result) return [];
  const uids = (result.uids as string[]) ?? idlist;
  const hits: SearchHit[] = [];
  for (const uid of uids) {
    const r = result[uid] as Record<string, unknown> | undefined;
    if (!r || typeof r !== 'object') continue;
    const title = (r.title as string) || (r.sorttitle as string) || 'Untitled';
    let authors = '';
    const al = r.authors as { name?: string }[] | undefined;
    if (Array.isArray(al)) {
      authors = al
        .map(a => a?.name)
        .filter(Boolean)
        .join(', ');
    }
    let year: number | null = null;
    const pd = (r.pubdate as string) || (r.epubdate as string) || '';
    const y = parseInt(pd.slice(0, 4), 10);
    if (!Number.isNaN(y)) year = y;
    hits.push({
      id: `pubmed-${uid}`,
      title,
      authors,
      year,
      abstract: null,
      url: `https://pubmed.ncbi.nlm.nih.gov/${uid}/`,
      source_type: 'pubmed',
    });
  }
  return hits;
}

async function searchEric(query: string): Promise<SearchHit[]> {
  const url = `https://api.ies.ed.gov/eric/?search=${encodeURIComponent(query)}&format=json&rows=10`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const j = (await res.json()) as {
    response?: { docs?: Record<string, unknown>[] };
    docs?: Record<string, unknown>[];
  };
  const docs =
    j.response?.docs ?? j.docs ?? [];
  return docs.slice(0, 10).map((d, i) => {
    const title = String(d.title ?? d.Title ?? 'Untitled');
    const author = String(d.author ?? d.authorname ?? '');
    const y = d.publicationdateyear ?? d.publication_year;
    const year =
      typeof y === 'number'
        ? y
        : parseInt(String(y ?? ''), 10) || null;
    const id = String(d.id ?? d.ericid ?? i);
    const link =
      (d.url as string) ||
      (d.href as string) ||
      `https://eric.ed.gov/?id=${encodeURIComponent(id)}`;
    return {
      id: `eric-${id}`,
      title,
      authors: author,
      year: Number.isNaN(year as number) ? null : (year as number),
      abstract: null,
      url: link,
      source_type: 'eric' as const,
    };
  });
}

async function searchSemantic(query: string): Promise<SearchHit[]> {
  const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&fields=title,authors,year,abstract,url&limit=10`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const j = (await res.json()) as {
    data?: {
      paperId?: string;
      title?: string;
      year?: number | null;
      abstract?: string | null;
      url?: string | null;
      authors?: { name?: string }[];
    }[];
  };
  const data = j.data ?? [];
  return data.map((p, i) => ({
    id: `sem-${p.paperId ?? i}`,
    title: p.title ?? 'Untitled',
    authors: (p.authors ?? [])
      .map(a => a?.name)
      .filter(Boolean)
      .join(', '),
    year: p.year ?? null,
    abstract: p.abstract ?? null,
    url: p.url ?? null,
    source_type: 'semantic' as const,
  }));
}

function ReadingNotesEditor({
  article,
  onSave,
}: {
  article: ResearchArticle;
  onSave: (notes: string) => void;
}) {
  const [v, setV] = useState(article.notes ?? '');
  useEffect(() => {
    setV(article.notes ?? '');
  }, [article.article_id, article.notes]);
  return (
    <>
      <textarea
        value={v}
        onChange={e => setV(e.target.value)}
        rows={3}
        placeholder="Notes"
        style={{
          width: '100%',
          maxWidth: 480,
          padding: 8,
          border: `1px solid ${C.mint}`,
          borderRadius: 8,
          fontSize: 12,
          fontFamily: 'Trebuchet MS, sans-serif',
          boxSizing: 'border-box',
        }}
      />
      <button
        type="button"
        onClick={() => onSave(v)}
        style={{
          marginTop: 6,
          padding: '4px 12px',
          background: C.teal,
          color: C.white,
          border: 'none',
          borderRadius: 6,
          fontSize: 11,
          cursor: 'pointer',
        }}
      >
        Save Notes
      </button>
    </>
  );
}

export function ResearchIntelligence() {
  const [activeTab, setActiveTab] = useState<
    'news' | 'research' | 'reading'
  >('news');
  const [rssItems, setRssItems] = useState<RssItem[]>([]);
  const [rssLoading, setRssLoading] = useState(false);
  const [rssError, setRssError] = useState('');
  const [selectedCategory, setSelectedCategory] =
    useState('all');
  const [lastRssFetch, setLastRssFetch] =
    useState('');
  const [articles, setArticles] = useState<ResearchArticle[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('');
  const [usePubmed, setUsePubmed] = useState(true);
  const [useEric, setUseEric] = useState(true);
  const [useSemantic, setUseSemantic] = useState(true);
  const [expandedHits, setExpandedHits] = useState<Set<string>>(
    new Set()
  );
  const [readingStatusFilter, setReadingStatusFilter] =
    useState('all');
  const [readingSourceFilter, setReadingSourceFilter] =
    useState('all');

  const savedUrls = useMemo(() => {
    const s = new Set<string>();
    for (const a of articles) {
      if (a.url) s.add(a.url);
    }
    return s;
  }, [articles]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const db = await getDb();
      const ar = await db.select<ResearchArticle[]>(
        `SELECT article_id, title, authors, source,
                source_type, year, abstract, url, doi,
                stz_layer, status, notes, saved_at
         FROM research_articles
         ORDER BY datetime(saved_at) DESC`
      );
      setArticles(ar);
    } catch (e) {
      console.error('ResearchIntelligence load', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredArticles = useMemo(() => {
    return articles.filter(a => {
      if (
        readingStatusFilter !== 'all' &&
        a.status !== readingStatusFilter
      ) {
        return false;
      }
      if (readingSourceFilter !== 'all') {
        const map: Record<string, string> = {
          PubMed: 'pubmed',
          ERIC: 'eric',
          Semantic: 'semantic',
          RSS: 'rss',
        };
        const want = map[readingSourceFilter] ?? readingSourceFilter;
        if (a.source_type !== want) return false;
      }
      return true;
    });
  }, [articles, readingStatusFilter, readingSourceFilter]);

  async function fetchRssFeeds() {
    setRssLoading(true);
    setRssError('');
    const items: RssItem[] = [];

    for (const source of RSS_SOURCES.filter(
      s => s.active
    )) {
      try {
        const proxyUrl =
          `https://api.rss2json.com/v1/api.json` +
          `?rss_url=${encodeURIComponent(source.url)}` +
          `&api_key=public` +
          `&count=5`;

        const response = await fetch(proxyUrl);
        const data = (await response.json()) as {
          status?: string;
          items?: {
            guid?: string | { _: string };
            link?: string;
            title?: string;
            description?: string;
            pubDate?: string;
          }[];
        };

        if (data.status === 'ok' && data.items) {
          for (const item of data.items) {
            const guidRaw = item.guid;
            const guidStr =
              typeof guidRaw === 'object' && guidRaw
                ? String(
                    (guidRaw as { _?: string })._ ?? ''
                  )
                : String(guidRaw ?? '');
            const linkStr = String(item.link ?? '');
            items.push({
              id: `${source.id}_${guidStr || linkStr}`,
              title: item.title || '',
              link: linkStr,
              description: item.description
                ? item.description
                    .replace(/<[^>]*>/g, '')
                    .slice(0, 200)
                : '',
              pubDate: item.pubDate || '',
              source: source.name,
              category: source.category,
            });
          }
        }
      } catch {
        console.error(
          `RSS fetch failed: ${source.name}`
        );
      }
    }

    items.sort((a, b) => {
      const ta = new Date(a.pubDate).getTime();
      const tb = new Date(b.pubDate).getTime();
      const na = Number.isNaN(ta) ? 0 : ta;
      const nb = Number.isNaN(tb) ? 0 : tb;
      return nb - na;
    });

    setRssItems(items);
    setLastRssFetch(new Date().toLocaleTimeString());
    setRssLoading(false);
    if (items.length === 0) {
      setRssError(
        'No articles returned. Check network or try again.'
      );
    } else {
      setRssError('');
    }
  }

  async function captureNewsToReading(item: RssItem) {
    try {
      const db = await getDb();
      await db.execute(
        `INSERT INTO research_articles
           (article_id, title, source, source_type, url,
            abstract, status)
         VALUES (?, ?, ?, 'rss', ?, ?, 'unread')`,
        [
          uuidv4(),
          item.title,
          item.source,
          item.link || null,
          item.description || null,
        ]
      );
      setSaveStatus('Captured to Reading List');
      setTimeout(() => setSaveStatus(''), 3000);
      await load();
    } catch (err) {
      console.error('Capture failed:', err);
      setRssError('Could not save to Reading List');
    }
  }

  async function runSearch() {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchResults([]);
    const all: SearchHit[] = [];
    try {
      if (usePubmed) {
        try {
          all.push(...(await searchPubMed(searchQuery.trim())));
        } catch (e) {
          console.error('PubMed', e);
        }
      }
      if (useEric) {
        try {
          all.push(...(await searchEric(searchQuery.trim())));
        } catch (e) {
          console.error('ERIC', e);
        }
      }
      if (useSemantic) {
        try {
          all.push(
            ...(await searchSemantic(searchQuery.trim()))
          );
        } catch (e) {
          console.error('Semantic', e);
        }
      }
      setSearchResults(all);
    } finally {
      setSearching(false);
    }
  }

  async function saveSearchHit(hit: SearchHit) {
    const db = await getDb();
    await db.execute(
      `INSERT INTO research_articles
         (article_id, title, authors, source, source_type,
          year, abstract, url, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'unread')`,
      [
        uuidv4(),
        hit.title,
        hit.authors || null,
        hit.source_type.toUpperCase(),
        hit.source_type,
        hit.year,
        hit.abstract,
        hit.url,
      ]
    );
    setSaveStatus('Saved to Reading List');
    setTimeout(() => setSaveStatus(''), 3000);
    await load();
  }

  async function updateArticle(
    a: ResearchArticle,
    patch: Partial<ResearchArticle>
  ) {
    const db = await getDb();
    const next = { ...a, ...patch };
    await db.execute(
      `UPDATE research_articles SET
         stz_layer = ?, status = ?, notes = ?,
         updated_at = datetime('now')
       WHERE article_id = ?`,
      [next.stz_layer, next.status, next.notes, a.article_id]
    );
    await load();
  }

  async function captureArticleToAha(a: ResearchArticle) {
    if (a.status !== 'reading' && a.status !== 'done') return;
    const db = await getDb();
    const raw = a.abstract ?? a.title;
    const layer =
      a.stz_layer?.startsWith('L')
        ? parseInt(a.stz_layer.slice(1, 2), 10) || 1
        : 1;
    await db.execute(
      `INSERT INTO aha_moments
         (aha_id, raw_input, input_type, key_insight,
          stz_layer, source_title, content_worthy)
       VALUES (?, ?, 'text', ?, ?, ?, 0)`,
      [uuidv4(), raw, a.title, layer, a.url ?? a.source]
    );
    await db.execute(
      `UPDATE research_articles SET status = 'captured',
           updated_at = datetime('now')
       WHERE article_id = ?`,
      [a.article_id]
    );
    await load();
  }

  async function deleteArticle(id: string) {
    if (!window.confirm('Delete this article from your list?')) return;
    const db = await getDb();
    await db.execute(
      `DELETE FROM research_articles WHERE article_id = ?`,
      [id]
    );
    await load();
  }

  const tabBtn = (id: typeof activeTab, label: string) => {
    const on = activeTab === id;
    return (
      <button
        key={id}
        type="button"
        onClick={() => setActiveTab(id)}
        style={{
          padding: '7px 20px',
          borderRadius: 20,
          border: on ? 'none' : `1px solid ${C.mint}`,
          background: on ? C.teal : 'transparent',
          color: on ? C.white : C.slate,
          fontSize: 13,
          fontWeight: on ? 700 : 500,
          cursor: 'pointer',
          fontFamily: 'Trebuchet MS, sans-serif',
          marginRight: 8,
          marginBottom: 8,
        }}
      >
        {label}
      </button>
    );
  };

  if (loading) {
    return (
      <div style={{
        padding: 32,
        color: C.slate,
        fontFamily: 'Courier New, monospace',
        background: C.cream,
      }}>
        Loading…
      </div>
    );
  }

  return (
    <div style={{
      padding: 32,
      background: C.cream,
      minHeight: '100%',
      boxSizing: 'border-box',
    }}>
      <header style={{ marginBottom: 20 }}>
        <h1 style={{
          fontFamily: 'Georgia, serif',
          fontSize: 24,
          color: C.navy,
          margin: '0 0 8px 0',
        }}>
          Research Intelligence
        </h1>
        <p style={{
          fontFamily: 'Trebuchet MS, sans-serif',
          fontSize: 13,
          color: C.slate,
          margin: 0,
          maxWidth: 560,
          lineHeight: 1.5,
        }}>
          AI for small businesses, academic research, and your reading list in one place.
        </p>
      </header>

      {saveStatus && (
        <div style={{
          marginBottom: 12,
          padding: 8,
          background: `${C.teal}22`,
          borderRadius: 8,
          fontSize: 12,
          color: C.navy,
        }}>
          {saveStatus}
        </div>
      )}

      <div style={{ marginBottom: 20 }}>
        {tabBtn('news', 'News Feed')}
        {tabBtn('research', 'Research Publications')}
        {tabBtn('reading', 'My Reading List')}
      </div>

      {activeTab === 'news' && (
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}>
            <div>
              <div style={{
                fontSize: 13,
                color: C.slate,
                fontFamily: 'Trebuchet MS, sans-serif',
              }}>
                {rssItems.length > 0
                  ? `${rssItems.length} articles from ${RSS_SOURCES.length} sources`
                  : 'Click Refresh to load latest news'}
              </div>
              {lastRssFetch ? (
                <div style={{
                  fontSize: 10,
                  color: C.slate,
                  fontFamily: 'Courier New, monospace',
                  marginTop: 2,
                }}>
                  Last fetched: {lastRssFetch}
                </div>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => void fetchRssFeeds()}
              disabled={rssLoading}
              style={{
                padding: '7px 18px',
                background: rssLoading ? C.lgray : C.teal,
                color: rssLoading ? C.slate : C.white,
                border: 'none',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                cursor: rssLoading ? 'default' : 'pointer',
                fontFamily: 'Trebuchet MS, sans-serif',
              }}
            >
              {rssLoading ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {rssItems.length > 0 ? (
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 6,
              marginBottom: 16,
            }}>
              {[
                'all',
                ...Array.from(
                  new Set(
                    RSS_SOURCES.map(s => s.category)
                  )
                ),
              ].map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '4px 12px',
                    borderRadius: 20,
                    border: `1px solid ${
                      selectedCategory === cat
                        ? C.teal
                        : C.mint}`,
                    background:
                      selectedCategory === cat
                        ? C.teal
                        : 'transparent',
                    color:
                      selectedCategory === cat
                        ? C.white
                        : C.slate,
                    fontSize: 11,
                    fontWeight:
                      selectedCategory === cat ? 700 : 400,
                    cursor: 'pointer',
                    fontFamily: 'Courier New, monospace',
                  }}
                >
                  {cat === 'all' ? 'All' : cat}
                </button>
              ))}
            </div>
          ) : null}

          {rssError ? (
            <div style={{
              padding: '10px 14px',
              background: '#F05F5712',
              border: `1px solid ${C.coral}`,
              borderRadius: 8,
              fontSize: 12,
              color: C.coral,
              marginBottom: 12,
              fontFamily: 'Courier New, monospace',
            }}>
              {rssError}
            </div>
          ) : null}

          {!rssLoading && rssItems.length === 0 ? (
            <div style={{
              background: C.lgray,
              borderRadius: 10,
              padding: '32px 24px',
              textAlign: 'center',
              fontSize: 13,
              color: C.slate,
              fontFamily: 'Trebuchet MS, sans-serif',
            }}>
              <div style={{
                fontSize: 24,
                marginBottom: 8,
              }}>
                📰
              </div>
              <div style={{
                fontWeight: 600,
                color: C.navy,
                marginBottom: 4,
              }}>
                No articles loaded yet
              </div>
              <div>
                Click Refresh to pull the latest from all
                10 sources.
              </div>
            </div>
          ) : null}

          {rssItems
            .filter(
              item =>
                selectedCategory === 'all' ||
                item.category === selectedCategory
            )
            .map(item => (
              <div
                key={item.id}
                style={{
                  background: C.white,
                  border: `1px solid ${C.mint}`,
                  borderLeft: `4px solid ${C.teal}`,
                  borderRadius: 10,
                  padding: '14px 16px',
                  marginBottom: 10,
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: 6,
                }}>
                  <div style={{
                    fontFamily: 'Courier New, monospace',
                    fontSize: 9,
                    color: C.slate,
                    background: C.lgray,
                    padding: '2px 8px',
                    borderRadius: 10,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}>
                    {item.source}
                  </div>
                  <div style={{
                    fontFamily: 'Courier New, monospace',
                    fontSize: 9,
                    color: C.slate,
                  }}>
                    {item.pubDate
                      ? new Date(
                          item.pubDate
                        ).toLocaleDateString()
                      : ''}
                  </div>
                </div>

                <div
                  role={item.link ? 'button' : undefined}
                  onClick={() => {
                    if (item.link) {
                      void openArticleUrl(item.link);
                    }
                  }}
                  onKeyDown={e => {
                    if (
                      item.link &&
                      (e.key === 'Enter' || e.key === ' ')
                    ) {
                      e.preventDefault();
                      void openArticleUrl(item.link);
                    }
                  }}
                  tabIndex={item.link ? 0 : undefined}
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: C.navy,
                    fontFamily: 'Georgia, serif',
                    lineHeight: 1.4,
                    marginBottom: 6,
                    cursor: item.link ? 'pointer' : 'default',
                    textDecoration: 'none',
                  }}
                  onMouseEnter={e => {
                    if (item.link) {
                      (e.currentTarget as HTMLElement)
                        .style.color = C.teal;
                      (e.currentTarget as HTMLElement)
                        .style.textDecoration = 'underline';
                    }
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement)
                      .style.color = C.navy;
                    (e.currentTarget as HTMLElement)
                      .style.textDecoration = 'none';
                  }}
                >
                  {item.title}
                </div>

                {item.description ? (
                  <div style={{
                    fontSize: 12,
                    color: C.slate,
                    fontFamily: 'Trebuchet MS, sans-serif',
                    lineHeight: 1.5,
                    marginBottom: 10,
                  }}>
                    {item.description}
                    {item.description.length >= 200
                      ? '...'
                      : ''}
                  </div>
                ) : null}

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span style={{
                    fontFamily: 'Courier New, monospace',
                    fontSize: 9,
                    color: C.teal,
                    background: '#3BBFBF18',
                    border: `1px solid ${C.teal}`,
                    padding: '2px 8px',
                    borderRadius: 10,
                  }}>
                    {item.category}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      void captureNewsToReading(item)
                    }
                    style={{
                      padding: '4px 12px',
                      background: 'transparent',
                      border: `1px solid ${C.mint}`,
                      borderRadius: 6,
                      fontSize: 10,
                      color: C.slate,
                      cursor: 'pointer',
                      fontFamily: 'Trebuchet MS, sans-serif',
                    }}
                  >
                    Capture
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}

      {activeTab === 'research' && (
        <div>
          <div style={{ marginBottom: 12 }}>
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search PubMed, ERIC, and Semantic Scholar…"
              style={{
                width: '100%',
                maxWidth: 640,
                padding: '10px 12px',
                border: `1px solid ${C.mint}`,
                borderRadius: 8,
                fontSize: 13,
                color: C.navy,
                boxSizing: 'border-box',
                fontFamily: 'Trebuchet MS, sans-serif',
              }}
            />
            <button
              type="button"
              disabled={searching}
              onClick={() => runSearch()}
              style={{
                marginTop: 8,
                padding: '8px 20px',
                background: C.teal,
                color: C.white,
                border: 'none',
                borderRadius: 8,
                fontWeight: 700,
                cursor: searching ? 'wait' : 'pointer',
              }}
            >
              {searching ? 'Searching…' : 'Search'}
            </button>
          </div>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 16,
            marginBottom: 16,
            fontSize: 12,
            color: C.slate,
            fontFamily: 'Trebuchet MS, sans-serif',
          }}>
            <label>
              <input
                type="checkbox"
                checked={usePubmed}
                onChange={e => setUsePubmed(e.target.checked)}
              />{' '}
              PubMed
            </label>
            <label>
              <input
                type="checkbox"
                checked={useEric}
                onChange={e => setUseEric(e.target.checked)}
              />{' '}
              ERIC
            </label>
            <label>
              <input
                type="checkbox"
                checked={useSemantic}
                onChange={e => setUseSemantic(e.target.checked)}
              />{' '}
              Semantic Scholar
            </label>
          </div>

          {searchResults.length === 0 && !searching ? (
            <p style={{
              textAlign: 'center',
              color: C.slate,
              fontFamily: 'Trebuchet MS, sans-serif',
              fontSize: 13,
              marginTop: 24,
            }}>
              Search PubMed, ERIC, and Semantic Scholar to find research relevant to your practice.
            </p>
          ) : (
            searchResults.map(hit => {
              const border =
                hit.source_type === 'pubmed'
                  ? C.coral
                  : hit.source_type === 'eric'
                    ? C.gold
                    : C.teal;
              const badgeBg = border;
              const exp = expandedHits.has(hit.id);
              const abs = hit.abstract ?? '';
              const saved = hit.url && savedUrls.has(hit.url);
              return (
                <div
                  key={hit.id}
                  style={{
                    background: C.white,
                    border: `1px solid ${C.mint}`,
                    borderLeft: `4px solid ${border}`,
                    borderRadius: 10,
                    padding: '14px 18px',
                    marginBottom: 10,
                    position: 'relative',
                  }}
                >
                  <span style={{
                    position: 'absolute',
                    top: 12,
                    right: 14,
                    fontFamily: 'Courier New, monospace',
                    fontSize: 9,
                    textTransform: 'uppercase',
                    background: badgeBg,
                    color: C.white,
                    padding: '2px 8px',
                    borderRadius: 20,
                  }}>
                    {hit.source_type}
                  </span>
                  <div
                    role={hit.url ? 'button' : undefined}
                    onClick={() => {
                      if (hit.url) {
                        void openArticleUrl(hit.url);
                      }
                    }}
                    onKeyDown={e => {
                      if (
                        hit.url &&
                        (e.key === 'Enter' || e.key === ' ')
                      ) {
                        e.preventDefault();
                        void openArticleUrl(hit.url);
                      }
                    }}
                    tabIndex={hit.url ? 0 : undefined}
                    style={{
                      fontFamily: 'Georgia, serif',
                      fontSize: 13,
                      fontWeight: 700,
                      color: C.navy,
                      paddingRight: 80,
                      cursor: hit.url ? 'pointer' : 'default',
                      textDecoration: 'none',
                    }}
                    onMouseEnter={e => {
                      if (hit.url) {
                        e.currentTarget.style.color = C.teal;
                        e.currentTarget.style.textDecoration =
                          'underline';
                      }
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.color = C.navy;
                      e.currentTarget.style.textDecoration =
                        'none';
                    }}
                  >
                    {hit.title}
                  </div>
                  <div style={{
                    fontSize: 11,
                    color: C.slate,
                    marginTop: 6,
                    fontFamily: 'Trebuchet MS, sans-serif',
                  }}>
                    {hit.authors}
                  </div>
                  <div style={{
                    fontFamily: 'Courier New, monospace',
                    fontSize: 10,
                    color: C.slate,
                    marginTop: 4,
                  }}>
                    {hit.year ?? 'n/a'}
                  </div>
                  {abs ? (
                    <div style={{
                      fontSize: 12,
                      color: C.slate,
                      marginTop: 8,
                      lineHeight: 1.45,
                    }}>
                      {exp ? abs : truncate(abs, 200)}
                      {abs.length > 200 && (
                        <button
                          type="button"
                          onClick={() => {
                            setExpandedHits(prev => {
                              const n = new Set(prev);
                              if (n.has(hit.id)) n.delete(hit.id);
                              else n.add(hit.id);
                              return n;
                            });
                          }}
                          style={{
                            marginLeft: 8,
                            border: 'none',
                            background: 'none',
                            color: C.teal,
                            cursor: 'pointer',
                            fontSize: 11,
                          }}
                        >
                          {exp ? 'Collapse' : 'Expand'}
                        </button>
                      )}
                    </div>
                  ) : null}
                  <div style={{ marginTop: 10 }}>
                    {saved ? (
                      <span style={{
                        background: C.green,
                        color: C.white,
                        fontSize: 11,
                        padding: '4px 12px',
                        borderRadius: 6,
                      }}>
                        Saved
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => saveSearchHit(hit)}
                        style={{
                          background: C.teal,
                          color: C.white,
                          fontSize: 11,
                          padding: '4px 12px',
                          border: 'none',
                          borderRadius: 6,
                          cursor: 'pointer',
                        }}
                      >
                        Save
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'reading' && (
        <div>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            marginBottom: 16,
          }}>
            {['all', 'unread', 'reading', 'done', 'captured'].map(
              s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setReadingStatusFilter(s)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 16,
                    border: `1px solid ${C.mint}`,
                    background:
                      readingStatusFilter === s
                        ? C.teal
                        : C.white,
                    color:
                      readingStatusFilter === s
                        ? C.white
                        : C.slate,
                    fontSize: 11,
                    cursor: 'pointer',
                  }}
                >
                  {s}
                </button>
              )
            )}
            <span style={{ width: 16 }} />
            {['all', 'pubmed', 'eric', 'semantic', 'rss'].map(
              s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setReadingSourceFilter(s)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 16,
                    border: `1px solid ${C.mint}`,
                    background:
                      readingSourceFilter === s
                        ? C.navy
                        : C.white,
                    color:
                      readingSourceFilter === s
                        ? C.white
                        : C.slate,
                    fontSize: 11,
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                  }}
                >
                  {s === 'all' ? 'All sources' : s}
                </button>
              )
            )}
          </div>

          {filteredArticles.length === 0 ? (
            <p style={{
              textAlign: 'center',
              color: C.slate,
              fontFamily: 'Trebuchet MS, sans-serif',
              fontSize: 13,
            }}>
              Your reading list is empty. Search for research or capture news items to build your list.
            </p>
          ) : (
            filteredArticles.map(a => {
              const daysAgo = a.saved_at
                ? Math.floor(
                    (Date.now() -
                      new Date(
                        a.saved_at.replace(' ', 'T')
                      ).getTime()) /
                      86400000
                  )
                : 0;
              return (
                <div
                  key={a.article_id}
                  style={{
                    background: C.white,
                    border: `1px solid ${C.mint}`,
                    borderRadius: 10,
                    padding: '14px 18px',
                    marginBottom: 10,
                  }}
                >
                  <div
                    role={a.url ? 'button' : undefined}
                    onClick={() => {
                      if (a.url) {
                        void openArticleUrl(a.url);
                      }
                    }}
                    onKeyDown={e => {
                      if (
                        a.url &&
                        (e.key === 'Enter' || e.key === ' ')
                      ) {
                        e.preventDefault();
                        void openArticleUrl(a.url);
                      }
                    }}
                    tabIndex={a.url ? 0 : undefined}
                    style={{
                      fontFamily: 'Georgia, serif',
                      fontSize: 13,
                      fontWeight: 700,
                      color: C.navy,
                      cursor: a.url ? 'pointer' : 'default',
                      textDecoration: 'none',
                    }}
                    onMouseEnter={e => {
                      if (a.url) {
                        e.currentTarget.style.color = C.teal;
                        e.currentTarget.style.textDecoration =
                          'underline';
                      }
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.color = C.navy;
                      e.currentTarget.style.textDecoration =
                        'none';
                    }}
                  >
                    {a.title}
                  </div>
                  <div style={{
                    fontSize: 11,
                    color: C.slate,
                    marginTop: 6,
                  }}>
                    <span style={{
                      fontFamily: 'Courier New, monospace',
                      fontSize: 9,
                      background: C.lgray,
                      padding: '2px 6px',
                      borderRadius: 4,
                      marginRight: 8,
                    }}>
                      {a.source_type}
                    </span>
                    {a.year ?? ''}
                    {a.authors ? ` · ${a.authors}` : ''}
                  </div>
                  <div style={{
                    fontSize: 12,
                    color: C.slate,
                    marginTop: 8,
                    lineHeight: 1.4,
                  }}>
                    {truncate(a.abstract, 150)}
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <label style={{
                      fontSize: 10,
                      color: C.slate,
                      fontFamily: 'Courier New, monospace',
                      display: 'block',
                      marginBottom: 4,
                    }}>
                      STZ layer
                    </label>
                    <select
                      value={a.stz_layer ?? 'General'}
                      onChange={e =>
                        updateArticle(a, {
                          stz_layer: e.target.value,
                        })}
                      style={{
                        padding: '6px 10px',
                        borderRadius: 6,
                        border: `1px solid ${C.mint}`,
                        fontSize: 12,
                        color: C.navy,
                      }}
                    >
                      <option value="L1">L1 Prompts</option>
                      <option value="L2">L2 Skills</option>
                      <option value="L3">L3 Agents</option>
                      <option value="L4">L4 Contracts</option>
                      <option value="L5">L5 Evaluation</option>
                      <option value="General">General</option>
                    </select>
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <ReadingNotesEditor
                      article={a}
                      onSave={notes =>
                        updateArticle(a, { notes })}
                    />
                  </div>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: 10,
                    marginTop: 12,
                  }}>
                    <label style={{ fontSize: 12, color: C.slate }}>
                      Status{' '}
                      <select
                        value={a.status}
                        onChange={e =>
                          updateArticle(a, {
                            status: e.target.value,
                          })}
                        style={{
                          marginLeft: 6,
                          padding: '4px 8px',
                          borderRadius: 6,
                          border: `1px solid ${C.mint}`,
                        }}
                      >
                        <option value="unread">unread</option>
                        <option value="reading">reading</option>
                        <option value="done">done</option>
                        <option value="captured">captured</option>
                      </select>
                    </label>
                    {(a.status === 'reading' ||
                      a.status === 'done') && (
                      <button
                        type="button"
                        onClick={() => captureArticleToAha(a)}
                        style={{
                          padding: '4px 12px',
                          background: C.teal,
                          color: C.white,
                          border: 'none',
                          borderRadius: 6,
                          fontSize: 11,
                          cursor: 'pointer',
                        }}
                      >
                        Capture to Aha Moments
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => deleteArticle(a.article_id)}
                      style={{
                        padding: '4px 12px',
                        background: `${C.coral}18`,
                        color: C.coral,
                        border: `1px solid ${C.coral}`,
                        borderRadius: 6,
                        fontSize: 11,
                        cursor: 'pointer',
                      }}
                    >
                      Delete
                    </button>
                  </div>
                  {daysAgo > 7 && (
                    <div style={{
                      marginTop: 8,
                      fontSize: 11,
                      color: C.gold,
                      fontWeight: 600,
                    }}>
                      Not updated in {daysAgo} days
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
