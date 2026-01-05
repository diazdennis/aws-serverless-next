import { Pinecone, Index, RecordMetadata } from '@pinecone-database/pinecone';
import { PineconeMatch, PineconeVector } from '../types';
import { ExternalServiceError } from '../utils/errors';

let pineconeClient: Pinecone | null = null;
let pineconeIndex: Index<RecordMetadata> | null = null;

function getClient(): Pinecone {
  if (!pineconeClient) {
    const apiKey = process.env.PINECONE_API_KEY;
    if (!apiKey) {
      throw new ExternalServiceError('Pinecone', 'PINECONE_API_KEY environment variable is not set');
    }
    pineconeClient = new Pinecone({ apiKey });
  }
  return pineconeClient;
}

function getIndex(): Index<RecordMetadata> {
  if (!pineconeIndex) {
    const indexName = process.env.PINECONE_INDEX;
    if (!indexName) {
      throw new ExternalServiceError('Pinecone', 'PINECONE_INDEX environment variable is not set');
    }
    pineconeIndex = getClient().index(indexName);
  }
  return pineconeIndex;
}

/** Maximum vectors per upsert batch */
const UPSERT_BATCH_SIZE = 100;

/**
 * Upsert vectors to Pinecone
 * Handles batching automatically for large vector sets
 * 
 * @param vectors - Array of vectors with IDs and metadata
 */
export async function upsertVectors(vectors: PineconeVector[]): Promise<void> {
  if (vectors.length === 0) {
    return;
  }

  try {
    const index = getIndex();

    for (let i = 0; i < vectors.length; i += UPSERT_BATCH_SIZE) {
      const batch = vectors.slice(i, i + UPSERT_BATCH_SIZE);
      await index.upsert(batch);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    throw new ExternalServiceError('Pinecone', `Failed to upsert vectors: ${message}`);
  }
}

/**
 * Query Pinecone for similar vectors
 * 
 * @param vector - Query vector
 * @param topK - Number of results to return
 * @returns Array of matches with scores and metadata
 */
export async function queryVectors(
  vector: number[],
  topK: number
): Promise<PineconeMatch[]> {
  try {
    const index = getIndex();
    const results = await index.query({
      vector,
      topK,
      includeMetadata: true,
    });

    const matches: PineconeMatch[] = [];
    for (const match of results.matches || []) {
      if (match.metadata && typeof match.score === 'number') {
        matches.push({
          id: match.id,
          score: match.score,
          metadata: {
            docId: String(match.metadata.docId || ''),
            title: String(match.metadata.title || ''),
            chunkText: String(match.metadata.chunkText || ''),
          },
        });
      }
    }

    return matches;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    throw new ExternalServiceError('Pinecone', `Failed to query vectors: ${message}`);
  }
}

/**
 * Delete all vectors for a specific document
 * Used for idempotent re-ingestion (update, not duplicate)
 * 
 * @param docId - Document ID to delete vectors for
 */
export async function deleteByDocId(docId: string): Promise<void> {
  try {
    const index = getIndex();
    
    await index.deleteMany({
      filter: {
        docId: { $eq: docId },
      },
    });
  } catch (err) {
    console.warn(`Could not delete existing vectors for docId ${docId}:`, err);
  }
}

/**
 * Delete vectors by their IDs
 * 
 * @param ids - Array of vector IDs to delete
 */
export async function deleteByIds(ids: string[]): Promise<void> {
  if (ids.length === 0) {
    return;
  }

  try {
    const index = getIndex();
    await index.deleteMany(ids);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    throw new ExternalServiceError('Pinecone', `Failed to delete vectors: ${message}`);
  }
}

/**
 * Check if Pinecone connection is healthy
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const index = getIndex();
    await index.describeIndexStats();
    return true;
  } catch {
    return false;
  }
}

