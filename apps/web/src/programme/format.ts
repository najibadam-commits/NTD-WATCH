import { NOT_SHOWN_TEXT, type Count } from '@ntd-watch/programme';

const nf = new Intl.NumberFormat('en');

export const formatNumber = (n: number) => nf.format(n);

/**
 * A published count. `null` is a count that is not shown (1 to 4, or a total that would reveal
 * one), written out so it is never mistaken for zero or for missing data.
 */
export const formatCount = (c: Count) => (c === null ? NOT_SHOWN_TEXT : nf.format(c));
/** Short form for tight spaces such as map badges and table cells: "n/s" (not shown). */
export const NOT_SHOWN_SHORT = 'n/s';
export const formatCountShort = (c: Count) => (c === null ? NOT_SHOWN_SHORT : nf.format(c));
export const formatPercent = (share: number | null, digits = 0) =>
  share === null ? '–' : `${(share * 100).toFixed(digits)}%`;
export const formatIndex = (n: number | null) => (n === null ? '–' : n.toFixed(1));

/** "+12", "-3" or "no change". */
export function formatDelta(current: number, previous: number): string {
  const d = current - previous;
  if (d === 0) return 'no change';
  return `${d > 0 ? '+' : '-'}${formatNumber(Math.abs(d))}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
}

/** A round upper bound for an axis: 1, 2, 5 or 10 times a power of ten. */
export function niceMax(max: number): number {
  if (max <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(max));
  const f = max / pow;
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
  return nice * pow;
}
