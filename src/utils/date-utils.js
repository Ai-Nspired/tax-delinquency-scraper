/**
 * Date utility helpers for tax delinquency calculations.
 */

/**
 * Parse a date string in various common formats.
 * @param {string} str - Date string to parse
 * @returns {Date|null} Parsed date or null if unparseable
 */
export function parseDate(str) {
  if (!str || typeof str !== "string") return null;
  const trimmed = str.trim();
  if (!trimmed) return null;

  // Try ISO 8601 first
  const iso = new Date(trimmed);
  if (!isNaN(iso.getTime())) return iso;

  // Try MM/DD/YYYY and similar US formats
  const usMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (usMatch) {
    const [, mm, dd, yyyy] = usMatch;
    const d = new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd));
    if (!isNaN(d.getTime())) return d;
  }

  // Try DD/MM/YYYY
  const euMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (euMatch) {
    const [, dd, mm, yyyy] = euMatch;
    const d = new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd));
    if (!isNaN(d.getTime())) return d;
  }

  // Try "Month DD, YYYY" format
  const named = new Date(trimmed);
  if (!isNaN(named.getTime())) return named;

  return null;
}

/**
 * Calculate the number of full years between two dates.
 * @param {Date} from
 * @param {Date} to
 * @returns {number} Full years elapsed
 */
export function yearsBetween(from, to) {
  if (!(from instanceof Date) || !(to instanceof Date)) return 0;
  let diff = to.getFullYear() - from.getFullYear();
  const monthDiff = to.getMonth() - from.getMonth();
  const dayDiff = to.getDate() - from.getDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) diff--;
  return Math.max(0, diff);
}

/**
 * Check if a date is at least N years in the past from now.
 * @param {Date} date
 * @param {number} minYears
 * @returns {boolean}
 */
export function isAtLeastYearsAgo(date, minYears) {
  const threshold = new Date();
  threshold.setFullYear(threshold.getFullYear() - minYears);
  return date <= threshold;
}

/**
 * Format a date as YYYY-MM-DD.
 * @param {Date|string} date
 * @returns {string}
 */
export function formatDate(date) {
  const d = date instanceof Date ? date : parseDate(date);
  if (!d) return "unknown";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}