/**
 * Chart Data Engine
 *
 * Pure functions that produce {@link ChartSpec} objects from employee data.
 * Each function corresponds to one chart on the dashboard. ChartSpecs are
 * rendered by `<SmartChart>`.
 *
 * Fiscal-year boundary logic uses {@link businessConfig} so all FY handling
 * is consistent across the codebase.
 */

import { Employee, ChartSpec, ChartDataPoint } from './types';
import { diffDays, safeLower, titleCase } from './formatters';
import {
  ROLLING_FY_COUNT,
  FY_START_MONTH,
  CTC_TO_CRORES,
  dateToFYStartYear,
  fyLabel,
  fyBounds,
} from './businessConfig';

// ─── Shared helpers ───────────────────────────────────────────────

/**
 * Counts occurrences of each distinct value in `arr`.
 * Null/undefined → "Unknown". Values are title-cased.
 * Returned array is sorted descending by count.
 */
function valueCounts(arr: (string | null | undefined)[]): ChartDataPoint[] {
  const counts: Record<string, number> = {};
  arr.forEach(v => {
    const k = v ? titleCase(v.trim()) : 'Unknown';
    counts[k] = (counts[k] || 0) + 1;
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));
}

/**
 * Distributes numeric `values` into histogram `bins`.
 * `bins` has N+1 edges for N `labels`.
 */
function bucketize(values: number[], bins: number[], labels: string[]): ChartDataPoint[] {
  const counts = new Array(labels.length).fill(0);
  for (const v of values) {
    for (let i = 0; i < bins.length - 1; i++) {
      if (v >= bins[i] && v < bins[i + 1]) { counts[i]++; break; }
    }
  }
  return labels.map((name, i) => ({ name, value: counts[i] }));
}

/** Returns employees who are active (joined ≤ date, not exited by date). */
function getActiveAtDate(employees: Employee[], date: Date): Employee[] {
  return employees.filter(e =>
    e.date_of_joining && e.date_of_joining <= date &&
    (!e.date_of_exit || e.date_of_exit > date)
  );
}

/**
 * Returns an array of FY start years for the rolling window ending
 * at the FY that contains `asOfDate`.
 *
 * Uses {@link ROLLING_FY_COUNT} from business config.
 */
function getRollingFYs(asOfDate: Date): number[] {
  const currentFYStartYear = dateToFYStartYear(asOfDate);
  const years: number[] = [];
  for (let i = ROLLING_FY_COUNT - 1; i >= 0; i--) {
    years.push(currentFYStartYear - i);
  }
  return years;
}

// ===== PEOPLE SNAPSHOT CHARTS =====

/** Headcount at end of each FY in the rolling window. */
function manpowerGrowth(employees: Employee[], asOfDate: Date): ChartSpec {
  const fyYears = getRollingFYs(asOfDate);
  const data: ChartDataPoint[] = fyYears.map(yr => {
    const { end } = fyBounds(yr);
    return { name: fyLabel(yr), value: getActiveAtDate(employees, end).length };
  });
  return { title: 'Manpower Growth', type: 'line', data, yLabel: 'Headcount' };
}

/** Total CTC (in Crores) at end of each FY. */
function manpowerCost(employees: Employee[], asOfDate: Date): ChartSpec {
  const fyYears = getRollingFYs(asOfDate);
  const data: ChartDataPoint[] = fyYears.map(yr => {
    const { end } = fyBounds(yr);
    const active = getActiveAtDate(employees, end);
    const cost = active.reduce((s, e) => s + (e.total_ctc_pa ?? 0), 0) / CTC_TO_CRORES;
    return { name: fyLabel(yr), value: Math.round(cost * 10) / 10 };
  });
  return { title: 'Manpower Cost', type: 'bar', data, yLabel: 'INR Cr' };
}

