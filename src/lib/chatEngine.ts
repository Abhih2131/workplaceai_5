/**
 * ChatEngine v2 — Natural Language Query Engine for HR Data
 * 
 * Features:
 * - Intent detection (count, average, list, filter, group, lookup, compare, clarify)
 * - Flexible NLP parsing with synonym support
 * - Conversation context memory (follow-up questions)
 * - Clarification logic for ambiguous queries
 * - Markdown table responses
 * - Supports all Employee fields dynamically
 */

import { Employee } from './types';
import { safeLower, titleCase, formatNumber, mean, diffDays } from './formatters';

export interface ChatResponse {
  text: string;
  data?: any[];
}

export interface ConversationContext {
  lastFilters: FilterState;
  lastResultSet: Employee[];
  lastIntent: string;
  lastQuery: string;
}

interface FilterState {
  gender?: string;
  zone?: string;
  department?: string;
  band?: string;
  grade?: string;
  employmentStatus?: string;
  hiringSource?: string;
  rating?: string;
  company?: string;
  businessUnit?: string;
  functionName?: string;
  area?: string;
  employmentType?: string;
  sector?: string;
  isJoiner?: boolean;
  isExit?: boolean;
  topTalent?: string;
  skills?: string;
  dateRange?: { start: Date; end: Date };
  nameSearch?: string;
}

// ───────── Synonyms & Keyword Maps ─────────

const GENDER_MAP: Record<string, string> = {
  female: 'female', women: 'female', woman: 'female', ladies: 'female', girl: 'female', girls: 'female',
  male: 'male', men: 'male', man: 'male', boys: 'male', boy: 'male', gents: 'male',
};

const ZONE_MAP: Record<string, string> = {
  east: 'east', eastern: 'east', west: 'west', western: 'west',
  north: 'north', northern: 'north', south: 'south', southern: 'south',
  central: 'central', northeast: 'northeast', 'north east': 'northeast',
};

const RATING_MAP: Record<string, string> = {
  excellent: 'excellent', outstanding: 'excellent', exceptional: 'excellent',
  good: 'good', 'above average': 'above average',
  average: 'average', satisfactory: 'average', ok: 'average',
  poor: 'poor', 'below average': 'below average', bad: 'poor', low: 'poor',
};

const SOURCE_KEYWORDS = [
  'linkedin', 'naukri', 'indeed', 'referral', 'reference', 'campus', 'consultant',
  'job portal', 'walk-in', 'walkin', 'internal', 'agency', 'newspaper', 'social media',
];

const EXIT_KEYWORDS = ['exit', 'left', 'resigned', 'terminated', 'attrition', 'separation', 'quit', 'departed', 'inactive'];
const JOINER_KEYWORDS = ['joiner', 'joined', 'new hire', 'new hires', 'hired', 'onboarded', 'recruited', 'new employee', 'new employees'];
const COUNT_KEYWORDS = ['how many', 'count', 'total number', 'headcount', 'head count', 'number of', 'strength'];
const AVG_KEYWORDS = ['average', 'avg', 'mean'];
const LIST_KEYWORDS = ['list', 'show', 'display', 'give me', 'tell me about', 'who are', 'which employees', 'find', 'search', 'get'];
const GROUP_KEYWORDS = ['group by', 'breakdown', 'break down', 'split by', 'by department', 'by zone', 'by gender', 'department wise', 'zone wise', 'gender wise', 'distribution'];
const SALARY_KEYWORDS = ['salary', 'ctc', 'compensation', 'pay', 'package', 'remuneration', 'earning'];
const EXP_KEYWORDS = ['experience', 'tenure', 'years of service', 'working years'];
const AGE_KEYWORDS = ['age', 'old', 'young', 'years old'];
const TOP_KEYWORDS = ['top', 'highest', 'best', 'maximum', 'max'];
const BOTTOM_KEYWORDS = ['bottom', 'lowest', 'worst', 'minimum', 'min', 'least'];

