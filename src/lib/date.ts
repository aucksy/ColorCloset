/**
 * Explicit date formatting (avoids Hermes `toLocaleDateString` locale fragility).
 * Matches the prototype's "day month-short" form, e.g. "5 Jun".
 */
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function todayStr(d: Date = new Date()): string {
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** Friendly "time since" for an ISO timestamp, e.g. "just now", "5m ago", "3h ago", "5 Jun". */
export function agoStr(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  const s = Math.max(0, Math.floor((now.getTime() - then.getTime()) / 1000));
  if (s < 45) return 'just now';
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return todayStr(then);
}
