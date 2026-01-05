import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { ZodError } from 'zod';
import { validateIngestRequest } from '../utils/validation';
import { chunkDocument, getChunkStats } from '../services/chunker';
import { embedTexts } from '../services/embeddings';
import { upsertVectors, deleteByDocId } from '../services/pinecone';
import { success, error, validationError } from '../utils/response';
import { IngestResponse, PineconeVector } from '../types';
import { isOperationalError } from '../utils/errors';

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  console.log('Ingest request received');

  try {
    let body: unknown;
    try {
      body = JSON.parse(event.body ?? '{}');
    } catch {
      return error('Invalid JSON in request body', 400);
    }

    const { documents } = validateIngestRequest(body);
    console.log(`Processing ${documents.length} document(s)`);

    let totalChunks = 0;

    for (const doc of documents) {
      console.log(`Processing document: ${doc.id} (${doc.title})`);

      await deleteByDocId(doc.id);

      const chunks = chunkDocument(doc.id, doc.title, doc.content);
      
      if (chunks.length === 0) {
        console.log(`Document ${doc.id} produced no chunks (empty content)`);
        continue;
      }

      const stats = getChunkStats(chunks);
      console.log(`Document ${doc.id}: ${stats.count} chunks, avg ${stats.avgLength} chars`);

      const texts = chunks.map((c) => c.text);
      const embeddings = await embedTexts(texts);

      const vectors: PineconeVector[] = chunks.map((chunk, i) => ({
        id: chunk.chunkId,
        values: embeddings[i],
        metadata: {
          docId: chunk.docId,
          title: chunk.title,
          chunkText: chunk.text,
        },
      }));

      await upsertVectors(vectors);
      totalChunks += chunks.length;

      console.log(`Document ${doc.id} ingested: ${chunks.length} chunks`);
    }

    const response: IngestResponse = {
      ingestedDocuments: documents.length,
      ingestedChunks: totalChunks,
    };

    console.log(`Ingest complete: ${response.ingestedDocuments} docs, ${response.ingestedChunks} chunks`);
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

    console.error('Unexpected error during ingest:', err);
    return error('Internal server error', 500);
  }
};

