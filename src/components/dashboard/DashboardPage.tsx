import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import type { Run, DashboardStats, TokenUsage } from '../../types';
import { api } from '../../services/api';
import useRunPolling from '../../hooks/useRunPolling';
import StatCard from './StatCard';
import UsageCard from './UsageCard';
import RunRow from './RunRow';
import Skeleton from '../common/Skeleton';
import PageHeader from '../common/PageHeader';
import './DashboardPage.css';

type StatusFilter = 'all' | 'in_progress' | 'pr_opened' | 'merged' | 'failed';

export const DashboardPage: React.FC = () => {
  const { selectedRepo } = useAuth();

  const [runs, setRuns] = useState<Run[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async (isPolling = false) => {
    if (!isPolling) setError(null);
    try {
      const [runsData, statsData, usageData] = await Promise.all([
        api.runs.getAll({ repo: selectedRepo }),
        api.runs.getStats(),
        api.usage.getTokenUsage({ preset: 'today' }, selectedRepo),
      ]);
      setRuns(runsData);
      setStats(statsData);
      setTokenUsage(usageData);
    } catch {
      if (!isPolling) {
        setError('Failed to load dashboard activity. Please check your connection.');
      }
    } finally {
      if (!isPolling) setIsLoading(false);
    }
  }, [selectedRepo]);

  useEffect(() => {
    fetchDashboardData(false);
  }, [fetchDashboardData]);

  // 5s Live polling hook (pauses when tab is hidden)
  useRunPolling(() => {
    fetchDashboardData(true);
  }, 5000);

  // Compute status counts for the segmented filter tabs
  const filterCounts = useMemo(() => {
    const inProgressCount = runs.filter(
      (r) =>
        r.status === 'Detected' ||
        r.status === 'Investigating' ||
        r.status === 'Patching' ||
        r.status === 'Verifying'
    ).length;
    const prOpenedCount = runs.filter((r) => r.status === 'PR opened').length;
    const mergedCount = runs.filter((r) => r.status === 'Merged').length;
    const failedCount = runs.filter((r) => r.status === 'Failed to fix').length;

    return {
      all: runs.length,
      in_progress: inProgressCount,
      pr_opened: prOpenedCount,
      merged: mergedCount,
      failed: failedCount,
    };
  }, [runs]);

  // Filter runs based on segmented control
  const filteredRuns = runs.filter((run) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'in_progress') {
      return (
        run.status === 'Detected' ||
        run.status === 'Investigating' ||
        run.status === 'Patching' ||
        run.status === 'Verifying'
      );
    }
    if (statusFilter === 'pr_opened') return run.status === 'PR opened';
    if (statusFilter === 'merged') return run.status === 'Merged';
    if (statusFilter === 'failed') return run.status === 'Failed to fix';
    return true;
  });

  return (
    <div className="dashboard-view-wrapper">
      {/* Page Header with H1 + muted description line */}
      <PageHeader
        title="Dashboard"
        description="Autonomous CI/CD failure investigation and verified fixes."
      />

      {/* Autonomous CI Daemon Status Banner */}
      <section className="agent-status-banner" aria-label="Autonomous agent status">
        <div className="agent-banner-left">
          <div className="agent-robot-frame">
            <img
              src="/github_login_teddy_assets/bottom-agents/mini-robot-coding.png"
              alt="GitHeal Autonomous Daemon Robot"
              className="agent-robot-img"
            />
          </div>
          <div className="agent-banner-text">
            <div className="agent-badge-row">
              <span className="agent-status-pill">
                <span className="agent-pulse-dot" aria-hidden="true" />
                <span>Autonomous CI Daemon Active</span>
              </span>
              <span className="agent-version-tag">Docker Sandbox v2.4</span>
            </div>
            <h2 className="agent-banner-title">
              Monitoring builds across {selectedRepo === 'all' ? 'all repositories' : selectedRepo}
            </h2>
            <p className="agent-banner-desc">
              When a workflow fails, GitHeal extracts the error log, isolates the regression in a Docker sandbox, verifies the patch, and opens a clean pull request for review.
            </p>
          </div>
        </div>

        <div className="agent-banner-telemetry">
          <div className="telemetry-item">
            <span className="telemetry-label">Webhook Latency</span>
            <span className="telemetry-val">18ms <span className="telemetry-sub">(nominal)</span></span>
          </div>
          <div className="telemetry-item">
            <span className="telemetry-label">Sandbox Workers</span>
            <span className="telemetry-val">3 Ready <span className="telemetry-sub">(idle)</span></span>
          </div>
          <div className="telemetry-item">
            <span className="telemetry-label">Security Sandbox</span>
            <span className="telemetry-val">Isolated CPU/Mem</span>
          </div>
        </div>
      </section>

      {/* 1. Status Strip (Tokens left today, Failures · 30d, Fixes verified, Merge rate) */}
      <section className="status-strip" aria-label="System status overview">
        {isLoading && !stats ? (
          <div className="stat-cards-skeleton">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="stat-card-skeleton-box">
                <Skeleton width={60} height={32} />
                <Skeleton width={110} height={12} />
              </div>
            ))}
          </div>
        ) : (
          <div className="stat-cards-grid">
            {/* 1. Tokens left today (from Stage C) */}
            <UsageCard usage={tokenUsage} />

            {/* 2. Failures · 30d */}
            <StatCard
              label="Failures · 30d"
              value={stats?.failuresDetected30d ?? runs.length}
            />

            {/* 3. Fixes verified */}
            <StatCard
              label="Fixes verified"
              value={stats?.fixesVerified ?? 0}
            />

            {/* 4. Merge rate */}
            <StatCard
              label="Merge rate"
              value={stats?.mergeRate ?? 0}
              suffix="%"
            />
          </div>
        )}
      </section>

      {/* Developer Impact & Automation Highlights */}
      <section className="dashboard-impact-strip" aria-label="Autonomous agent efficiency highlights">
        <div className="impact-card">
          <div className="impact-card-content">
            <div className="impact-icon-wrap icon-purple">
              <svg viewBox="0 0 16 16" width="18" height="18" fill="currentColor" aria-hidden="true">
                <path d="M9.504.43a1.5 1.5 0 0 1 .536 1.455l-.47 3.515h3.68a1.5 1.5 0 0 1 1.157 2.454l-6.5 8a1.5 1.5 0 0 1-2.408-1.78l1.01-3.674H3.25a1.5 1.5 0 0 1-1.341-2.17l3.5-7A1.5 1.5 0 0 1 6.75 0h2.004a1.5 1.5 0 0 1 .75.43Z" />
              </svg>
            </div>
            <div>
              <div className="impact-card-header">
                <h3 className="impact-card-title">Rapid Autonomous Fixes</h3>
                <span className="impact-metric-pill">42s avg</span>
              </div>
              <p className="impact-card-desc">
                From GitHub Actions failure detection to verified pull request creation in under a minute.
              </p>
            </div>
          </div>
        </div>

        <div className="impact-card">
          <div className="impact-card-content">
            <div className="impact-robot-wrap">
              <img
                src="/github_login_teddy_assets/bottom-agents/mini-robot-star.png"
                alt=""
                className="impact-mini-robot"
                aria-hidden="true"
              />
            </div>
            <div>
              <div className="impact-card-header">
                <h3 className="impact-card-title">Engineering Time Reclaimed</h3>
                <span className="impact-metric-pill">~14.8 hrs</span>
              </div>
              <p className="impact-card-desc">
                Zero human triage required for common stack trace regressions, syntax updates, and expired auth claims.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Error Banner */}
      {error && (
        <div className="dashboard-error-box" role="alert">
          <span className="error-text">{error}</span>
          <button
            type="button"
            className="error-retry-btn"
            onClick={() => fetchDashboardData(false)}
          >
            Retry
          </button>
        </div>
      )}

      {/* 3. Live Activity List */}
      <section className="activity-section" aria-label="Live CI/CD healing activity">
        <div className="activity-header-bar">
          <div className="activity-title-group">
            <h2 className="activity-title">Live activity</h2>
            {/* Live pill with pulsing dot and tooltip */}
            <span
              className="live-indicator-pill"
              title="Updates every 5 seconds"
              tabIndex={0}
              aria-label="Live updates every 5 seconds"
            >
              <span className="live-dot" aria-hidden="true" />
              <span>Live</span>
            </span>
          </div>

          {/* Segmented Status Control with Dynamic Counts */}
          <div className="status-segmented-control" role="tablist" aria-label="Filter runs by status">
            <button
              type="button"
              role="tab"
              aria-selected={statusFilter === 'all'}
              className={`segment-btn ${statusFilter === 'all' ? 'is-active' : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              <span>All</span>
              <span className="seg-count">{filterCounts.all}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={statusFilter === 'in_progress'}
              className={`segment-btn ${statusFilter === 'in_progress' ? 'is-active' : ''}`}
              onClick={() => setStatusFilter('in_progress')}
            >
              <span>In progress</span>
              <span className="seg-count">{filterCounts.in_progress}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={statusFilter === 'pr_opened'}
              className={`segment-btn ${statusFilter === 'pr_opened' ? 'is-active' : ''}`}
              onClick={() => setStatusFilter('pr_opened')}
            >
              <span>PR opened</span>
              <span className="seg-count">{filterCounts.pr_opened}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={statusFilter === 'merged'}
              className={`segment-btn ${statusFilter === 'merged' ? 'is-active' : ''}`}
              onClick={() => setStatusFilter('merged')}
            >
              <span>Merged</span>
              <span className="seg-count">{filterCounts.merged}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={statusFilter === 'failed'}
              className={`segment-btn ${statusFilter === 'failed' ? 'is-active' : ''}`}
              onClick={() => setStatusFilter('failed')}
            >
              <span>Failed</span>
              <span className="seg-count">{filterCounts.failed}</span>
            </button>
          </div>
        </div>

        {/* Activity Rows Card */}
        <div className="activity-card">
          {isLoading ? (
            <div className="activity-skeleton-list">
              {[1, 2, 3].map((n) => (
                <div key={n} className="activity-skeleton-row">
                  <div className="skeleton-main-block">
                    <Skeleton width={140} height={14} />
                    <Skeleton width="80%" height={16} />
                  </div>
                  <Skeleton width={90} height={22} borderRadius={9999} />
                </div>
              ))}
            </div>
          ) : filteredRuns.length === 0 ? (
            /* Empty state when no runs match filter or no failures */
            <div className="dashboard-empty-state" role="status">
              <img
                src="/github_login_teddy_assets/main-bears/bear-repo-eating.png"
                alt=""
                className="empty-state-bear-img"
                aria-hidden="true"
              />
              <h3 className="empty-state-title">
                {statusFilter === 'all' ? 'All builds green.' : 'No runs match this filter.'}
              </h3>
              <p className="empty-state-subtitle">
                {statusFilter === 'all'
                  ? 'GitHeal is actively listening for failing CI workflows. When a build breaks, investigation triggers automatically.'
                  : 'There are currently no CI runs with this status.'}
              </p>
            </div>
          ) : (
            <div className="activity-list" role="feed" aria-label="CI healing run activity feed">
              {filteredRuns.map((run) => (
                <RunRow key={run.id} run={run} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;
