'use client';

import { useState } from 'react';
import QuestionForm from '@/components/QuestionForm';
import AnswerDisplay from '@/components/AnswerDisplay';
import { ToastContainer, useToast } from '@/components/Toast';
import { AskResponse } from '@/types';

export default function AskPage() {
  const [result, setResult] = useState<AskResponse | null>(null);
  const toast = useToast();

  const handleResult = (response: AskResponse) => {
    setResult(response);
  };

  const handleError = (message: string) => {
    toast.error(message);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />

      {/* Page Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Ask a Question</h1>
        <p className="text-[var(--muted)]">
          Get AI-powered answers based on your ingested documents
        </p>
      </div>

      {/* Question Form */}
      <div className="card mb-8">
        <QuestionForm onResult={handleResult} onError={handleError} />
      </div>

      {/* Results */}
      {result && <AnswerDisplay result={result} />}

      {/* Empty State */}
      {!result && (
        <div className="text-center py-12 text-[var(--muted)]">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-lg">Ask a question to get started</p>
          <p className="text-sm mt-2">
            Make sure you&apos;ve{' '}
            <a href="/docs" className="text-accent-600 hover:underline">
              ingested some documents
            </a>{' '}
            first
          </p>
        </div>
      )}
    </div>
  );
}

