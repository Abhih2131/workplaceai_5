import { Employee } from './types';

const FIRST_NAMES_M = ['Rahul', 'Amit', 'Suresh', 'Vikram', 'Arjun', 'Rohan', 'Sanjay', 'Deepak', 'Anil', 'Ravi', 'Karan', 'Nikhil', 'Manish', 'Rajesh', 'Prakash', 'Ajay', 'Vinod', 'Kunal', 'Sachin', 'Mohit'];
const FIRST_NAMES_F = ['Priya', 'Anita', 'Sneha', 'Pooja', 'Neha', 'Kavita', 'Sunita', 'Meera', 'Divya', 'Rina', 'Swati', 'Nisha', 'Lakshmi', 'Geeta', 'Komal'];
const LAST_NAMES = ['Sharma', 'Verma', 'Gupta', 'Singh', 'Kumar', 'Patel', 'Joshi', 'Reddy', 'Nair', 'Iyer', 'Mishra', 'Rao', 'Das', 'Mehta', 'Chauhan'];
const ZONES = ['North', 'South', 'East', 'West'];
const GENDERS = ['Male', 'Female'];
const SOURCES = ['LinkedIn', 'Naukri', 'Referral', 'Campus', 'Direct', 'Consultant'];
const QUALIFICATIONS = ['B.Tech', 'MBA', 'B.Com', 'M.Tech', 'BBA', 'MCA', 'B.Sc', 'M.Sc', 'CA', 'PhD'];
const SECTORS = ['IT', 'Finance', 'HR', 'Operations', 'Marketing', 'Sales', 'Engineering', 'Admin'];
const ROLES = ['Software Engineer', 'Analyst', 'Manager', 'Consultant', 'Designer', 'Data Scientist', 'Accountant', 'HR Executive', 'Sales Executive', 'Team Lead', 'QA Engineer', 'DevOps Engineer', 'Product Manager', 'Business Analyst', 'Support Engineer'];
const EXIT_TYPES = ['Regrettable', 'Non-Regrettable', 'Retirement'];
const RATINGS = ['Excellent', 'Good', 'Average', 'Below Average'];
const EXIT_REASONS = ['Better Opportunity', 'Personal Reasons', 'Relocation', 'Higher Studies', 'Health Issues', 'Retirement', 'Performance', 'Compensation'];
const SKILLS = ['Python', 'JavaScript', 'SQL', 'Excel', 'Tableau', 'React', 'Java', 'AWS', 'Communication', 'Leadership', 'Project Management', 'Data Analysis', 'Machine Learning', 'Salesforce', 'SAP'];
const COMPETENCIES = ['Problem Solving', 'Team Work', 'Communication', 'Leadership', 'Innovation', 'Customer Focus', 'Strategic Thinking', 'Adaptability'];

// New filter field values
const COMPANIES = ['TechCorp India', 'InfoVista Ltd', 'CloudNine Solutions', 'DataPrime Inc'];
const EMPLOYMENT_TYPES = ['Full-Time', 'Contract', 'Part-Time', 'Intern'];
const BUSINESS_UNITS = ['Digital Services', 'Consulting', 'Products', 'Managed Services'];
const AREAS = ['Metro', 'Tier-1', 'Tier-2', 'Remote'];
const FUNCTIONS = ['Technology', 'Business', 'Support', 'Strategy', 'Corporate'];
const DEPARTMENTS = ['Engineering', 'Finance', 'Human Resources', 'Marketing', 'Operations', 'Sales', 'Research', 'Legal'];
const BANDS = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6'];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min: number, max: number): number { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

export function generateDemoData(count: number = 250): Employee[] {
  const employees: Employee[] = [];

  for (let i = 0; i < count; i++) {
    const isFemale = Math.random() < 0.35;
    const gender = isFemale ? 'Female' : 'Male';
    const firstName = isFemale ? pick(FIRST_NAMES_F) : pick(FIRST_NAMES_M);
    const lastName = pick(LAST_NAMES);
    const name = `${firstName} ${lastName}`;

    const dob = randDate(new Date(1965, 0, 1), new Date(2002, 0, 1));
    const doj = randDate(new Date(2019, 0, 1), new Date(2025, 11, 31));
    const hasExited = Math.random() < 0.2;
    const doe = hasExited ? randDate(new Date(Math.max(doj.getTime() + 90 * 86400000, new Date(2021, 0, 1).getTime())), new Date(2025, 11, 31)) : null;

    const totalExp = Math.round((Math.random() * 20 + (hasExited ? 1 : 0)) * 10) / 10;
    const ctc = randInt(300000, 3500000);
    const training = randInt(0, 120);
    const satisfaction = Math.round((2 + Math.random() * 3) * 10) / 10;

    employees.push({
      employee_id: `EMP${String(i + 1).padStart(5, '0')}`,
      employee_name: name,
      date_of_birth: dob,
      date_of_joining: doj,
      date_of_exit: doe,
      gender,
      zone: pick(ZONES),
      hiring_source: pick(SOURCES),
      highest_qualification: pick(QUALIFICATIONS),
      employment_sector: pick(SECTORS),
      unique_job_role: pick(ROLES),
      total_exp_yrs: totalExp,
      total_ctc_pa: ctc,
      training_hours: training,
      satisfaction_score: satisfaction,
      exit_type: hasExited ? pick(EXIT_TYPES) : null,
      rating_25: pick(RATINGS),
      top_talent: Math.random() < 0.15 ? 'Yes' : 'No',
      reason_for_exit: hasExited ? pick(EXIT_REASONS) : null,
      skills_1: pick(SKILLS),
      skills_2: pick(SKILLS),
      skills_3: Math.random() < 0.7 ? pick(SKILLS) : null,
      competency: pick(COMPETENCIES),
      // New filter fields
      company: pick(COMPANIES),
      employment_type: pick(EMPLOYMENT_TYPES),
      employment_status: hasExited ? 'Inactive' : 'Active',
      business_unit: pick(BUSINESS_UNITS),
      area: pick(AREAS),
      function_name: pick(FUNCTIONS),
      department: pick(DEPARTMENTS),
      band: pick(BANDS),
    });
  }

  return employees;
}