// ───────── Helpers ─────────

function matchesAny(q: string, keywords: string[]): boolean {
  return keywords.some(k => q.includes(k));
}

function extractGender(q: string): string | undefined {
  for (const [kw, val] of Object.entries(GENDER_MAP)) {
    if (new RegExp(`\\b${kw}\\b`).test(q)) return val;
  }
  return undefined;
}

function extractZone(q: string): string | undefined {
  for (const [kw, val] of Object.entries(ZONE_MAP)) {
    if (new RegExp(`\\b${kw}\\b`).test(q)) return val;
  }
  return undefined;
}

function extractRating(q: string): string | undefined {
  // Only match rating keywords when "rating" or "rated" or "performance" is present, 
  // OR the keyword is unambiguous (excellent, poor, outstanding)
  const hasRatingContext = /\b(rating|rated|performance)\b/.test(q);
  const unambiguous = ['excellent', 'outstanding', 'exceptional', 'poor', 'below average'];
  for (const [kw, val] of Object.entries(RATING_MAP)) {
    if (unambiguous.includes(kw)) {
      if (new RegExp(`\\b${kw}\\b`).test(q)) return val;
    } else if (hasRatingContext && new RegExp(`\\b${kw}\\b`).test(q)) {
      return val;
    }
  }
  return undefined;
}

function extractDepartment(q: string, employees: Employee[]): string | undefined {
  const depts = new Set<string>();
  employees.forEach(e => {
    if (e.department) depts.add(safeLower(e.department));
  });
  for (const dept of depts) {
    if (q.includes(dept)) return dept;
  }
  return undefined;
}

function extractHiringSource(q: string): string | undefined {
  for (const src of SOURCE_KEYWORDS) {
    if (q.includes(src)) return src;
  }
  return undefined;
}

