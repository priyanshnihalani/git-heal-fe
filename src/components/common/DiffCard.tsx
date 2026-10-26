import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import type { PatchDiff } from '../../types';
import { computeDiffCounts } from '../../services/api';
import './DiffCard.css';

interface DiffCardProps {
  patch: PatchDiff;
  repo?: string;
  prNumber?: number;
}

export const DiffCard: React.FC<DiffCardProps> = ({ patch, repo, prNumber }) => {
  const [copied, setCopied] = useState(false);
  const { additions, deletions } = computeDiffCounts(patch.lines);

  const handleCopy = async () => {
    const rawText = patch.lines.map((l) => l.code).join('\n');
    try {
      await navigator.clipboard.writeText(rawText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="reusable-diff-card" aria-label={`Code diff for ${patch.filePath}`}>
      <div className="reusable-diff-header">
        <div className="diff-header-left">
          {repo && <span className="diff-repo-tag">{repo}</span>}
          {prNumber && <span className="diff-pr-tag">PR #{prNumber}</span>}
          <span className="diff-file-path">{patch.filePath}</span>
        </div>

        <div className="diff-header-right">
          <button
            type="button"
            className="btn-copy-code"
            onClick={handleCopy}
            aria-label="Copy diff code"
          >
            {copied ? (
              <>
                <Check size={12} aria-hidden="true" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy size={12} aria-hidden="true" />
                <span>Copy</span>
              </>
            )}
          </button>
          <span className="diff-counter-pill" aria-label={`${additions} additions, ${deletions} deletions`}>
            <span className="count-add">+{additions}</span>
            <span className="count-del">-{deletions}</span>
          </span>
        </div>
      </div>

      <pre className="reusable-diff-body" tabIndex={0} aria-label="Patch diff preview">
        <code>
          {patch.lines.map((line, idx) => (
            <span key={idx} className={`diff-line-row line-type-${line.type}`}>
              {line.code}
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
};

export default DiffCard;
