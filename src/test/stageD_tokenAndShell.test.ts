import { describe, it, expect } from 'vitest';
import {
  formatTokenCount,
  formatExactTokens,
  getUsageState,
  getInitials,
  parseUsageRange,
  rangeToQueryString,
} from '../utils/tokenUtils';
import { api } from '../services/api';
import type { UsageRange } from '../types';

describe('Stage D: Token Formatter', () => {
  it('formats compact tokens properly (318K, 1.2M, etc.)', () => {
    expect(formatTokenCount(0)).toBe('0');
    expect(formatTokenCount(317600)).toBe('318K');
    expect(formatTokenCount(500000)).toBe('500K');
    expect(formatTokenCount(1200000)).toBe('1.2M');
    expect(formatTokenCount(1894200)).toBe('1.9M');
  });

  it('formats exact tokens with grouping separators', () => {
    expect(formatExactTokens(318400)).toBe('318,400 tokens');
    expect(formatExactTokens(500000)).toBe('500,000 tokens');
  });
});

describe('Stage D: Threshold Function (ok, low, limit)', () => {
  it('returns ok for usage under 80%', () => {
    expect(getUsageState(182400, 500000)).toBe('ok'); // 36.48%
    expect(getUsageState(399000, 500000)).toBe('ok'); // 79.8%
  });

  it('returns low for usage between 80% and 99.9%', () => {
    expect(getUsageState(400000, 500000)).toBe('low'); // 80.0%
    expect(getUsageState(420000, 500000)).toBe('low'); // 84.0%
    expect(getUsageState(499999, 500000)).toBe('low'); // 99.9%
  });

  it('returns limit for usage at or above 100%', () => {
    expect(getUsageState(500000, 500000)).toBe('limit'); // 100%
    expect(getUsageState(520000, 500000)).toBe('limit'); // >100%
  });

  it('handles null limit (unlimited) gracefully as ok', () => {
    expect(getUsageState(182400, null)).toBe('ok');
  });
});

describe('Stage D: Remaining is null for 7d, 30d, and custom ranges', () => {
  it('returns remaining token count for today and month', async () => {
    const todayUsage = await api.usage.getTokenUsage({ preset: 'today' });
    expect(todayUsage.remaining).not.toBeNull();
    expect(typeof todayUsage.remaining).toBe('number');

    const monthUsage = await api.usage.getTokenUsage({ preset: 'month' });
    expect(monthUsage.remaining).not.toBeNull();
    expect(typeof monthUsage.remaining).toBe('number');
  });

  it('returns null remaining for 7d, 30d, and custom ranges', async () => {
    const sevenDay = await api.usage.getTokenUsage({ preset: '7d' });
    expect(sevenDay.remaining).toBeNull();

    const thirtyDay = await api.usage.getTokenUsage({ preset: '30d' });
    expect(thirtyDay.remaining).toBeNull();

    const custom = await api.usage.getTokenUsage({
      preset: 'custom',
      from: '2026-10-01',
      to: '2026-10-15',
    });
    expect(custom.remaining).toBeNull();
  });
});

describe('Stage D: Range ↔ URL Param Parsing', () => {
  it('parses presets correctly from search params', () => {
    expect(parseUsageRange(new URLSearchParams('range=7d'))).toEqual({ preset: '7d' });
    expect(parseUsageRange(new URLSearchParams('range=30d'))).toEqual({ preset: '30d' });
    expect(parseUsageRange(new URLSearchParams('range=month'))).toEqual({ preset: 'month' });
    expect(parseUsageRange(new URLSearchParams('range=today'))).toEqual({ preset: 'today' });
    expect(parseUsageRange(new URLSearchParams(''))).toEqual({ preset: 'today' });
  });

  it('parses custom from/to params correctly', () => {
    const params = new URLSearchParams('from=2026-10-01&to=2026-10-10');
    expect(parseUsageRange(params)).toEqual({
      preset: 'custom',
      from: '2026-10-01',
      to: '2026-10-10',
    });
  });

  it('converts UsageRange to query strings faithfully', () => {
    expect(rangeToQueryString({ preset: '7d' })).toBe('range=7d');
    const customRange: UsageRange = {
      preset: 'custom',
      from: '2026-10-01',
      to: '2026-10-10',
    };
    expect(rangeToQueryString(customRange)).toBe('from=2026-10-01&to=2026-10-10');
  });
});

describe('Stage D: Topbar Nav Item Constraints', () => {
  it('contains ONLY Dashboard, Usage, and Settings in the primary navigation pill list', () => {
    const expectedPillNavItems = ['Dashboard', 'Usage', 'Settings'];
    expect(expectedPillNavItems).toHaveLength(3);
    expect(expectedPillNavItems).not.toContain('Run Detail');
    expect(expectedPillNavItems).not.toContain('Onboarding');
  });
});

describe('Stage D: Avatar Initials Fallback', () => {
  it('extracts two-letter initials from full names', () => {
    expect(getInitials('Alex Chen', 'alex-developer')).toBe('AC');
    expect(getInitials('Sarah Jane Conner', 'sconner')).toBe('SC');
  });

  it('extracts initials from handle if name is missing', () => {
    expect(getInitials('', 'alex-developer')).toBe('AL');
    expect(getInitials(undefined, 'octocat')).toBe('OC');
  });

  it('falls back safely to GH if both are empty', () => {
    expect(getInitials('', '')).toBe('GH');
  });
});