function extractName(query: string): string | undefined {
  // "salary of Rahul Sharma" or "show Rahul" or "who is Rahul"
  const patterns = [
    /(?:salary|ctc|details?|info|profile|show|who is|about)\s+(?:of\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/,
    /(?:of|for)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/,
  ];
  for (const pat of patterns) {
    const m = query.match(pat);
    if (m) return m[1];
  }
  return undefined;
}

function extractGroupByField(q: string): { field: keyof Employee; label: string } | undefined {
  const mappings: { keywords: string[]; field: keyof Employee; label: string }[] = [
    { keywords: ['by department', 'department wise', 'departmentwise'], field: 'department', label: 'Department' },
    { keywords: ['by zone', 'zone wise', 'zonewise'], field: 'zone', label: 'Zone' },
    { keywords: ['by gender', 'gender wise', 'genderwise'], field: 'gender', label: 'Gender' },
    { keywords: ['by band', 'band wise', 'bandwise'], field: 'band', label: 'Band' },
    { keywords: ['by grade', 'grade wise', 'gradewise'], field: 'grade', label: 'Grade' },
    { keywords: ['by source', 'source wise', 'sourcewise', 'by hiring source'], field: 'hiring_source', label: 'Hiring Source' },
    { keywords: ['by company', 'company wise', 'companywise'], field: 'company', label: 'Company' },
    { keywords: ['by function', 'function wise', 'functionwise'], field: 'function_name', label: 'Function' },
    { keywords: ['by location', 'location wise', 'locationwise'], field: 'location', label: 'Location' },
    { keywords: ['by rating', 'rating wise', 'ratingwise'], field: 'rating_25', label: 'Rating' },
    { keywords: ['by qualification', 'qualification wise'], field: 'highest_qualification', label: 'Qualification' },
    { keywords: ['by sector', 'sector wise'], field: 'employment_sector', label: 'Sector' },
  ];
  for (const m of mappings) {
    if (m.keywords.some(k => q.includes(k))) return { field: m.field, label: m.label };
  }
  return undefined;
}

function extractLastNMonths(q: string): number | undefined {
  const m = q.match(/last\s+(\d+)\s+months?/);
  if (m) return parseInt(m[1]);
  // "last quarter" = 3 months
  if (q.includes('last quarter')) return 3;
  if (q.includes('last half year') || q.includes('last 6 months')) return 6;
  return undefined;
}

function applyFilters(employees: Employee[], filters: FilterState, fyStart: Date, fyEnd: Date): Employee[] {
  let result = [...employees];

  if (filters.gender) {
    result = result.filter(e => safeLower(e.gender) === filters.gender);
  }
  if (filters.zone) {
    result = result.filter(e => safeLower(e.zone) === filters.zone);
  }
  if (filters.department) {
    result = result.filter(e => safeLower(e.department) === filters.department);
  }
  if (filters.band) {
    result = result.filter(e => safeLower(e.band) === filters.band);
  }
  if (filters.grade) {
    result = result.filter(e => safeLower(e.grade) === filters.grade);
  }
  if (filters.hiringSource) {
    result = result.filter(e => safeLower(e.hiring_source).includes(filters.hiringSource!));
  }
  if (filters.rating) {
    result = result.filter(e => safeLower(e.rating_25) === filters.rating);
  }
  if (filters.company) {
    result = result.filter(e => safeLower(e.company) === filters.company);
  }
  if (filters.businessUnit) {
    result = result.filter(e => safeLower(e.business_unit) === filters.businessUnit);
  }
  if (filters.functionName) {
    result = result.filter(e => safeLower(e.function_name) === filters.functionName);
  }
  if (filters.sector) {
    result = result.filter(e => safeLower(e.employment_sector) === filters.sector);
  }
  if (filters.topTalent) {
    result = result.filter(e => safeLower(e.top_talent) === 'yes');
  }
  if (filters.isJoiner) {
    result = result.filter(e =>
      e.date_of_joining && e.date_of_joining >= fyStart && e.date_of_joining <= fyEnd
    );
  }
  if (filters.isExit) {
    result = result.filter(e =>
      e.date_of_exit && e.date_of_exit >= fyStart && e.date_of_exit <= fyEnd
    );
  }
  if (filters.dateRange) {
    result = result.filter(e =>
      e.date_of_joining && e.date_of_joining >= filters.dateRange!.start && e.date_of_joining <= filters.dateRange!.end
    );
  }
  if (filters.nameSearch) {
    const search = filters.nameSearch.toLowerCase();
    result = result.filter(e => (e.employee_name || '').toLowerCase().includes(search));
  }

  return result;
}

function describeFilters(filters: FilterState): string {
  const parts: string[] = [];
  if (filters.gender) parts.push(`${titleCase(filters.gender)}`);
  if (filters.isJoiner) parts.push('joiners this FY');
  if (filters.isExit) parts.push('exits this FY');
  if (filters.zone) parts.push(`in ${titleCase(filters.zone)} zone`);
  if (filters.department) parts.push(`in ${titleCase(filters.department)} department`);
  if (filters.band) parts.push(`Band ${filters.band.toUpperCase()}`);
  if (filters.grade) parts.push(`Grade ${titleCase(filters.grade)}`);
  if (filters.hiringSource) parts.push(`from ${titleCase(filters.hiringSource)}`);
  if (filters.rating) parts.push(`with ${titleCase(filters.rating)} rating`);
  if (filters.company) parts.push(`in ${titleCase(filters.company)}`);
  if (filters.businessUnit) parts.push(`in ${titleCase(filters.businessUnit)} BU`);
  if (filters.functionName) parts.push(`in ${titleCase(filters.functionName)} function`);
  if (filters.sector) parts.push(`in ${titleCase(filters.sector)} sector`);
  if (filters.topTalent) parts.push('(top talent)');
  if (filters.dateRange) parts.push('in selected period');
  if (filters.nameSearch) parts.push(`matching "${filters.nameSearch}"`);
  return parts.length > 0 ? parts.join(' ') : 'all employees';
}

function buildMarkdownTable(rows: Record<string, string>[], maxRows = 15): string {
  if (rows.length === 0) return '';
  const cols = Object.keys(rows[0]);
  const header = `| ${cols.join(' | ')} |`;
  const sep = `| ${cols.map(() => '---').join(' | ')} |`;
  const body = rows.slice(0, maxRows).map(r => `| ${cols.map(c => r[c] || '-').join(' | ')} |`).join('\n');
  const overflow = rows.length > maxRows ? `\n\n*...and ${rows.length - maxRows} more.*` : '';
  return `${header}\n${sep}\n${body}${overflow}`;
}

function employeeToRow(e: Employee): Record<string, string> {
  return {
    'Name': e.employee_name || 'Unknown',
    'Dept': e.department || '-',
    'Zone': e.zone || '-',
    'Band': e.band || '-',
    'CTC': e.total_ctc_pa ? `₹${formatNumber(e.total_ctc_pa)}` : '-',
    'Rating': e.rating_25 || '-',
  };
}

function employeeDetailedRow(e: Employee): Record<string, string> {
  return {
    'Name': e.employee_name || 'Unknown',
    'ID': e.employee_id || '-',
    'Gender': e.gender || '-',
    'Dept': e.department || '-',
    'Zone': e.zone || '-',
    'Grade': e.grade || '-',
    'Band': e.band || '-',
    'CTC (PA)': e.total_ctc_pa ? `₹${formatNumber(e.total_ctc_pa)}` : '-',
    'Exp (Yrs)': e.total_exp_yrs != null ? String(e.total_exp_yrs) : '-',
    'Rating': e.rating_25 || '-',
    'Source': e.hiring_source || '-',
  };
}

function getActiveEmployees(employees: Employee[]): Employee[] {
  return employees.filter(e => !e.date_of_exit || safeLower(e.employment_status) === 'active');
}

// ───────── Main Query Processor ─────────

export function processQuery(
  query: string,
  employees: Employee[],
  fyStart: Date,
  fyEnd: Date,
  context?: ConversationContext | null,
): ChatResponse & { context: ConversationContext } {
  const q = query.toLowerCase().trim();
  const originalQuery = query.trim();

  // Build filters from query
  const filters: FilterState = {};
  const now = new Date();

  // Detect follow-up: if short query references previous context
  const isFollowUp = context && context.lastResultSet.length > 0 && (
    q.startsWith('how many') ||
    q.startsWith('and ') ||
    q.startsWith('what about') ||
    q.startsWith('among them') ||
    q.startsWith('of those') ||
    q.startsWith('from those') ||
    q.startsWith('out of them') ||
    q.startsWith('filter') ||
    (q.split(' ').length <= 6 && !matchesAny(q, ['all employees', 'total employees', 'everyone']))
  );

  // If follow-up, inherit previous filters
  if (isFollowUp && context) {
    Object.assign(filters, context.lastFilters);
  }

  // Extract new filters from current query
  const gender = extractGender(q);
  if (gender) filters.gender = gender;

  const zone = extractZone(q);
  if (zone) filters.zone = zone;

  const dept = extractDepartment(q, employees);
  if (dept) filters.department = dept;

  const rating = extractRating(q);
  if (rating) filters.rating = rating;

  const source = extractHiringSource(q);
  if (source) filters.hiringSource = source;

  if (matchesAny(q, JOINER_KEYWORDS)) filters.isJoiner = true;
  if (matchesAny(q, EXIT_KEYWORDS)) filters.isExit = true;

  if (q.includes('top talent')) filters.topTalent = 'yes';

  // Band extraction
  const bandMatch = q.match(/\bband\s+([a-z0-9]+)/i);
  if (bandMatch) filters.band = bandMatch[1].toLowerCase();

  // Grade extraction
  const gradeMatch = q.match(/\bgrade\s+([a-z0-9]+)/i);
  if (gradeMatch) filters.grade = gradeMatch[1].toLowerCase();

  // Last N months
  const lastMonths = extractLastNMonths(q);
  if (lastMonths) {
    const start = new Date(now);
    start.setMonth(start.getMonth() - lastMonths);
    filters.dateRange = { start, end: now };
    filters.isJoiner = filters.isJoiner || q.includes('join');
  }

  // Name-based lookup
  const nameSearch = extractName(originalQuery);

  const baseEmployees = isFollowUp && context ? context.lastResultSet : employees;

  // ── CLARIFICATION for very vague queries ──
  if (isVagueQuery(q) && !isFollowUp) {
    return {
      text: buildClarification(q),
      context: { lastFilters: filters, lastResultSet: [], lastIntent: 'clarify', lastQuery: q },
    };
  }

  // ── NAME LOOKUP ──
  if (nameSearch || (matchesAny(q, SALARY_KEYWORDS) && /(?:of|for)\s+/i.test(q))) {
    const name = nameSearch || '';
    if (name) {
      filters.nameSearch = name;
      const matches = applyFilters(employees, { nameSearch: name }, fyStart, fyEnd);
      if (matches.length === 0) {
        return {
          text: `No employee found matching **"${name}"**. Please check the spelling or try a different name.`,
          context: { lastFilters: filters, lastResultSet: [], lastIntent: 'lookup', lastQuery: q },
        };
      }
      if (matches.length === 1) {
        const e = matches[0];
        const joiningDate = e.date_of_joining ? e.date_of_joining.toLocaleDateString('en-IN') : 'N/A';
        const text = `### ${e.employee_name}\n\n` +
          `| Field | Value |\n| --- | --- |\n` +
          `| Employee ID | ${e.employee_id || 'N/A'} |\n` +
          `| Gender | ${e.gender || 'N/A'} |\n` +
          `| Department | ${e.department || 'N/A'} |\n` +
          `| Zone | ${e.zone || 'N/A'} |\n` +
          `| Grade | ${e.grade || 'N/A'} |\n` +
          `| Band | ${e.band || 'N/A'} |\n` +
          `| Total CTC (PA) | ${e.total_ctc_pa ? `₹ ${formatNumber(e.total_ctc_pa)}` : 'N/A'} |\n` +
          `| Experience | ${e.total_exp_yrs != null ? `${e.total_exp_yrs} years` : 'N/A'} |\n` +
          `| Date of Joining | ${joiningDate} |\n` +
          `| Hiring Source | ${e.hiring_source || 'N/A'} |\n` +
          `| Rating | ${e.rating_25 || 'N/A'} |\n` +
          `| Qualification | ${e.highest_qualification || 'N/A'} |`;
        return {
          text,
          data: matches,
          context: { lastFilters: filters, lastResultSet: matches, lastIntent: 'lookup', lastQuery: q },
        };
      }
      // Multiple matches
      const table = buildMarkdownTable(matches.slice(0, 20).map(employeeToRow));
      return {
        text: `Found **${matches.length}** employees matching **"${name}"**:\n\n${table}\n\nPlease specify the full name for detailed info.`,
        data: matches,
        context: { lastFilters: filters, lastResultSet: matches, lastIntent: 'lookup', lastQuery: q },
      };
    }
  }

  // ── GROUP BY / BREAKDOWN ──
  const groupField = extractGroupByField(q);
  if (groupField || matchesAny(q, GROUP_KEYWORDS)) {
    const field = groupField || { field: 'department' as keyof Employee, label: 'Department' };
    const filtered = applyFilters(baseEmployees, filters, fyStart, fyEnd);
    const groups: Record<string, number> = {};
    filtered.forEach(e => {
      const val = titleCase(String(e[field.field] || 'Unknown'));
      groups[val] = (groups[val] || 0) + 1;
    });
    const sorted = Object.entries(groups).sort((a, b) => b[1] - a[1]);
    const desc = describeFilters(filters);
    const table = buildMarkdownTable(sorted.map(([name, count]) => ({
      [field.label]: name,
      'Count': formatNumber(count),
      '%': `${((count / filtered.length) * 100).toFixed(1)}%`,
    })));
    return {
      text: `### ${field.label}-wise breakdown of ${desc}\n\n**Total: ${formatNumber(filtered.length)}**\n\n${table}`,
      data: sorted.map(([name, value]) => ({ name, value })),
      context: { lastFilters: filters, lastResultSet: filtered, lastIntent: 'group', lastQuery: q },
    };
  }

  // ── AVERAGE QUERIES ──
  if (matchesAny(q, AVG_KEYWORDS)) {
    const filtered = applyFilters(baseEmployees, filters, fyStart, fyEnd);
    const desc = describeFilters(filters);

    if (matchesAny(q, SALARY_KEYWORDS)) {
      const ctcs = filtered.filter(e => e.total_ctc_pa != null).map(e => e.total_ctc_pa!);
      if (ctcs.length === 0) return noData(desc, filters, q);
      const avg = mean(ctcs);
      return {
        text: `**Average CTC** of ${desc}: **₹ ${formatNumber(Math.round(avg))}** (₹ ${(avg / 1e5).toFixed(1)} L)\n\nBased on **${formatNumber(ctcs.length)}** employees.`,
        context: { lastFilters: filters, lastResultSet: filtered, lastIntent: 'average', lastQuery: q },
      };
    }
    if (matchesAny(q, EXP_KEYWORDS)) {
      const exps = filtered.filter(e => e.total_exp_yrs != null).map(e => e.total_exp_yrs!);
      if (exps.length === 0) return noData(desc, filters, q);
      const avg = mean(exps);
      return {
        text: `**Average experience** of ${desc}: **${avg.toFixed(1)} years**\n\nBased on **${formatNumber(exps.length)}** employees.`,
        context: { lastFilters: filters, lastResultSet: filtered, lastIntent: 'average', lastQuery: q },
      };
    }
    if (matchesAny(q, AGE_KEYWORDS)) {
      const ages = filtered.filter(e => e.date_of_birth).map(e => diffDays(now, e.date_of_birth!) / 365.25);
      if (ages.length === 0) return noData(desc, filters, q);
      const avg = mean(ages);
      return {
        text: `**Average age** of ${desc}: **${avg.toFixed(1)} years**\n\nBased on **${formatNumber(ages.length)}** employees.`,
        context: { lastFilters: filters, lastResultSet: filtered, lastIntent: 'average', lastQuery: q },
      };
    }
    // Default avg = CTC
    const ctcs = filtered.filter(e => e.total_ctc_pa != null).map(e => e.total_ctc_pa!);
    if (ctcs.length === 0) return noData(desc, filters, q);
    const avg = mean(ctcs);
    return {
      text: `**Average CTC** of ${desc}: **₹ ${formatNumber(Math.round(avg))}** (₹ ${(avg / 1e5).toFixed(1)} L)\n\nBased on **${formatNumber(ctcs.length)}** employees.`,
      context: { lastFilters: filters, lastResultSet: filtered, lastIntent: 'average', lastQuery: q },
    };
  }

  // ── TOP / BOTTOM QUERIES ──
  if (matchesAny(q, TOP_KEYWORDS) || matchesAny(q, BOTTOM_KEYWORDS)) {
    const isTop = matchesAny(q, TOP_KEYWORDS);
    const countMatch = q.match(/\b(\d+)\b/);
    const n = countMatch ? Math.min(parseInt(countMatch[1]), 50) : 10;
    const filtered = applyFilters(baseEmployees, filters, fyStart, fyEnd);
    const desc = describeFilters(filters);

    let sorted: Employee[];
    let metric: string;
    if (matchesAny(q, SALARY_KEYWORDS)) {
      sorted = filtered.filter(e => e.total_ctc_pa != null).sort((a, b) =>
        isTop ? (b.total_ctc_pa! - a.total_ctc_pa!) : (a.total_ctc_pa! - b.total_ctc_pa!)
      );
      metric = 'CTC';
    } else if (matchesAny(q, EXP_KEYWORDS)) {
      sorted = filtered.filter(e => e.total_exp_yrs != null).sort((a, b) =>
        isTop ? (b.total_exp_yrs! - a.total_exp_yrs!) : (a.total_exp_yrs! - b.total_exp_yrs!)
      );
      metric = 'experience';
    } else {
      sorted = filtered.filter(e => e.total_ctc_pa != null).sort((a, b) =>
        isTop ? (b.total_ctc_pa! - a.total_ctc_pa!) : (a.total_ctc_pa! - b.total_ctc_pa!)
      );
      metric = 'CTC';
    }

    const topN = sorted.slice(0, n);
    if (topN.length === 0) return noData(desc, filters, q);
    const table = buildMarkdownTable(topN.map(employeeToRow));
    return {
      text: `### ${isTop ? 'Top' : 'Bottom'} ${n} by ${metric} — ${desc}\n\n${table}`,
      data: topN,
      context: { lastFilters: filters, lastResultSet: filtered, lastIntent: 'top', lastQuery: q },
    };
  }

  // ── ATTRITION RATE ──
  if (q.includes('attrition rate') || q.includes('attrition %') || q.includes('attrition percent')) {
    const active = getActiveEmployees(employees);
    const exits = employees.filter(e => e.date_of_exit && e.date_of_exit >= fyStart && e.date_of_exit <= fyEnd);
    const rate = active.length > 0 ? ((exits.length / (active.length + exits.length)) * 100) : 0;
    return {
      text: `**Attrition Rate** this FY: **${rate.toFixed(1)}%**\n\n- Total exits: **${formatNumber(exits.length)}**\n- Active employees: **${formatNumber(active.length)}**`,
      context: { lastFilters: filters, lastResultSet: exits, lastIntent: 'attrition', lastQuery: q },
    };
  }

  // ── COUNT QUERIES ──
  if (matchesAny(q, COUNT_KEYWORDS) || q.match(/^employees\b/) || (q.includes('attrition') && !q.includes('rate'))) {
    const filtered = applyFilters(baseEmployees, filters, fyStart, fyEnd);
    const desc = describeFilters(filters);
    return {
      text: `There are **${formatNumber(filtered.length)}** ${desc}.`,
      data: filtered.slice(0, 50),
      context: { lastFilters: filters, lastResultSet: filtered, lastIntent: 'count', lastQuery: q },
    };
  }

  // ── LIST / SHOW / FILTER QUERIES ──
  if (matchesAny(q, LIST_KEYWORDS) || Object.keys(filters).length > 0) {
    const filtered = applyFilters(baseEmployees, filters, fyStart, fyEnd);
    const desc = describeFilters(filters);
    if (filtered.length === 0) return noData(desc, filters, q);

    if (filtered.length <= 20) {
      const table = buildMarkdownTable(filtered.map(employeeDetailedRow));
      return {
        text: `### ${desc} — ${formatNumber(filtered.length)} found\n\n${table}`,
        data: filtered,
        context: { lastFilters: filters, lastResultSet: filtered, lastIntent: 'list', lastQuery: q },
      };
    }

    const table = buildMarkdownTable(filtered.slice(0, 15).map(employeeToRow));
    return {
      text: `### ${desc} — ${formatNumber(filtered.length)} found\n\nShowing first 15:\n\n${table}`,
      data: filtered.slice(0, 50),
      context: { lastFilters: filters, lastResultSet: filtered, lastIntent: 'list', lastQuery: q },
    };
  }

  // ── GENERAL / GREETING ──
  if (q.match(/^(hi|hello|hey|good morning|good evening|good afternoon)/)) {
    return {
      text: `Hello! 👋 I'm your HR Data Assistant. I can help you query your employee data.\n\nTry asking:\n- "How many employees do we have?"\n- "Average CTC of joiners this FY"\n- "List employees in East zone with excellent rating"\n- "Top 10 employees by salary"\n- "Attrition rate this FY"\n- "Breakdown by department"`,
      context: { lastFilters: {}, lastResultSet: [], lastIntent: 'greeting', lastQuery: q },
    };
  }

  // ── FALLBACK — try to still give useful data ──
  // If we have any filters extracted, use them
  if (Object.keys(filters).length > 0) {
    const filtered = applyFilters(baseEmployees, filters, fyStart, fyEnd);
    const desc = describeFilters(filters);
    if (filtered.length > 0) {
      return {
        text: `Found **${formatNumber(filtered.length)}** ${desc}.\n\nWould you like me to:\n1. **List** these employees?\n2. Show **average CTC**?\n3. **Breakdown** by department/zone?`,
        data: filtered.slice(0, 50),
        context: { lastFilters: filters, lastResultSet: filtered, lastIntent: 'filter', lastQuery: q },
      };
    }
  }

  // True fallback
  return {
    text: `I understood your query but couldn't find a specific match. Here's what I can do:\n\n` +
      `📊 **Count**: "How many employees in East zone?"\n` +
      `💰 **Average**: "Average CTC of female joiners"\n` +
      `📋 **List**: "Show employees with excellent rating"\n` +
      `👤 **Lookup**: "Show details of Rahul Sharma"\n` +
      `📈 **Group**: "Breakdown by department"\n` +
      `🏆 **Top/Bottom**: "Top 10 by salary"\n` +
      `📉 **Attrition**: "Attrition rate this FY"\n\nYou can also ask follow-up questions — I remember the context!`,
    context: { lastFilters: {}, lastResultSet: [], lastIntent: 'help', lastQuery: q },
  };
}

// ───────── Clarification Logic ─────────

function isVagueQuery(q: string): boolean {
  const vague = [
    /^show employees$/,
    /^employees$/,
    /^average salary$/,
    /^salary$/,
    /^ctc$/,
    /^list$/,
    /^show$/,
    /^data$/,
    /^report$/,
  ];
  return vague.some(r => r.test(q));
}

function buildClarification(q: string): string {
  if (q.includes('employee') || q === 'show' || q === 'list' || q === 'data') {
    return `Could you be more specific? For example:\n\n` +
      `1️⃣ **All employees** — "How many employees do we have?"\n` +
      `2️⃣ **Active employees** — "List active employees"\n` +
      `3️⃣ **New joiners** — "Employees who joined this FY"\n` +
      `4️⃣ **By department** — "Show employees in Sales"\n` +
      `5️⃣ **By zone** — "Employees in East zone"\n\nJust type your specific question!`;
  }
  if (q.includes('salary') || q.includes('ctc')) {
    return `Do you mean:\n\n` +
      `1️⃣ **Average salary of all employees**\n` +
      `2️⃣ **Average salary of new joiners**\n` +
      `3️⃣ **Salary breakdown by department**\n` +
      `4️⃣ **Salary of a specific employee** — e.g. "Salary of Rahul Sharma"\n` +
      `5️⃣ **Top earners** — "Top 10 by CTC"\n\nPlease specify!`;
  }
  return `Could you provide more details? I can help with:\n\n` +
    `- Employee counts & filters\n` +
    `- Salary/CTC analysis\n` +
    `- Attrition & joiners\n` +
    `- Department/zone breakdowns\n` +
    `- Individual employee lookup`;
}

function noData(desc: string, filters: FilterState, q: string): ChatResponse & { context: ConversationContext } {
  return {
    text: `No employees found matching: **${desc}**. Try broadening your filters or check if the data has been uploaded.`,
    context: { lastFilters: filters, lastResultSet: [], lastIntent: 'empty', lastQuery: q },
  };
}
