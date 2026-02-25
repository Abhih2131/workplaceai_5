import * as XLSX from 'xlsx';
import { Employee, UploadResult, ValidationResult } from './types';
import { parseDate, parseNum, safeStr } from './formatters';

function normalizeColumnName(name: string): string {
  return name
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

const REQUIRED_COLUMNS = [
  'date_of_joining', 'date_of_exit', 'date_of_birth', 'total_exp_yrs',
  'training_hours', 'satisfaction_score', 'total_ctc_pa', 'gender',
  'hiring_source', 'zone', 'highest_qualification', 'employment_sector',
  'unique_job_role', 'exit_type', 'rating_25', 'top_talent',
  'reason_for_exit', 'skills_1', 'skills_2', 'skills_3', 'competency',
];

const DATE_COLS = ['date_of_joining', 'date_of_exit', 'date_of_birth', 'last_promotion', 'last_transfer'];
const NUM_COLS = ['total_exp_yrs', 'prev_exp_in_yrs', 'training_hours', 'satisfaction_score', 'engagement_score', 'total_ctc_pa', 'fixed_ctc_pa', 'variable_ctc_pa'];

function validate(rows: Record<string, any>[], colNames: string[]): ValidationResult {
  const missingColumns = REQUIRED_COLUMNS.filter(c => !colNames.includes(c));
  let duplicateIds = 0;
  const idCol = colNames.find(c => c.includes('employee_id') || c.includes('emp_id') || c === 'id');
  if (idCol) {
    const ids = rows.map(r => r[idCol]).filter(Boolean);
    duplicateIds = ids.length - new Set(ids).size;
  }
  const invalidDates: Record<string, number> = {};
  for (const col of DATE_COLS) {
    if (!colNames.includes(col)) continue;
    let count = 0;
    for (const row of rows) {
      const v = row[col];
      if (v !== null && v !== undefined && v !== '' && parseDate(v) === null) count++;
    }
    if (count > 0) invalidDates[col] = count;
  }
  const invalidNumbers: Record<string, number> = {};
  for (const col of NUM_COLS) {
    if (!colNames.includes(col)) continue;
    let count = 0;
    for (const row of rows) {
      const v = row[col];
      if (v !== null && v !== undefined && v !== '' && parseNum(v) === null) count++;
    }
    if (count > 0) invalidNumbers[col] = count;
  }
  const nullRates: Record<string, number> = {};
  for (const col of REQUIRED_COLUMNS) {
    if (!colNames.includes(col)) continue;
    const nullCount = rows.filter(r => {
      const v = r[col];
      return v === null || v === undefined || v === '';
    }).length;
    const rate = Math.round((nullCount / rows.length) * 100);
    if (rate > 0) nullRates[col] = rate;
  }
  return { missingColumns, duplicateIds, invalidDates, invalidNumbers, nullRates };
}

// Helper to find first matching column from variations
function findCol(row: Record<string, any>, ...names: string[]): any {
  for (const n of names) {
    if (row[n] !== undefined && row[n] !== null && row[n] !== '') return row[n];
  }
  return null;
}

function rowToEmployee(row: Record<string, any>): Employee {
  const mapped: Employee = {
    // Dates
    date_of_joining: parseDate(row.date_of_joining),
    date_of_exit: parseDate(row.date_of_exit),
    date_of_birth: parseDate(row.date_of_birth),
    last_promotion: parseDate(findCol(row, 'last_promotion', 'last_promotion_date')),
    last_transfer: parseDate(findCol(row, 'last_transfer', 'last_transfer_date')),
    // Numbers
    total_exp_yrs: parseNum(row.total_exp_yrs),
    prev_exp_in_yrs: parseNum(findCol(row, 'prev_exp_in_yrs', 'previous_experience', 'prev_exp')),
    training_hours: parseNum(row.training_hours),
    satisfaction_score: parseNum(row.satisfaction_score),
    engagement_score: parseNum(findCol(row, 'engagement_score', 'engagement')),
    total_ctc_pa: parseNum(row.total_ctc_pa),
    fixed_ctc_pa: parseNum(findCol(row, 'fixed_ctc_pa', 'fixed_ctc')),
    variable_ctc_pa: parseNum(findCol(row, 'variable_ctc_pa', 'variable_ctc')),
    // Categorical
    gender: safeStr(row.gender),
    hiring_source: safeStr(findCol(row, 'hiring_source', 'hiring_source_category')),
    zone: safeStr(row.zone),
    cluster: safeStr(row.cluster),
    location: safeStr(row.location),
    highest_qualification: safeStr(row.highest_qualification),
    qualification: safeStr(findCol(row, 'qualification', 'degree')),
    qualification_type: safeStr(row.qualification_type),
    employment_sector: safeStr(row.employment_sector),
    unique_job_role: safeStr(row.unique_job_role),
    exit_type: safeStr(row.exit_type),
    rating_25: safeStr(row.rating_25),
    rating_24: safeStr(row.rating_24),
    top_talent: safeStr(findCol(row, 'top_talent', 'Top Talent')),
    succession_ready: safeStr(row.succession_ready),
    reason_for_exit: safeStr(row.reason_for_exit),
    skills_1: safeStr(row.skills_1),
    skills_2: safeStr(row.skills_2),
    skills_3: safeStr(row.skills_3),
    competency: safeStr(row.competency),
    competency_type: safeStr(row.competency_type),
    competency_level: safeStr(row.competency_level),
    learning_program: safeStr(row.learning_program),
    previous_employers: safeStr(row.previous_employers),
    last_employer: safeStr(row.last_employer),
    employee_name: safeStr(findCol(row, 'employee_name', 'emp_name', 'name')),
    employee_id: safeStr(findCol(row, 'employee_id', 'emp_id', 'id')),
    grade: safeStr(row.grade),
    // Filter fields with flexible column matching
    company: safeStr(findCol(row, 'company', 'company_name', 'org', 'organization')),
    employment_type: safeStr(findCol(row, 'employment_type', 'emp_type', 'type_of_employment')),
    employment_status: safeStr(findCol(row, 'employment_status', 'emp_status', 'status')),
    business_unit: safeStr(findCol(row, 'business_unit', 'bu', 'unit')),
    area: safeStr(findCol(row, 'area', 'region', 'sub_zone')),
    function_name: safeStr(findCol(row, 'function', 'function_name', 'func')),
    department: safeStr(findCol(row, 'department', 'dept', 'department_name')),
    band: safeStr(findCol(row, 'band', 'job_band')),
  };

  // Capture extra fields not already mapped
  const knownKeys = new Set(Object.keys(mapped));
  for (const [key, value] of Object.entries(row)) {
    if (!knownKeys.has(key)) {
      mapped[key] = value;
    }
  }

  return mapped;
}

export function parseExcelFile(file: File, preferredSheet?: string): Promise<{ employees: Employee[]; upload: UploadResult }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const sheetNames = workbook.SheetNames;
        let sheetName = 'Master';
        if (preferredSheet && sheetNames.includes(preferredSheet)) {
          sheetName = preferredSheet;
        } else if (sheetNames.includes('Master')) {
          sheetName = 'Master';
        } else {
          sheetName = sheetNames[0];
        }
        const ws = workbook.Sheets[sheetName];
        const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(ws);
        const normalizedRows = rawRows.map(row => {
          const newRow: Record<string, any> = {};
          for (const [key, value] of Object.entries(row)) {
            newRow[normalizeColumnName(key)] = value;
          }
          return newRow;
        });
        const colNames = normalizedRows.length > 0 ? Object.keys(normalizedRows[0]) : [];
        const validation = validate(normalizedRows, colNames);
        const employees = normalizedRows.map(rowToEmployee);
        resolve({
          employees,
          upload: {
            fileName: file.name, sheetName,
            rowCount: employees.length, colCount: colNames.length,
            timestamp: new Date(), validation, sheetNames,
          },
        });
      } catch (err) { reject(err); }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}
