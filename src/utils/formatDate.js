/**
 * REUSE-017 — the ONE date formatter for the storefront, mirroring
 * formatCurrency.js (FE-63).
 *
 * Before this helper, at least six components defined their own local
 * formatDate (BlogSection, ReviewItem, ReviewSection, OrderCard,
 * TrackOrderPage, OrderConfirmationPage) and ~25 call sites used
 * locale-less `toLocaleDateString()` — so admin dates followed each
 * viewer's browser locale while currency was fixed to "en-NP".
 *
 * All formatters here are constructed / called with the FIXED "en-NP"
 * locale, so output is deterministic regardless of the visitor's
 * ambient locale.
 *
 * Null / undefined / invalid input returns "" — callers that need an
 * explicit placeholder render it themselves (e.g. TrackOrderPage
 * wraps this and substitutes "N/A").
 */

const LOCALE = "en-NP";

function toValidDate(value) {
  if (value === null || value === undefined || value === "") return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Date only. `options` are Intl.DateTimeFormat options, passed through
 * so a call site keeps the exact shape it rendered before (month
 * names, weekday, etc.) — only the locale is now fixed. With no
 * options this is the bare locale date (the previous locale-less
 * `toLocaleDateString()` call sites).
 */
export function formatDate(value, options) {
  const date = toValidDate(value);
  return date === null
    ? ""
    : new Intl.DateTimeFormat(LOCALE, options).format(date);
}

const DEFAULT_DATETIME_OPTIONS = {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
};

/** Time only. `options` are Intl.DateTimeFormat options, passed through. */
export function formatTime(
  value,
  options = { hour: "2-digit", minute: "2-digit" },
) {
  const date = toValidDate(value);
  return date === null
    ? ""
    : new Intl.DateTimeFormat(LOCALE, options).format(date);
}

/** Date + time. `options` override / extend the defaults. */
export function formatDateTime(value, options) {
  const date = toValidDate(value);
  return date === null
    ? ""
    : new Intl.DateTimeFormat(LOCALE, {
        ...DEFAULT_DATETIME_OPTIONS,
        ...options,
      }).format(date);
}

/**
 * Relative phrasing for a past date.
 *
 * Default style — the NotificationsPage phrasing:
 *   "Just now", "N minutes ago", "N hours ago", "N days ago",
 *   "N months ago", "N years ago" (each only when the interval is > 1).
 *
 * style: "day" — the ReviewItem phrasing:
 *   "Today", "Yesterday", "N days ago", "N weeks ago",
 *   "N months ago", "N years ago" (whole-day buckets).
 *
 * `now` is injectable for tests. Invalid input returns "".
 */
export function formatRelative(value, { now = new Date(), style } = {}) {
  const date = toValidDate(value);
  if (date === null) return "";
  const nowDate = toValidDate(now) ?? new Date();

  if (style === "day") {
    const days = Math.floor((nowDate - date) / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    return `${Math.floor(days / 365)} years ago`;
  }

  const seconds = Math.floor((nowDate - date) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return `${Math.floor(interval)} years ago`;
  interval = seconds / 2592000;
  if (interval > 1) return `${Math.floor(interval)} months ago`;
  interval = seconds / 86400;
  if (interval > 1) return `${Math.floor(interval)} days ago`;
  interval = seconds / 3600;
  if (interval > 1) return `${Math.floor(interval)} hours ago`;
  interval = seconds / 60;
  if (interval > 1) return `${Math.floor(interval)} minutes ago`;
  return "Just now";
}

export default formatDate;
