import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import type { TokenUsage, UsageRange } from '../../types';
import { api } from '../../services/api';
import {
  formatTokenCount,
  formatExactTokens,
  getUsageState,
  formatTimeUntil,
} from '../../utils/tokenUtils';
import './TokenPopover.css';

interface TokenPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  currentUsage: TokenUsage | null;
}

type PopoverPreset = 'today' | '7d' | '30d' | 'month' | 'custom';

export const TokenPopover: React.FC<TokenPopoverProps> = ({
  isOpen,
  onClose,
  triggerRef,
  currentUsage,
}) => {
  const [activePreset, setActivePreset] = useState<PopoverPreset>('today');
  const [usageData, setUsageData] = useState<TokenUsage | null>(currentUsage);
  const [isLoading, setIsLoading] = useState(false);

  // Custom date range state
  const todayStr = new Date().toISOString().split('T')[0];
  const defaultFrom = new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0];
  const [customFrom, setCustomFrom] = useState(defaultFrom);
  const [customTo, setCustomTo] = useState(todayStr);
  const [dateError, setDateError] = useState<string | null>(null);

  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, triggerRef]);

  // Load data when preset changes
  useEffect(() => {
    if (!isOpen) return;

    if (activePreset === 'custom') {
      validateAndFetchCustom();
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setDateError(null);

    const range: UsageRange = { preset: activePreset };
    api.usage
      .getTokenUsage(range)
      .then((data) => {
        if (isMounted) setUsageData(data);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activePreset, isOpen]);

  const validateAndFetchCustom = async () => {
    if (!customFrom || !customTo) {
      setDateError('Please enter both start and end dates.');
      return;
    }
    const fromDate = new Date(customFrom).getTime();
    const toDate = new Date(customTo).getTime();
    const now = Date.now();

    if (fromDate > toDate) {
      setDateError('Start date cannot be after end date.');
      return;
    }
    if (toDate > now) {
      setDateError('Future dates are not permitted.');
      return;
    }
    const daysDiff = (toDate - fromDate) / (1000 * 60 * 60 * 24);
    if (daysDiff > 90) {
      setDateError('Maximum date range is 90 days.');
      return;
    }

    setDateError(null);
    setIsLoading(true);
    try {
      const data = await api.usage.getTokenUsage({
        preset: 'custom',
        from: customFrom,
        to: customTo,
      });
      setUsageData(data);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const data = usageData || currentUsage;
  const isCappedRange = activePreset === 'today' || activePreset === 'month';
  const limitValue = activePreset === 'month' ? data?.limit.monthly ?? null : data?.limit.daily ?? null;
  const usedValue = data?.used ?? 0;
  const remainingValue = data?.remaining ?? null;
  const percentUsed = limitValue ? Math.min(100, Math.round((usedValue / limitValue) * 100)) : 0;
  const thresholdState = getUsageState(usedValue, limitValue);

  // Multi-day metrics for 7d, 30d, custom
  const totalDays = data?.byDay.length || 7;
  const avgPerDay = Math.round(usedValue / Math.max(1, totalDays));

  // Find peak day
  let peakDayLabel = 'N/A';
  if (data?.byDay && data.byDay.length > 0) {
    const sorted = [...data.byDay].sort((a, b) => b.used - a.used);
    const peak = sorted[0];
    const peakDate = new Date(peak.date);
    peakDayLabel = new Intl.DateTimeFormat('en-US', { weekday: 'short', day: 'numeric' }).format(peakDate);
  }

  // Stage breakdown
  const stages = data?.byStage || [];
  const investigateTotal = (stages.find((s) => s.stage === 'investigate')?.input || 0) + (stages.find((s) => s.stage === 'investigate')?.output || 0);
  const patchTotal = (stages.find((s) => s.stage === 'patch')?.input || 0) + (stages.find((s) => s.stage === 'patch')?.output || 0);
  const verifyTotal = (stages.find((s) => s.stage === 'critic')?.input || 0) + (stages.find((s) => s.stage === 'critic')?.output || 0);
  const sumStages = Math.max(1, investigateTotal + patchTotal + verifyTotal);

  const pctInvestigate = Math.round((investigateTotal / sumStages) * 100);
  const pctPatch = Math.round((patchTotal / sumStages) * 100);
  const pctVerify = Math.max(0, 100 - pctInvestigate - pctPatch);

  const resetsInText = data ? formatTimeUntil(data.resetsAt) : '6h 12m';

  return (
    <div
      ref={popoverRef}
      className="token-popover-panel"
      role="dialog"
      aria-modal="true"
      aria-label="AI token usage details"
    >
      <div className="popover-header">
        <h2 className="popover-title">AI token usage</h2>
        <button
          type="button"
          className="popover-close-btn"
          onClick={onClose}
          aria-label="Close token usage details"
        >
          <X size={14} />
        </button>
      </div>

      {/* Period Segmented Control */}
      <div className="popover-period-tabs" role="tablist" aria-label="Select period">
        {(['today', '7d', '30d', 'month', 'custom'] as PopoverPreset[]).map((preset) => (
          <button
            key={preset}
            type="button"
            role="tab"
            aria-selected={activePreset === preset}
            className={`period-tab-btn ${activePreset === preset ? 'is-active' : ''}`}
            onClick={() => setActivePreset(preset)}
          >
            {preset === 'today'
              ? 'Today'
              : preset === '7d'
              ? '7 days'
              : preset === '30d'
              ? '30 days'
              : preset === 'month'
              ? 'This month'
              : 'Custom'}
          </button>
        ))}
      </div>

      {/* Custom Date Inputs */}
      {activePreset === 'custom' && (
        <div className="custom-range-row">
          <div className="custom-field">
            <label htmlFor="custom-from" className="custom-label">From</label>
            <input
              id="custom-from"
              type="date"
              max={todayStr}
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="custom-date-input"
            />
          </div>
          <div className="custom-field">
            <label htmlFor="custom-to" className="custom-label">To</label>
            <input
              id="custom-to"
              type="date"
              max={todayStr}
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="custom-date-input"
            />
          </div>
          <button
            type="button"
            className="btn-apply-custom"
            onClick={validateAndFetchCustom}
          >
            Apply
          </button>
        </div>
      )}

      {dateError && <p className="custom-error-text" role="alert">{dateError}</p>}

      {isLoading ? (
        <div className="popover-loading">Loading usage...</div>
      ) : (
        <div className="popover-content">
          {/* Capped View (Today / This month) */}
          {isCappedRange ? (
            <div className="capped-usage-summary">
              <div className="capped-metric-row">
                <div className="capped-metric-main">
                  <span className="big-remaining-num">
                    {remainingValue !== null ? `${formatTokenCount(remainingValue)} left` : `${formatTokenCount(usedValue)} used`}
                  </span>
                  {limitValue && (
                    <span
                      className="metric-limit-caption"
                      title={formatExactTokens(limitValue)}
                    >
                      of {formatTokenCount(limitValue)}
                    </span>
                  )}
                </div>

                <div
                  className="reset-countdown"
                  title={`Resets at ${data?.resetsAt} (UTC)`}
                >
                  Resets in {resetsInText}
                </div>
              </div>

              {/* Progress Bar */}
              {limitValue && (
                <div
                  className={`popover-progress-track state-${thresholdState}`}
                  role="progressbar"
                  aria-valuenow={usedValue}
                  aria-valuemin={0}
                  aria-valuemax={limitValue}
                  aria-valuetext={`${formatTokenCount(remainingValue ?? 0)} of ${formatTokenCount(limitValue)} tokens left`}
                >
                  <div
                    className="popover-progress-fill"
                    style={{ width: `${percentUsed}%` }}
                  />
                </div>
              )}
            </div>
          ) : (
            /* Multi-day View (7d, 30d, Custom) */
            <div className="multiday-usage-summary">
              <div className="multiday-metric-col">
                <span className="multiday-num">{formatTokenCount(usedValue)} used</span>
                <span className="multiday-label">Total for period</span>
              </div>
              <div className="multiday-metric-col">
                <span className="multiday-sub-num">Avg {formatTokenCount(avgPerDay)}/day</span>
                <span className="multiday-label">Daily average</span>
              </div>
              <div className="multiday-metric-col">
                <span className="multiday-sub-num">Peak: {peakDayLabel}</span>
                <span className="multiday-label">Highest usage</span>
              </div>
            </div>
          )}

          {/* Stage Breakdown Stacked Bar */}
          <div className="stage-breakdown-section">
            <div className="stage-breakdown-title">Usage by stage</div>
            <div className="stage-stacked-bar">
              <div
                className="stacked-seg seg-investigate"
                style={{ width: `${pctInvestigate}%` }}
                title={`Investigate: ${formatTokenCount(investigateTotal)} (${pctInvestigate}%)`}
              />
              <div
                className="stacked-seg seg-patch"
                style={{ width: `${pctPatch}%` }}
                title={`Patch: ${formatTokenCount(patchTotal)} (${pctPatch}%)`}
              />
              <div
                className="stacked-seg seg-verify"
                style={{ width: `${pctVerify}%` }}
                title={`Verify: ${formatTokenCount(verifyTotal)} (${pctVerify}%)`}
              />
            </div>

            <div className="stage-legend">
              <span className="legend-item">
                <span className="legend-dot dot-investigate" aria-hidden="true" />
                <span>Investigate: {formatTokenCount(investigateTotal)}</span>
              </span>
              <span className="legend-item">
                <span className="legend-dot dot-patch" aria-hidden="true" />
                <span>Patch: {formatTokenCount(patchTotal)}</span>
              </span>
              <span className="legend-item">
                <span className="legend-dot dot-verify" aria-hidden="true" />
                <span>Verify: {formatTokenCount(verifyTotal)}</span>
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="popover-footer">
        <Link to="/usage" className="popover-view-all-link" onClick={onClose}>
          View full usage →
        </Link>
      </div>
    </div>
  );
};

export default TokenPopover;
