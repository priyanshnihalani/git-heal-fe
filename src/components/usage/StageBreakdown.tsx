import React from 'react';
import type { StageTokenUsage, RepoTokenUsage } from '../../types';
import { formatTokenCount, formatExactTokens } from '../../utils/tokenUtils';
import './StageBreakdown.css';

interface StageBreakdownProps {
  stages: StageTokenUsage[];
  repos: RepoTokenUsage[];
}

export const StageBreakdown: React.FC<StageBreakdownProps> = ({ stages, repos }) => {
  return (
    <div className="breakdown-grid">
      {/* Table 1: Breakdown by Stage (Input vs Output) */}
      <div className="breakdown-card" aria-labelledby="stage-breakdown-heading">
        <h3 id="stage-breakdown-heading" className="breakdown-card-title">
          Breakdown by pipeline stage
        </h3>

        <div className="table-responsive">
          <table className="breakdown-table">
            <thead>
              <tr>
                <th scope="col">Stage</th>
                <th scope="col" className="text-right">Input tokens</th>
                <th scope="col" className="text-right">Output tokens</th>
                <th scope="col" className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {stages.map((st) => {
                const total = st.input + st.output;
                const stageName =
                  st.stage === 'investigate'
                    ? 'Investigate'
                    : st.stage === 'patch'
                    ? 'Patch generation'
                    : 'Critic / Verify';

                return (
                  <tr key={st.stage}>
                    <td className="stage-name-cell">
                      <span className={`stage-indicator-dot dot-${st.stage}`} aria-hidden="true" />
                      <span>{stageName}</span>
                    </td>
                    <td className="text-right num-cell" title={formatExactTokens(st.input)}>
                      {formatTokenCount(st.input)}
                    </td>
                    <td className="text-right num-cell" title={formatExactTokens(st.output)}>
                      {formatTokenCount(st.output)}
                    </td>
                    <td className="text-right num-cell font-bold" title={formatExactTokens(total)}>
                      {formatTokenCount(total)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Table 2: Breakdown by Repository */}
      <div className="breakdown-card" aria-labelledby="repo-breakdown-heading">
        <h3 id="repo-breakdown-heading" className="breakdown-card-title">
          Breakdown by repository
        </h3>

        <div className="table-responsive">
          <table className="breakdown-table">
            <thead>
              <tr>
                <th scope="col">Repository</th>
                <th scope="col" className="text-right">Runs</th>
                <th scope="col" className="text-right">Tokens used</th>
                <th scope="col" className="text-right">Avg / run</th>
              </tr>
            </thead>
            <tbody>
              {repos.length === 0 ? (
                <tr>
                  <td colSpan={4} className="empty-table-cell">
                    No token activity for this repository.
                  </td>
                </tr>
              ) : (
                repos.map((r) => {
                  const avg = Math.round(r.used / Math.max(1, r.runs));
                  return (
                    <tr key={r.repo}>
                      <td className="repo-name-cell">
                        <code>{r.repo}</code>
                      </td>
                      <td className="text-right num-cell">{r.runs}</td>
                      <td className="text-right num-cell font-bold" title={formatExactTokens(r.used)}>
                        {formatTokenCount(r.used)}
                      </td>
                      <td className="text-right num-cell" title={formatExactTokens(avg)}>
                        {formatTokenCount(avg)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StageBreakdown;
