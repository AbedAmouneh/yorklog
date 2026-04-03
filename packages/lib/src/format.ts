/**
 * Format a duration in minutes to a human-readable string (e.g. "2h 30m").
 */
export function fmtHours(mins: number | null | undefined): string {
  if (mins == null || (!mins && mins !== 0)) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
