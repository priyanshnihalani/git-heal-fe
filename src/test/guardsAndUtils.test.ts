import { describe, it, expect } from 'vitest';
import { computeDiffCounts } from '../services/api';
import { getStatusConfig } from '../components/common/StatusPill';
import type { DiffLine, RunStatus } from '../types';

describe('Diff Counter Calculation', () => {
  it('correctly counts additions and deletions from diff lines', () => {
    const lines: DiffLine[] = [
      { type: 'context', code: 'export function isTokenValid(token: string) {' },
      { type: 'context', code: '  const decoded = jwt.decode(token);' },
      { type: 'del', code: '- return decoded.exp > Date.now();' },
      { type: 'add', code: '+ if (!decoded?.exp) return false;' },
      { type: 'add', code: '+ return decoded.exp * 1000 > Date.now();' },
      { type: 'context', code: '}' },
    ];

    const { additions, deletions } = computeDiffCounts(lines);
    expect(additions).toBe(2);
    expect(deletions).toBe(1);
  });

  it('handles empty or context-only diffs correctly', () => {
    const empty = computeDiffCounts([]);
    expect(empty.additions).toBe(0);
    expect(empty.deletions).toBe(0);

    const contextOnly: DiffLine[] = [
      { type: 'context', code: 'console.log("hello");' },
    ];
    const res = computeDiffCounts(contextOnly);
    expect(res.additions).toBe(0);
    expect(res.deletions).toBe(0);
  });
});

describe('StatusPill State Mapping', () => {
  const statuses: RunStatus[] = [
    'Detected',
    'Investigating',
    'Patching',
    'Verifying',
    'PR opened',
    'Merged',
    'Failed to fix',
  ];

  it('provides valid configuration and non-empty colorClass for all statuses', () => {
    statuses.forEach((status) => {
      const config = getStatusConfig(status);
      expect(config.label).toBe(status);
      expect(config.colorClass).toMatch(/^status-/);
    });
  });

  it('flags in-progress statuses with animated pulse', () => {
    expect(getStatusConfig('Investigating').isAnimated).toBe(true);
    expect(getStatusConfig('Patching').isAnimated).toBe(true);
    expect(getStatusConfig('Verifying').isAnimated).toBe(true);
    expect(getStatusConfig('PR opened').isAnimated).toBe(false);
    expect(getStatusConfig('Merged').isAnimated).toBe(false);
    expect(getStatusConfig('Failed to fix').isAnimated).toBe(false);
  });
});

describe('Redirect Guards Decision Logic', () => {
  function getRedirectTarget(
    isAuthenticated: boolean,
    hasConnectedRepos: boolean,
    pathname: string
  ): string | null {
    if (!isAuthenticated) {
      return '/login';
    }
    if (!hasConnectedRepos && pathname !== '/onboarding') {
      return '/onboarding';
    }
    if (hasConnectedRepos && pathname === '/onboarding') {
      return '/dashboard';
    }
    return null; // Allowed to render current route
  }

  it('redirects unauthenticated users to /login', () => {
    expect(getRedirectTarget(false, false, '/dashboard')).toBe('/login');
    expect(getRedirectTarget(false, true, '/runs/run_4812')).toBe('/login');
    expect(getRedirectTarget(false, false, '/settings')).toBe('/login');
  });

  it('redirects authenticated users with 0 repos to /onboarding', () => {
    expect(getRedirectTarget(true, false, '/dashboard')).toBe('/onboarding');
    expect(getRedirectTarget(true, false, '/settings')).toBe('/onboarding');
    expect(getRedirectTarget(true, false, '/onboarding')).toBeNull(); // Allowed on /onboarding
  });

  it('redirects authenticated users with repos away from /onboarding to /dashboard', () => {
    expect(getRedirectTarget(true, true, '/onboarding')).toBe('/dashboard');
    expect(getRedirectTarget(true, true, '/dashboard')).toBeNull(); // Allowed on /dashboard
    expect(getRedirectTarget(true, true, '/runs/run_4812')).toBeNull(); // Allowed on /runs/:id
  });
});
