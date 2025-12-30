'use client';

import { useState } from 'react';
import { AskResponse } from '@/types';
import { askQuestion, ApiRequestError } from '@/lib/api';
import LoadingSpinner from './LoadingSpinner';

interface QuestionFormProps {
  onResult: (result: AskResponse) => void;
  onError: (message: string) => void;
}

export default function QuestionForm({ onResult, onError }: QuestionFormProps) {
  const [question, setQuestion] = useState('');
  const [topK, setTopK] = useState(3);
  const [isLoading, setIsLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!question.trim()) {
      onError('Please enter a question');
      return;
    }

    setIsLoading(true);

    try {
      const result = await askQuestion(question.trim(), topK);
      onResult(result);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        if (err.isTimeout) {
          onError('The request timed out. The AI is taking longer than expected. Please try again with a simpler question or check if the backend is running properly.');
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="question" className="block text-sm font-medium mb-2">
          Your Question
        </label>
        <textarea
          id="question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question about your documents..."
          rows={3}
          className="textarea"
          disabled={isLoading}
        />
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          {showAdvanced ? '− Hide' : '+ Show'} advanced options
        </button>
      </div>

      {showAdvanced && (
        <div className="p-4 rounded-lg bg-[var(--card-bg)] border border-[var(--border)]">
          <label htmlFor="topK" className="block text-sm font-medium mb-2">
            Number of context chunks (topK): {topK}
          </label>
          <input
            type="range"
            id="topK"
            min="1"
            max="10"
            value={topK}
            onChange={(e) => setTopK(parseInt(e.target.value))}
            className="w-full accent-accent-600"
            disabled={isLoading}
          />
          <div className="flex justify-between text-xs text-[var(--muted)] mt-1">
            <span>1 (faster)</span>
            <span>10 (more context)</span>
          </div>
        </div>
      )}

      <button
        type="submit"
        className="btn btn-primary w-full flex items-center justify-center gap-2"
        disabled={isLoading || !question.trim()}
      >
        {isLoading ? (
          <>
            <LoadingSpinner size="sm" />
            Searching & Generating...
          </>
        ) : (
          'Ask Question'
        )}
      </button>
    </form>
  );
}

