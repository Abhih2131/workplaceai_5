import * as XLSX from 'xlsx';

// Template columns with example data
const TEMPLATE_COLUMNS = [
  'Employee_ID',
  'Employee_Name',
  'Date_of_Joining',
  'Date_of_Exit',
  'Date_of_Birth',
  'Gender',
  'Employment_Status',
  'Employment_Type',
  'Company',
  'Business_Unit',
  'Department',
  'Function',
  'Zone',
  'Area',
  'Location',
  'Band',
  'Grade',
  'Designation',
  'Unique_Job_Role',
  'Total_Exp_Yrs',
  'Prev_Exp_in_Yrs',
  'Total_CTC_PA',
  'Fixed_CTC_PA',
  'Variable_CTC_PA',
  'Hiring_Source',
  'Manager',
  'Training_Hours',
  'Satisfaction_Score',
  'Engagement_Score',
  'Rating_25',
  'Rating_24',
  'Top_Talent',
  'Exit_Type',
  'Reason_for_Exit',
  'Highest_Qualification',
  'Qualification',
  'Qualification_Type',
  'Skills_1',
  'Skills_2',
  'Skills_3',
  'Competency',
  'Competency_Type',
  'Competency_Level',
  'Last_Promotion',
  'Last_Transfer',
  'Last_Employer',
  'Previous_Employers',
  'Succession_Ready',
  'Learning_Program',
  'Cluster',
];

const EXAMPLE_ROW: Record<string, any> = {
  Employee_ID: 'EMP001',
  Employee_Name: 'John Doe',
  Date_of_Joining: '01-Apr-2020',
  Date_of_Exit: '',
  Date_of_Birth: '15-Jun-1985',
  Gender: 'Male',
  Employment_Status: 'Active',
  Employment_Type: 'Permanent',
  Company: 'ABC Corp',
  Business_Unit: 'Technology',
  Department: 'Engineering',
  Function: 'Product',
  Zone: 'North',
  Area: 'Delhi NCR',
  Location: 'New Delhi',
  Band: 'M1',
  Grade: 'Senior',
  Designation: 'Senior Engineer',
  Unique_Job_Role: 'Software Developer',
  Total_Exp_Yrs: 8,
  Prev_Exp_in_Yrs: 3,
  Total_CTC_PA: 1500000,
  Fixed_CTC_PA: 1200000,
  Variable_CTC_PA: 300000,
  Hiring_Source: 'LinkedIn',
  Manager: 'Jane Smith',
  Training_Hours: 40,
  Satisfaction_Score: 4,
  Engagement_Score: 85,
  Rating_25: 'Exceeds Expectations',
  Rating_24: 'Meets Expectations',
  Top_Talent: 'Yes',
  Exit_Type: '',
  Reason_for_Exit: '',
  Highest_Qualification: 'MBA',
  Qualification: 'MBA - Finance',
  Qualification_Type: 'Post Graduate',
  Skills_1: 'JavaScript',
  Skills_2: 'React',
  Skills_3: 'Node.js',
  Competency: 'Technical',
  Competency_Type: 'Core',
  Competency_Level: 'Expert',
  Last_Promotion: '01-Jan-2023',
  Last_Transfer: '',
  Last_Employer: 'XYZ Tech',
  Previous_Employers: 'XYZ Tech, ABC Inc',
  Succession_Ready: 'No',
  Learning_Program: 'Leadership Development',
  Cluster: 'Urban',
};

export function downloadTemplate(): void {
  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  
  // Create header row and example row
  const data = [TEMPLATE_COLUMNS, TEMPLATE_COLUMNS.map(col => EXAMPLE_ROW[col] ?? '')];
  
  const ws = XLSX.utils.aoa_to_sheet(data);
  
  // Set column widths
  ws['!cols'] = TEMPLATE_COLUMNS.map(() => ({ wch: 20 }));
  
  XLSX.utils.book_append_sheet(wb, ws, 'Master');
  
  // Download
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
