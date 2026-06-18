/**
 * Explicit date formatting (avoids Hermes `toLocaleDateString` locale fragility).
 * Matches the prototype's "day month-short" form, e.g. "5 Jun".
 */
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function todayStr(d: Date = new Date()): string {
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}
