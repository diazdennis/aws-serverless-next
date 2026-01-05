# Doc Q&A Portal

A RAG-powered (Retrieval-Augmented Generation) document Q&A application built with Next.js, AWS Lambda, and Pinecone.

## Features

- **Document Ingestion**: Upload plain-text documents with chunking and embedding
- **Q&A Interface**: Ask natural language questions about your documents
- **RAG Pipeline**: Retrieval-Augmented Generation using Pinecone for vector search
- **Serverless Backend**: AWS Lambda functions with API Gateway
- **Modern Frontend**: Next.js 14 with TypeScript and Tailwind CSS
- **Free AI Services**: Uses HuggingFace free tier for embeddings and LLM
- **Timeout Handling**: Frontend handles timeouts and connection errors gracefully

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Backend | Node.js 20, TypeScript, AWS Lambda |
| API | AWS API Gateway (HTTP API) |
| Vector Store | Pinecone |
| LLM | HuggingFace (meta-llama/Llama-3.2-3B-Instruct) |
| Embeddings | HuggingFace (sentence-transformers/all-MiniLM-L6-v2) |
| IaC | Serverless Framework |

## Prerequisites

- Node.js 20+
- npm or yarn
- AWS CLI configured (for deployment)
- HuggingFace API key (free tier available)
- Pinecone account and API key

## Project Structure

```
aws-lambda-next/
├── frontend/                    # Next.js app
│   ├── src/
│   │   ├── app/                # App Router pages
│   │   ├── components/         # React components
│   │   ├── lib/                # API client
│   │   └── types/              # TypeScript types
│   └── package.json
│
├── backend/                     # Serverless Lambda
│   ├── src/
│   │   ├── handlers/           # Lambda handlers
│   │   ├── services/           # Business logic
│   │   ├── utils/              # Utilities
│   │   └── types/              # TypeScript types
│   ├── tests/                  # Jest tests
│   ├── serverless.yml          # IaC definition
│   └── package.json
│
└── README.md
```

## Environment Variables

### Backend (`backend/.env`)

```bash
# HuggingFace API Key for embeddings and chat completions
# Get your free token at: https://huggingface.co/settings/tokens
HUGGINGFACE_API_KEY=hf_...

# Pinecone API Key
PINECONE_API_KEY=pcsk_...

# Pinecone Index Name (must exist with 384 dimensions, cosine metric)
PINECONE_INDEX=doc-qa

# Frontend URL for CORS (optional, defaults to http://localhost:3000)
FRONTEND_URL=http://localhost:3000
```

### Frontend (`frontend/.env.local`)

```bash
# Backend API URL (serverless-offline runs on 3001)
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Setup Instructions

### 1. Get HuggingFace API Key

1. Sign up at [HuggingFace](https://huggingface.co/)
2. Go to [Settings > Access Tokens](https://huggingface.co/settings/tokens)
3. Create a new token with **"Write"** access (includes inference permissions)
4. Copy the token (starts with `hf_`)

### 2. Create Pinecone Index

1. Log in to [Pinecone Console](https://app.pinecone.io/)
2. Create a new index with:
   - **Name**: `doc-qa` (or your preferred name)
   - **Dimensions**: `384` (for HuggingFace all-MiniLM-L6-v2 model)
   - **Metric**: `cosine`

### 3. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 4. Configure Environment Variables

```bash
# Backend
cd backend
cp .env.example .env  # Then edit with your API keys

# Frontend
cd ../frontend
echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > .env.local
```

### 5. Run Locally

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Runs on http://localhost:3001
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Runs on http://localhost:3000
```

### 6. Run Tests

```bash
cd backend
npm test

# With coverage
npm run test:coverage
```

## API Documentation

### POST /ingest

Ingest one or more documents into the vector store.

**Request:**
```json
{
  "documents": [
    {
      "id": "refund-policy",
      "title": "Refund Policy",
      "content": "Full refund within 30 days with receipt. No refunds on digital goods. Partial refunds available for items over 30 days with manager approval."
    },
    {
      "id": "shipping-info",
      "title": "Shipping Information",
      "content": "Free shipping on orders over $50. Standard shipping takes 5-7 business days. Express shipping available for $9.99."
    }
  ]
}
```

**Response:**
```json
{
  "ingestedDocuments": 2,
  "ingestedChunks": 4
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3001/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "documents": [
      {
        "id": "refund-policy",
        "title": "Refund Policy",
        "content": "Full refund within 30 days with receipt. No refunds on digital goods."
      }
    ]
  }'
```

### POST /ask

Ask a question and get an answer based on ingested documents.

**Request:**
```json
{
  "question": "Can I get a refund on a digital product?",
  "topK": 3
}
```

