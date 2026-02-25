import { Employee, ChartSpec, ChartDataPoint } from './types';
import { diffDays, safeLower, titleCase } from './formatters';

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

function bucketize(values: number[], bins: number[], labels: string[]): ChartDataPoint[] {
  const counts = new Array(labels.length).fill(0);
  for (const v of values) {
    for (let i = 0; i < bins.length - 1; i++) {
      if (v >= bins[i] && v < bins[i + 1]) { counts[i]++; break; }
    }
  }
  return labels.map((name, i) => ({ name, value: counts[i] }));
}

function getActiveAtDate(employees: Employee[], date: Date): Employee[] {
  return employees.filter(e =>
    e.date_of_joining && e.date_of_joining <= date &&
    (!e.date_of_exit || e.date_of_exit > date)
  );
}

/** Get rolling 5 FY range ending at current FY. Python uses 2021-2025 hardcoded; we make dynamic. */
function getRolling5FYs(asOfDate: Date): number[] {
  const month = asOfDate.getMonth(); // 0-indexed
  const year = asOfDate.getFullYear();
  // Current FY start year: if month >= 3 (Apr+), current year; else previous year
  const currentFYStartYear = month >= 3 ? year : year - 1;
  // Rolling 5 FYs ending at current
  const years: number[] = [];
  for (let i = 4; i >= 0; i--) {
    years.push(currentFYStartYear - i);
  }
  return years;
}

// ===== PEOPLE SNAPSHOT CHARTS =====
// Python: 1_People_Snapshot.py

function manpowerGrowth(employees: Employee[], asOfDate: Date): ChartSpec {
  const fyYears = getRolling5FYs(asOfDate);
  const data: ChartDataPoint[] = [];
  for (const yr of fyYears) {
    const end = new Date(yr + 1, 2, 31); // Mar 31 of FY end year
    data.push({ name: `FY-${yr + 1}`, value: getActiveAtDate(employees, end).length });
  }
  return { title: 'Manpower Growth', type: 'line', data, yLabel: 'Headcount' };
}

function manpowerCost(employees: Employee[], asOfDate: Date): ChartSpec {
  const fyYears = getRolling5FYs(asOfDate);
  const data: ChartDataPoint[] = [];
  for (const yr of fyYears) {
    const end = new Date(yr + 1, 2, 31);
    const active = getActiveAtDate(employees, end);
    const cost = active.reduce((s, e) => s + (e.total_ctc_pa ?? 0), 0) / 1e7;
    data.push({ name: `FY-${yr + 1}`, value: Math.round(cost * 10) / 10 });
  }
  return { title: 'Manpower Cost', type: 'bar', data, yLabel: 'INR Cr' };
}

// Python: attrition trend in People Snapshot uses avg HC denominator
function attritionTrendPeople(employees: Employee[], asOfDate: Date): ChartSpec {
  const fyYears = getRolling5FYs(asOfDate);
  const data: ChartDataPoint[] = [];
  for (const yr of fyYears) {
    const start = new Date(yr, 3, 1);
    const end = new Date(yr + 1, 2, 31);
    const exits = employees.filter(e => e.date_of_exit && e.date_of_exit >= start && e.date_of_exit <= end).length;
    const openHC = employees.filter(e => e.date_of_joining && e.date_of_joining <= start && (!e.date_of_exit || e.date_of_exit > start)).length;
    const closeHC = employees.filter(e => e.date_of_joining && e.date_of_joining <= end && (!e.date_of_exit || e.date_of_exit > end)).length;
    const avgHC = (openHC + closeHC) > 0 ? (openHC + closeHC) / 2 : 1;
    data.push({ name: `FY-${yr + 1}`, value: Math.round((exits / avgHC) * 1000) / 10 });
  }
  return { title: 'Attrition Trend', type: 'bar', data, yLabel: '%' };
}

// Python: gender donut (hole=0.3)
function genderDiversity(employees: Employee[], asOfDate: Date): ChartSpec {
  const active = employees.filter(e => !e.date_of_exit || e.date_of_exit > asOfDate);
  return { title: 'Gender Diversity', type: 'donut', data: valueCounts(active.map(e => e.gender)) };
}

