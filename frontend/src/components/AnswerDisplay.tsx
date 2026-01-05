'use client';

import { AskResponse } from '@/types';

interface AnswerDisplayProps {
  result: AskResponse;
}

export default function AnswerDisplay({ result }: AnswerDisplayProps) {
  // Defensive checks to handle incomplete data
  const answer = result?.answer || 'No answer available.';
  const sources = result?.sources || [];
  const sourcesCount = sources.length;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Answer Section */}
      <div className="card">
        <h3 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wide mb-3">
          Answer
        </h3>
        <div className="prose prose-zinc dark:prose-invert max-w-none">
          <p className="text-lg leading-relaxed whitespace-pre-wrap">
            {answer}
          </p>
        </div>
      </div>

      {/* Sources Section */}
      <div className="card">
        <h3 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wide mb-3">
          Sources ({sourcesCount})
        </h3>
        {sourcesCount > 0 ? (
          <div className="flex flex-wrap gap-2">
            {sources.map((source, index) => (
              <div
                key={`${source?.docId || index}-${index}`}
                className="badge badge-blue"
                title={`Document ID: ${source?.docId || 'unknown'}`}
              >
                <span className="font-mono text-xs mr-2 opacity-60">
                  {source?.docId || 'unknown'}
                </span>
                <span>{source?.title || 'Untitled'}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[var(--muted)] italic">
            No source documents were used for this answer.
          </p>
        )}
      </div>
    </div>
  );
}