/** Attrition rate per FY (exits / avg HC × 100) for People Snapshot. */
function attritionTrendPeople(employees: Employee[], asOfDate: Date): ChartSpec {
  const fyYears = getRollingFYs(asOfDate);
  const data: ChartDataPoint[] = fyYears.map(yr => {
    const { start, end } = fyBounds(yr);
    const exits = employees.filter(e => e.date_of_exit && e.date_of_exit >= start && e.date_of_exit <= end).length;
    const openHC = getActiveAtDate(employees, start).length;
    const closeHC = getActiveAtDate(employees, end).length;
    const avgHC = (openHC + closeHC) > 0 ? (openHC + closeHC) / 2 : 1;
    return { name: fyLabel(yr), value: Math.round((exits / avgHC) * 1000) / 10 };
  });
  return { title: 'Attrition Trend', type: 'bar', data, yLabel: '%' };
}

/** Gender diversity donut of active employees. */
function genderDiversity(employees: Employee[], asOfDate: Date): ChartSpec {
  const active = employees.filter(e => !e.date_of_exit || e.date_of_exit > asOfDate);
  return { title: 'Gender Diversity', type: 'donut', data: valueCounts(active.map(e => e.gender)) };
}

/** Age distribution histogram (active employees). */
function ageDistribution(employees: Employee[], asOfDate: Date): ChartSpec {
  const active = employees.filter(e => !e.date_of_exit || e.date_of_exit > asOfDate);
  const ages = active.filter(e => e.date_of_birth).map(e => Math.floor(diffDays(asOfDate, e.date_of_birth!) / 365.25));
  const bins = [0, 20, 25, 30, 35, 40, 45, 50, 55, 60, Infinity];
  const labels = ['<20', '20-24', '25-29', '30-34', '35-39', '40-44', '45-49', '50-54', '55-59', '60+'];
  return { title: 'Age Distribution', type: 'bar', data: bucketize(ages, bins, labels) };
}

/** Tenure distribution histogram (active employees). */
function tenureDistribution(employees: Employee[], asOfDate: Date): ChartSpec {
  const active = employees.filter(e => !e.date_of_exit || e.date_of_exit > asOfDate);
  const tenures = active.filter(e => e.date_of_joining).map(e => diffDays(asOfDate, e.date_of_joining!) / 365.25);
  const bins = [0, 0.5, 1, 3, 5, 10, Infinity];
  const labels = ['0–6 Months', '6–12 Months', '1–3 Years', '3–5 Years', '5–10 Years', '10+ Years'];
  return { title: 'Tenure Distribution', type: 'bar', data: bucketize(tenures, bins, labels) };
}

// ===== JOINERS SNAPSHOT CHARTS =====

/** Hiring source breakdown (donut). */
function hiringSourceDist(joiners: Employee[]): ChartSpec {
  return { title: 'Hiring Source Distribution', type: 'donut', data: valueCounts(joiners.map(e => e.hiring_source)) };
}

/** Qualification breakdown of joiners (donut). */
function qualificationDist(joiners: Employee[]): ChartSpec {
  return { title: 'Qualification Distribution', type: 'donut', data: valueCounts(joiners.map(e => e.highest_qualification)) };
}

/** Gender split of joiners (pie). */
function genderSplitJoiners(joiners: Employee[]): ChartSpec {
  return { title: 'Gender Split of Joiners', type: 'pie', data: valueCounts(joiners.map(e => e.gender)) };
}

/** Employment sector distribution of joiners (bar). */
function sectorDist(joiners: Employee[]): ChartSpec {
  return { title: 'Employment Sector Distribution', type: 'bar', data: valueCounts(joiners.map(e => e.employment_sector)) };
}

/** Experience range histogram of joiners. */
function expRangeJoiners(joiners: Employee[]): ChartSpec {
  const exps = joiners.filter(e => e.total_exp_yrs !== null).map(e => e.total_exp_yrs!);
  const bins = [0, 1, 3, 5, 10, Infinity];
  const labels = ['<1 Yr', '1–3 Yrs', '3–5 Yrs', '5–10 Yrs', '10+ Yrs'];
  return { title: 'Experience Range of Joiners', type: 'bar', data: bucketize(exps, bins, labels) };
}

/** Top 30 unique job roles hired (bar / word-cloud substitute). */
function jobRolesHired(joiners: Employee[]): ChartSpec {
  const roles = joiners.map(e => e.unique_job_role).filter(Boolean) as string[];
  return { title: 'Unique Job Roles Hired', type: 'wordcloud', data: valueCounts(roles).slice(0, 30) };
}

