import * as XLSX from 'xlsx';

/**
 * Complete Employee Master template columns.
 * This list is the single source of truth and must match
 * the column names accepted by excelParser.ts (pre-normalization).
 * Keep display-friendly casing here; the parser normalises on import.
 */
const TEMPLATE_COLUMNS = [
  // Identity
  'Employee_ID',
  'Employee_Name',
  // Dates
  'Date_of_Joining',
  'Date_of_Exit',
  'Date_of_Birth',
  'Last_Promotion',
  'Last_Transfer',
  // Demographics
  'Gender',
  'Employment_Status',
  'Employment_Type',
  // Organisation hierarchy
  'Company',
  'Business_Unit',
  'Department',
  'Function',
  'Zone',
  'Area',
  'Location',
  'Cluster',
  // Job details
  'Band',
  'Grade',
  'Designation',
  'Unique_Job_Role',
  'Employment_Sector',
  // Experience
  'Total_Exp_Yrs',
  'Prev_Exp_in_Yrs',
  // Compensation
  'Total_CTC_PA',
  'Fixed_CTC_PA',
  'Variable_CTC_PA',
  // Hiring
  'Hiring_Source',
  'Manager',
  // Engagement & satisfaction
  'Training_Hours',
  'Satisfaction_Score',
  'Engagement_Score',
  // Performance
  'Rating_25',
  'Rating_24',
  'Top_Talent',
  // Exit
  'Exit_Type',
  'Reason_for_Exit',
  // Education
  'Highest_Qualification',
  'Qualification',
  'Qualification_Type',
  // Skills & competencies
  'Skills_1',
  'Skills_2',
  'Skills_3',
  'Competency',
  'Competency_Type',
  'Competency_Level',
  // Career history
  'Last_Employer',
  'Previous_Employers',
  // Talent management
  'Succession_Ready',
  'Learning_Program',
];

export function downloadTemplate(): void {
  const wb = XLSX.utils.book_new();

  // Header-only template (no example row)
  const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_COLUMNS]);

  // Set column widths
  ws['!cols'] = TEMPLATE_COLUMNS.map(() => ({ wch: 22 }));

  XLSX.utils.book_append_sheet(wb, ws, 'Master');
  XLSX.writeFile(wb, 'Employee_Master_Template.xlsx');
}

export const REQUIRED_COLUMNS_LIST = [
  'Employee_ID',
  'Employee_Name',
  'Date_of_Joining',
  'Gender',
  'Employment_Status',
  'Department',
  'Zone',
  'Total_Exp_Yrs',
];

export const RECOMMENDED_COLUMNS_LIST = [
  'Date_of_Birth',
  'Date_of_Exit',
  'Exit_Type',
  'Total_CTC_PA',
  'Training_Hours',
  'Satisfaction_Score',
  'Hiring_Source',
  'Highest_Qualification',
  'Rating_25',
  'Top_Talent',
  'Reason_for_Exit',
  'Skills_1',
  'Skills_2',
  'Skills_3',
  'Competency',
];