// Python: age bins [0,20,25,30,35,40,45,50,55,60,inf], labels ["<20","20-24",...,"60+"]
function ageDistribution(employees: Employee[], asOfDate: Date): ChartSpec {
  const active = employees.filter(e => !e.date_of_exit || e.date_of_exit > asOfDate);
  const ages = active.filter(e => e.date_of_birth).map(e => Math.floor(diffDays(asOfDate, e.date_of_birth!) / 365.25));
  const bins = [0, 20, 25, 30, 35, 40, 45, 50, 55, 60, Infinity];
  const labels = ['<20', '20-24', '25-29', '30-34', '35-39', '40-44', '45-49', '50-54', '55-59', '60+'];
  return { title: 'Age Distribution', type: 'bar', data: bucketize(ages, bins, labels) };
}

// Python: tenure bins [0,0.5,1,3,5,10,inf], labels exactly as below
function tenureDistribution(employees: Employee[], asOfDate: Date): ChartSpec {
  const active = employees.filter(e => !e.date_of_exit || e.date_of_exit > asOfDate);
  const tenures = active.filter(e => e.date_of_joining).map(e => diffDays(asOfDate, e.date_of_joining!) / 365.25);
  const bins = [0, 0.5, 1, 3, 5, 10, Infinity];
  const labels = ['0–6 Months', '6–12 Months', '1–3 Years', '3–5 Years', '5–10 Years', '10+ Years'];
  return { title: 'Tenure Distribution', type: 'bar', data: bucketize(tenures, bins, labels) };
}

// ===== JOINERS SNAPSHOT CHARTS =====
// Python: 2_Joiners_Snapshot.py

function hiringSourceDist(joiners: Employee[]): ChartSpec {
  return { title: 'Hiring Source Distribution', type: 'donut', data: valueCounts(joiners.map(e => e.hiring_source)) };
}

function qualificationDist(joiners: Employee[]): ChartSpec {
  return { title: 'Qualification Distribution', type: 'donut', data: valueCounts(joiners.map(e => e.highest_qualification)) };
}

function genderSplitJoiners(joiners: Employee[]): ChartSpec {
  return { title: 'Gender Split of Joiners', type: 'pie', data: valueCounts(joiners.map(e => e.gender)) };
}

// Python: "Employment Sector Distribution" bar chart
function sectorDist(joiners: Employee[]): ChartSpec {
  return { title: 'Employment Sector Distribution', type: 'bar', data: valueCounts(joiners.map(e => e.employment_sector)) };
}

// Python: experience bins [0,1,3,5,10,inf], labels ['<1 Yr','1–3 Yrs','3–5 Yrs','5–10 Yrs','10+ Yrs']
function expRangeJoiners(joiners: Employee[]): ChartSpec {
  const exps = joiners.filter(e => e.total_exp_yrs !== null).map(e => e.total_exp_yrs!);
  const bins = [0, 1, 3, 5, 10, Infinity];
  const labels = ['<1 Yr', '1–3 Yrs', '3–5 Yrs', '5–10 Yrs', '10+ Yrs'];
  return { title: 'Experience Range of Joiners', type: 'bar', data: bucketize(exps, bins, labels) };
}

// Python: word cloud of unique_job_role → VISUAL SUBSTITUTION to bar chart
function jobRolesHired(joiners: Employee[]): ChartSpec {
  const roles = joiners.map(e => e.unique_job_role).filter(Boolean) as string[];
  return { title: 'Unique Job Roles Hired', type: 'wordcloud', data: valueCounts(roles).slice(0, 30) };
}

// ===== ATTRITION SNAPSHOT CHARTS =====
// Python: 3_Attrition_Snapshot.py

