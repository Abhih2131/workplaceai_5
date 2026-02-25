export interface Employee {
  // Dates
  date_of_joining: Date | null;
  date_of_exit: Date | null;
  date_of_birth: Date | null;
  last_promotion: Date | null;
  last_transfer: Date | null;
  // Numbers
  total_exp_yrs: number | null;
  prev_exp_in_yrs: number | null;
  training_hours: number | null;
  satisfaction_score: number | null;
  engagement_score: number | null;
  total_ctc_pa: number | null;
  fixed_ctc_pa: number | null;
  variable_ctc_pa: number | null;
  // Categorical - core
  gender: string | null;
  hiring_source: string | null;
  zone: string | null;
  cluster: string | null;
  location: string | null;
  highest_qualification: string | null;
  qualification: string | null;
  qualification_type: string | null;
  employment_sector: string | null;
  unique_job_role: string | null;
  exit_type: string | null;
  rating_25: string | null;
  rating_24: string | null;
  top_talent: string | null;
  succession_ready: string | null;
  reason_for_exit: string | null;
  skills_1: string | null;
  skills_2: string | null;
  skills_3: string | null;
  competency: string | null;
  competency_type: string | null;
  competency_level: string | null;
  learning_program: string | null;
  previous_employers: string | null;
  last_employer: string | null;
  employee_name: string | null;
  employee_id: string | null;
  grade: string | null;
  // Filter fields
  company: string | null;
  employment_type: string | null;
  employment_status: string | null;
  business_unit: string | null;
  area: string | null;
  function_name: string | null;
  department: string | null;
  band: string | null;
  // Dynamic extra fields
  [key: string]: any;
}

export interface FilterConfig {
  key: string;
  label: string;
  field: string;
}

export const FILTER_FIELDS: FilterConfig[] = [
  { key: 'company', label: 'Company', field: 'company' },
  { key: 'employmentType', label: 'Employment Type', field: 'employment_type' },
  { key: 'businessUnit', label: 'Business Unit', field: 'business_unit' },
  { key: 'zone', label: 'Zone', field: 'zone' },
  { key: 'area', label: 'Area', field: 'area' },
  { key: 'function', label: 'Function', field: 'function_name' },
  { key: 'department', label: 'Department', field: 'department' },
  { key: 'band', label: 'Band', field: 'band' },
];

export interface PeopleKPIs {
  totalEmployees: number;
  newHires: number;
  totalExits: number;
  avgAge: number;
  avgTenure: number;
  avgExperience: number;
  trainingHours: number;
  avgSatisfaction: number;
}

export interface JoinersKPIs {
  totalNewJoiners: number;
  avgAge: number;
  avgExperience: number;
  avgCTC: number;
  pctFreshers: number;
  maleToFemaleRatio: string;
  topHiringSource: string;
  topHiringZone: string;
}

export interface AttritionKPIs {
  totalAttritionPct: number;
  regrettableAttritionPct: number;
  nonRegretAttritionPct: number;
  retirementAttritionPct: number;
  avgTenureExited: number;
  topExitRegion: string;
  highPerfAttritionPct: number;
  topTalentAttritionPct: number;
}

export interface ValidationResult {
  missingColumns: string[];
  duplicateIds: number;
  invalidDates: Record<string, number>;
  invalidNumbers: Record<string, number>;
  nullRates: Record<string, number>;
}

export interface UploadResult {
  fileName: string;
  sheetName: string;
  rowCount: number;
  colCount: number;
  timestamp: Date;
  validation: ValidationResult;
  sheetNames: string[];
}

export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: any;
}

export interface ChartSpec {
  title: string;
  type: 'line' | 'bar' | 'donut' | 'pie' | 'wordcloud';
  data: ChartDataPoint[];
  yLabel?: string;
}

export type SectionType = 'people' | 'joiners' | 'attrition' | 'organization' | 'demographics' | 'talent';
