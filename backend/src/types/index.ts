// Request/Response types for API
export interface Document {
  id: string;
  title: string;
  content: string;
}

export interface IngestRequest {
  documents: Document[];
}

export interface IngestResponse {
  ingestedDocuments: number;
  ingestedChunks: number;
}

export interface AskRequest {
  question: string;
  topK?: number;
}

export interface Source {
  docId: string;
  title: string;
}

export interface AskResponse {
  answer: string;
  sources: Source[];
}

// Internal types
export interface Chunk {
  chunkId: string;
  docId: string;
  title: string;
  text: string;
}

export interface PineconeMatch {
  id: string;
  score: number;
  metadata: {
    docId: string;
    title: string;
    chunkText: string;
  };
}

export interface PineconeVector {
  id: string;
  values: number[];
  metadata: {
    docId: string;
    title: string;
    chunkText: string;
  };
}

// Error types
export interface ApiError {
  error: string;
  details?: string;
}

