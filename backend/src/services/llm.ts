import { chatCompletion } from '@huggingface/inference';
import { PineconeMatch } from '../types';
import { ExternalServiceError } from '../utils/errors';

/** HuggingFace chat model - using a more reliable model */
const CHAT_MODEL = 'meta-llama/Llama-3.2-3B-Instruct';

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

/** System prompt for RAG */
const SYSTEM_PROMPT = `You are a helpful assistant that answers questions based only on the provided context. 
Be concise and accurate. If the answer cannot be found in the context, clearly state that you don't have enough information to answer the question.
Do not make up information or use knowledge outside of the provided context.`;

/**
 * Build the RAG prompt with question and retrieved context
 * 
 * @param question - User's question
 * @param matches - Retrieved chunks from Pinecone
 * @returns Formatted prompt string
 */
export function buildPrompt(question: string, matches: PineconeMatch[]): string {
  if (matches.length === 0) {
    return `Question: ${question}

No context documents were found. Please indicate that you cannot answer without relevant documents.`;
  }

  const context = matches
    .map((m, i) => {
      const score = (m.score * 100).toFixed(1);
      return `[${i + 1}] "${m.metadata.title}" (relevance: ${score}%):
${m.metadata.chunkText}`;
    })
    .join('\n\n');

  return `Based on the following context documents, answer the question. If the answer cannot be found in the context, say "I don't have enough information to answer this question."

Context:
${context}

Question: ${question}`;
}

/**
 * Generate an answer using the LLM with RAG context
 * 
 * @param question - User's question
 * @param matches - Retrieved chunks from Pinecone
 * @returns Generated answer string
 */
export async function generateAnswer(
  question: string,
  matches: PineconeMatch[]
): Promise<string> {
  if (matches.length === 0) {
    return "I don't have any documents to answer this question. Please ingest some documents first.";
  }

  try {
    const userPrompt = buildPrompt(question, matches);

    const response = await chatCompletion({
      accessToken: getApiKey(),
      model: CHAT_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 500,
      temperature: 0.3,
    });

    const generatedText = response.choices?.[0]?.message?.content;

    if (!generatedText) {
      return 'Unable to generate an answer. Please try again.';
    }

    return generatedText.trim();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    throw new ExternalServiceError('HuggingFace', `Failed to generate answer: ${message}`);
  }
}

/**
 * Extract unique sources from Pinecone matches
 * 
 * @param matches - Retrieved chunks from Pinecone
 * @returns Array of unique sources (docId + title)
 */
export function extractSources(
  matches: PineconeMatch[]
): Array<{ docId: string; title: string }> {
  const sourcesMap = new Map<string, { docId: string; title: string }>();

  for (const match of matches) {
    if (!sourcesMap.has(match.metadata.docId)) {
      sourcesMap.set(match.metadata.docId, {
        docId: match.metadata.docId,
        title: match.metadata.title,
      });
    }
  }

  return Array.from(sourcesMap.values());
}
