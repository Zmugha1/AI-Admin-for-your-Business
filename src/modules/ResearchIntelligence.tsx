import { useState, useEffect, useCallback, useMemo } from 'react';
import { openUrl } from '@tauri-apps/plugin-opener';
import { getDb } from '../services/db';
import { v4 as uuidv4 } from 'uuid';

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

interface RssFeed {
  feed_id: string;
  name: string;
  url: string;
  category: string;
  active: number;
  last_fetched: string | null;
}

interface RssItem {
  item_id: string;
  feed_id: string;
  feed_name: string;
  feed_category: string;
  title: string;
  link: string | null;
  summary: string | null;
  published_date: string | null;
  captured: number;
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

const CATEGORY_PILLS: { id: string; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'ai', label: 'AI' },
  { id: 'ld', label: 'L&D' },
  { id: 'education', label: 'Education' },
  { id: 'data', label: 'Data' },
  { id: 'business', label: 'Business' },
  { id: 'research', label: 'Research' },
  { id: 'smallbiz', label: 'Small Biz' },
];

function categoryBorderColor(cat: string): string {
  switch (cat) {
    case 'ai':
    case 'data':
      return C.teal;
    case 'ld':
      return C.gold;
    case 'education':
      return C.navy;
    case 'business':
      return C.slate;
    case 'research':
      return C.coral;
    case 'smallbiz':
      return C.green;
    default:
      return C.mint;
  }
}

function truncate(s: string | null, n: number): string {
  if (!s) return '';
  const t = s.trim();
  return t.length <= n ? t : `${t.slice(0, n)}…`;
}

function textEl(parent: Element | null, tag: string): string {
  if (!parent) return '';
  const el = parent.getElementsByTagName(tag)[0];
  return el?.textContent?.trim() ?? '';
}

