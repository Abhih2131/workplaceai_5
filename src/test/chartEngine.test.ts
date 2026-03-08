import { describe, it, expect } from 'vitest';
import { Employee } from '../lib/types';
import { computeAttritionCharts, computePeopleCharts } from '../lib/chartEngine';

function makeEmployee(overrides: Partial<Employee> = {}): Employee {
  return {
    employee_id: '1001',
    employee_name: 'Test',
    date_of_joining: new Date(2020, 3, 1),
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

describe('chartEngine', () => {
  describe('attritionTrendAll - FY boundary fix', () => {
    it('assigns exit in Jan 2025 to FY-2025 (FY starting Apr 2024)', () => {
      const emp = makeEmployee({
        date_of_exit: new Date(2025, 0, 15), // Jan 15 2025
        exit_type: 'Regrettable',
      });
      const asOf = new Date(2025, 0, 15);
      const fyStart = new Date(2024, 3, 1);
      const fyEnd = new Date(2025, 2, 31);
      const charts = computeAttritionCharts([emp], fyStart, fyEnd, asOf);
      const trendChart = charts[0]; // attritionTrendAll is first
      expect(trendChart.title).toBe('Attrition Trend');

      // Jan 2025 should be in FY-2025 (startYear=2024, label=FY-2025)
      const fy2025 = trendChart.data.find(d => d.name === 'FY-2025');
      expect(fy2025).toBeDefined();
      expect(fy2025!.value).toBe(1);
    });

    it('assigns exit in May 2024 to FY-2025 (FY starting Apr 2024)', () => {
      const emp = makeEmployee({
        date_of_exit: new Date(2024, 4, 10), // May 10 2024
        exit_type: 'Non-Regrettable',
      });
      const asOf = new Date(2025, 0, 15);
      const fyStart = new Date(2024, 3, 1);
      const fyEnd = new Date(2025, 2, 31);
      const charts = computeAttritionCharts([emp], fyStart, fyEnd, asOf);
      const trendChart = charts[0];
      const fy2025 = trendChart.data.find(d => d.name === 'FY-2025');
      expect(fy2025).toBeDefined();
      expect(fy2025!.value).toBe(1);
    });

    it('does NOT assign exit in Mar 2024 to FY-2025', () => {
      const emp = makeEmployee({
        date_of_exit: new Date(2024, 2, 15), // Mar 15 2024 → FY-2024
        exit_type: 'Retirement',
      });
      const asOf = new Date(2025, 0, 15);
      const fyStart = new Date(2024, 3, 1);
      const fyEnd = new Date(2025, 2, 31);
      const charts = computeAttritionCharts([emp], fyStart, fyEnd, asOf);
      const trendChart = charts[0];
      // Mar 2024 → FY startYear=2023 → label=FY-2024
      const fy2024 = trendChart.data.find(d => d.name === 'FY-2024');
      const fy2025 = trendChart.data.find(d => d.name === 'FY-2025');
      if (fy2024) expect(fy2024.value).toBe(1);
      if (fy2025) expect(fy2025!.value).toBe(0);
    });
  });

  describe('computePeopleCharts', () => {
    it('returns 6 chart specs', () => {
      const charts = computePeopleCharts([makeEmployee()], new Date(2025, 0, 15));
      expect(charts).toHaveLength(6);
    });

    it('handles empty dataset', () => {
      const charts = computePeopleCharts([], new Date(2025, 0, 15));
      expect(charts).toHaveLength(6);
      charts.forEach(c => {
        // All should produce valid specs even with no data
        expect(c.title).toBeTruthy();
        expect(Array.isArray(c.data)).toBe(true);
      });
    });
  });
});
