import { describe, it, expect } from 'vitest';
import { Employee } from '../lib/types';
import { computePeopleKPIs, computeJoinersKPIs, computeAttritionKPIs } from '../lib/kpiEngine';

// ─── Test data factory ──────────────────────────────────────────

function makeEmployee(overrides: Partial<Employee> = {}): Employee {
  return {
    employee_id: '1001',
    employee_name: 'Test User',
    date_of_joining: new Date(2022, 3, 1), // Apr 1 2022
    date_of_exit: null,
    date_of_birth: new Date(1990, 5, 15),
    last_promotion: null,
    last_transfer: null,
    total_exp_yrs: 5,
    prev_exp_in_yrs: 2,
    training_hours: 40,
    satisfaction_score: 4.0,
    engagement_score: 3.5,
    total_ctc_pa: 1000000,
    fixed_ctc_pa: 700000,
    variable_ctc_pa: 300000,
    gender: 'Male',
    hiring_source: 'LinkedIn',
    zone: 'North',
    cluster: 'A',
    location: 'Delhi',
    highest_qualification: 'MBA',
    qualification: 'MBA',
    qualification_type: 'Full-Time',
    employment_sector: 'IT',
    unique_job_role: 'Analyst',
    exit_type: null,
    rating_25: 'Good',
    rating_24: 'Good',
    top_talent: 'No',
    succession_ready: 'No',
    reason_for_exit: null,
    skills_1: 'Python',
    skills_2: 'SQL',
    skills_3: null,
    competency: 'Problem Solving',
    competency_type: 'Technical',
    competency_level: 'Advanced',
    learning_program: null,
    previous_employers: null,
    last_employer: null,
    grade: 'G3',
    company: 'TestCorp',
    employment_type: 'Full-Time',
    employment_status: 'Active',
    business_unit: 'Digital',
    area: 'Metro',
    function_name: 'Technology',
    department: 'Engineering',
    band: 'L3',
    ...overrides,
  };
}

// ─── FY boundaries for tests ────────────────────────────────────
// FY 2024-25: Apr 1 2024 – Mar 31 2025
const FY_START = new Date(2024, 3, 1);
const FY_END = new Date(2025, 2, 31);
const AS_OF = new Date(2025, 0, 15); // Jan 15 2025

describe('computePeopleKPIs', () => {
  it('counts active employees correctly (no exit = active)', () => {
    const emps = [makeEmployee(), makeEmployee({ employee_id: '1002' })];
    const kpis = computePeopleKPIs(emps, AS_OF, FY_START, FY_END);
    expect(kpis.totalEmployees).toBe(2);
  });

  it('excludes employees who exited before asOfDate', () => {
    const emps = [
      makeEmployee(),
      makeEmployee({ employee_id: '1002', date_of_exit: new Date(2024, 6, 1) }), // exited Jul 2024
    ];
    const kpis = computePeopleKPIs(emps, AS_OF, FY_START, FY_END);
    expect(kpis.totalEmployees).toBe(1);
  });

  it('counts new hires within FY boundaries', () => {
    const emps = [
      makeEmployee({ date_of_joining: new Date(2024, 5, 1) }), // Jun 2024 – in FY
      makeEmployee({ employee_id: '1002', date_of_joining: new Date(2023, 11, 1) }), // Dec 2023 – outside FY
    ];
    const kpis = computePeopleKPIs(emps, AS_OF, FY_START, FY_END);
    expect(kpis.newHires).toBe(1);
  });

  it('counts exits within FY boundaries', () => {
    const emps = [
      makeEmployee({ date_of_exit: new Date(2024, 8, 1) }), // Sep 2024 – in FY
      makeEmployee({ employee_id: '1002', date_of_exit: new Date(2023, 11, 1) }), // Dec 2023 – outside FY
    ];
    const kpis = computePeopleKPIs(emps, AS_OF, FY_START, FY_END);
    expect(kpis.totalExits).toBe(1);
  });

  it('computes training hours as total by default', () => {
    const emps = [
      makeEmployee({ training_hours: 40 }),
      makeEmployee({ employee_id: '1002', training_hours: 60 }),
    ];
    const kpis = computePeopleKPIs(emps, AS_OF, FY_START, FY_END);
    expect(kpis.trainingHours).toBe(100);
  });

  it('handles empty dataset without errors', () => {
    const kpis = computePeopleKPIs([], AS_OF, FY_START, FY_END);
    expect(kpis.totalEmployees).toBe(0);
    expect(kpis.avgAge).toBe(0);
    expect(kpis.avgTenure).toBe(0);
    expect(kpis.trainingHours).toBe(0);
  });
});

