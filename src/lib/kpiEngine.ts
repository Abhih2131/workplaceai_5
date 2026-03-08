/**
 * KPI Calculation Engine
 *
 * Pure functions that compute Key Performance Indicators from an employee
 * dataset, an as-of date, and fiscal-year boundaries.
 *
 * **Business rules** (FY month, rounding, attrition-rate base) are read
 * from `businessConfig.ts` so they can be changed in one place.
 */

import { Employee, PeopleKPIs, JoinersKPIs, AttritionKPIs } from './types';
import { diffDays, mean, mode, round1, safeLower, titleCase } from './formatters';
import {
  ATTRITION_PCT_BASE,
  TRAINING_HOURS_MODE,
  CTC_TO_LAKHS,
  PCT_DECIMALS,
} from './businessConfig';

/** Round to the configured percentage decimal places. */
function roundPct(n: number): number {
  const f = Math.pow(10, PCT_DECIMALS);
  return Math.round(n * f) / f;
}

// ─── People Snapshot KPIs ─────────────────────────────────────────

/**
 * Computes the 8 KPIs displayed on the People Snapshot tab.
 *
 * Active employees: `date_of_exit` is null OR after `asOfDate`.
 * New hires / exits are counted within the `[fyStart, fyEnd]` range.
 *
 * @param employees  Full (filtered) employee array.
 * @param asOfDate   The reference "today" date for headcount & age/tenure.
 * @param fyStart    Start of the selected fiscal year (inclusive).
 * @param fyEnd      End of the selected fiscal year (inclusive).
 * @returns {@link PeopleKPIs}
 */
export function computePeopleKPIs(employees: Employee[], asOfDate: Date, fyStart: Date, fyEnd: Date): PeopleKPIs {
  const dfActive = employees.filter(e =>
    !e.date_of_exit || e.date_of_exit > asOfDate
  );

  // Debug: log FY boundaries and new hire detection
  console.log('[KPI DEBUG] asOfDate:', asOfDate.toISOString(), '| local:', asOfDate.toString());
  console.log('[KPI DEBUG] fyStart:', fyStart.toISOString(), '| local:', fyStart.toString());
  console.log('[KPI DEBUG] fyEnd:', fyEnd.toISOString(), '| local:', fyEnd.toString());
  console.log('[KPI DEBUG] Total employees passed:', employees.length, '| Active:', dfActive.length);

  // Log all employees with DOJ in 2025 or 2026 to see which are included/excluded
  const dojIn2025_2026 = employees
    .filter(e => e.date_of_joining && (e.date_of_joining.getFullYear() === 2025 || e.date_of_joining.getFullYear() === 2026))
    .map(e => ({
      id: e.employee_id,
      doj: e.date_of_joining!.toISOString(),
      dojLocal: e.date_of_joining!.toString(),
      inFY: e.date_of_joining! >= fyStart && e.date_of_joining! <= fyEnd,
    }));
  console.log('[KPI DEBUG] Employees with DOJ in 2025/2026:', JSON.stringify(dojIn2025_2026, null, 2));

  const newHiresList = employees.filter(e =>
    e.date_of_joining && e.date_of_joining >= fyStart && e.date_of_joining <= fyEnd
  );
  console.log('[KPI DEBUG] New Hires count:', newHiresList.length);

  // Check for null DOJ
  const nullDOJ = employees.filter(e => !e.date_of_joining).length;
  if (nullDOJ > 0) console.warn('[KPI DEBUG] Employees with NULL date_of_joining:', nullDOJ);

  const newHires = newHiresList.length;

  const totalExits = employees.filter(e =>
    e.date_of_exit && e.date_of_exit >= fyStart && e.date_of_exit <= fyEnd
  ).length;

  const ages = dfActive
    .filter(e => e.date_of_birth)
    .map(e => Math.floor(diffDays(asOfDate, e.date_of_birth!) / 365.25));

  const tenures = dfActive
    .filter(e => e.date_of_joining)
    .map(e => diffDays(asOfDate, e.date_of_joining!) / 365.25);

  const trainingHoursRaw = dfActive.reduce((s, e) => s + (e.training_hours ?? 0), 0);
  const trainingHours = TRAINING_HOURS_MODE === 'average' && dfActive.length > 0
    ? round1(trainingHoursRaw / dfActive.length)
    : Math.floor(trainingHoursRaw);

  const satisfactionScores = dfActive.map(e => e.satisfaction_score ?? 0);

  return {
    totalEmployees: dfActive.length,
    newHires,
    totalExits,
    avgAge: ages.length ? Math.floor(mean(ages)) : 0,
    avgTenure: tenures.length ? round1(mean(tenures)) : 0,
    avgExperience: round1(mean(dfActive.map(e => e.total_exp_yrs ?? 0))),
    trainingHours,
    avgSatisfaction: round1(mean(satisfactionScores)),
  };
}

// ─── Joiners Snapshot KPIs ────────────────────────────────────────

/**
 * Computes the 8 KPIs displayed on the Hiring / Joiners tab.
 *
 * Joiners: employees whose `date_of_joining` falls in `[fyStart, fyEnd]`.
 *
 * @param employees  Full (filtered) employee array.
 * @param asOfDate   Reference date (used for age calculation of joiners).
 * @param fyStart    FY start (inclusive).
 * @param fyEnd      FY end (inclusive).
 * @returns {@link JoinersKPIs}
 */
