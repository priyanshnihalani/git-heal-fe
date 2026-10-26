import React from 'react';
import { Link } from 'react-router-dom';
import type { Run } from '../../types';
import StatusPill from '../common/StatusPill';
import './RunRow.css';

interface RunRowProps {
  run: Run;
}

export const RunRow: React.FC<RunRowProps> = ({ run }) => {
  return (
    <Link
      to={`/runs/${run.id}`}
      className="run-row-grid-link"
      aria-label={`View run ${run.id} for ${run.repo} on branch ${run.branch}. Status: ${run.status}`}
    >
      {/* Column 1: Main (Repo, Branch, Hash, Message) */}
      <div className="grid-col-main">
        <div className="run-repo-branch-line">
          <span className="run-repo-name">{run.repo}</span>
          <span className="run-branch-badge">
            <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor" aria-hidden="true">
              <path d="M9.5 3.25a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.493 2.493 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25Zm-6 0a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Zm8.25.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM4.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z" />
            </svg>
            {run.branch}
          </span>
          <span className="run-commit-hash">{run.commitHash}</span>
        </div>

        <p className="run-commit-message">{run.commitMessage}</p>
      </div>

      {/* Column 2: Status */}
      <div className="grid-col-status">
        <StatusPill status={run.status} size="sm" />
      </div>

      {/* Column 3: Time & Arrow */}
      <div className="grid-col-time">
        <div className="time-stack">
          <span className="run-relative-time">{run.relativeTime}</span>
          <span className="run-duration" title="Run duration">
            <svg viewBox="0 0 16 16" width="11" height="11" fill="currentColor" aria-hidden="true">
              <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm7-3.25a.75.75 0 0 0-1.5 0v3.5c0 .2.08.39.22.53l2.25 2.25a.75.75 0 1 0 1.06-1.06L8.5 7.94V4.75Z" />
            </svg>
            {run.duration}
          </span>
        </div>
        <span className="run-arrow" aria-hidden="true">→</span>
      </div>
    </Link>
  );
};

export default RunRow;