// ===== ATTRITION SNAPSHOT CHARTS =====

/**
 * Attrition exit-count trend across rolling FYs.
 *
 * **Fix applied**: Now uses proper April–March fiscal-year boundaries
 * via {@link dateToFYStartYear} instead of the legacy `year + 1` logic
 * that ignored FY month boundaries.
 */
function attritionTrendAll(employees: Employee[], asOfDate: Date): ChartSpec {
  const allExits = employees.filter(e => e.date_of_exit instanceof Date && !isNaN(e.date_of_exit.getTime()));
  const fyYears = getRollingFYs(asOfDate);

  // Build a map of FY start year → exit count using proper FY boundaries
  const fyMap: Record<number, number> = {};
  fyYears.forEach(yr => { fyMap[yr] = 0; });

  allExits.forEach(e => {
    const exitFY = dateToFYStartYear(e.date_of_exit!);
    if (exitFY in fyMap) fyMap[exitFY]++;
  });

  const data: ChartDataPoint[] = fyYears.map(yr => ({
    name: fyLabel(yr),
    value: fyMap[yr],
  }));

  return { title: 'Attrition Trend', type: 'bar', data, yLabel: 'Exits' };
}

/** Attrition breakdown by exit type (donut). */
function attritionByExitType(exits: Employee[]): ChartSpec {
  return { title: 'Attrition by Exit Type', type: 'donut', data: valueCounts(exits.map(e => e.exit_type)) };
}

/** Tenure distribution histogram of exited employees. */
function tenureExited(exits: Employee[]): ChartSpec {
  const tenures = exits.filter(e => e.date_of_joining && e.date_of_exit).map(e => diffDays(e.date_of_exit!, e.date_of_joining!) / 365.25);
  const bins = [0, 1, 3, 5, 10, Infinity];
  const labels = ['<1', '1–3', '3–5', '5–10', '10+'];
  return { title: 'Tenure of Exited Employees', type: 'bar', data: bucketize(tenures, bins, labels) };
}

/** Gender breakdown of exits (pie). */
function attritionByGender(exits: Employee[]): ChartSpec {
  return { title: 'Attrition by Gender', type: 'pie', data: valueCounts(exits.map(e => e.gender)) };
}

/** Rating distribution of exited employees (bar). */
function attritionByRating(exits: Employee[]): ChartSpec {
  return { title: 'Attrition by Rating (FY)', type: 'bar', data: valueCounts(exits.map(e => e.rating_25)) };
}

/** Exit reason distribution (donut). */
function exitReasonDist(exits: Employee[]): ChartSpec {
  return { title: 'Exit Reason Distribution', type: 'donut', data: valueCounts(exits.map(e => e.reason_for_exit)) };
}

/** Top 30 skills lost via attrition (word-cloud substitute). */
function skillLoss(exits: Employee[]): ChartSpec {
  const skills: string[] = [];
  exits.forEach(e => { [e.skills_1, e.skills_2, e.skills_3].forEach(s => { if (s) skills.push(s.toLowerCase().trim()); }); });
  return { title: 'Skill Loss', type: 'wordcloud', data: valueCounts(skills).slice(0, 30) };
}

/** Top 30 competencies lost via attrition (word-cloud substitute). */
function competencyLoss(exits: Employee[]): ChartSpec {
  const comps = exits.map(e => e.competency).filter(Boolean).map(c => c!.toLowerCase().trim());
  return { title: 'Competency Loss', type: 'wordcloud', data: valueCounts(comps).slice(0, 30) };
}

// ===== ORGANIZATION CHARTS =====

function departmentDist(active: Employee[]): ChartSpec {
  return { title: 'Department Distribution', type: 'bar', data: valueCounts(active.map(e => e.department || e.employment_sector)) };
}

function bandDist(active: Employee[]): ChartSpec {
  return { title: 'Band Distribution', type: 'bar', data: valueCounts(active.map(e => e.band)) };
}

function companyDist(active: Employee[]): ChartSpec {
  return { title: 'Company Distribution', type: 'donut', data: valueCounts(active.map(e => e.company)) };
}

