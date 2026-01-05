'use client';

import { useState } from 'react';
import { DocumentFormData } from '@/types';
import { ingestDocuments, ApiRequestError } from '@/lib/api';
import LoadingSpinner from './LoadingSpinner';

interface DocumentFormProps {
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

const emptyDocument: DocumentFormData = {
  id: '',
  title: '',
  content: '',
};

export default function DocumentForm({ onSuccess, onError }: DocumentFormProps) {
  const [documents, setDocuments] = useState<DocumentFormData[]>([{ ...emptyDocument }]);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<number, Record<string, string>>>({});

  const validateDocument = (doc: DocumentFormData, index: number): boolean => {
    const errors: Record<string, string> = {};

    if (!doc.id.trim()) {
      errors.id = 'Document ID is required';
    } else if (!/^[a-zA-Z0-9_-]+$/.test(doc.id)) {
      errors.id = 'ID can only contain letters, numbers, dashes, and underscores';
    }

    if (!doc.title.trim()) {
      errors.title = 'Title is required';
    }

    if (!doc.content.trim()) {
      errors.content = 'Content is required';
    }

    setValidationErrors((prev) => ({
      ...prev,
      [index]: errors,
    }));

    return Object.keys(errors).length === 0;
  };

  const handleChange = (
    index: number,
    field: keyof DocumentFormData,
    value: string
  ) => {
    setDocuments((prev) =>
      prev.map((doc, i) => (i === index ? { ...doc, [field]: value } : doc))
    );

    // Clear validation error when user starts typing
    if (validationErrors[index]?.[field]) {
      setValidationErrors((prev) => ({
        ...prev,
        [index]: { ...prev[index], [field]: '' },
      }));
    }
  };

  const addDocument = () => {
    setDocuments((prev) => [...prev, { ...emptyDocument }]);
  };

  const removeDocument = (index: number) => {
    if (documents.length > 1) {
      setDocuments((prev) => prev.filter((_, i) => i !== index));
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[index];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all documents
    let isValid = true;
    documents.forEach((doc, index) => {
      if (!validateDocument(doc, index)) {
        isValid = false;
      }
    });

    if (!isValid) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await ingestDocuments(documents);
      onSuccess(
        `Successfully ingested ${result.ingestedDocuments} document(s) with ${result.ingestedChunks} chunks`
      );
      // Reset form
      setDocuments([{ ...emptyDocument }]);
      setValidationErrors({});
    } catch (err) {
      if (err instanceof ApiRequestError) {
        if (err.isTimeout) {
          onError('The ingestion timed out. This can happen with large documents. Please try with smaller documents or fewer documents at once.');
        } else if (err.isNetworkError) {
          onError('Unable to connect to the server. Please ensure the backend is running and try again.');
        } else {
          onError(err.message);
        }
      } else {
        onError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {documents.map((doc, index) => (
        <div key={index} className="card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              Document {index + 1}
            </h3>
            {documents.length > 1 && (
              <button
                type="button"
                onClick={() => removeDocument(index)}
                className="text-red-500 hover:text-red-700 text-sm font-medium"
              >
                Remove
              </button>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor={`doc-id-${index}`}
                className="block text-sm font-medium mb-1"
              >
                Document ID
              </label>
              <input
                type="text"
                id={`doc-id-${index}`}
                value={doc.id}
                onChange={(e) => handleChange(index, 'id', e.target.value)}
                placeholder="e.g., refund-policy"
                className={`input ${validationErrors[index]?.id ? 'border-red-500' : ''}`}
                disabled={isLoading}
              />
              {validationErrors[index]?.id && (
                <p className="text-red-500 text-sm mt-1">
                  {validationErrors[index].id}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor={`doc-title-${index}`}
                className="block text-sm font-medium mb-1"
              >
                Title
              </label>
              <input
                type="text"
                id={`doc-title-${index}`}
                value={doc.title}
                onChange={(e) => handleChange(index, 'title', e.target.value)}
                placeholder="e.g., Refund Policy"
                className={`input ${validationErrors[index]?.title ? 'border-red-500' : ''}`}
                disabled={isLoading}
              />
              {validationErrors[index]?.title && (
                <p className="text-red-500 text-sm mt-1">
                  {validationErrors[index].title}
                </p>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor={`doc-content-${index}`}
              className="block text-sm font-medium mb-1"
            >
              Content
            </label>
            <textarea
              id={`doc-content-${index}`}
              value={doc.content}
              onChange={(e) => handleChange(index, 'content', e.target.value)}
              placeholder="Paste or type your document content here..."
              rows={8}
              className={`textarea ${validationErrors[index]?.content ? 'border-red-500' : ''}`}
              disabled={isLoading}
            />
            {validationErrors[index]?.content && (
              <p className="text-red-500 text-sm mt-1">
                {validationErrors[index].content}
              </p>
            )}
            <p className="text-[var(--muted)] text-sm mt-1">
              {doc.content.length.toLocaleString()} characters
            </p>
          </div>
        </div>
      ))}

      <div className="flex flex-wrap gap-4">
        <button
          type="button"
          onClick={addDocument}
          className="btn btn-secondary"
          disabled={isLoading || documents.length >= 10}
        >
          + Add Another Document
        </button>

        <button
          type="submit"
          className="btn btn-primary flex items-center gap-2"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <LoadingSpinner size="sm" />
              Ingesting...
            </>
          ) : (
            `Ingest ${documents.length} Document${documents.length > 1 ? 's' : ''}`
          )}
        </button>
      </div>

      {documents.length >= 10 && (
        <p className="text-[var(--muted)] text-sm">
          Maximum 10 documents per request
        </p>
      )}
    </form>
  );
}

