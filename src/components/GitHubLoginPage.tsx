import React, { useState } from 'react';
import DiffPreview from './DiffPreview';
import PipelinePreview from './PipelinePreview';
import GitFlowGraph from './GitFlowGraph';
import './GitHubLoginPage.css';

interface ScopeInfo {
  name: string;
  purpose: string;
}

const SCOPES: ScopeInfo[] = [
  { name: 'repo', purpose: 'To checkout the failing commit and submit verified pull requests.' },
  { name: 'workflow', purpose: 'To detect failed GitHub Actions workflow runs and inspect logs.' },
  { name: 'write:repo_hook', purpose: 'To receive webhook events when CI checks fail.' },
  { name: 'user:email', purpose: 'To attribute git authorship on generated pull requests.' },
];

export const GitHubLoginPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPermissions, setShowPermissions] = useState(false);

  const handleGitHubLogin = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);

    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
    const redirectUri = window.location.origin + '/auth/callback';
    const scopes = 'repo,read:org,workflow,write:repo_hook,user:email';

    if (clientId) {
      window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&scope=${encodeURIComponent(scopes)}`;
    } else {
      window.location.href = '/api/auth/github';
    }
  };

  return (
    <div className="login-viewport">
      {/* Subtle Layered Background (Masked Dot Grid, Grain, Git Graphs) */}
      <div className="bg-layers" aria-hidden="true">
        {/* 1px neutral dot grid with radial mask behind hero */}
        <div className="bg-dot-grid" />

        {/* Inline SVG feTurbulence noise overlay (~3% opacity, fixed, full-screen) */}
        <svg className="bg-noise" aria-hidden="true">
          <filter id="noiseFilter">
            <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="3" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#noiseFilter)" />
        </svg>

        {/* Animated Git-flow lifecycle branch lines (Flow -> Error -> Retry -> Merge) */}
        <GitFlowGraph side="left" />
        <GitFlowGraph side="right" />
      </div>

      <main className="login-content-column">

        {/* 1. Hero Section */}
        <section className="hero-section" aria-label="GitHeal overview">
          <div className="hero-branding-row">
            <div className="github-icon-badge" aria-hidden="true">
              <img
                src="/GitHeal_AI_Health_Logo.png"
                alt="GitHeal"
                className="hero-logo-img"
              />
            </div>
          </div>

          <h1 className="hero-headline">
            Broken builds. <span className="text-purple">Meet your fix.</span>
          </h1>

          <p className="hero-subheadline">
            GitHeal investigates failed builds, tests fixes in an isolated sandbox, and opens verified pull requests—so you can focus on shipping.
          </p>
        </section>

        {/* 2. Primary Action Section */}
        <section className="primary-action-section" aria-label="Sign in action">
          <div className="action-row">
            <button
              type="button"
              className={`btn-primary-cta ${isLoading ? 'is-loading' : ''}`}
              onClick={handleGitHubLogin}
              disabled={isLoading}
              aria-busy={isLoading}
              aria-label="Continue with GitHub to authorize GitHeal"
            >
              {isLoading ? (
                <span className="spinner" aria-hidden="true" />
              ) : (
                <svg className="btn-icon" viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
              )}
              <span>{isLoading ? 'Connecting to GitHub...' : 'Continue with GitHub'}</span>
              {!isLoading && <span className="arrow" aria-hidden="true">→</span>}
            </button>
          </div>

          <p className="security-line">
            Read-only until you approve. Runs in an isolated sandbox. Never auto-merges.
          </p>

          <button
            type="button"
            className="permissions-link"
            onClick={() => setShowPermissions(!showPermissions)}
            aria-expanded={showPermissions}
            aria-controls="permissions-panel"
          >
            {showPermissions ? 'Hide requested permissions' : 'View requested permissions'}
          </button>

          {showPermissions && (
            <div id="permissions-panel" className="permissions-panel" role="region" aria-label="Requested permissions">
              <ul className="permissions-list">
                {SCOPES.map((s) => (
                  <li key={s.name} className="permission-item">
                    <code>{s.name}</code>
                    <span>{s.purpose}</span>
                  </li>
                ))}
              </ul>
              <p className="permissions-revoke-note">
                You can revoke access anytime in GitHub settings.
              </p>
            </div>
          )}
        </section>

        {/* 3. Product Preview (Diff Card with layered depth and top-right Mascot Bear) */}
        <section className="preview-section" aria-label="Product preview">
          <div className="diff-card-container">
            {/* Mascot Bear (~180px) overlapping the top-right corner of code card */}
            <div className="mascot-card-badge" aria-hidden="true">
              <img
                src="/github_login_teddy_assets/main-bears/bear-raising-pull-request-jwt.png"
                alt=""
                className="mascot-badge-img"
              />
            </div>
            
            <DiffPreview />
          </div>
        </section>

        {/* 4. How It Works (Simple 5-Step Pipeline with Agent Illustrations) */}
        <PipelinePreview />

      </main>

      {/* Tiny Footer: Privacy · Terms · GitHub */}
      <footer className="login-footer" aria-label="Site links">
        <a href="#privacy" className="footer-link">Privacy</a>
        <span className="footer-sep" aria-hidden="true">·</span>
        <a href="#terms" className="footer-link">Terms</a>
        <span className="footer-sep" aria-hidden="true">·</span>
        <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="footer-link">GitHub</a>
      </footer>
    </div>
  );
};

export default GitHubLoginPage;
