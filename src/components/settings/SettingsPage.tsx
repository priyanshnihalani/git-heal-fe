import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { Repo, UserSettings } from '../../types';
import { api } from '../../services/api';
import Skeleton from '../common/Skeleton';
import PageHeader from '../common/PageHeader';
import TypedConfirmDialog from './TypedConfirmDialog';
import './SettingsPage.css';

export const SettingsPage: React.FC = () => {
  const { logout, refreshSession } = useAuth();
  const navigate = useNavigate();

  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [repos, setRepos] = useState<Repo[]>([]);
  const [availableRepos, setAvailableRepos] = useState<Repo[]>([]);
  const [showAddRepoDropdown, setShowAddRepoDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Confirm remove popover state
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  // Dialog states
  const [dialogAction, setDialogAction] = useState<'disconnect' | 'delete' | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [allRepos, userSettings] = await Promise.all([
        api.repos.getAll(),
        api.settings.get(),
      ]);
      setRepos(allRepos.filter((r) => r.monitored));
      setAvailableRepos(allRepos.filter((r) => !r.monitored && r.hasWorkflows));
      setSettings(userSettings);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const triggerSavedFeedback = () => {
    setSaveStatus('Saved');
    setTimeout(() => {
      setSaveStatus(null);
    }, 2500);
  };

  const handleToggleSetting = async (key: keyof UserSettings) => {
    if (!settings) return;
    const newVal = !settings[key];
    const updated = await api.settings.update({ [key]: newVal });
    setSettings(updated);
    triggerSavedFeedback();
  };

  const handleThresholdPercentChange = async (val: 80 | 90 | 100) => {
    if (!settings) return;
    const updated = await api.settings.update({ pauseThresholdPercent: val });
    setSettings(updated);
    triggerSavedFeedback();
  };

  const handleBranchesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSettings((prev) => (prev ? { ...prev, watchedBranches: val } : null));
  };

  const handleBranchesBlur = async () => {
    if (!settings) return;
    await api.settings.update({ watchedBranches: settings.watchedBranches });
    triggerSavedFeedback();
  };

  const handleRemoveRepo = async (repoId: string) => {
    setConfirmRemoveId(null);
    await api.repos.disconnectRepo(repoId);
    await refreshSession();
    await loadData();
    triggerSavedFeedback();
  };

  const handleAddRepo = async (repoId: string) => {
    await api.repos.connectRepos([repoId]);
    setShowAddRepoDropdown(false);
    await refreshSession();
    await loadData();
    triggerSavedFeedback();
  };

  const handleDisconnectConfirm = async () => {
    setDialogAction(null);
    await logout();
    navigate('/login');
  };

  const handleDeleteDataConfirm = async () => {
    setDialogAction(null);
    await api.settings.deleteAllData();
    await logout();
    navigate('/login');
  };

  if (isLoading || !settings) {
    return (
      <div className="settings-viewport">
        <div className="settings-container">
          <Skeleton width={180} height={28} />
          <Skeleton width="100%" height={200} borderRadius={16} />
          <Skeleton width="100%" height={160} borderRadius={16} />
        </div>
      </div>
    );
  }

  return (
    <div className="settings-viewport">
      <div className="settings-container">
        {/* Header with Inline Save Feedback */}
        <PageHeader
          title="Settings"
          description="Manage repository connections, agent notifications, and behavior."
          action={
            saveStatus ? (
              <div className="save-feedback-pill" role="status" aria-live="polite">
                <span>{saveStatus}</span>
              </div>
            ) : undefined
          }
        />

        {/* Section 1: Connected Repositories */}
        <section className="settings-section-card" aria-labelledby="heading-repos">
          <div className="section-card-header">
            <div>
              <h2 id="heading-repos" className="section-title">Connected repositories</h2>
              <p className="section-desc">GitHeal watches these repositories for failing CI workflows.</p>
            </div>

            {availableRepos.length > 0 && (
              <div className="add-repo-menu-wrap">
                <button
                  type="button"
                  className="btn-add-repo"
                  onClick={() => setShowAddRepoDropdown(!showAddRepoDropdown)}
                  aria-expanded={showAddRepoDropdown}
                >
                  + Add repository
                </button>

                {showAddRepoDropdown && (
                  <div className="add-repo-dropdown" role="menu">
                    {availableRepos.map((ar) => (
                      <button
                        key={ar.id}
                        type="button"
                        className="add-repo-item"
                        onClick={() => handleAddRepo(ar.id)}
                        role="menuitem"
                      >
                        <span className="ar-name">{ar.fullName}</span>
                        <span className="ar-lang">{ar.language}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="connected-repo-list">
            {repos.length === 0 ? (
              <p className="empty-repos-text">No repositories connected. Click &ldquo;Add repository&rdquo; to begin monitoring.</p>
            ) : (
              repos.map((r) => (
                <div key={r.id} className="settings-repo-row-grid">
                  <div className="repo-grid-name">
                    <strong className="settings-repo-name">{r.fullName}</strong>
                  </div>

                  <div className="repo-grid-lang">
                    <span className="repo-lang-badge">{r.language}</span>
                  </div>

                  <div className="repo-grid-workflow">
                    {r.workflowFile ? (
                      <span className="repo-wf-path" title="Detected CI workflow">{r.workflowFile}</span>
                    ) : (
                      <span className="repo-wf-path text-muted">No workflow file</span>
                    )}
                  </div>

                  <div className="repo-grid-actions">
                    {confirmRemoveId === r.id ? (
                      <div className="remove-confirm-popover" role="dialog" aria-label={`Confirm removing ${r.fullName}`}>
                        <span className="confirm-text">Disconnect?</span>
                        <button
                          type="button"
                          className="btn-confirm-yes"
                          onClick={() => handleRemoveRepo(r.id)}
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          className="btn-confirm-cancel"
                          onClick={() => setConfirmRemoveId(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="btn-remove-repo"
                        onClick={() => setConfirmRemoveId(r.id)}
                        aria-label={`Remove ${r.fullName} from GitHeal monitoring`}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Section 2: Usage & Limits (Stage C) */}
        <section className="settings-section-card" aria-labelledby="heading-usage">
          <div className="section-card-header">
            <div>
              <h2 id="heading-usage" className="section-title">Usage &amp; limits</h2>
              <p className="section-desc">Track and control your daily AI token quota consumption.</p>
            </div>
            <Link to="/usage" className="link-view-usage">
              View full usage →
            </Link>
          </div>

          <div className="settings-toggle-group">
            <div className="plan-limit-box">
              <div className="plan-limit-info">
                <span className="plan-limit-title">Daily AI token limit</span>
                <span className="plan-limit-val">500,000 tokens / day</span>
              </div>
              <span className="plan-badge">Standard Plan</span>
            </div>

            <div className="toggle-row">
              <div className="toggle-label-wrap">
                <label htmlFor="toggle-pause" className="toggle-title">
                  Pause new runs when daily usage reaches threshold
                </label>
                <div className="threshold-row">
                  <span className="toggle-help">Queue incoming failures when usage reaches:</span>
                  <select
                    className="threshold-select"
                    value={settings.pauseThresholdPercent || 90}
                    onChange={(e) => handleThresholdPercentChange(Number(e.target.value) as 80 | 90 | 100)}
                    disabled={!settings.pauseOnThresholdEnabled}
                    aria-label="Threshold percentage"
                  >
                    <option value={80}>80%</option>
                    <option value={90}>90%</option>
                    <option value={100}>100%</option>
                  </select>
                </div>
              </div>
              <button
                type="button"
                id="toggle-pause"
                role="switch"
                aria-checked={settings.pauseOnThresholdEnabled || false}
                className={`switch-toggle ${settings.pauseOnThresholdEnabled ? 'is-on' : 'is-off'}`}
                onClick={() => handleToggleSetting('pauseOnThresholdEnabled')}
              >
                <span className="switch-slider" />
              </button>
            </div>

            <div className="toggle-row">
              <div className="toggle-label-wrap">
                <label htmlFor="toggle-token-email" className="toggle-title">
                  Email me when I reach 80% of my daily tokens
                </label>
                <span className="toggle-help">Receive a notification alert when approaching daily quota.</span>
              </div>
              <button
                type="button"
                id="toggle-token-email"
                role="switch"
                aria-checked={settings.emailOnTokenThreshold !== false}
                className={`switch-toggle ${settings.emailOnTokenThreshold !== false ? 'is-on' : 'is-off'}`}
                onClick={() => handleToggleSetting('emailOnTokenThreshold')}
              >
                <span className="switch-slider" />
              </button>
            </div>
          </div>
        </section>

        {/* Section 3: Notifications ("alerts you", not "your engineering team") */}
        <section className="settings-section-card" aria-labelledby="heading-notifications">
          <div className="section-card-header">
            <div>
              <h2 id="heading-notifications" className="section-title">Notifications</h2>
              <p className="section-desc">Choose when GitHeal alerts you.</p>
            </div>
          </div>

          <div className="settings-toggle-group">
            <div className="toggle-row">
              <div className="toggle-label-wrap">
                <label htmlFor="toggle-pr" className="toggle-title">Email when a pull request is opened</label>
                <span className="toggle-help">Receive an email with the sandbox test report and PR link.</span>
              </div>
              <button
                type="button"
                id="toggle-pr"
                role="switch"
                aria-checked={settings.emailOnPrOpened}
                className={`switch-toggle ${settings.emailOnPrOpened ? 'is-on' : 'is-off'}`}
                onClick={() => handleToggleSetting('emailOnPrOpened')}
              >
                <span className="switch-slider" />
              </button>
            </div>

            <div className="toggle-row">
              <div className="toggle-label-wrap">
                <label htmlFor="toggle-fail" className="toggle-title">Email when an automated fix fails</label>
                <span className="toggle-help">Receive alerts when human investigation is recommended.</span>
              </div>
              <button
                type="button"
                id="toggle-fail"
                role="switch"
                aria-checked={settings.emailOnFixFailed}
                className={`switch-toggle ${settings.emailOnFixFailed ? 'is-on' : 'is-off'}`}
                onClick={() => handleToggleSetting('emailOnFixFailed')}
              >
                <span className="switch-slider" />
              </button>
            </div>
          </div>
        </section>

        {/* Section 4: Behavior */}
        <section className="settings-section-card" aria-labelledby="heading-behavior">
          <div className="section-card-header">
            <div>
              <h2 id="heading-behavior" className="section-title">Behavior</h2>
              <p className="section-desc">Control which branches trigger automated investigations.</p>
            </div>
          </div>

          <div className="settings-form-group">
            <div className="field-group">
              <label htmlFor="input-branches" className="field-label">
                Watched branches
              </label>
              <input
                id="input-branches"
                type="text"
                className="text-input-field"
                value={settings.watchedBranches}
                onChange={handleBranchesChange}
                onBlur={handleBranchesBlur}
                placeholder="main, master, release/*"
              />
              <span className="field-hint">Comma-separated branch names or wildcard glob patterns.</span>
            </div>

            <div className="toggle-row">
              <div className="toggle-label-wrap">
                <label htmlFor="toggle-only-watched" className="toggle-title">
                  Only open PRs for failures on watched branches
                </label>
                <span className="toggle-help">Ignore ephemeral build failures on unmonitored feature branches.</span>
              </div>
              <button
                type="button"
                id="toggle-only-watched"
                role="switch"
                aria-checked={settings.onlyWatchedBranches}
                className={`switch-toggle ${settings.onlyWatchedBranches ? 'is-on' : 'is-off'}`}
                onClick={() => handleToggleSetting('onlyWatchedBranches')}
              >
                <span className="switch-slider" />
              </button>
            </div>
          </div>
        </section>

        {/* Section 5: Danger Zone */}
        <section className="danger-zone-card" aria-labelledby="heading-danger">
          <div className="danger-card-header">
            <h2 id="heading-danger" className="danger-title">Danger Zone</h2>
            <p className="danger-desc">Actions here have permanent effect on your account integration.</p>
          </div>

          <div className="danger-actions-list">
            <div className="danger-row">
              <div>
                <strong className="danger-action-name">Disconnect GitHub</strong>
                <p className="danger-action-desc">Revoke GitHeal webhook integrations and return to login.</p>
              </div>
              <button
                type="button"
                className="btn-danger-outline"
                onClick={() => setDialogAction('disconnect')}
              >
                Disconnect GitHub
              </button>
            </div>

            <div className="danger-row">
              <div>
                <strong className="danger-action-name">Delete my data</strong>
                <p className="danger-action-desc">Permanently erase all run histories, sandbox logs, and stored credentials.</p>
              </div>
              <button
                type="button"
                className="btn-danger-solid"
                onClick={() => setDialogAction('delete')}
              >
                Delete my data
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Typed Confirmation for Disconnecting GitHub */}
      <TypedConfirmDialog
        isOpen={dialogAction === 'disconnect'}
        title="Disconnect GitHub OAuth integration?"
        description="This will revoke GitHeal access to your repositories and pause automated CI/CD healing."
        requiredWord="DISCONNECT"
        confirmLabel="Disconnect"
        onConfirm={handleDisconnectConfirm}
        onCancel={() => setDialogAction(null)}
      />

      {/* Typed Confirmation for Deleting Data */}
      <TypedConfirmDialog
        isOpen={dialogAction === 'delete'}
        title="Permanently erase all GitHeal data?"
        description="This action is irreversible. All cached runs, sandbox reports, and configurations will be permanently deleted."
        requiredWord="DELETE"
        confirmLabel="Permanently Delete Data"
        onConfirm={handleDeleteDataConfirm}
        onCancel={() => setDialogAction(null)}
      />
    </div>
  );
};

export default SettingsPage;
