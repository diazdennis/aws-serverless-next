import { Chunk } from '../types';

export interface ChunkOptions {
  /** Maximum characters per chunk (default: 500) */
  maxChunkSize?: number;
  /** Minimum characters per chunk - smaller chunks get merged (default: 100) */
  minChunkSize?: number;
}

const DEFAULT_MAX_CHUNK_SIZE = 500;
const DEFAULT_MIN_CHUNK_SIZE = 100;

/**
 * Split text into sentences using common sentence terminators
 */
function splitIntoSentences(text: string): string[] {
  const sentences = text.split(/(?<=[.!?])\s+/);
  return sentences.filter((s) => s.trim().length > 0);
}

/**
 * Split a paragraph into smaller chunks if it exceeds maxSize
 */
function splitLargeParagraph(paragraph: string, maxSize: number): string[] {
  if (paragraph.length <= maxSize) {
    return [paragraph];
  }

  const sentences = splitIntoSentences(paragraph);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    if (sentence.length > maxSize) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
      for (let i = 0; i < sentence.length; i += maxSize) {
        chunks.push(sentence.slice(i, i + maxSize).trim());
      }
      continue;
    }

    if (currentChunk.length + sentence.length + 1 > maxSize) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = sentence;
    } else {
      currentChunk = currentChunk ? `${currentChunk} ${sentence}` : sentence;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Merge small chunks together until they reach minimum size
 */
function mergeSmallChunks(chunks: string[], minSize: number, maxSize: number): string[] {
  if (chunks.length <= 1) {
    return chunks;
  }

  const merged: string[] = [];
  let currentChunk = '';

  for (const chunk of chunks) {
    if (!currentChunk) {
      currentChunk = chunk;
      continue;
    }

    if (currentChunk.length < minSize) {
      const combined = `${currentChunk} ${chunk}`;
      if (combined.length <= maxSize) {
        currentChunk = combined;
      } else {
        merged.push(currentChunk);
        currentChunk = chunk;
      }
    } else {
      merged.push(currentChunk);
      currentChunk = chunk;
    }
  }

  if (currentChunk) {
    if (currentChunk.length < minSize && merged.length > 0) {
      const lastMerged = merged[merged.length - 1];
      const combined = `${lastMerged} ${currentChunk}`;
      if (combined.length <= maxSize) {
        merged[merged.length - 1] = combined;
      } else {
        merged.push(currentChunk);
      }
    } else {
      merged.push(currentChunk);
    }
  }

  return merged;
}

/**
 * Chunk a document into smaller pieces for embedding
 * 
 * Strategy:
 * @param docId - Unique document identifier
 * @param title - Document title (stored in metadata)
 * @param content - Document content to chunk
 * @param options - Chunking options
 */
export function chunkDocument(
  docId: string,
  title: string,
  content: string,
  options?: ChunkOptions
): Chunk[] {
  const maxSize = options?.maxChunkSize ?? DEFAULT_MAX_CHUNK_SIZE;
  const minSize = options?.minChunkSize ?? DEFAULT_MIN_CHUNK_SIZE;

  const trimmedContent = content.trim();
  if (!trimmedContent) {
    return [];
  }

  const paragraphs = trimmedContent
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  let rawChunks: string[] = [];
  for (const paragraph of paragraphs) {
    const subChunks = splitLargeParagraph(paragraph, maxSize);
    rawChunks.push(...subChunks);
  }

  const mergedChunks = mergeSmallChunks(rawChunks, minSize, maxSize);

  return mergedChunks.map((text, index) => ({
    chunkId: `${docId}#chunk-${index}`,
    docId,
    title,
    text,
  }));
}

/**
 * Get statistics about chunking results
 */
export function getChunkStats(chunks: Chunk[]): {
  count: number;
  avgLength: number;
  minLength: number;
  maxLength: number;
} {
  if (chunks.length === 0) {
    return { count: 0, avgLength: 0, minLength: 0, maxLength: 0 };
  }

  const lengths = chunks.map((c) => c.text.length);
  return {
    count: chunks.length,
    avgLength: Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length),
    minLength: Math.min(...lengths),
    maxLength: Math.max(...lengths),
  };
}