**Response:**
```json
{
  "answer": "No, digital products are not eligible for refunds according to the refund policy.",
  "sources": [
    {
      "docId": "refund-policy",
      "title": "Refund Policy"
    }
  ]
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3001/ask \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is the refund policy for digital goods?",
    "topK": 3
  }'
```

## Chunking Strategy

Documents are chunked using the following strategy:

1. **Paragraph Splitting**: Split by double newlines (`\n\n`)
2. **Sentence Splitting**: If a paragraph exceeds 500 characters, split by sentence boundaries (`.`, `!`, `?`)
3. **Chunk Merging**: Small chunks (<100 chars) are merged with adjacent chunks
4. **ID Generation**: Each chunk gets an ID like `docId#chunk-0`, `docId#chunk-1`, etc.

This strategy ensures:
- Semantic coherence within chunks
- Optimal chunk sizes for embedding (300-500 chars)
- Traceability back to source documents

## Frontend Error Handling

The frontend includes comprehensive error handling:

- **Timeout Errors**: 2-minute timeout for ingestion, 1-minute for questions
- **Network Errors**: Detects connection issues and provides helpful messages
- **HTTP Errors**: Displays API error messages with details
- **User Feedback**: Clear error messages guide users on what to do next

## Deployment

### Deploy Backend to AWS

```bash
cd backend

# Development
npm run deploy

# Production
npm run deploy:prod
```

The deploy command will output the API Gateway URL. Update the frontend environment variable accordingly.

### Deploy Frontend

Deploy to Vercel, Netlify, or AWS Amplify:

```bash
cd frontend
npm run build

# Then deploy the .next folder to your hosting provider
```

Set `NEXT_PUBLIC_API_URL` to your deployed API Gateway URL.

## Error Handling

The API returns consistent error responses:

```json
{
  "error": "Error message here",
  "details": "Optional additional details"
}
```

| Status Code | Meaning |
|-------------|---------|
| 400 | Bad Request (validation error) |
| 404 | Not Found |
| 408 | Request Timeout |
| 500 | Internal Server Error |
| 502 | External Service Error (HuggingFace/Pinecone) |

## Trade-offs & Assumptions

### Current Limitations

1. **Simple Chunking**: Using paragraph/sentence-based splitting. Production would use semantic chunking or overlapping windows with better context preservation.

2. **Synchronous Ingest**: All processing happens in a single request. For large documents, this could hit Lambda timeout limits.

3. **No Authentication**: As specified, no auth is implemented. Production would require API keys or JWT.

4. **Single Namespace**: All documents share one Pinecone namespace. Multi-tenant would need partitioning.

5. **No Caching**: Each question triggers fresh embedding + query + LLM call. Could cache frequent queries.

6. **Free Tier Limits**: HuggingFace free tier has rate limits (~1000 requests/day). Production would need paid tier or alternative provider.


### If I Had More Time, I Would Add...

1. **Async Ingestion with SQS**
   - Write document metadata to DynamoDB
   - Publish message to SQS queue
   - Separate Lambda processes chunks asynchronously
   - Status endpoint to check ingestion progress

2. **File Upload Support**
   - S3 pre-signed URLs for direct upload
   - Azure Document Intelligence for PDF/DOCX
   - File type detection and routing

3. **Better RAG**
   - Hybrid search (keyword + semantic)
   - Re-ranking with cross-encoder
   - Query expansion/reformulation
   - Metadata filtering

4. **Production Features**
   - API key authentication
   - Rate limiting
   - CloudWatch metrics and alarms
   - X-Ray tracing
   - Response streaming for long answers

5. **UI Improvements**
   - Document management (list, delete)
   - Chat history
   - Source highlighting
   - Dark/light mode toggle

6. **Multi-tenancy & Workspaces**
   - User/organization isolation
   - Separate Pinecone namespaces per tenant
   - Workspace-level access controls
   - Document sharing between workspaces

7. **Caching & Performance**
   - Redis/ElastiCache for query result caching
   - Embedding cache for frequently asked questions
   - CDN for static assets
   - Lambda provisioned concurrency for cold starts
   - Query result pagination

8. **Multi-language Support**
    - Automatic language detection
    - Language-specific embedding models
    - Translation for cross-language queries
    - Multi-language document support

9. **Document Management**
    - Document versioning and history
    - Bulk operations (delete, update multiple docs)
    - Document tags and categories
    - Search/filter documents by metadata
    - Document expiration/archival policies


## Testing

The backend includes Jest unit tests for:

- **Chunker**: Document splitting, ID generation, edge cases
- **Prompt Building**: Context formatting, question injection
- **Validation**: Input schema validation for both endpoints

Run tests:
```bash
cd backend
npm test
```

## License

MIT