function parseRssItems(xmlText: string): {
  title: string;
  link: string | null;
  summary: string | null;
  pubDate: string | null;
}[] {
  const parser = new DOMParser();
  const xml = parser.parseFromString(xmlText, 'text/xml');
  const out: {
    title: string;
    link: string | null;
    summary: string | null;
    pubDate: string | null;
  }[] = [];

  const items = xml.querySelectorAll('item');
  items.forEach(item => {
    let link = textEl(item, 'link') || null;
    if (!link) {
      const guid = item.getElementsByTagName('guid')[0]?.textContent?.trim();
      if (guid?.startsWith('http')) link = guid;
    }
    out.push({
      title: textEl(item, 'title') || 'Untitled',
      link,
      summary:
        textEl(item, 'description') ||
        textEl(item, 'summary') ||
        null,
      pubDate: textEl(item, 'pubDate') || null,
    });
  });

  if (out.length === 0) {
    xml.querySelectorAll('entry').forEach(entry => {
      const linkEl = entry.querySelector('link[href]');
      const href = linkEl?.getAttribute('href') ?? null;
      out.push({
        title: textEl(entry, 'title') || 'Untitled',
        link: href,
        summary: textEl(entry, 'summary') || null,
        pubDate: textEl(entry, 'updated') || null,
      });
    });
  }

  return out;
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
  const [feeds, setFeeds] = useState<RssFeed[]>([]);
  const [rssItems, setRssItems] = useState<RssItem[]>([]);
  const [articles, setArticles] = useState<ResearchArticle[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
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
      const f = await db.select<RssFeed[]>(
        `SELECT feed_id, name, url, category,
                active, last_fetched
         FROM rss_feeds
         ORDER BY name ASC`
      );
      setFeeds(f);

      const ri = await db.select<RssItem[]>(
        `SELECT ri.item_id, ri.feed_id, rf.name AS feed_name,
                rf.category AS feed_category,
                ri.title, ri.link, ri.summary,
                ri.published_date, ri.captured
         FROM rss_items ri
         JOIN rss_feeds rf ON ri.feed_id = rf.feed_id
         ORDER BY ri.created_at DESC
         LIMIT 50`
      );
      setRssItems(ri);

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

  const filteredRss = useMemo(() => {
    if (selectedCategory === 'all') return rssItems;
    return rssItems.filter(
      i => i.feed_category === selectedCategory
    );
  }, [rssItems, selectedCategory]);

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

  async function linkExists(link: string | null): Promise<boolean> {
    if (!link) return false;
    const db = await getDb();
    const r = await db.select<{ n: number }[]>(
      `SELECT COUNT(*) as n FROM rss_items WHERE link = ?`,
      [link]
    );
    return (r[0]?.n ?? 0) > 0;
  }

  async function fetchLatest() {
    setFetching(true);
    setSaveStatus('');
    const db = await getDb();
    const activeFeeds = feeds.filter(f => f.active === 1);
    for (const feed of activeFeeds) {
      try {
        const res = await fetch(feed.url);
        if (!res.ok) throw new Error(String(res.status));
        const text = await res.text();
        const parsed = parseRssItems(text);
        for (const it of parsed) {
          if (it.link && (await linkExists(it.link))) {
            continue;
          }
          const itemId = uuidv4();
          await db.execute(
            `INSERT OR IGNORE INTO rss_items
               (item_id, feed_id, title, link, summary,
                published_date)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              itemId,
              feed.feed_id,
              it.title,
              it.link,
              it.summary,
              it.pubDate,
            ]
          );
        }
        await db.execute(
          `UPDATE rss_feeds SET last_fetched = datetime('now')
           WHERE feed_id = ?`,
          [feed.feed_id]
        );
      } catch (err) {
        console.error(`RSS fetch ${feed.name}:`, err);
      }
    }
    setSaveStatus('Feed updated');
    setTimeout(() => setSaveStatus(''), 4000);
    await load();
    setFetching(false);
  }

  async function captureRssToAha(item: RssItem) {
    const db = await getDb();
    const raw = item.summary ?? item.title;
    await db.execute(
      `INSERT INTO aha_moments
         (aha_id, raw_input, input_type, key_insight,
          stz_layer, source_title, content_worthy)
       VALUES (?, ?, 'text', ?, 1, ?, 0)`,
      [
        uuidv4(),
        raw,
        item.title,
        item.link ?? item.feed_name,
      ]
    );
    await db.execute(
      `UPDATE rss_items SET captured = 1 WHERE item_id = ?`,
      [item.item_id]
    );
    await load();
  }

  async function saveRssToReading(item: RssItem) {
    const db = await getDb();
    await db.execute(
      `INSERT INTO research_articles
         (article_id, title, source, source_type, url,
          abstract, status)
       VALUES (?, ?, ?, 'rss', ?, ?, 'unread')`,
      [
        uuidv4(),
        item.title,
        item.feed_name,
        item.link,
        item.summary,
      ]
    );
    setSaveStatus('Saved');
    setTimeout(() => setSaveStatus(''), 3000);
    await load();
  }

  async function openExternal(url: string | null) {
    if (!url) return;
    try {
      await openUrl(url);
    } catch (e) {
      console.error(e);
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
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 16,
          }}>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 6,
            }}>
              {CATEGORY_PILLS.map(p => {
                const on = selectedCategory === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedCategory(p.id)}
                    style={{
                      padding: '4px 12px',
                      borderRadius: 20,
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 11,
                      background: on ? C.teal : C.lgray,
                      color: on ? C.white : C.slate,
                      fontFamily: 'Trebuchet MS, sans-serif',
                    }}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              disabled={fetching}
              onClick={() => fetchLatest()}
              style={{
                padding: '8px 18px',
                background: fetching ? C.slate : C.teal,
                color: C.white,
                border: 'none',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                cursor: fetching ? 'default' : 'pointer',
              }}
            >
              {fetching ? 'Fetching…' : 'Fetch Latest'}
            </button>
          </div>

          {filteredRss.length === 0 ? (
            <p style={{
              textAlign: 'center',
              color: C.slate,
              fontFamily: 'Trebuchet MS, sans-serif',
              fontSize: 13,
            }}>
              No news items yet. Click Fetch Latest to load your feeds.
            </p>
          ) : (
            filteredRss.map(item => (
              <div
                key={item.item_id}
                style={{
                  background: C.white,
                  border: `1px solid ${C.mint}`,
                  borderLeft: `4px solid ${categoryBorderColor(item.feed_category)}`,
                  borderRadius: 10,
                  padding: '12px 16px',
                  marginBottom: 8,
                }}
              >
                <div
                  role={item.link ? 'button' : undefined}
                  onClick={() =>
                    item.link && openExternal(item.link)}
                  style={{
                    fontFamily: 'Georgia, serif',
                    fontSize: 13,
                    fontWeight: 700,
                    color: C.navy,
                    cursor: item.link ? 'pointer' : 'default',
                  }}
                >
                  {item.title}
                </div>
                <div style={{
                  fontFamily: 'Courier New, monospace',
                  fontSize: 10,
                  color: C.slate,
                  marginTop: 4,
                }}>
                  {item.feed_name}
                  {item.published_date
                    ? ` · ${item.published_date}`
                    : ''}
                </div>
                <div style={{
                  fontFamily: 'Trebuchet MS, sans-serif',
                  fontSize: 12,
                  color: C.slate,
                  marginTop: 6,
                  lineHeight: 1.4,
                }}>
                  {truncate(item.summary, 120)}
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 8,
                  marginTop: 10,
                }}>
                  {item.captured === 1 ? (
                    <span style={{
                      background: C.green,
                      color: C.white,
                      fontSize: 10,
                      padding: '4px 10px',
                      borderRadius: 6,
                    }}>
                      Captured
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => captureRssToAha(item)}
                      style={{
                        background: C.teal,
                        color: C.white,
                        fontSize: 10,
                        padding: '4px 10px',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                      }}
                    >
                      Capture
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => saveRssToReading(item)}
                    style={{
                      background: C.lgray,
                      color: C.slate,
                      fontSize: 10,
                      padding: '4px 10px',
                      border: `1px solid ${C.mint}`,
                      borderRadius: 6,
                      cursor: 'pointer',
                    }}
                  >
                    Save to Reading List
                  </button>
                </div>
              </div>
            ))
          )}
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
                    onClick={() => openExternal(hit.url)}
                    style={{
                      fontFamily: 'Georgia, serif',
                      fontSize: 13,
                      fontWeight: 700,
                      color: C.navy,
                      paddingRight: 80,
                      cursor: hit.url ? 'pointer' : 'default',
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
                    onClick={() => openExternal(a.url)}
                    style={{
                      fontFamily: 'Georgia, serif',
                      fontSize: 13,
                      fontWeight: 700,
                      color: C.navy,
                      cursor: a.url ? 'pointer' : 'default',
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
