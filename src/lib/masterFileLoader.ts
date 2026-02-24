import * as XLSX from 'xlsx';
import { Employee, UploadResult, ValidationResult } from './types';
import { parseDate, parseNum, safeStr } from './formatters';
import { MASTER_FILE_PATH, MASTER_FILE_NAME, MASTER_FILE_PREFERRED_SHEET } from './config';

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

const DATE_COLS = ['date_of_joining', 'date_of_exit', 'date_of_birth'];
const NUM_COLS = ['total_exp_yrs', 'training_hours', 'satisfaction_score', 'total_ctc_pa'];

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
    const rate = Math.round((nullCount / Math.max(rows.length, 1)) * 100);
    if (rate > 0) nullRates[col] = rate;
  }
  return { missingColumns, duplicateIds, invalidDates, invalidNumbers, nullRates };
}

function rowToEmployee(row: Record<string, any>): Employee {
  return {
    date_of_joining: parseDate(row.date_of_joining),
    date_of_exit: parseDate(row.date_of_exit),
    date_of_birth: parseDate(row.date_of_birth),
    total_exp_yrs: parseNum(row.total_exp_yrs),
    training_hours: parseNum(row.training_hours),
    satisfaction_score: parseNum(row.satisfaction_score),
    total_ctc_pa: parseNum(row.total_ctc_pa),
    gender: safeStr(row.gender),
    hiring_source: safeStr(row.hiring_source),
    zone: safeStr(row.zone),
    highest_qualification: safeStr(row.highest_qualification),
    employment_sector: safeStr(row.employment_sector),
    unique_job_role: safeStr(row.unique_job_role),
    exit_type: safeStr(row.exit_type),
    rating_25: safeStr(row.rating_25),
    top_talent: safeStr(row.top_talent),
    reason_for_exit: safeStr(row.reason_for_exit),
    skills_1: safeStr(row.skills_1),
    skills_2: safeStr(row.skills_2),
    skills_3: safeStr(row.skills_3),
    competency: safeStr(row.competency),
    employee_name: safeStr(row.employee_name) || safeStr(row.emp_name) || safeStr(row.name),
    employee_id: safeStr(row.employee_id) || safeStr(row.emp_id) || safeStr(row.id),
    ...row,
  };
}

export async function loadMasterFile(): Promise<{ employees: Employee[]; upload: UploadResult }> {
  const response = await fetch(MASTER_FILE_PATH);
  if (!response.ok) {
    throw new Error(`Failed to load master file: ${MASTER_FILE_NAME} (${response.status})`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const data = new Uint8Array(arrayBuffer);
  const workbook = XLSX.read(data, { type: 'array', cellDates: true });
  const sheetNames = workbook.SheetNames;

  let sheetName = MASTER_FILE_PREFERRED_SHEET;
  if (!sheetNames.includes(sheetName)) {
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

  console.log(`[MasterFileLoader] Loaded ${employees.length} rows from ${sheetName} sheet`);
  console.log(`[MasterFileLoader] Columns: ${colNames.join(', ')}`);
  if (validation.missingColumns.length > 0) {
    console.warn(`[MasterFileLoader] Missing columns: ${validation.missingColumns.join(', ')}`);
  }

  return {
    employees,
    upload: {
      fileName: MASTER_FILE_NAME,
      sheetName,
      rowCount: employees.length,
      colCount: colNames.length,
      timestamp: new Date(),
      validation,
      sheetNames,
    },
  };
}
