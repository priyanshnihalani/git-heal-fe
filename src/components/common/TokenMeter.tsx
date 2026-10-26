import React, { useState, useEffect, useRef } from 'react';
import type { TokenUsage } from '../../types';
import { api } from '../../services/api';
import {
  formatTokenCount,
  formatExactTokens,
  getUsageState,
} from '../../utils/tokenUtils';
import TokenPopover from './TokenPopover';
import './TokenMeter.css';

export const TokenMeter: React.FC = () => {
  const [usage, setUsage] = useState<TokenUsage | null>(null);
  const [hasError, setHasError] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const fetchUsage = async () => {
    try {
      setHasError(false);
      const data = await api.usage.getTokenUsage({ preset: 'today' });
      setUsage(data);
    } catch {
      setHasError(true);
    }
  };

  useEffect(() => {
    fetchUsage();
    // 5s subscription with visibilitychange pause
    const unsubscribe = api.usage.subscribeTokenUsage((data) => {
      setUsage(data);
      setHasError(false);
    });

    if (typeof window !== 'undefined' && import.meta.env.DEV) {
      const params = new URLSearchParams(window.location.search);
      if (params.get('openMeter') === 'true') {
        setPopoverOpen(true);
      }
    }

    return () => {
      unsubscribe();
    };
  }, []);

  if (hasError) {
    return (
      <div className="token-meter-error">
        <span className="meter-error-text">Usage unavailable</span>
        <button
          type="button"
          className="meter-retry-btn"
          onClick={fetchUsage}
          aria-label="Retry loading token usage"
        >
          Retry
        </button>
      </div>
    );
  }

  const limit = usage?.limit.daily ?? null;
  const used = usage?.used ?? 182400;
  const remaining = usage?.remaining ?? (limit !== null ? Math.max(0, limit - used) : null);
  const state = getUsageState(used, limit);
  const percentUsed = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0;

  // Exact tooltip description
  const tooltipText = limit
    ? `${formatExactTokens(remaining ?? 0)} of ${formatExactTokens(limit)} remaining today`
    : `${formatExactTokens(used)} used`;

  const ariaValueText = limit
    ? `${formatTokenCount(remaining ?? 0)} of ${formatTokenCount(limit)} tokens left`
    : `${formatTokenCount(used)} tokens used`;

  // Display label:
  // <80%: "318K left"
  // 80-99%: "Running low"
  // 100%: "Limit reached"
  let labelText = `${formatTokenCount(remaining ?? used)} left`;
  if (state === 'low') {
    labelText = 'Running low';
  } else if (state === 'limit') {
    labelText = 'Limit reached';
  } else if (limit === null) {
    labelText = `${formatTokenCount(used)} used`;
  }

  return (
    <div className="token-meter-wrapper">
      <button
        ref={triggerRef}
        type="button"
        className={`token-meter-pill state-${state}`}
        onClick={() => setPopoverOpen(!popoverOpen)}
        aria-expanded={popoverOpen}
        aria-haspopup="dialog"
        title={tooltipText}
        role="progressbar"
        aria-valuenow={used}
        aria-valuemin={0}
        aria-valuemax={limit ?? 100}
        aria-valuetext={ariaValueText}
      >
        {/* Desktop progress bar inside pill */}
        {limit !== null && (
          <div className="pill-bar-track" aria-hidden="true">
            <div className="pill-bar-fill" style={{ width: `${percentUsed}%` }} />
          </div>
        )}

        {/* Mobile Ring / Circular Progress (<640px) */}
        <div className="meter-mobile-ring" aria-hidden="true">
          <svg viewBox="0 0 20 20" width="16" height="16">
            <circle
              cx="10"
              cy="10"
              r="8"
              fill="none"
              stroke="#E2E8F0"
              strokeWidth="2.5"
            />
            <circle
              cx="10"
              cy="10"
              r="8"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeDasharray={50.2}
              strokeDashoffset={50.2 - (50.2 * percentUsed) / 100}
              strokeLinecap="round"
              transform="rotate(-90 10 10)"
            />
          </svg>
        </div>

        <span className="meter-pill-text">{labelText}</span>
      </button>

      <TokenPopover
        isOpen={popoverOpen}
        onClose={() => setPopoverOpen(false)}
        triggerRef={triggerRef}
        currentUsage={usage}
      />
    </div>
  );
};

export default TokenMeter;
