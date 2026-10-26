import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { Repo } from '../../types';
import { api } from '../../services/api';
import TokenMeter from './TokenMeter';
import AvatarMenu from './AvatarMenu';
import LimitBanner from './LimitBanner';
import './AppShell.css';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { selectedRepo, setSelectedRepo } = useAuth();
  const location = useLocation();

  const [connectedRepos, setConnectedRepos] = useState<Repo[]>([]);
  const [repoDropdownOpen, setRepoDropdownOpen] = useState(false);
  const repoDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    api.repos.getConnected().then((repos) => {
      if (mounted) setConnectedRepos(repos);
    });
    return () => {
      mounted = false;
    };
  }, [location.pathname]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (repoDropdownRef.current && !repoDropdownRef.current.contains(e.target as Node)) {
        setRepoDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setRepoDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const selectedRepoObj = connectedRepos.find((r) => r.fullName === selectedRepo);
  const repoLabel = selectedRepo === 'all' ? 'All repositories' : (selectedRepoObj?.name || selectedRepo);

  // Show repo switcher ONLY on Dashboard and Usage
  const isDashboardOrUsage = location.pathname === '/dashboard' || location.pathname === '/usage';

  // Layout max-width container variant:
  // App pages: max-width 1120px (dashboard, run detail, usage)
  // Form pages: max-width 760px (settings, onboarding)
  const isFormPage = location.pathname === '/settings' || location.pathname === '/onboarding';
  const containerClass = isFormPage ? 'layout-container-form' : 'layout-container-app';

  return (
    <div className="app-shell-layout">
      {/* Top Bar */}
      <header className="app-topbar">
        <div className="topbar-inner">
          {/* Left: Brand Logo & Repo Switcher */}
          <div className="topbar-left">
            <Link to="/dashboard" className="topbar-brand" aria-label="GitHeal Dashboard">
              <img src="/GitHeal_AI_Health_Logo.png" alt="GitHeal Logo" className="brand-logo-img" />
              <span className="brand-name">GitHeal</span>
            </Link>

            {/* Repo Switcher: shown only on Dashboard and Usage */}
            {isDashboardOrUsage && (
              <div className="repo-switcher-wrap" ref={repoDropdownRef}>
                <button
                  type="button"
                  className={`repo-switcher-btn ${repoDropdownOpen ? 'is-active' : ''}`}
                  onClick={() => setRepoDropdownOpen(!repoDropdownOpen)}
                  aria-expanded={repoDropdownOpen}
                  aria-haspopup="listbox"
                  aria-label="Filter by repository"
                >
                  <svg className="repo-icon" viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden="true">
                    <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z" />
                  </svg>
                  <span className="repo-current-label">{repoLabel}</span>
                  <span className="switcher-caret" aria-hidden="true">▾</span>
                </button>

                {repoDropdownOpen && (
                  <div className="switcher-dropdown" role="listbox" aria-label="Connected repositories">
                    <button
                      type="button"
                      className={`switcher-option ${selectedRepo === 'all' ? 'is-selected' : ''}`}
                      onClick={() => {
                        setSelectedRepo('all');
                        setRepoDropdownOpen(false);
                      }}
                      role="option"
                      aria-selected={selectedRepo === 'all'}
                    >
                      <span className="option-title">All repositories</span>
                      <span className="option-badge">{connectedRepos.length}</span>
                    </button>

                    <div className="switcher-divider" />

                    {connectedRepos.map((repo) => (
                      <button
                        key={repo.id}
                        type="button"
                        className={`switcher-option ${selectedRepo === repo.fullName ? 'is-selected' : ''}`}
                        onClick={() => {
                          setSelectedRepo(repo.fullName);
                          setRepoDropdownOpen(false);
                        }}
                        role="option"
                        aria-selected={selectedRepo === repo.fullName}
                      >
                        <span className="option-title">{repo.name}</span>
                        <span className="option-meta">{repo.language}</span>
                      </button>
                    ))}

                    <div className="switcher-divider" />
                    <Link
                      to="/settings"
                      className="switcher-option-action"
                      onClick={() => setRepoDropdownOpen(false)}
                    >
                      + Manage repositories
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Center: Clean Nav Pills (Dashboard, Usage, Settings only) */}
          <nav className="topbar-nav-links" aria-label="Main navigation">
            <Link
              to="/dashboard"
              className={`nav-link-pill ${location.pathname === '/dashboard' ? 'is-active' : ''}`}
            >
              Dashboard
            </Link>
            <Link
              to="/usage"
              className={`nav-link-pill ${location.pathname === '/usage' ? 'is-active' : ''}`}
            >
              Usage
            </Link>
            <Link
              to="/settings"
              className={`nav-link-pill ${location.pathname === '/settings' ? 'is-active' : ''}`}
            >
              Settings
            </Link>
          </nav>

          {/* Right: TokenMeter + Avatar */}
          <div className="topbar-right">
            <TokenMeter />
            <AvatarMenu />
          </div>
        </div>
      </header>

      {/* Global Limit / Warning Banner */}
      <LimitBanner />

      {/* Main Page Area */}
      <main className={`app-shell-content ${containerClass}`}>
        {children}
      </main>

      {/* Small Pinned Footer */}
      <footer className="app-shell-footer">
        <div className="footer-inner">
          <span className="footer-links">
            <a href="#privacy" className="footer-link">Privacy</a>
            <span className="footer-dot" aria-hidden="true">·</span>
            <a href="#terms" className="footer-link">Terms</a>
            <span className="footer-dot" aria-hidden="true">·</span>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              GitHub
            </a>
          </span>
          <span className="footer-copy">GitHeal CI/CD Autonomous Healing</span>
        </div>
      </footer>
    </div>
  );
};

export default AppShell;
