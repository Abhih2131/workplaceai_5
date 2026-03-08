import { useState, useCallback } from 'react';
import { Employee, ChartSpec } from '@/lib/types';
import { computePeopleKPIs, computeJoinersKPIs, computeAttritionKPIs } from '@/lib/kpiEngine';
import { computePeopleCharts, computeJoinersCharts, computeAttritionCharts, computeOrganizationCharts, computeDemographicsCharts } from '@/lib/chartEngine';
import { formatNumber, formatYears, formatPercent, formatCurrency } from '@/lib/formatters';
import { exportDashboardToPPT } from '@/lib/exportUtils';

export function useDashboardExport() {
  const [exporting, setExporting] = useState(false);

  const exportDashboard = useCallback(async (
    employees: Employee[],
    asOfDate: Date,
    fyStart: Date,
    fyEnd: Date,
    appliedFilters: Record<string, string>,
    meta: { isDemo: boolean; fileName?: string }
  ) => {
    setExporting(true);
    try {
      // Compute all KPIs
      const peopleKpis = computePeopleKPIs(employees, asOfDate, fyStart, fyEnd);
      const joinersKpis = computeJoinersKPIs(employees, asOfDate, fyStart, fyEnd);
      const attritionKpis = computeAttritionKPIs(employees, asOfDate, fyStart, fyEnd);

      // Compute all charts
      const peopleCharts = computePeopleCharts(employees, asOfDate);
      const joinersCharts = computeJoinersCharts(employees, fyStart, fyEnd);
      const attritionCharts = computeAttritionCharts(employees, fyStart, fyEnd, asOfDate);
      const orgCharts = computeOrganizationCharts(employees, asOfDate);
      const demoCharts = computeDemographicsCharts(employees, asOfDate);

      const sections = [
        {
          sectionTitle: 'People Snapshot',
          kpis: [
            { label: 'Total Employees', value: formatNumber(peopleKpis.totalEmployees) },
            { label: 'New Hires (FY)', value: formatNumber(peopleKpis.newHires) },
            { label: 'Total Exits (FY)', value: formatNumber(peopleKpis.totalExits) },
            { label: 'Average Age', value: `${peopleKpis.avgAge} Yrs` },
            { label: 'Average Tenure', value: formatYears(peopleKpis.avgTenure) },
            { label: 'Average Experience', value: formatYears(peopleKpis.avgExperience) },
            { label: 'Training Hours', value: formatNumber(peopleKpis.trainingHours) },
            { label: 'Avg Satisfaction', value: String(peopleKpis.avgSatisfaction) },
          ],
          charts: peopleCharts,
        },
        {
          sectionTitle: 'Hiring Analytics',
          kpis: [
            { label: 'Total New Joiners', value: formatNumber(joinersKpis.totalNewJoiners) },
            { label: 'Avg Age', value: `${joinersKpis.avgAge} Yrs` },
            { label: 'Avg Experience', value: formatYears(joinersKpis.avgExperience) },
            { label: 'Avg CTC (Lakhs)', value: formatCurrency(joinersKpis.avgCTC) },
            { label: '% Freshers', value: formatPercent(joinersKpis.pctFreshers) },
            { label: 'M:F Ratio', value: joinersKpis.maleToFemaleRatio },
            { label: 'Top Hiring Source', value: joinersKpis.topHiringSource },
            { label: 'Top Hiring Zone', value: joinersKpis.topHiringZone },
          ],
          charts: joinersCharts,
        },
        {
          sectionTitle: 'Attrition Analytics',
          kpis: [
            { label: 'Total Attrition %', value: formatPercent(attritionKpis.totalAttritionPct) },
            { label: 'Regrettable %', value: formatPercent(attritionKpis.regrettableAttritionPct) },
            { label: 'Non-Regret %', value: formatPercent(attritionKpis.nonRegretAttritionPct) },
            { label: 'Retirement %', value: formatPercent(attritionKpis.retirementAttritionPct) },
            { label: 'Avg Tenure (Exited)', value: formatYears(attritionKpis.avgTenureExited) },
            { label: 'Top Exit Region', value: attritionKpis.topExitRegion },
            { label: 'High Perf Attrition %', value: formatPercent(attritionKpis.highPerfAttritionPct) },
            { label: 'Top Talent Attrition %', value: formatPercent(attritionKpis.topTalentAttritionPct) },
          ],
          charts: attritionCharts,
        },
        {
          sectionTitle: 'Organization',
          charts: orgCharts,
        },
        {
          sectionTitle: 'Demographics & Diversity',
          charts: demoCharts,
        },
      ];

      await exportDashboardToPPT(sections, appliedFilters, {
        employeeCount: employees.length,
        isDemo: meta.isDemo,
        fileName: meta.fileName,
        asOfDate,
        fyStart,
        fyEnd,
      });
    } catch (e) {
      console.error('Dashboard PPT export failed:', e);
    }
    setExporting(false);
  }, []);

  return { exporting, exportDashboard };
}
