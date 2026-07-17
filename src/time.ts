// Pure time formatting, kept separate so it can be unit-tested without any DOM.

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

/**
 * Format the gap between `date` and `now` as a short, git-log-style relative
 * string: "just now", "2m ago", "3h ago", "yesterday", "3d ago", "1w ago",
 * "2mo ago", "1y ago". Future dates and `now === date` collapse to "just now".
 */
export function relativeTime(date: Date, now: Date): string {
  const seconds = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));

  if (seconds < MINUTE) {
    return "just now";
  }
  if (seconds < HOUR) {
    return `${Math.floor(seconds / MINUTE)}m ago`;
  }
  if (seconds < DAY) {
    return `${Math.floor(seconds / HOUR)}h ago`;
  }

  const days = Math.floor(seconds / DAY);
  if (days === 1) {
    return "yesterday";
  }
  if (seconds < WEEK) {
    return `${days}d ago`;
  }
  if (days < 30) {
    return `${Math.floor(days / 7)}w ago`;
  }
  if (days < 365) {
    return `${Math.floor(days / 30)}mo ago`;
  }
  return `${Math.floor(days / 365)}y ago`;
}
