import type { UsageRange } from '../types';

/**
 * Format token count with compact Intl notation: e.g. 318K, 1.2M, 3.2K
 */
export function formatTokenCount(num: number): string {
  if (num === 0) return '0';
  // Use 1 fraction digit for millions (1.2M) or small thousands (3.2K); round thousands for large counts (318K)
  const maximumFractionDigits = num >= 1000000 ? 1 : num >= 10000 ? 0 : 1;
  const formatter = new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits,
  });
  return formatter.format(num);
}

/**
 * Format exact tokens with grouping separators: e.g. 318,400 tokens
 */
export function formatExactTokens(num: number): string {
  const formatter = new Intl.NumberFormat('en-US');
  return `${formatter.format(num)} tokens`;
}

export type UsageState = 'ok' | 'low' | 'limit';

/**
 * Computes usage threshold state:
 * - under 80%: 'ok' (purple)
 * - 80% to 99%: 'low' (amber, "Running low")
 * - 100%+: 'limit' (red, "Limit reached")
 */
export function getUsageState(used: number, limit: number | null): UsageState {
  if (limit === null || limit <= 0) return 'ok';
  const pct = (used / limit) * 100;
  if (pct >= 100) return 'limit';
  if (pct >= 80) return 'low';
  return 'ok';
}

/**
 * Format human duration until ISO timestamp: e.g. "6h 12m"
 */
export function formatTimeUntil(isoResetTime: string): string {
  try {
    const target = new Date(isoResetTime).getTime();
    const now = Date.now();
    const diffMs = Math.max(0, target - now);

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours === 0 && minutes === 0) return '< 1m';
    if (hours === 0) return `${minutes}m`;
    return `${hours}h ${minutes}m`;
  } catch {
    return '0h 0m';
  }
}

/**
 * Generates user initials for avatar fallback (never empty).
 */
export function getInitials(name?: string, login?: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  if (login && login.trim()) {
    const cleaned = login.replace(/[^a-zA-Z0-9]/g, '');
    return cleaned.slice(0, 2).toUpperCase() || 'GH';
  }
  return 'GH';
}

/**
 * Parse URLSearchParams into UsageRange
 */
export function parseUsageRange(params: URLSearchParams): UsageRange {
  const rangeParam = params.get('range');
  const fromParam = params.get('from');
  const toParam = params.get('to');

  if (fromParam && toParam) {
    return {
      preset: 'custom',
      from: fromParam,
      to: toParam,
    };
  }

  if (rangeParam === 'today' || rangeParam === '7d' || rangeParam === '30d' || rangeParam === 'month') {
    return { preset: rangeParam };
  }

  return { preset: 'today' };
}

/**
 * Convert UsageRange to URLSearchParams string
 */
export function rangeToQueryString(range: UsageRange): string {
  if (range.preset === 'custom') {
    return `from=${encodeURIComponent(range.from)}&to=${encodeURIComponent(range.to)}`;
  }
  return `range=${range.preset}`;
}
