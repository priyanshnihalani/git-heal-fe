import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { Repo, EnvVar } from '../../types';
import { api } from '../../services/api';
import Skeleton from '../common/Skeleton';
import './OnboardingPage.css';

type OnboardingStep = 1 | 2 | 3;

export const OnboardingPage: React.FC = () => {
  const { hasConnectedRepos, refreshSession } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<OnboardingStep>(1);

  // Step 1: Repositories
  const [repos, setRepos] = useState<Repo[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Step 2: Watched Branches
  const [watchedBranches, setWatchedBranches] = useState('main, master, release/*');
  const [onlyWatchedBranches, setOnlyWatchedBranches] = useState(true);

  // Step 3: Environment Variables
  const [envVars, setEnvVars] = useState<EnvVar[]>([
    { id: 'env_1', key: 'NODE_ENV', value: 'test', isSecret: false },
    { id: 'env_2', key: 'CI', value: 'true', isSecret: false },
  ]);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newIsSecret, setNewIsSecret] = useState(false);
  const [showSecretIds, setShowSecretIds] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInitialData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [allRepos, settings] = await Promise.all([
        api.repos.getAll(),
        api.settings.get(),
      ]);
      setRepos(allRepos);
      if (settings.watchedBranches) {
        setWatchedBranches(settings.watchedBranches);
      }
      if (settings.envVars && settings.envVars.length > 0) {
        setEnvVars(settings.envVars);
      }

      // Pre-select the first repo with workflows as a helpful default
      const withWorkflows = allRepos.filter((r) => r.hasWorkflows);
      if (withWorkflows.length > 0) {
        setSelectedIds([withWorkflows[0].id]);
      }
    } catch {
      setError('Unable to fetch your GitHub repositories. Please check your connection and retry.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Sort repos: workflows first, then alphabetical by full name
  const sortedRepos = useMemo(() => {
    return [...repos].sort((a, b) => {
      if (a.hasWorkflows !== b.hasWorkflows) {
        return a.hasWorkflows ? -1 : 1;
      }
      return a.fullName.localeCompare(b.fullName);
    });
  }, [repos]);

  const eligibleRepos = useMemo(() => {
    return sortedRepos.filter((r) => r.hasWorkflows);
  }, [sortedRepos]);

  const filteredRepos = useMemo(() => {
    if (!searchQuery.trim()) return sortedRepos;
    const q = searchQuery.toLowerCase();
    return sortedRepos.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.fullName.toLowerCase().includes(q) ||
        r.language.toLowerCase().includes(q)
    );
  }, [sortedRepos, searchQuery]);

  const handleToggle = (id: string, hasWorkflows: boolean) => {
    if (!hasWorkflows) return;
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const allEligibleIds = eligibleRepos.map((r) => r.id);
    setSelectedIds(allEligibleIds);
  };

  const handleSelectNone = () => {
    setSelectedIds([]);
  };

  // Branch Preset Helpers
  const toggleBranchPreset = (branchName: string) => {
    const parts = watchedBranches
      .split(',')
      .map((b) => b.trim())
      .filter(Boolean);
    if (parts.includes(branchName)) {
      setWatchedBranches(parts.filter((p) => p !== branchName).join(', '));
    } else {
      setWatchedBranches([...parts, branchName].join(', '));
    }
  };

  const isBranchPresetActive = (branchName: string) => {
    const parts = watchedBranches
      .split(',')
      .map((b) => b.trim())
      .filter(Boolean);
    return parts.includes(branchName);
  };

  // Environment Variable Helpers
  const handleAddEnvVar = () => {
    if (!newKey.trim()) return;
    const item: EnvVar = {
      id: `env_${Date.now()}`,
      key: newKey.trim().toUpperCase(),
      value: newValue.trim(),
      isSecret: newIsSecret,
    };
    setEnvVars([...envVars, item]);
    setNewKey('');
    setNewValue('');
    setNewIsSecret(false);
  };

  const handleRemoveEnvVar = (id: string) => {
    setEnvVars(envVars.filter((e) => e.id !== id));
  };

  const toggleShowSecret = (id: string) => {
    setShowSecretIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Final submission
  const handleCompleteOnboarding = async () => {
    if (selectedIds.length === 0 || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await Promise.all([
        api.repos.connectRepos(selectedIds),
        api.settings.update({
          watchedBranches,
          onlyWatchedBranches,
          envVars,
        }),
      ]);
      await refreshSession();
      navigate('/dashboard');
    } catch {
      setError('Failed to configure monitoring setup. Please try again.');
      setIsSubmitting(false);
    }
  };

  const buttonCountText = `Start monitoring ${selectedIds.length} ${
    selectedIds.length === 1 ? 'repository' : 'repositories'
  }`;

  return (
    <div className="onboarding-viewport">
      <div className="onboarding-container">
        {/* Brand Bar with Logo */}
        <div className="onboarding-brand-bar">
          <img
            src="/GitHeal_AI_Health_Logo.png"
            alt="GitHeal Logo"
            className="onboarding-brand-logo"
          />
          <span className="onboarding-brand-name">GitHeal</span>
        </div>

        {/* Header with Mascot Bear (~120px) */}
        <header className="onboarding-header">
          <div className="onboarding-header-main">
            <div className="onboarding-badge">Setup</div>
            <h1 className="onboarding-title">
              {step === 1 && 'Choose repositories for GitHeal to watch'}
              {step === 2 && 'Select branches to watch'}
              {step === 3 && 'Configure environment variables & secrets'}
            </h1>
            <p className="onboarding-subtitle">
              {step === 1 &&
                'GitHeal will listen for failed GitHub Actions workflow runs, run tests in an isolated sandbox, and open verified pull requests for review.'}
              {step === 2 &&
                'Specify which branches trigger automated investigations. You can use standard names or wildcard glob patterns.'}
              {step === 3 &&
                'Add test environment variables and secrets needed to reproduce and verify test suites in isolated Docker sandboxes.'}
            </p>
          </div>
          <div className="onboarding-mascot-wrap" aria-hidden="true">
            <img
              src="/github_login_teddy_assets/main-bears/bear-reading-repositories.png"
              alt=""
              className="onboarding-mascot-img"
            />
          </div>
        </header>

        {/* Error State */}
        {error && (
          <div className="onboarding-error-box" role="alert">
            <span className="error-text">{error}</span>
            <button type="button" className="error-retry-btn" onClick={fetchInitialData}>
              Retry
            </button>
          </div>
        )}

        {/* Content Card with 3-Step Wizard */}
        <div className="onboarding-card">
          {/* Stepper Navigation */}
          <nav className="onboarding-stepper" aria-label="Setup steps">
            <button
              type="button"
              className={`step-tab ${step === 1 ? 'is-active' : ''} ${step > 1 ? 'is-done' : ''}`}
              onClick={() => setStep(1)}
            >
              <span className="step-num">{step > 1 ? <Check size={12} strokeWidth={3} /> : '1'}</span>
              <span className="step-label">Repositories ({selectedIds.length})</span>
            </button>
            <span className="stepper-arrow" aria-hidden="true">→</span>
            <button
              type="button"
              className={`step-tab ${step === 2 ? 'is-active' : ''} ${step > 2 ? 'is-done' : ''}`}
              onClick={() => selectedIds.length > 0 && setStep(2)}
              disabled={selectedIds.length === 0}
            >
              <span className="step-num">{step > 2 ? <Check size={12} strokeWidth={3} /> : '2'}</span>
              <span className="step-label">Watched branches</span>
            </button>
            <span className="stepper-arrow" aria-hidden="true">→</span>
            <button
              type="button"
              className={`step-tab ${step === 3 ? 'is-active' : ''}`}
              onClick={() => selectedIds.length > 0 && setStep(3)}
              disabled={selectedIds.length === 0}
            >
              <span className="step-num">3</span>
              <span className="step-label">Environment variables</span>
            </button>
          </nav>

          {/* STEP 1: Repository Picker */}
          {step === 1 && (
            <div className="step-content-pane">
              {/* Controls Bar: Search + Select All / None */}
              <div className="onboarding-controls">
                <div className="search-input-wrap">
                  <svg className="search-icon" viewBox="0 0 20 20" width="16" height="16" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
                  </svg>
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search repositories by name or language..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    aria-label="Filter repositories"
                    disabled={isLoading}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="search-clear-btn"
                      onClick={() => setSearchQuery('')}
                      aria-label="Clear search"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className="bulk-selection-row">
                  <span className="selection-count">
                    <strong>{selectedIds.length}</strong> selected
                  </span>
                  <div className="selection-actions">
                    <button
                      type="button"
                      className="bulk-action-btn"
                      onClick={handleSelectAll}
                      disabled={isLoading || selectedIds.length === eligibleRepos.length}
                    >
                      Select all
                    </button>
                    <span className="bulk-sep" aria-hidden="true">·</span>
                    <button
                      type="button"
                      className="bulk-action-btn"
                      onClick={handleSelectNone}
                      disabled={isLoading || selectedIds.length === 0}
                    >
                      Select none
                    </button>
                  </div>
                </div>
              </div>

              {/* Repo List */}
              <div className="repo-list-container" role="group" aria-label="Available repositories">
                {isLoading ? (
                  <div className="repo-skeleton-list">
                    {[1, 2, 3, 4].map((n) => (
                      <div key={n} className="repo-skeleton-row">
                        <Skeleton width={18} height={18} borderRadius={4} />
                        <div className="skeleton-meta">
                          <Skeleton width={160} height={16} />
                          <Skeleton width={100} height={12} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredRepos.length === 0 ? (
                  <div className="repo-empty-search">
                    <p>No repositories match &ldquo;{searchQuery}&rdquo;</p>
                  </div>
                ) : (
                  <ul className="repo-list">
                    {filteredRepos.map((repo) => {
                      const isChecked = selectedIds.includes(repo.id);
                      const isEnabled = repo.hasWorkflows;

                      return (
                        <li
                          key={repo.id}
                          className={`repo-row ${isEnabled ? 'is-enabled' : 'is-disabled'} ${
                            isChecked ? 'is-selected' : ''
                          }`}
                          onClick={() => handleToggle(repo.id, isEnabled)}
                        >
                          <div className="repo-checkbox-cell">
                            <input
                              type="checkbox"
                              id={`repo-cb-${repo.id}`}
                              checked={isChecked}
                              onChange={() => handleToggle(repo.id, isEnabled)}
                              disabled={!isEnabled}
                              className="repo-checkbox"
                              aria-label={`Select ${repo.fullName}`}
                            />
                          </div>

                          <div className="repo-info-cell">
                            <div className="repo-title-line">
                              <label htmlFor={`repo-cb-${repo.id}`} className="repo-name">
                                {repo.fullName}
                              </label>
                              <span className={`tag-visibility ${repo.isPrivate ? 'is-private' : 'is-public'}`}>
                                {repo.isPrivate ? 'Private' : 'Public'}
                              </span>
                            </div>

                            <div className="repo-details-line">
                              <span className="repo-lang">{repo.language}</span>

                              {isEnabled && repo.workflowFile && (
                                <>
                                  <span className="dot-sep" aria-hidden="true">•</span>
                                  <span className="repo-workflow-badge">
                                    <svg viewBox="0 0 16 16" width="11" height="11" fill="currentColor" aria-hidden="true">
                                      <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm7.28-3.22a.75.75 0 0 0-1.06 0L5.47 7.03a.75.75 0 0 0 0 1.06l2.25 2.25a.75.75 0 1 0 1.06-1.06L7.31 7.75h3.94a.75.75 0 0 0 0-1.5H7.31l1.47-1.47a.75.75 0 0 0 0-1.06Z" />
                                    </svg>
                                    {repo.workflowFile}
                                  </span>
                                </>
                              )}

                              {!isEnabled && (
                                <>
                                  <span className="dot-sep" aria-hidden="true">•</span>
                                  <span className="repo-no-workflow-tag">No workflows</span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* CI Status Dot */}
                          <div className="repo-ci-cell">
                            {repo.lastCiStatus === 'failure' && (
                              <span className="ci-indicator status-fail" title="Last CI build failed">
                                <span className="ci-dot" aria-hidden="true" />
                                <span className="ci-label">Build failing</span>
                              </span>
                            )}
                            {repo.lastCiStatus === 'success' && (
                              <span className="ci-indicator status-pass" title="Last CI build passed">
                                <span className="ci-dot" aria-hidden="true" />
                                <span className="ci-label">Build passing</span>
                              </span>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* Step 1 Footer */}
              <div className="onboarding-footer">
                <button
                  type="button"
                  className="btn-primary-monitoring"
                  onClick={() => setStep(2)}
                  disabled={selectedIds.length === 0}
                >
                  <span>Continue to branches ({selectedIds.length} selected)</span>
                  <span className="btn-arrow" aria-hidden="true">→</span>
                </button>

                <p className="onboarding-reassurance">
                  <span>You can change this anytime in Settings.</span>
                  {hasConnectedRepos && (
                    <>
                      <span aria-hidden="true"> &nbsp;·&nbsp; </span>
                      <button
                        type="button"
                        className="onboarding-skip-link"
                        onClick={() => navigate('/dashboard')}
                      >
                        Go to Dashboard →
                      </button>
                    </>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: Watched Branches */}
          {step === 2 && (
            <div className="step-content-pane branch-step-pane">
              <div className="wizard-field-block">
                <label htmlFor="input-branches-step2" className="wizard-field-title">
                  Branches to watch
                </label>
                <p className="wizard-field-help">
                  Select common target branches or enter custom glob patterns separated by commas.
                </p>

                {/* Preset Chips */}
                <div className="branch-chips-row">
                  {['main', 'master', 'develop', 'release/*'].map((chip) => {
                    const isActive = isBranchPresetActive(chip);
                    return (
                      <button
                        key={chip}
                        type="button"
                        className={`branch-preset-chip ${isActive ? 'is-active' : ''}`}
                        onClick={() => toggleBranchPreset(chip)}
                      >
                        <span className="chip-check">{isActive ? <Check size={12} strokeWidth={2.5} /> : '+'}</span>
                        <span>{chip}</span>
                      </button>
                    );
                  })}
                </div>

                <input
                  id="input-branches-step2"
                  type="text"
                  className="text-input-field wizard-input"
                  value={watchedBranches}
                  onChange={(e) => setWatchedBranches(e.target.value)}
                  placeholder="main, master, release/*"
                />
              </div>

              <div className="wizard-toggle-card">
                <div className="toggle-label-wrap">
                  <span className="toggle-title">Only open PRs for failures on watched branches</span>
                  <span className="toggle-help">
                    Ignore ephemeral failures on feature branches that are not in your watched list.
                  </span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={onlyWatchedBranches}
                  className={`switch-toggle ${onlyWatchedBranches ? 'is-on' : 'is-off'}`}
                  onClick={() => setOnlyWatchedBranches(!onlyWatchedBranches)}
                >
                  <span className="switch-slider" />
                </button>
              </div>

              {/* Step 2 Footer */}
              <div className="onboarding-footer-nav">
                <button
                  type="button"
                  className="btn-wizard-back"
                  onClick={() => setStep(1)}
                >
                  ← Back to repositories
                </button>
                <button
                  type="button"
                  className="btn-primary-monitoring"
                  onClick={() => setStep(3)}
                >
                  <span>Continue to environment variables</span>
                  <span className="btn-arrow" aria-hidden="true">→</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Environment Variables & Secrets */}
          {step === 3 && (
            <div className="step-content-pane env-step-pane">
              <div className="wizard-field-block">
                <h2 className="wizard-field-title">Sandbox environment variables</h2>
                <p className="wizard-field-help">
                  Injected securely into the isolated Docker sandbox so reproduced tests can access mock credentials, flags, and database URLs.
                </p>

                {/* Existing Variables List */}
                <div className="env-vars-list">
                  {envVars.length === 0 ? (
                    <p className="env-empty-msg">No custom variables configured. Click &ldquo;Add variable&rdquo; below if your test suite requires env variables.</p>
                  ) : (
                    envVars.map((ev) => {
                      const isShowing = showSecretIds.includes(ev.id);
                      return (
                        <div key={ev.id} className="env-var-row">
                          <span className="env-key"><code>{ev.key}</code></span>
                          <span className="env-val">
                            {ev.isSecret && !isShowing ? '••••••••••••' : ev.value}
                          </span>
                          {ev.isSecret && (
                            <button
                              type="button"
                              className="btn-toggle-secret"
                              onClick={() => toggleShowSecret(ev.id)}
                            >
                              {isShowing ? 'Hide' : 'Show'}
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn-remove-env"
                            onClick={() => handleRemoveEnvVar(ev.id)}
                            aria-label={`Delete ${ev.key}`}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Add New Variable Form */}
                <div className="add-env-form">
                  <div className="add-env-inputs">
                    <input
                      type="text"
                      className="env-input-field input-key"
                      placeholder="KEY (e.g. API_KEY)"
                      value={newKey}
                      onChange={(e) => setNewKey(e.target.value)}
                    />
                    <input
                      type={newIsSecret ? 'password' : 'text'}
                      className="env-input-field input-val"
                      placeholder="Value"
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                    />
                  </div>
                  <div className="add-env-controls">
                    <label className="checkbox-secret-label">
                      <input
                        type="checkbox"
                        checked={newIsSecret}
                        onChange={(e) => setNewIsSecret(e.target.checked)}
                      />
                      <span>Mask as secret</span>
                    </label>
                    <button
                      type="button"
                      className="btn-add-env-item"
                      onClick={handleAddEnvVar}
                      disabled={!newKey.trim()}
                    >
                      + Add
                    </button>
                  </div>
                </div>

                <div className="security-note-box">
                  <Lock size={14} className="sec-icon" aria-hidden="true" />
                  <span className="sec-text">
                    Environment variables are encrypted at rest and only mounted into ephemeral Docker sandbox containers during verification.
                  </span>
                </div>
              </div>

              {/* Step 3 Footer */}
              <div className="onboarding-footer-nav">
                <button
                  type="button"
                  className="btn-wizard-back"
                  onClick={() => setStep(2)}
                >
                  ← Back to branches
                </button>
                <button
                  type="button"
                  className="btn-primary-monitoring"
                  onClick={handleCompleteOnboarding}
                  disabled={selectedIds.length === 0 || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-sm" aria-hidden="true" />
                      <span>Finishing setup...</span>
                    </>
                  ) : (
                    <>
                      <span>{buttonCountText}</span>
                      <span className="btn-arrow" aria-hidden="true">→</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
