import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { TokenUsage } from '../../types';
import {
  formatTokenCount,
  formatExactTokens,
  getUsageState,
  formatTimeUntil,
} from '../../utils/tokenUtils';
import './UsageCard.css';

interface UsageCardProps {
  usage: TokenUsage | null;
}

export const UsageCard: React.FC<UsageCardProps> = ({ usage }) => {
  const navigate = useNavigate();

  const limit = usage?.limit.daily ?? 500000;
  const used = usage?.used ?? 182400;
  const remaining = usage?.remaining ?? Math.max(0, limit - used);
  const percentUsed = Math.min(100, Math.round((used / limit) * 100));
  const state = getUsageState(used, limit);
  const resetsInText = usage ? formatTimeUntil(usage.resetsAt) : '6h 12m';

  const tooltipText = `${formatExactTokens(remaining)} of ${formatExactTokens(limit)} remaining today. Resets in ${resetsInText}. Click to view usage details.`;

  return (
    <div
      className={`stat-card usage-stat-card state-${state}`}
      role="button"
      tabIndex={0}
      onClick={() => navigate('/usage')}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigate('/usage');
        }
      }}
      title={tooltipText}
      aria-label={`Tokens left today: ${formatTokenCount(remaining)} of ${formatTokenCount(limit)}. Resets in ${resetsInText}. Click to view usage details.`}
    >
      <div className="stat-card-top">
        <div className="stat-number-wrap">
          <span className="stat-number">{formatTokenCount(remaining)}</span>
        </div>
        <span className="stat-label">Tokens left today</span>
      </div>

      <div className="usage-card-footer">
        <div className="usage-card-subtext">
          <span>of {formatTokenCount(limit)}</span>
          <span className="usage-dot-sep" aria-hidden="true">·</span>
          <span>resets in {resetsInText}</span>
        </div>
        <div className="usage-mini-track" aria-hidden="true">
          <div className="usage-mini-fill" style={{ width: `${percentUsed}%` }} />
        </div>
      </div>
    </div>
  );
};

export default UsageCard;
