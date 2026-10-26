import React, { useState, useEffect } from 'react';

interface DiffLine {
  type: 'context' | 'add' | 'del';
  code: string;
}

const DIFF_DATA: DiffLine[] = [
  { type: 'context', code: 'export function isTokenValid(token: string) {' },
  { type: 'context', code: '  const decoded = jwt.decode(token);' },
  { type: 'del', code: '- return decoded.exp > Date.now();' },
  { type: 'add', code: '+ if (!decoded?.exp) return false;' },
  { type: 'add', code: '+ return decoded.exp * 1000 > Date.now();' },
  { type: 'context', code: '}' },
];

export const DiffPreview: React.FC = () => {
  const additions = DIFF_DATA.filter((line) => line.type === 'add').length;
  const deletions = DIFF_DATA.filter((line) => line.type === 'del').length;

  // Status pill: starts at 'failed' and transitions once to 'verified' on load.
  // Respects prefers-reduced-motion by checking media query immediately.
  const [status, setStatus] = useState<'failed' | 'verified'>(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return 'verified';
    }
    return 'failed';
  });

  useEffect(() => {
    if (status === 'verified') return;
    const timer = setTimeout(() => {
      setStatus('verified');
    }, 1100);
    return () => clearTimeout(timer);
  }, [status]);

  return (
    <div className="product-diff-card" aria-label="GitHeal verified pull request preview">
      {/* Diff Header */}
      <div className="diff-card-header">
        <div className="header-meta">
          <span className="repo-tag">auth-service</span>
          <span className="pr-number">PR #48</span>
          <span className="file-path">src/auth/token.ts</span>
        </div>
        <div className="header-badges">
          <span className="diff-counter" aria-label={`${additions} additions, ${deletions} deletions`}>
            <span className="diff-add">+{additions}</span>
            <span className="diff-del">-{deletions}</span>
          </span>
          
          {/* Animated Status Pill */}
          <span
            className={`badge-status ${status === 'verified' ? 'is-verified' : 'is-failed'}`}
            role="status"
            aria-live="polite"
          >
            <span className="status-dot" aria-hidden="true" />
            <span className="status-label">
              {status === 'verified' ? 'Verified in sandbox · 42s' : 'Failed'}
            </span>
          </span>
        </div>
      </div>

      {/* Diff Code Display */}
      <pre className="diff-code-body" tabIndex={0} aria-label="Code diff snippet">
        <code>
          {DIFF_DATA.map((line, idx) => (
            <span key={idx} className={`code-line line-${line.type}`}>
              {line.code}
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
};

export default DiffPreview;
