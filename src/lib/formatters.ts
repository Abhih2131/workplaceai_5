/**
 * Formatting & Utility Functions
 *
 * Pure helper functions used across KPI, chart, and UI layers.
 * No business logic lives here — only data transformation.
 */

/** Difference in days between two dates (a − b). */
export function diffDays(a: Date, b: Date): number {
  return (a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24);
}

/** Arithmetic mean of a numeric array. Returns 0 for empty arrays. */
export function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

/** Statistical mode (most frequent value) of a string array. Returns 'N/A' for empty arrays. */
export function mode(arr: string[]): string {
  if (arr.length === 0) return 'N/A';
  const counts: Record<string, number> = {};
  arr.forEach(v => { counts[v] = (counts[v] || 0) + 1; });
  let maxK = arr[0], maxV = 0;
  for (const [k, v] of Object.entries(counts)) {
    if (v > maxV) { maxK = k; maxV = v; }
  }
  return maxK;
}

/** Round to 1 decimal place. */
export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Format number with Indian locale separators (e.g. 1,23,456). */
export function formatNumber(n: number): string {
  return n.toLocaleString('en-IN');
}

/** Format as percentage string with 1 decimal (e.g. "12.3%"). */
export function formatPercent(n: number): string {
  return `${round1(n)}%`;
}

/** Format as Indian currency in Lakhs (e.g. "₹ 3.5 L"). */
export function formatCurrency(n: number): string {
  return `₹ ${round1(n)} L`;
}

/** Format as years with 1 decimal (e.g. "4.2 Yrs"). */
export function formatYears(n: number): string {
  return `${round1(n)} Yrs`;
}

/** Safely convert any value to a trimmed string or null. */
export function safeStr(v: any): string | null {
  if (v === null || v === undefined || v === '') return null;
  return String(v).trim();
}

/** Safely convert any value to a lowercase trimmed string; returns '' for nullish. */
export function safeLower(v: any): string {
  const s = safeStr(v);
  return s ? s.toLowerCase() : '';
}

/** Title-case a string (first char upper, rest lower). */
export function titleCase(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

/**
 * Parse a value into a Date or return null.
 *
 * Handles: Date objects, Excel serial numbers, ISO strings,
 * DD/MM/YYYY, DD-MM-YYYY, and YYYY-MM-DD formats.
 */
export function parseDate(value: any): Date | null {
  if (!value) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  if (typeof value === 'number') {
    // Excel serial number
    const d = new Date((value - 25569) * 86400 * 1000);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    // Try ISO / standard parsing
    let d = new Date(trimmed);
    if (!isNaN(d.getTime())) return d;
    // Try DD/MM/YYYY or DD-MM-YYYY
    const parts = trimmed.split(/[\/\-\.]/);
    if (parts.length === 3) {
      const [a, b, c] = parts.map(Number);
      if (c > 1900) { d = new Date(c, b - 1, a); if (!isNaN(d.getTime())) return d; }
      if (a > 1900) { d = new Date(a, b - 1, c); if (!isNaN(d.getTime())) return d; }
    }
    return null;
  }
  return null;
}

/** Parse a value to a number or return null. */
export function parseNum(value: any): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return isNaN(n) ? null : n;
}
