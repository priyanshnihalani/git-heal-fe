import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Check, Copy, XCircle } from 'lucide-react';
import type { Run } from '../../types';
import { api } from '../../services/api';
import useRunPolling from '../../hooks/useRunPolling';
import StatusPill from '../common/StatusPill';
import Skeleton from '../common/Skeleton';
import ConfirmDialog from '../common/ConfirmDialog';
import DiffCard from '../common/DiffCard';
import Breadcrumb from '../common/Breadcrumb';
import PipelineTimeline from './PipelineTimeline';
import './RunDetailPage.css';

type DetailTab = 'root_cause' | 'patch' | 'sandbox' | 'reasoning';
const TAB_ORDER: DetailTab[] = ['root_cause', 'patch', 'sandbox', 'reasoning'];

export const RunDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab state synced to URL (?tab=...)
  const initialTabParam = searchParams.get('tab') as DetailTab | null;
  const initialTab: DetailTab =
    initialTabParam && TAB_ORDER.includes(initialTabParam) ? initialTabParam : 'root_cause';

  const [activeTab, setActiveTab] = useState<DetailTab>(initialTab);
  const [run, setRun] = useState<Run | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRerunning, setIsRerunning] = useState(false);
  const [showDismissDialog, setShowDismissDialog] = useState(false);
  const [overflowMenuOpen, setOverflowMenuOpen] = useState(false);
  const [logCopied, setLogCopied] = useState(false);
  const [expandedReasoningIds, setExpandedReasoningIds] = useState<string[]>(['rs_1', 'rs_2', 'rs_3']);

  const overflowRef = useRef<HTMLDivElement>(null);
  const tabButtonRefs = useRef<{ [key in DetailTab]?: HTMLButtonElement | null }>({});

  const handleTabChange = (tab: DetailTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Keyboard navigation for tabs (Left / Right arrow keys)
  const handleTabKeyDown = (e: React.KeyboardEvent, currentTab: DetailTab) => {
    const currentIndex = TAB_ORDER.indexOf(currentTab);
    let newIndex = currentIndex;

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      newIndex = (currentIndex + 1) % TAB_ORDER.length;
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      newIndex = (currentIndex - 1 + TAB_ORDER.length) % TAB_ORDER.length;
    }

    if (newIndex !== currentIndex) {
      const nextTab = TAB_ORDER[newIndex];
      handleTabChange(nextTab);
      tabButtonRefs.current[nextTab]?.focus();
    }
  };

  const fetchRun = async (isPolling = false) => {
    if (!id) return;
    try {
      const data = await api.runs.getById(id);
      setRun(data);
    } catch {
      // Handled in render
    } finally {
      if (!isPolling) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRun(false);
  }, [id]);

  // Click outside for overflow menu
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (overflowRef.current && !overflowRef.current.contains(e.target as Node)) {
        setOverflowMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Poll for updates while in progress
  useRunPolling(() => {
    if (run && (run.status === 'Investigating' || run.status === 'Patching' || run.status === 'Verifying')) {
      fetchRun(true);
    }
  }, 4000);

  const handleRerun = async () => {
    if (!id || isRerunning) return;
    setIsRerunning(true);
    try {
      const updated = await api.runs.rerun(id);
      setRun(updated);
    } finally {
      setIsRerunning(false);
    }
  };

  const handleDismissConfirm = async () => {
    if (!id) return;
    await api.runs.dismiss(id);
    navigate('/dashboard');
  };

  const toggleReasoning = (stepId: string) => {
    setExpandedReasoningIds((prev) =>
      prev.includes(stepId) ? prev.filter((i) => i !== stepId) : [...prev, stepId]
    );
  };

  const handleCopyLog = async (logLines: string[]) => {
    try {
      await navigator.clipboard.writeText(logLines.join('\n'));
      setLogCopied(true);
      setTimeout(() => setLogCopied(false), 2000);
    } catch {
      // Ignore
    }
  };

  // Helper to render inline styled code chips from text containing backticks
  const renderDiagnosisText = (text: string) => {
    const parts = text.split(/(`[^`]+`)/g);
    return parts.map((part, index) => {
      if (part.startsWith('`') && part.endsWith('`')) {
        const cleanCode = part.slice(1, -1);
        return (
          <code key={index} className="inline-code-chip">
            {cleanCode}
          </code>
        );
      }
      return <React.Fragment key={index}>{part}</React.Fragment>;
    });
  };

  if (isLoading) {
    return (
      <div className="run-detail-viewport">
        <Skeleton width={240} height={20} />
        <Skeleton width="100%" height={90} borderRadius={16} />
        <div className="run-detail-grid">
          <Skeleton width="100%" height={320} borderRadius={16} />
          <Skeleton width="100%" height={400} borderRadius={16} />
        </div>
      </div>
    );
  }

  // 404 state
  if (!run) {
    return (
      <div className="run-detail-viewport">
        <div className="run-not-found-card" role="alert">
          <h2 className="not-found-title">Run not found</h2>
          <p className="not-found-text">
            The requested run &ldquo;{id}&rdquo; does not exist or has been dismissed.
          </p>
          <Link to="/dashboard" className="btn-back-dashboard">
            ← Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Extract any "Note: ..." line out of failingLog into a dedicated callout below it
  const noteLines = run.failingLog.filter((l) => l.trim().startsWith('Note:'));
  const logCodeLines = run.failingLog.filter((l) => !l.trim().startsWith('Note:'));
  const extractedNote =
    noteLines.length > 0
      ? noteLines.map((n) => n.replace(/^Note:\s*/i, '')).join(' ')
      : null;

  const isMerged = run.status === 'Merged';
  const commitUrl = `https://github.com/${run.repo}/commit/${run.commitHash}`;

  return (
    <div className="run-detail-viewport">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="detail-top-nav">
        <Breadcrumb
          items={[
            { label: 'Dashboard', to: '/dashboard' },
            { label: run.repo },
            { label: run.commitHash, href: commitUrl, isCurrent: true },
          ]}
        />

        <div className="detail-actions-group">
          {run.prUrl && (
            <a
              href={run.prUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-action-primary"
            >
              <span>View PR on GitHub</span>
              <span aria-hidden="true">↗</span>
            </a>
          )}

          {/* Re-run button with spinner when active */}
          <button
            type="button"
            className="btn-action-secondary"
            onClick={handleRerun}
            disabled={isRerunning}
            aria-busy={isRerunning}
          >
            {isRerunning ? (
              <>
                <span className="spinner-icon" aria-hidden="true" />
                <span>Re-running...</span>
              </>
            ) : (
              'Re-run'
            )}
          </button>

          {/* "..." Overflow Menu for Dismiss */}
          <div className="overflow-menu-wrap" ref={overflowRef}>
            <button
              type="button"
              className="btn-action-overflow"
              onClick={() => setOverflowMenuOpen(!overflowMenuOpen)}
              aria-expanded={overflowMenuOpen}
              aria-haspopup="menu"
              aria-label="More run actions"
            >
              •••
            </button>

            {overflowMenuOpen && (
              <div className="overflow-dropdown" role="menu">
                <button
                  type="button"
                  className="overflow-menu-item text-danger"
                  role="menuitem"
                  onClick={() => {
                    setOverflowMenuOpen(false);
                    setShowDismissDialog(true);
                  }}
                  disabled={isMerged}
                  title={isMerged ? 'Merged runs cannot be dismissed.' : undefined}
                >
                  Dismiss run
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Run Story Header (duplicate GitHub link removed; commit links to commit) */}
      <header className="run-header-card">
        <div className="run-header-left">
          <div className="run-repo-badge-row">
            <span className="run-header-repo">{run.repo}</span>
            <span className="run-header-branch">
              <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor" aria-hidden="true">
                <path d="M9.5 3.25a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.493 2.493 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25Zm-6 0a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Zm8.25.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM4.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z" />
              </svg>
              {run.branch}
            </span>
            <a
              href={commitUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="run-header-commit-link"
              title="View commit on GitHub"
            >
              {run.commitHash}
            </a>
          </div>

          <h1 className="run-header-commit-msg">{run.commitMessage}</h1>
        </div>

        <div className="run-header-right">
          <StatusPill status={run.status} size="md" />
          <span className="run-header-time">{run.relativeTime} · {run.duration}</span>
        </div>
      </header>

      {/* Honest Failed-to-Fix Banner */}
      {run.status === 'Failed to fix' && (
        <div className="honest-failure-banner" role="alert">
          <div className="failure-banner-header">
            <XCircle size={18} className="failure-icon" aria-hidden="true" />
            <strong>GitHeal couldn&rsquo;t fix this automatically</strong>
          </div>
          <p className="failure-reason-text">{run.failureReason}</p>
          {run.humanRecommendation && (
            <div className="human-recommendation-box">
              <span className="rec-badge">Recommended human check</span>
              <p className="rec-text">{run.humanRecommendation}</p>
            </div>
          )}
        </div>
      )}

      {/* Two-Column Story Layout: Left Sticky Timeline, Right Tabs */}
      <div className="run-detail-grid">
        {/* Left Column: Vertical Timeline (sticky on desktop) */}
        <aside className="run-timeline-column">
          <PipelineTimeline steps={run.steps} totalDuration={run.duration} />
        </aside>

        {/* Right Column: Tabbed Deep Dive */}
        <section className="run-tabs-column" aria-label="Run inspection details">
          {/* Tab Navigation with Arrow-Key navigation */}
          <div className="tabs-nav-bar" role="tablist" aria-label="Detail inspection tabs">
            {TAB_ORDER.map((tab) => (
              <button
                key={tab}
                ref={(el) => {
                  tabButtonRefs.current[tab] = el;
                }}
                type="button"
                role="tab"
                id={`tab-${tab}`}
                aria-controls={`pane-${tab}`}
                aria-selected={activeTab === tab}
                tabIndex={activeTab === tab ? 0 : -1}
                className={`tab-btn ${activeTab === tab ? 'is-active' : ''}`}
                onClick={() => handleTabChange(tab)}
                onKeyDown={(e) => handleTabKeyDown(e, tab)}
              >
                {tab === 'root_cause'
                  ? 'Root cause'
                  : tab === 'patch'
                  ? 'Proposed patch'
                  : tab === 'sandbox'
                  ? 'Sandbox results'
                  : 'Agent reasoning'}
              </button>
            ))}
          </div>

          {/* Tab 1: Root Cause */}
          {activeTab === 'root_cause' && (
            <div className="tab-pane-card" id="pane-root_cause" role="tabpanel" aria-labelledby="tab-root_cause">
              <h3 className="pane-heading">Diagnosis</h3>
              <p className="root-cause-explanation">
                {renderDiagnosisText(run.rootCause)}
              </p>

              <div className="log-snippet-header">
                <h4 className="log-heading">Failing CI log snippet</h4>
                <button
                  type="button"
                  className="btn-copy-log"
                  onClick={() => handleCopyLog(logCodeLines)}
                  aria-label="Copy CI log snippet"
                >
                  {logCopied ? (
                    <>
                      <Check size={12} aria-hidden="true" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} aria-hidden="true" />
                      <span>Copy log</span>
                    </>
                  )}
                </button>
              </div>

              {/* Log Block: Gutter, Context Gray, Error Red, Dimmed Paths */}
              <div className="log-snippet-container">
                <pre className="log-code-pre">
                  <code>
                    {logCodeLines.map((line, i) => {
                      const isError =
                        line.startsWith('FAIL') ||
                        line.startsWith('E   ') ||
                        line.includes('AssertionError:');
                      const isStack = line.trim().startsWith('at ') || line.includes('.ts:');

                      return (
                        <div
                          key={i}
                          className={`log-line-row ${
                            isError ? 'is-error' : isStack ? 'is-stack' : 'is-context'
                          }`}
                        >
                          <span className="log-gutter-num" aria-hidden="true">{i + 1}</span>
                          <span className="log-code-text">{line}</span>
                        </div>
                      );
                    })}
                  </code>
                </pre>
              </div>

              {/* "Why this fails" Callout Box */}
              {extractedNote && (
                <div className="why-fails-callout" role="note">
                  <span className="callout-badge">Why this fails</span>
                  <p className="callout-desc">{extractedNote}</p>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Proposed Patch */}
          {activeTab === 'patch' && (
            <div className="tab-pane-card" id="pane-patch" role="tabpanel" aria-labelledby="tab-patch">
              {run.patch ? (
                <DiffCard patch={run.patch} repo={run.repo} prNumber={run.prNumber} />
              ) : (
                <p className="muted-empty-tab">No patch available for this run state.</p>
              )}
            </div>
          )}

          {/* Tab 3: Sandbox Results */}
          {activeTab === 'sandbox' && (
            <div className="tab-pane-card" id="pane-sandbox" role="tabpanel" aria-labelledby="tab-sandbox">
              {run.sandbox ? (
                <div className="sandbox-results-wrap">
                  <div className="sandbox-summary-row">
                    <div className="sandbox-pass-tag">
                      <span className="dot-green" aria-hidden="true" />
                      <strong>{run.sandbox.summary}</strong>
                    </div>
                    <span className="sandbox-duration">Duration: {run.sandbox.duration}</span>
                  </div>

                  <h4 className="sandbox-files-title">Executed test suites in container</h4>
                  <ul className="sandbox-test-list">
                    {run.sandbox.testFiles.map((tf) => (
                      <li key={tf.path} className="sandbox-test-item">
                        <Check size={14} className="test-status-icon" aria-hidden="true" />
                        <span className="test-file-path">{tf.path}</span>
                        <span className="test-file-duration">{tf.duration}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="muted-empty-tab">Sandbox execution has not begun yet.</p>
              )}
            </div>
          )}

          {/* Tab 4: Agent Reasoning */}
          {activeTab === 'reasoning' && (
            <div className="tab-pane-card" id="pane-reasoning" role="tabpanel" aria-labelledby="tab-reasoning">
              <h3 className="pane-heading">Agent decisions & hypotheses</h3>
              {run.reasoningSteps && run.reasoningSteps.length > 0 ? (
                <div className="reasoning-accordion">
                  {run.reasoningSteps.map((step) => {
                    const isExpanded = expandedReasoningIds.includes(step.id);
                    return (
                      <div key={step.id} className="reasoning-step-box">
                        <button
                          type="button"
                          className="reasoning-step-header"
                          onClick={() => toggleReasoning(step.id)}
                          aria-expanded={isExpanded}
                        >
                          <span className="reasoning-caret" aria-hidden="true">
                            {isExpanded ? '▾' : '▸'}
                          </span>
                          <span className="reasoning-title">{step.title}</span>
                          <span className="reasoning-timestamp">{step.timestamp}</span>
                        </button>
                        {isExpanded && (
                          <div className="reasoning-step-detail">
                            <p>{step.detail}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="muted-empty-tab">Detailed reasoning log not available for this run.</p>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Dismiss Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDismissDialog}
        title="Dismiss this run?"
        description="This will remove the run from your active feed. The pull request (if opened) will remain on GitHub."
        confirmLabel="Dismiss run"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={handleDismissConfirm}
        onCancel={() => setShowDismissDialog(false)}
      />
    </div>
  );
};

export default RunDetailPage;