describe('computeJoinersKPIs', () => {
  it('counts joiners within FY', () => {
    const emps = [
      makeEmployee({ date_of_joining: new Date(2024, 6, 1) }), // Jul 2024
      makeEmployee({ employee_id: '1002', date_of_joining: new Date(2023, 6, 1) }), // Jul 2023
    ];
    const kpis = computeJoinersKPIs(emps, AS_OF, FY_START, FY_END);
    expect(kpis.totalNewJoiners).toBe(1);
  });

  it('computes average CTC in lakhs', () => {
    const emps = [
      makeEmployee({ date_of_joining: new Date(2024, 6, 1), total_ctc_pa: 1000000 }),
      makeEmployee({ employee_id: '1002', date_of_joining: new Date(2024, 7, 1), total_ctc_pa: 2000000 }),
    ];
    const kpis = computeJoinersKPIs(emps, AS_OF, FY_START, FY_END);
    expect(kpis.avgCTC).toBe(15); // (10 + 20) / 2 = 15 lakhs
  });

  it('computes fresher percentage', () => {
    const emps = [
      makeEmployee({ date_of_joining: new Date(2024, 6, 1), total_exp_yrs: 0 }),
      makeEmployee({ employee_id: '1002', date_of_joining: new Date(2024, 7, 1), total_exp_yrs: 5 }),
    ];
    const kpis = computeJoinersKPIs(emps, AS_OF, FY_START, FY_END);
    expect(kpis.pctFreshers).toBe(50);
  });

  it('handles all-male joiners', () => {
    const emps = [
      makeEmployee({ date_of_joining: new Date(2024, 6, 1), gender: 'Male' }),
    ];
    const kpis = computeJoinersKPIs(emps, AS_OF, FY_START, FY_END);
    expect(kpis.maleToFemaleRatio).toBe('All Male');
  });
});

describe('computeAttritionKPIs', () => {
  it('computes attrition rate relative to avg headcount', () => {
    // 10 employees joined before FY, 2 exit during FY
    const emps: Employee[] = [];
    for (let i = 0; i < 10; i++) {
      emps.push(makeEmployee({
        employee_id: `${1000 + i}`,
        date_of_joining: new Date(2020, 0, 1),
        date_of_exit: i < 2 ? new Date(2024, 6, 1) : null,
        exit_type: i === 0 ? 'Regrettable' : 'Non-Regrettable',
      }));
    }
    const kpis = computeAttritionKPIs(emps, AS_OF, FY_START, FY_END);
    // Opening HC = 10 (all joined before, none exited before FY start)
    // Closing HC = 8 (2 exited during FY)
    // Avg HC = 9
    // Total attrition = 2/9 * 100 ≈ 22.2%
    expect(kpis.totalAttritionPct).toBeCloseTo(22.2, 0);
    expect(kpis.regrettableAttritionPct).toBeGreaterThan(0);
  });

  it('handles zero exits gracefully', () => {
    const emps = [makeEmployee()];
    const kpis = computeAttritionKPIs(emps, AS_OF, FY_START, FY_END);
    expect(kpis.totalAttritionPct).toBe(0);
    expect(kpis.avgTenureExited).toBe(0);
    expect(kpis.topExitRegion).toBe('N/A');
  });

  it('counts high-performer and top-talent attrition', () => {
    const emps = [
      makeEmployee({
        date_of_exit: new Date(2024, 6, 1),
        exit_type: 'Regrettable',
        rating_25: 'Excellent',
        top_talent: 'Yes',
      }),
    ];
    const kpis = computeAttritionKPIs(emps, AS_OF, FY_START, FY_END);
    expect(kpis.highPerfAttritionPct).toBeGreaterThan(0);
    expect(kpis.topTalentAttritionPct).toBeGreaterThan(0);
  });
});
