import { z } from 'zod';

/**
 * Schema for a single document to be ingested
 * - id: alphanumeric with dashes and underscores, 1-100 chars
 * - title: 1-200 chars
 * - content: 1-50000 chars (plain text)
 */
export const DocumentSchema = z.object({
  id: z
    .string()
    .min(1, 'Document ID is required')
    .max(100, 'Document ID must be at most 100 characters')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Document ID must contain only letters, numbers, dashes, and underscores'
    ),
  title: z
    .string()
    .min(1, 'Document title is required')
    .max(200, 'Document title must be at most 200 characters'),
  content: z
    .string()
    .min(1, 'Document content is required')
    .max(50000, 'Document content must be at most 50000 characters'),
});

/**
 * Schema for the ingest request
 * - documents: array of 1-10 documents
 */
export const IngestRequestSchema = z.object({
  documents: z
    .array(DocumentSchema)
    .min(1, 'At least one document is required')
    .max(10, 'Maximum 10 documents per request'),
});

/**
 * Schema for the ask request
 * - question: 1-1000 chars
 * - topK: optional, 1-10, defaults to 3
 */
export const AskRequestSchema = z.object({
  question: z
    .string()
    .min(1, 'Question is required')
    .max(1000, 'Question must be at most 1000 characters'),
  topK: z
    .number()
    .int('topK must be an integer')
    .min(1, 'topK must be at least 1')
    .max(10, 'topK must be at most 10')
    .optional()
    .default(3),
});

// Type exports for validated data
export type ValidatedDocument = z.infer<typeof DocumentSchema>;
export type ValidatedIngestRequest = z.infer<typeof IngestRequestSchema>;
export type ValidatedAskRequest = z.infer<typeof AskRequestSchema>;

/**
 * Validate ingest request body
 * @throws ZodError if validation fails
 */
export function validateIngestRequest(body: unknown): ValidatedIngestRequest {
  return IngestRequestSchema.parse(body);
}

/**
 * Validate ask request body
 * @throws ZodError if validation fails
 */
export function validateAskRequest(body: unknown): ValidatedAskRequest {
  return AskRequestSchema.parse(body);
}