export function computeJoinersKPIs(employees: Employee[], asOfDate: Date, fyStart: Date, fyEnd: Date): JoinersKPIs {
  const dfJoiners = employees.filter(e =>
    e.date_of_joining && e.date_of_joining >= fyStart && e.date_of_joining <= fyEnd
  );

  const total = dfJoiners.length;

  const ages = dfJoiners
    .filter(e => e.date_of_birth)
    .map(e => round1(diffDays(asOfDate, e.date_of_birth!) / 365.25));

  const experiences = dfJoiners
    .filter(e => e.total_exp_yrs !== null)
    .map(e => e.total_exp_yrs!);

  const ctcs = dfJoiners
    .filter(e => e.total_ctc_pa !== null)
    .map(e => e.total_ctc_pa!);

  const freshers = total > 0
    ? (dfJoiners.filter(e => (e.total_exp_yrs ?? 0) < 1).length / total) * 100
    : 0;

  const males = dfJoiners.filter(e => safeLower(e.gender) === 'male').length;
  const females = dfJoiners.filter(e => safeLower(e.gender) === 'female').length;
  const mfRatio = females === 0
    ? (males > 0 ? 'All Male' : 'N/A')
    : `${males}:${females}`;

  const sources = dfJoiners.map(e => e.hiring_source).filter(Boolean) as string[];
  const zones = dfJoiners.map(e => e.zone).filter(Boolean) as string[];

  return {
    totalNewJoiners: total,
    avgAge: ages.length ? round1(mean(ages)) : 0,
    avgExperience: experiences.length ? round1(mean(experiences)) : 0,
    avgCTC: ctcs.length ? round1(mean(ctcs) / CTC_TO_LAKHS) : 0,
    pctFreshers: roundPct(freshers),
    maleToFemaleRatio: mfRatio,
    topHiringSource: mode(sources),
    topHiringZone: mode(zones),
  };
}

// ─── Attrition Snapshot KPIs ──────────────────────────────────────

/**
 * Computes the 8 KPIs displayed on the Attrition tab.
 *
 * Attrition rate = exits / average headcount × 100 (when {@link ATTRITION_PCT_BASE} = 'headcount').
 * Sub-type percentages use the same denominator for consistency.
 *
 * Average headcount = (opening HC + closing HC) / 2
 *   - Opening HC: active on `fyStart`
 *   - Closing HC: active on `fyEnd`
 *
 * @param employees  Full (filtered) employee array.
 * @param _asOfDate  Currently unused; reserved for future use.
 * @param fyStart    FY start (inclusive).
 * @param fyEnd      FY end (inclusive).
 * @returns {@link AttritionKPIs}
 */
export function computeAttritionKPIs(employees: Employee[], _asOfDate: Date, fyStart: Date, fyEnd: Date): AttritionKPIs {
  const dfExits = employees.filter(e =>
    e.date_of_exit && e.date_of_exit >= fyStart && e.date_of_exit <= fyEnd
  );

  const openingHC = employees.filter(e =>
    e.date_of_joining && e.date_of_joining <= fyStart &&
    (!e.date_of_exit || e.date_of_exit > fyStart)
  ).length;

  const closingHC = employees.filter(e =>
    e.date_of_joining && e.date_of_joining <= fyEnd &&
    (!e.date_of_exit || e.date_of_exit > fyEnd)
  ).length;

  const avgHC = (openingHC + closingHC) > 0 ? (openingHC + closingHC) / 2 : 1;
  const totalExits = dfExits.length;

  const regrettable = dfExits.filter(e => safeLower(e.exit_type) === 'regrettable').length;
  const nonRegret = dfExits.filter(e => safeLower(e.exit_type) === 'non-regrettable').length;
  const retirement = dfExits.filter(e => safeLower(e.exit_type) === 'retirement').length;

  const exitTenures = dfExits
    .filter(e => e.date_of_joining && e.date_of_exit)
    .map(e => round1(diffDays(e.date_of_exit!, e.date_of_joining!) / 365.25));

  const zones = dfExits.map(e => e.zone).filter(Boolean) as string[];
  const highPerf = dfExits.filter(e => safeLower(e.rating_25) === 'excellent').length;
  const topTalent = dfExits.filter(e => safeLower(e.top_talent) === 'yes').length;

  // Denominator for sub-type percentages
  const denom = ATTRITION_PCT_BASE === 'exits' ? (totalExits || 1) : avgHC;

  return {
    totalAttritionPct: roundPct((totalExits / avgHC) * 100),
    regrettableAttritionPct: roundPct((regrettable / denom) * 100),
    nonRegretAttritionPct: roundPct((nonRegret / denom) * 100),
    retirementAttritionPct: roundPct((retirement / denom) * 100),
    avgTenureExited: exitTenures.length ? round1(mean(exitTenures)) : 0,
    topExitRegion: mode(zones),
    highPerfAttritionPct: roundPct((highPerf / denom) * 100),
    topTalentAttritionPct: roundPct((topTalent / denom) * 100),
  };
}
