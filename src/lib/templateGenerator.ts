import * as XLSX from 'xlsx';

/**
 * Complete Employee Master template columns.
 * Derived directly from the employee_master.xlsx schema (76 columns).
 * Order and naming must match the actual master dataset exactly.
 */
const TEMPLATE_COLUMNS = [
  'employee_id',
  'employee_name',
  'gender',
  'date_of_birth',
  'marital_status',
  'employment_type',
  'employment_status',
  'date_of_joining',
  'date_of_exit',
  'exit_type',
  'reason_for_exit',
  'sub_reason_for_exit',
  'company',
  'business_unit',
  'department',
  'function',
  'sub_function',
  'sub_department',
  'company_position',
  'unique_job_role',
  'band',
  'grade',
  'zone',
  'cluster',
  'area',
  'location',
  'state',
  'physical_location',
  'cost_center',
  'fixed_ctc_pa',
  'variable_ctc_pa',
  'total_ctc_pa',
  'total_exp_yrs',
  'prev_exp_in_yrs',
  'last_promotion',
  'last_transfer',
  'learning_program',
  'training_hours',
  'satisfaction_score',
  'engagement_score',
  'rating_25',
  'rating_24',
  'qualification',
  'highest_qualification',
  'qualification_type',
  'previous_employers',
  'last_employer',
  'employment_sector',
  'notice_period_days',
  'disciplinary_action',
  'disability_status',
  'blood_group',
  'hiring_source_category',
  'hiring_source',
  'succession_ready',
  'pip_status',
  'skills_1',
  'skills_2',
  'skills_3',
  'competency',
  'competency_type',
  'competency_level',
  'appoinyment_letter',
  'bgv_status',
  'bgv_date',
  'system_type',
  'model',
  'induction',
  'goals_status_current_fy',
  'confirmation_status',
  'resignation_status',
  'exit_interview_status',
  'fnf_status',
  'clearance_status',
  'service_cert_sent',
  'top_talent',
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
  'employee_id',
  'employee_name',
  'date_of_joining',
  'gender',
  'employment_status',
  'department',
  'zone',
  'total_exp_yrs',
];

export const RECOMMENDED_COLUMNS_LIST = [
  'date_of_birth',
  'date_of_exit',
  'exit_type',
  'total_ctc_pa',
  'training_hours',
  'satisfaction_score',
  'hiring_source',
  'highest_qualification',
  'rating_25',
  'top_talent',
  'reason_for_exit',
  'skills_1',
  'skills_2',
  'skills_3',
  'competency',
];