// Python attrition trend: counts exits per FY using year+1 logic (line 83,90)
// Note: Python uses `date_of_exit.dt.year.apply(lambda y: f"FY-{y+1}")` which doesn't
// properly account for Apr-Mar FY boundaries. We preserve Python logic exactly.
function attritionTrendAll(employees: Employee[], asOfDate: Date): ChartSpec {
  const allExits = employees.filter(e => e.date_of_exit instanceof Date && !isNaN(e.date_of_exit.getTime()));
  const fyYears = getRolling5FYs(asOfDate);
  const allowedFYs = fyYears.map(yr => `FY-${yr + 1}`);
  const fyMap: Record<string, number> = {};
  allExits.forEach(e => {
    const d = e.date_of_exit!;
    const year = d.getFullYear();
    // Python logic: FY-{year+1} regardless of month
    const fy = `FY-${year + 1}`;
    if (allowedFYs.includes(fy)) fyMap[fy] = (fyMap[fy] || 0) + 1;
  });
  return { title: 'Attrition Trend', type: 'bar', data: allowedFYs.map(fy => ({ name: fy, value: fyMap[fy] || 0 })), yLabel: 'Exits' };
}

function attritionByExitType(exits: Employee[]): ChartSpec {
  return { title: 'Attrition by Exit Type', type: 'donut', data: valueCounts(exits.map(e => e.exit_type)) };
}

// Python: tenure bins [0,1,3,5,10,inf], labels ["<1","1–3","3–5","5–10","10+"]
function tenureExited(exits: Employee[]): ChartSpec {
  const tenures = exits.filter(e => e.date_of_joining && e.date_of_exit).map(e => diffDays(e.date_of_exit!, e.date_of_joining!) / 365.25);
  const bins = [0, 1, 3, 5, 10, Infinity];
  const labels = ['<1', '1–3', '3–5', '5–10', '10+'];
  return { title: 'Tenure of Exited Employees', type: 'bar', data: bucketize(tenures, bins, labels) };
}

function attritionByGender(exits: Employee[]): ChartSpec {
  return { title: 'Attrition by Gender', type: 'pie', data: valueCounts(exits.map(e => e.gender)) };
}

// Python: "Attrition by Rating (FY)" - rating_25 value_counts
function attritionByRating(exits: Employee[]): ChartSpec {
  return { title: 'Attrition by Rating (FY)', type: 'bar', data: valueCounts(exits.map(e => e.rating_25)) };
}

// Python: "Exit Reason Distribution" - donut (hole=0.4)
function exitReasonDist(exits: Employee[]): ChartSpec {
  return { title: 'Exit Reason Distribution', type: 'donut', data: valueCounts(exits.map(e => e.reason_for_exit)) };
}

// Python: word cloud from skills_1+2+3 tokens → VISUAL SUBSTITUTION
function skillLoss(exits: Employee[]): ChartSpec {
  const skills: string[] = [];
  exits.forEach(e => { [e.skills_1, e.skills_2, e.skills_3].forEach(s => { if (s) skills.push(s.toLowerCase().trim()); }); });
  return { title: 'Skill Loss', type: 'wordcloud', data: valueCounts(skills).slice(0, 30) };
}

// Python: word cloud from competency column → VISUAL SUBSTITUTION
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

export function computeJoinersCharts(employees: Employee[], fyStart: Date, fyEnd: Date): ChartSpec[] {
  const joiners = employees.filter(e => e.date_of_joining && e.date_of_joining >= fyStart && e.date_of_joining <= fyEnd);
  return [hiringSourceDist(joiners), qualificationDist(joiners), genderSplitJoiners(joiners), sectorDist(joiners), expRangeJoiners(joiners), jobRolesHired(joiners)];
}

export function computeAttritionCharts(employees: Employee[], fyStart: Date, fyEnd: Date, asOfDate: Date): ChartSpec[] {
  const exits = employees.filter(e => e.date_of_exit && e.date_of_exit >= fyStart && e.date_of_exit <= fyEnd);
  return [attritionTrendAll(employees, asOfDate), attritionByExitType(exits), tenureExited(exits), attritionByGender(exits), attritionByRating(exits), exitReasonDist(exits), skillLoss(exits), competencyLoss(exits)];
}

export function computeOrganizationCharts(employees: Employee[], asOfDate: Date): ChartSpec[] {
  const active = employees.filter(e => !e.date_of_exit || e.date_of_exit > asOfDate);
  return [departmentDist(active), zoneDist(active), bandDist(active), companyDist(active), functionDist(active), businessUnitDist(active)];
}

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
