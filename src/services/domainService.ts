import { invoke } from '@tauri-apps/api/core';
import { getDb } from './db';
import { v4 as uuidv4 } from 'uuid';

export interface DomainDocument {
  doc_id: string;
  title: string;
  doc_type: string;
  file_path: string | null;
  file_name: string | null;
  raw_text: string | null;
  word_count: number;
  chunk_count: number;
  embedded: number;
  embedded_at: string | null;
  stz_layer: string | null;
  tags: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DomainEmbedding {
  embedding_id: string;
  doc_id: string;
  chunk_index: number;
  chunk_text: string;
  chunk_tokens: number;
  embedding_json: string | null;
  created_at: string;
}

export interface RetrievedChunk {
  doc_id: string;
  doc_title: string;
  chunk_index: number;
  chunk_text: string;
  similarity: number;
}

export const DOC_TYPES = [
  'dissertation',
  'framework',
  'paper',
  'career_clusters',
  'methodology',
  'client_notes',
  'research',
  'other',
];

export const STZ_LAYERS = [
  'L1 Prompts',
  'L2 Skills',
  'L3 Agents',
  'L4 Contracts',
  'L5 Evaluation',
  'General',
];

export async function getAllDocuments(
): Promise<DomainDocument[]> {
  const db = await getDb();
  return db.select<DomainDocument[]>(
    `SELECT * FROM domain_documents
     ORDER BY created_at DESC`
  );
}

export async function addDocument(
  title: string,
  docType: string,
  rawText: string,
  filePath: string | null,
  fileName: string | null,
  stzLayer: string | null,
  tags: string | null,
  notes: string | null,
): Promise<string> {
  const db = await getDb();
  const docId = uuidv4();
  const wordCount =
    rawText.split(/\s+/).filter(Boolean).length;

  await db.execute(
    `INSERT INTO domain_documents
       (doc_id, title, doc_type,
        file_path, file_name, raw_text,
        word_count, stz_layer, tags, notes)
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [
      docId, title, docType,
      filePath, fileName, rawText,
      wordCount, stzLayer, tags, notes,
    ]
  );

  await db.execute(
    `INSERT INTO audit_log
       (log_id, action, entity_type,
        entity_id, details)
     VALUES (?, 'document_added',
             'domain_documents', ?, ?)`,
    [uuidv4(), docId,
      `${title} -- ${wordCount} words`]
  );

  return docId;
}

export async function chunkAndEmbed(
  docId: string,
  rawText: string,
  onProgress?: (pct: number) => void,
): Promise<void> {
  const db = await getDb();

  // Delete existing chunks for this doc
  await db.execute(
    `DELETE FROM domain_embeddings
     WHERE doc_id = ?`,
    [docId]
  );

  // Chunk the text
  const chunks = await invoke<{
    chunk_index: number;
    text: string;
    token_count: number;
  }[]>('chunk_text', {
    text: rawText,
    chunkSize: 400,
    overlap: 50,
  });

  if (chunks.length === 0) return;

  // Embed each chunk
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];

    const embedding = await invoke<number[]>(
      'embed_chunk',
      { chunkText: chunk.text }
    );

    const embeddingId = uuidv4();
    await db.execute(
      `INSERT INTO domain_embeddings
         (embedding_id, doc_id, chunk_index,
          chunk_text, chunk_tokens,
          embedding_json)
       VALUES (?,?,?,?,?,?)`,
      [
        embeddingId,
        docId,
        chunk.chunk_index,
        chunk.text,
        chunk.token_count,
        JSON.stringify(embedding),
      ]
    );

    if (onProgress) {
      onProgress(
        Math.round(((i + 1) / chunks.length) * 100)
      );
    }
  }

  // Mark document as embedded
  await db.execute(
    `UPDATE domain_documents
     SET embedded = 1,
         chunk_count = ?,
         embedded_at = datetime('now'),
         updated_at = datetime('now')
     WHERE doc_id = ?`,
    [chunks.length, docId]
  );
}

export async function retrieveRelevantChunks(
  query: string,
  topK: number = 5,
): Promise<RetrievedChunk[]> {
  const db = await getDb();

  // Embed the query
  const queryEmbedding = await invoke<number[]>(
    'embed_chunk',
    { chunkText: query }
  );

  // Get all embeddings
  const embeddings = await db.select<{
    embedding_id: string;
    doc_id: string;
    chunk_index: number;
    chunk_text: string;
    embedding_json: string;
  }[]>(
    `SELECT e.embedding_id, e.doc_id,
            e.chunk_index, e.chunk_text,
            e.embedding_json
     FROM domain_embeddings e
     JOIN domain_documents d
       ON e.doc_id = d.doc_id
     WHERE d.embedded = 1
       AND e.embedding_json IS NOT NULL`
  );

  // Score each chunk
  const scored: RetrievedChunk[] = [];

  for (const emb of embeddings) {
    try {
      const embVec: number[] =
        JSON.parse(emb.embedding_json);

      const similarity = await invoke<number>(
        'cosine_similarity',
        {
          vecA: queryEmbedding,
          vecB: embVec,
        }
      );

      const doc = await db.select<{
        title: string;
      }[]>(
        `SELECT title FROM domain_documents
         WHERE doc_id = ?`,
        [emb.doc_id]
      );

      scored.push({
        doc_id: emb.doc_id,
        doc_title: doc[0]?.title ?? 'Unknown',
        chunk_index: emb.chunk_index,
        chunk_text: emb.chunk_text,
        similarity,
      });
    } catch {
      continue;
    }
  }

  // Sort by similarity descending
  scored.sort((a, b) =>
    b.similarity - a.similarity
  );

  return scored.slice(0, topK);
}

export async function buildRagContext(
  query: string,
  topK: number = 5,
): Promise<string> {
  const chunks =
    await retrieveRelevantChunks(query, topK);

  if (chunks.length === 0) {
    return '';
  }

  const context = chunks
    .map((c, i) =>
      `[Source ${i + 1}: ${c.doc_title}]\n` +
      c.chunk_text
    )
    .join('\n\n---\n\n');

  return `DOMAIN KNOWLEDGE CONTEXT:\n\n${context}`;
}

export async function deleteDocument(
  docId: string,
): Promise<void> {
  const db = await getDb();
  await db.execute(
    `DELETE FROM domain_embeddings
     WHERE doc_id = ?`,
    [docId]
  );
  await db.execute(
    `DELETE FROM domain_documents
     WHERE doc_id = ?`,
    [docId]
  );
  await db.execute(
    `INSERT INTO audit_log
       (log_id, action, entity_type,
        entity_id, details)
     VALUES (?, 'document_deleted',
             'domain_documents', ?, ?)`,
    [uuidv4(), docId, 'Document removed']
  );
}
