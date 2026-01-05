import {
  Document,
  IngestResponse,
  AskResponse,
  ApiError,
} from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Timeout durations (in milliseconds)
const INGEST_TIMEOUT = 120000; // 2 minutes for ingestion (can be slow with embeddings)
const ASK_TIMEOUT = 60000; // 1 minute for asking questions

/**
 * Custom error class for API errors
 */
export class ApiRequestError extends Error {
  public statusCode: number;
  public details?: string;
  public isTimeout: boolean;
  public isNetworkError: boolean;

  constructor(
    message: string,
    statusCode: number,
    details?: string,
    isTimeout = false,
    isNetworkError = false
  ) {
    super(message);
    this.name = 'ApiRequestError';
    this.statusCode = statusCode;
    this.details = details;
    this.isTimeout = isTimeout;
    this.isNetworkError = isNetworkError;
  }
}

/**
 * Create a fetch request with timeout
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiRequestError(
        'Request timed out. The server is taking too long to respond. Please try again.',
        408,
        undefined,
        true,
        false
      );
    }
    
    // Network errors (connection refused, no internet, etc.)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ApiRequestError(
        'Unable to connect to the server. Please check your connection and ensure the backend is running.',
        0,
        error.message,
        false,
        true
      );
    }
    
    throw error;
  }
}

/**
 * Helper to handle API responses
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = 'An error occurred';
    let details: string | undefined;
    const isTimeout = response.status === 408 || response.status === 504;

    try {
      const errorData: ApiError = await response.json();
      errorMessage = errorData.error || errorMessage;
      details = errorData.details;
    } catch {
      // If JSON parsing fails, use status text
      if (isTimeout) {
        errorMessage = 'Request timed out. The server is taking too long to respond. Please try again.';
      } else {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
    }

    throw new ApiRequestError(
      errorMessage,
      response.status,
      details,
      isTimeout,
      false
    );
  }

  return response.json();
}

/**
 * Ingest documents into the vector store
 *
 * @param documents - Array of documents to ingest
 * @returns Promise with ingestion results
 */
export async function ingestDocuments(
  documents: Document[]
): Promise<IngestResponse> {
  try {
    const response = await fetchWithTimeout(
      `${API_URL}/ingest`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documents }),
      },
      INGEST_TIMEOUT
    );

    return handleResponse<IngestResponse>(response);
  } catch (error) {
    // Re-throw ApiRequestError as-is (already has proper error info)
    if (error instanceof ApiRequestError) {
      throw error;
    }
    
    // Handle any other unexpected errors
    throw new ApiRequestError(
      'An unexpected error occurred while ingesting documents',
      0,
      error instanceof Error ? error.message : String(error),
      false,
      true
    );
  }
}

/**
 * Ask a question and get an answer based on ingested documents
 *
 * @param question - The question to ask
 * @param topK - Number of context chunks to retrieve (default: 3)
 * @returns Promise with answer and sources
 */
export async function askQuestion(
  question: string,
  topK = 3
): Promise<AskResponse> {
  try {
    const response = await fetchWithTimeout(
      `${API_URL}/ask`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question, topK }),
      },
      ASK_TIMEOUT
    );

    const result = await handleResponse<AskResponse>(response);
    
    // Validate response structure to prevent rendering incomplete data
    if (!result || typeof result !== 'object') {
      throw new ApiRequestError(
        'Invalid response format from server',
        500,
        'Response is not a valid object'
      );
    }
    
    if (typeof result.answer !== 'string') {
      throw new ApiRequestError(
        'Invalid response format: missing answer',
        500,
        'Response missing required field: answer'
      );
    }
    
    if (!Array.isArray(result.sources)) {
      throw new ApiRequestError(
        'Invalid response format: missing sources',
        500,
        'Response missing required field: sources'
      );
    }
    
    return result;
  } catch (error) {
    // Re-throw ApiRequestError as-is (already has proper error info)
    if (error instanceof ApiRequestError) {
      throw error;
    }
    
    // Handle any other unexpected errors
    throw new ApiRequestError(
      'An unexpected error occurred while asking the question',
      0,
      error instanceof Error ? error.message : String(error),
      false,
      true
    );
  }
}

/**
 * Check if the API is available
 */
export function getApiUrl(): string {
  return API_URL;
}
