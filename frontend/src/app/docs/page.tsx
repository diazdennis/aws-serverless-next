'use client';

import DocumentForm from '@/components/DocumentForm';
import { ToastContainer, useToast } from '@/components/Toast';

export default function DocsPage() {
  const toast = useToast();

  const handleSuccess = (message: string) => {
    toast.success(message);
  };

  const handleError = (message: string) => {
    toast.error(message);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />

      {/* Page Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Add Documents</h1>
        <p className="text-[var(--muted)]">
          Ingest plain-text documents to enable Q&A search
        </p>
      </div>

      {/* Instructions */}
      <div className="card mb-8 bg-accent-50 dark:bg-accent-900/20 border-accent-200 dark:border-accent-800">
        <h2 className="font-semibold text-accent-800 dark:text-accent-300 mb-2">
          How it works
        </h2>
        <ol className="list-decimal list-inside space-y-1 text-sm text-accent-700 dark:text-accent-400">
          <li>Enter a unique Document ID (used for updates and citations)</li>
          <li>Add a descriptive title</li>
          <li>Paste your document content as plain text</li>
          <li>Click &quot;Ingest&quot; to process and store the document</li>
        </ol>
        <p className="mt-3 text-sm text-accent-600 dark:text-accent-400">
          <strong>Tip:</strong> Re-ingesting a document with the same ID will update it, not duplicate it.
        </p>
      </div>

      {/* Document Form */}
      <DocumentForm onSuccess={handleSuccess} onError={handleError} />

      {/* Help Section */}
      <div className="mt-12 text-center text-[var(--muted)]">
        <p className="text-sm">
          After ingesting documents, go to the{' '}
          <a href="/" className="text-accent-600 hover:underline">
            Ask page
          </a>{' '}
          to query them.
        </p>
      </div>
    </div>
  );
}