function functionDist(active: Employee[]): ChartSpec {
  return { title: 'Function Distribution', type: 'donut', data: valueCounts(active.map(e => e.function_name)) };
}

function businessUnitDist(active: Employee[]): ChartSpec {
  return { title: 'Business Unit Distribution', type: 'bar', data: valueCounts(active.map(e => e.business_unit || e.employment_sector)) };
}

function zoneDist(active: Employee[]): ChartSpec {
  return { title: 'Zone Distribution', type: 'donut', data: valueCounts(active.map(e => e.zone)) };
}

// ===== DEMOGRAPHICS CHARTS =====

function qualificationDistDemo(active: Employee[]): ChartSpec {
  return { title: 'Qualification Distribution', type: 'bar', data: valueCounts(active.map(e => e.highest_qualification)) };
}

function expDistribution(active: Employee[]): ChartSpec {
  const exps = active.filter(e => e.total_exp_yrs !== null).map(e => e.total_exp_yrs!);
  const bins = [0, 1, 3, 5, 10, 15, 20, Infinity];
  const labels = ['<1Y', '1–3Y', '3–5Y', '5–10Y', '10–15Y', '15–20Y', '20+Y'];
  return { title: 'Experience Distribution', type: 'bar', data: bucketize(exps, bins, labels), yLabel: 'Count' };
}

function ratingDistribution(active: Employee[]): ChartSpec {
  return { title: 'Rating Distribution', type: 'donut', data: valueCounts(active.map(e => e.rating_25)) };
}

function employmentTypeDist(active: Employee[]): ChartSpec {
  return { title: 'Employment Type', type: 'donut', data: valueCounts(active.map(e => e.employment_type)) };
}

// ===== PUBLIC API =====

/** Returns all chart specs for the People Snapshot tab. */
export function computePeopleCharts(employees: Employee[], asOfDate: Date): ChartSpec[] {
  return [
    manpowerGrowth(employees, asOfDate),
    manpowerCost(employees, asOfDate),
    attritionTrendPeople(employees, asOfDate),
    genderDiversity(employees, asOfDate),
    ageDistribution(employees, asOfDate),
    tenureDistribution(employees, asOfDate),
  ];
}

/** Returns all chart specs for the Joiners / Hiring tab. */
export function computeJoinersCharts(employees: Employee[], fyStart: Date, fyEnd: Date): ChartSpec[] {
  const joiners = employees.filter(e => e.date_of_joining && e.date_of_joining >= fyStart && e.date_of_joining <= fyEnd);
  return [hiringSourceDist(joiners), qualificationDist(joiners), genderSplitJoiners(joiners), sectorDist(joiners), expRangeJoiners(joiners), jobRolesHired(joiners)];
}

/** Returns all chart specs for the Attrition tab. */
export function computeAttritionCharts(employees: Employee[], fyStart: Date, fyEnd: Date, asOfDate: Date): ChartSpec[] {
  const exits = employees.filter(e => e.date_of_exit && e.date_of_exit >= fyStart && e.date_of_exit <= fyEnd);
  return [attritionTrendAll(employees, asOfDate), attritionByExitType(exits), tenureExited(exits), attritionByGender(exits), attritionByRating(exits), exitReasonDist(exits), skillLoss(exits), competencyLoss(exits)];
}

/** Returns all chart specs for the Organization tab. */
export function computeOrganizationCharts(employees: Employee[], asOfDate: Date): ChartSpec[] {
  const active = employees.filter(e => !e.date_of_exit || e.date_of_exit > asOfDate);
  return [departmentDist(active), zoneDist(active), bandDist(active), companyDist(active), functionDist(active), businessUnitDist(active)];
}

/** Returns all chart specs for the Demographics tab. */
export function computeDemographicsCharts(employees: Employee[], asOfDate: Date): ChartSpec[] {
  const active = employees.filter(e => !e.date_of_exit || e.date_of_exit > asOfDate);
  return [
    genderDiversity(employees, asOfDate),
    ageDistribution(employees, asOfDate),
    qualificationDistDemo(active),
    expDistribution(active),
    ratingDistribution(active),
    employmentTypeDist(active),
  ];
}
