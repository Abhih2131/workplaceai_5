/**
 * Centralized Business Configuration
 *
 * All business rules that may need adjustment by semi-technical users
 * are gathered here. Change values in this file to alter fiscal-year
 * boundaries, rolling chart windows, rounding, and KPI semantics
 * without editing calculation or chart modules.
 */

// ─── Fiscal Year ──────────────────────────────────────────────────

/**
 * Zero-indexed month that starts the fiscal year.
 * 3 = April (India standard: April → March).
 * Change to 0 for calendar-year FY (Jan → Dec).
 */
export const FY_START_MONTH = 3;

/**
 * Given a reference date, returns the fiscal-year start and end dates.
 *
 * Example (FY_START_MONTH = 3, date = 15-Jun-2025):
 *   fyStart = 1-Apr-2025, fyEnd = 31-Mar-2026
 *
 * Example (date = 15-Feb-2025):
 *   fyStart = 1-Apr-2024, fyEnd = 31-Mar-2025
 */
export function getFiscalYear(date: Date): { fyStart: Date; fyEnd: Date } {
  const m = date.getMonth();
  const y = date.getFullYear();
  if (m >= FY_START_MONTH) {
    return {
      fyStart: new Date(y, FY_START_MONTH, 1),
      fyEnd: new Date(y + 1, FY_START_MONTH, 0), // last day of month before FY_START_MONTH next year
    };
  }
  return {
    fyStart: new Date(y - 1, FY_START_MONTH, 1),
    fyEnd: new Date(y, FY_START_MONTH, 0),
  };
}

/**
 * Maps a date to the FY start year using April-March boundaries.
 * e.g. 15-Jun-2024 → 2024, 15-Feb-2025 → 2024
 */
export function dateToFYStartYear(date: Date): number {
  return date.getMonth() >= FY_START_MONTH
    ? date.getFullYear()
    : date.getFullYear() - 1;
}

/**
 * Returns a display label for a fiscal year, e.g. "FY-2025" for FY starting Apr-2024.
 * Convention: FY label = startYear + 1 (the year it ends in).
 */
export function fyLabel(startYear: number): string {
  return `FY-${startYear + 1}`;
}

/**
 * Returns FY start and end dates for a given FY start year.
 */
export function fyBounds(startYear: number): { start: Date; end: Date } {
  return {
    start: new Date(startYear, FY_START_MONTH, 1),
    end: new Date(startYear + 1, FY_START_MONTH, 0),
  };
}

// ─── Rolling Charts ───────────────────────────────────────────────

/** Number of fiscal years to display in rolling trend charts (e.g. Manpower Growth, Attrition Trend). */
export const ROLLING_FY_COUNT = 5;

// ─── Rounding & Formatting ───────────────────────────────────────

/** Decimal places for percentage KPIs (e.g. attrition rate). */
export const PCT_DECIMALS = 1;

/** Decimal places for currency KPIs when expressed in Lakhs. */
export const CURRENCY_DECIMALS_LAKHS = 1;

/** Multiplier to convert raw CTC to Lakhs. */
export const CTC_TO_LAKHS = 1e5;

/** Multiplier to convert raw CTC to Crores. */
export const CTC_TO_CRORES = 1e7;

// ─── KPI Semantics ───────────────────────────────────────────────

/**
 * How attrition sub-type percentages are computed.
 *
 * - `'headcount'`  → numerator / avg headcount × 100  (industry standard attrition rate)
 * - `'exits'`      → numerator / total exits × 100    (share-of-exits breakdown)
 *
 * Current setting: headcount-based rates, which is the industry standard.
 */
export const ATTRITION_PCT_BASE: 'headcount' | 'exits' = 'headcount';

/**
 * Training hours KPI in People Snapshot.
 *
 * - `'total'`   → Sum of training_hours across all active employees
 * - `'average'` → Mean training_hours per active employee
 *
 * Current setting: total (matches the KPI label "Training Hours").
 */
export const TRAINING_HOURS_MODE: 'total' | 'average' = 'total';

// ─── Upload Validation ───────────────────────────────────────────

/** Maximum file size in bytes for Excel upload. */
export const MAX_UPLOAD_SIZE_BYTES = 20 * 1024 * 1024;

/** Maximum number of critical missing columns before rejecting a file. */
export const MAX_MISSING_CRITICAL_COLUMNS = 3;
