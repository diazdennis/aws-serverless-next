// Document types
export interface Document {
  id: string;
  title: string;
  content: string;
}

// API Request/Response types
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

export interface ApiError {
  error: string;
  details?: string;
}

// Form state types
export interface DocumentFormData {
  id: string;
  title: string;
  content: string;
}

export interface QuestionFormData {
  question: string;
  topK: number;
}

