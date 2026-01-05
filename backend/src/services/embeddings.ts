import { featureExtraction } from '@huggingface/inference';
import { ExternalServiceError } from '../utils/errors';

/** HuggingFace embedding model - 384 dimensions */
const EMBEDDING_MODEL = 'sentence-transformers/all-MiniLM-L6-v2';

/**
 * Get HuggingFace API key from environment
 */
function getApiKey(): string {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) {
    throw new ExternalServiceError('HuggingFace', 'HUGGINGFACE_API_KEY environment variable is not set');
  }
  return apiKey;
}

/**
 * Generate embedding for a single text
 * 
 * @param text - Text to embed
 * @returns Array of numbers representing the embedding vector (384 dimensions)
 */
export async function embedText(text: string): Promise<number[]> {
  try {
    const result = await featureExtraction({
      accessToken: getApiKey(),
      model: EMBEDDING_MODEL,
      inputs: text,
    });
    
    if (Array.isArray(result) && Array.isArray(result[0])) {
      return result[0] as number[];
    }
    return result as number[];
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    throw new ExternalServiceError('HuggingFace', `Failed to generate embedding: ${message}`);
  }
}

/**
 * Generate embeddings for multiple texts in a single request
 * More efficient than calling embedText multiple times
 * 
 * @param texts - Array of texts to embed
 * @returns Array of embedding vectors (same order as input)
 */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) {
    return [];
  }

  try {
    const embeddings: number[][] = [];
    for (const text of texts) {
      const result = await featureExtraction({
        accessToken: getApiKey(),
        model: EMBEDDING_MODEL,
        inputs: text,
      });
      
      if (Array.isArray(result) && Array.isArray(result[0])) {
        embeddings.push(result[0] as number[]);
      } else {
        embeddings.push(result as number[]);
      }
    }
    
    return embeddings;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    throw new ExternalServiceError('HuggingFace', `Failed to generate embeddings: ${message}`);
  }
}

/**
 * Get the dimension size of the embedding model
 */
export function getEmbeddingDimension(): number {
  return 384; // all-MiniLM-L6-v2 dimension
}
