import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Target, KeyRound, Zap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { TokenUsage, UsageRange } from '../../types';
import { api } from '../../services/api';
import {
  formatTokenCount,
  formatExactTokens,
  parseUsageRange,
  rangeToQueryString,
} from '../../utils/tokenUtils';
import PageHeader from '../common/PageHeader';
import Skeleton from '../common/Skeleton';
import UsageChart from './UsageChart';
import StageBreakdown from './StageBreakdown';
import './UsagePage.css';

type PresetType = 'today' | '7d' | '30d' | 'month' | 'custom';

export const UsagePage: React.FC = () => {
  const { selectedRepo } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Read range from URL query params
  const currentRange = useMemo(() => parseUsageRange(searchParams), [searchParams]);
  const activePreset: PresetType = currentRange.preset;

  const [usage, setUsage] = useState<TokenUsage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Custom date range state
  const todayStr = new Date().toISOString().split('T')[0];
  const defaultFrom =
    currentRange.preset === 'custom'
      ? currentRange.from
      : new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0];
  const defaultTo = currentRange.preset === 'custom' ? currentRange.to : todayStr;

  const [customFrom, setCustomFrom] = useState(defaultFrom);
  const [customTo, setCustomTo] = useState(defaultTo);
  const [dateError, setDateError] = useState<string | null>(null);

  const fetchUsageData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.usage.getTokenUsage(currentRange, selectedRepo);
      setUsage(data);
    } catch {
      setError('Unable to load AI token usage data. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  }, [currentRange, selectedRepo]);

  useEffect(() => {
    fetchUsageData();
  }, [fetchUsageData]);

  const handlePresetSelect = (preset: 'today' | '7d' | '30d' | 'month') => {
    setDateError(null);
    setSearchParams(new URLSearchParams(rangeToQueryString({ preset })));
  };

  const handleApplyCustom = () => {
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
    const newRange: UsageRange = { preset: 'custom', from: customFrom, to: customTo };
    setSearchParams(new URLSearchParams(rangeToQueryString(newRange)));
  };

  // Metrics calculation
  const isCappedRange = activePreset === 'today' || activePreset === 'month';
  const totalDays = usage?.byDay.length || 1;
  const avgPerDay = usage ? Math.round(usage.used / Math.max(1, totalDays)) : 0;

  // Peak day calculation
  let peakDayLabel = 'N/A';
  if (usage?.byDay && usage.byDay.length > 0) {
    const sorted = [...usage.byDay].sort((a, b) => b.used - a.used);
    const peak = sorted[0];
    const peakDate = new Date(peak.date);
    const formattedDate = new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).format(peakDate);
    peakDayLabel = `${formattedDate} (${formatTokenCount(peak.used)})`;
  }

  return (
    <div className="usage-page-wrapper">
      {/* Page Header */}
      <PageHeader
        title="Usage"
        description="Track AI token consumption, daily quotas, and stage breakdown."
      >
        {/* Period Selector synced to URL */}
        <div className="period-segmented-control" role="tablist" aria-label="Select usage period">
          {(['today', '7d', '30d', 'month'] as const).map((preset) => (
            <button
              key={preset}
              type="button"
              role="tab"
              aria-selected={activePreset === preset}
              className={`period-seg-btn ${activePreset === preset ? 'is-active' : ''}`}
              onClick={() => handlePresetSelect(preset)}
            >
              {preset === 'today'
                ? 'Today'
                : preset === '7d'
                ? '7 days'
                : preset === '30d'
                ? '30 days'
                : 'This month'}
            </button>
          ))}
          <button
            type="button"
            role="tab"
            aria-selected={activePreset === 'custom'}
            className={`period-seg-btn ${activePreset === 'custom' ? 'is-active' : ''}`}
            onClick={() => {
              const newRange: UsageRange = { preset: 'custom', from: customFrom, to: customTo };
              setSearchParams(new URLSearchParams(rangeToQueryString(newRange)));
            }}
          >
            Custom
          </button>
        </div>
      </PageHeader>

      {/* AI Multi-Agent Architecture Card */}
      <section className="usage-architecture-card" aria-label="AI Architecture and model routing">
        <div className="arch-card-left">
          <div className="arch-robot-frame">
            <img
              src="/github_login_teddy_assets/bottom-agents/mini-robot-coding.png"
              alt="GitHeal AI Agent Architecture"
              className="arch-robot-img"
            />
          </div>
          <div className="arch-card-content">
            <div className="arch-badge-row">
              <span className="arch-badge-tier">Developer Pro Plan</span>
              <span className="arch-badge-quota">500,000 tokens / day</span>
              <span className="arch-badge-reset">Resets daily at 00:00 UTC</span>
            </div>
            <h2 className="arch-card-title">Multi-Agent CI/CD Healing Pipeline</h2>
            <p className="arch-card-desc">
              GitHeal routes failed builds through specialized agent models, enforcing AST syntax validity and strict Docker container reproduction before writing patches.
            </p>
          </div>
        </div>

        <div className="arch-stages-grid">
          <div className="arch-stage-pill">
            <span className="stage-pill-num">1</span>
            <div className="stage-pill-info">
              <strong className="stage-pill-name">Investigation</strong>
              <span className="stage-pill-model">Claude 3.5 Sonnet</span>
            </div>
          </div>
          <div className="arch-stage-pill">
            <span className="stage-pill-num">2</span>
            <div className="stage-pill-info">
              <strong className="stage-pill-name">Patch Synthesis</strong>
              <span className="stage-pill-model">Claude 3.5 Sonnet</span>
            </div>
          </div>
          <div className="arch-stage-pill">
            <span className="stage-pill-num">3</span>
            <div className="stage-pill-info">
              <strong className="stage-pill-name">Sandbox Verify</strong>
              <span className="stage-pill-model">Docker Engine (0 tokens)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Custom Date Form (when custom range is active) */}
      {activePreset === 'custom' && (
        <div className="custom-range-card" role="region" aria-label="Custom date selector">
          <div className="custom-range-inputs">
            <div className="custom-input-group">
              <label htmlFor="range-from-date" className="custom-input-label">From</label>
              <input
                id="range-from-date"
                type="date"
                max={todayStr}
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="date-field"
              />
            </div>
            <div className="custom-input-group">
              <label htmlFor="range-to-date" className="custom-input-label">To</label>
              <input
                id="range-to-date"
                type="date"
                max={todayStr}
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="date-field"
              />
            </div>
            <button
              type="button"
              className="btn-apply-range"
              onClick={handleApplyCustom}
            >
              Apply range
            </button>
          </div>
          {dateError && <p className="range-error-msg" role="alert">{dateError}</p>}
        </div>
      )}

      {/* Error Banner with Retry */}
      {error && (
        <div className="usage-error-box" role="alert">
          <span>{error}</span>
          <button type="button" className="error-retry-btn" onClick={fetchUsageData}>
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && !usage ? (
        <div className="usage-skeleton-stack">
          <div className="summary-cards-grid">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="summary-skeleton-box">
                <Skeleton width={80} height={28} />
                <Skeleton width={120} height={14} />
              </div>
            ))}
          </div>
          <Skeleton width="100%" height={260} borderRadius={16} />
        </div>
      ) : usage ? (
        <>
          {/* Summary Row */}
          <section className="usage-summary-section" aria-label="Usage summary metrics">
            <div className="summary-cards-grid">
              {/* Card 1: Used */}
              <div className="summary-metric-card">
                <div className="metric-num" title={formatExactTokens(usage.used)}>
                  {formatTokenCount(usage.used)}
                </div>
                <div className="metric-label">Tokens used in period</div>
              </div>

              {/* Card 2: Remaining (shown only for Today and This month) */}
              {isCappedRange ? (
                <div className="summary-metric-card">
                  <div
                    className="metric-num text-purple"
                    title={usage.remaining !== null ? formatExactTokens(usage.remaining) : undefined}
                  >
                    {usage.remaining !== null ? `${formatTokenCount(usage.remaining)} left` : 'Unlimited'}
                  </div>
                  <div className="metric-label">
                    {activePreset === 'today' ? 'Daily remaining' : 'Monthly remaining'}
                  </div>
                </div>
              ) : (
                <div className="summary-metric-card">
                  <div className="metric-num text-muted">—</div>
                  <div className="metric-label">Remaining (daily quota only)</div>
                </div>
              )}

              {/* Card 3: Average per Day */}
              <div className="summary-metric-card">
                <div className="metric-num" title={formatExactTokens(avgPerDay)}>
                  {formatTokenCount(avgPerDay)}
                </div>
                <div className="metric-label">Daily average</div>
              </div>

              {/* Card 4: Peak Day */}
              <div className="summary-metric-card">
                <div className="metric-num-sub">{peakDayLabel}</div>
                <div className="metric-label">Peak usage day</div>
              </div>
            </div>
          </section>

          {/* Quota Efficiency & Economic Value Strip */}
          <section className="usage-economics-strip" aria-label="AI cost and quota efficiency metrics">
            <div className="econ-card">
              <div className="econ-badge">Cost Efficiency</div>
              <div className="econ-stat-val">~18.2K <span className="econ-unit">tokens / fix</span></div>
              <p className="econ-desc">
                Average cost is ~$0.05 per verified PR, saving ~99% compared to manual dev triage hours.
              </p>
            </div>

            <div className="econ-card">
              <div className="econ-badge badge-green">Zero-Waste CI</div>
              <div className="econ-stat-val">0 <span className="econ-unit">tokens on green</span></div>
              <p className="econ-desc">
                Passing build webhooks are filtered at the edge; zero LLM tokens are wasted on non-failing runs.
              </p>
            </div>

            <div className="econ-card">
              <div className="econ-badge badge-blue">Container Pre-Check</div>
              <div className="econ-stat-val">100% <span className="econ-unit">pre-verified</span></div>
              <p className="econ-desc">
                All synthesized fixes pass isolated Docker sandbox regression tests before human review.
              </p>
            </div>
          </section>

          {/* Daily Bar Chart Card */}
          <section className="chart-section-card" aria-label="Daily token usage chart">
            <div className="chart-header">
              <h2 className="chart-title">Daily consumption</h2>
              <span className="chart-subtitle">
                {activePreset === 'today'
                  ? 'Today’s usage against daily limit'
                  : activePreset === '7d'
                  ? 'Last 7 days'
                  : activePreset === '30d'
                  ? 'Last 30 days'
                  : activePreset === 'month'
                  ? 'This calendar month'
                  : `${currentRange.preset === 'custom' ? currentRange.from : ''} to ${
                      currentRange.preset === 'custom' ? currentRange.to : ''
                    }`}
              </span>
            </div>

            <UsageChart
              data={usage.byDay}
              dailyLimit={usage.limit.daily}
            />
          </section>

          {/* Stage & Repository Breakdown Tables */}
          <section className="breakdown-section" aria-label="Breakdown details">
            <StageBreakdown stages={usage.byStage} repos={usage.byRepo} />
          </section>

          {/* Token Optimization Best Practices Guide */}
          <section className="usage-tips-card" aria-label="Tips to optimize token usage">
            <div className="tips-content-left">
              <div className="tips-header-block">
                <span className="tips-tag">Developer Best Practices</span>
                <h3 className="tips-title">Optimizing your team’s daily token quota</h3>
                <p className="tips-subtitle">
                  Configure your repositories and CI triggers to get the most value out of your 500K daily tokens.
                </p>
              </div>

              <div className="tips-grid">
                <div className="tip-item">
                  <div className="tip-icon-box">
                    <Target size={15} className="tip-lucide-icon" aria-hidden="true" />
                  </div>
                  <div className="tip-body">
                    <strong className="tip-title">Scope watched branches</strong>
                    <p className="tip-text">
                      Limit watched branches in Settings to <code>main, release/*</code> so work-in-progress draft branches don&apos;t consume tokens.
                    </p>
                  </div>
                </div>

                <div className="tip-item">
                  <div className="tip-icon-box">
                    <KeyRound size={15} className="tip-lucide-icon" aria-hidden="true" />
                  </div>
                  <div className="tip-body">
                    <strong className="tip-title">Inject sandbox secrets</strong>
                    <p className="tip-text">
                      Provide database URLs and API mocks in Settings so tests reproduce cleanly on the first attempt without retries.
                    </p>
                  </div>
                </div>

                <div className="tip-item">
                  <div className="tip-icon-box">
                    <Zap size={15} className="tip-lucide-icon" aria-hidden="true" />
                  </div>
                  <div className="tip-body">
                    <strong className="tip-title">Keep threshold alerts on</strong>
                    <p className="tip-text">
                      Automatic 80% daily alerts help you pause automated healing before reaching your hard ceiling.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="tips-robot-frame" aria-hidden="true">
              <img
                src="/github_login_teddy_assets/bottom-agents/mini-robot-star.png"
                alt=""
                className="tips-robot-img"
              />
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
};

export default UsagePage;
