import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { ZodError } from 'zod';
import { validateAskRequest } from '../utils/validation';
import { embedText } from '../services/embeddings';
import { queryVectors } from '../services/pinecone';
import { generateAnswer, extractSources } from '../services/llm';
import { success, error, validationError } from '../utils/response';
import { AskResponse } from '../types';
import { isOperationalError } from '../utils/errors';

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  console.log('Ask request received');

  try {
    let body: unknown;
    try {
      body = JSON.parse(event.body ?? '{}');
    } catch {
      return error('Invalid JSON in request body', 400);
    }

    const { question, topK } = validateAskRequest(body);
    console.log(`Question: "${question.substring(0, 100)}..." (topK: ${topK})`);

    console.log('Generating question embedding...');
    const questionVector = await embedText(question);

    console.log(`Querying Pinecone for top ${topK} matches...`);
    const matches = await queryVectors(questionVector, topK);
    console.log(`Found ${matches.length} matches`);

    if (matches.length === 0) {
      console.log('No matches found - returning no documents message');
      const response: AskResponse = {
        answer: "I don't have any documents to answer this question. Please ingest some documents first.",
        sources: [],
      };
      return success(response);
    }

    matches.forEach((m, i) => {
      console.log(`Match ${i + 1}: ${m.metadata.docId} (score: ${m.score.toFixed(4)})`);
    });

    console.log('Generating answer with LLM...');
    const answer = await generateAnswer(question, matches);

    const sources = extractSources(matches);

    const response: AskResponse = {
      answer,
      sources,
    };

    console.log(`Answer generated, ${sources.length} source(s) cited`);
    return success(response);

  } catch (err: unknown) {
    if (err instanceof ZodError) {
      console.warn('Validation error:', err.errors);
      return validationError(err);
    }

    if (isOperationalError(err)) {
      console.error('Operational error:', err.message);
      return error(err.message, err.statusCode);
    }

    console.error('Unexpected error during ask:', err);
    return error('Internal server error', 500);
  }
};

