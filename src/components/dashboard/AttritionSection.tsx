import { useMemo } from 'react';
import { TrendingDown, AlertTriangle, ThumbsDown, Clock, MapPin, Award, Star, UserMinus } from 'lucide-react';
import { Employee, SectionType } from '@/lib/types';
import { computeAttritionKPIs } from '@/lib/kpiEngine';
import { computeAttritionCharts } from '@/lib/chartEngine';
import { formatPercent, formatYears } from '@/lib/formatters';
import KPICard from '@/components/KPICard';
import SmartChart from '@/components/SmartChart';

interface Props {
  employees: Employee[];
  asOfDate: Date;
  fyStart: Date;
  fyEnd: Date;
}

const section: SectionType = 'attrition';

export default function AttritionSection({ employees, asOfDate, fyStart, fyEnd }: Props) {
  const kpis = useMemo(() => computeAttritionKPIs(employees, asOfDate, fyStart, fyEnd), [employees, asOfDate, fyStart, fyEnd]);
  const charts = useMemo(() => computeAttritionCharts(employees, fyStart, fyEnd, asOfDate), [employees, fyStart, fyEnd, asOfDate]);

  const kpiCards = [
    { label: 'Total Attrition % (FY)', value: formatPercent(kpis.totalAttritionPct), icon: <TrendingDown className="w-5 h-5" /> },
    { label: 'Regrettable Attrition %', value: formatPercent(kpis.regrettableAttritionPct), icon: <AlertTriangle className="w-5 h-5" /> },
    { label: 'Non-Regret Attrition %', value: formatPercent(kpis.nonRegretAttritionPct), icon: <ThumbsDown className="w-5 h-5" /> },
    { label: 'Retirement Attrition %', value: formatPercent(kpis.retirementAttritionPct), icon: <UserMinus className="w-5 h-5" /> },
    { label: 'Avg Tenure of Exited', value: formatYears(kpis.avgTenureExited), icon: <Clock className="w-5 h-5" /> },
    { label: 'Top Exit Region', value: kpis.topExitRegion, icon: <MapPin className="w-5 h-5" /> },
    { label: 'High Perf. Attrition %', value: formatPercent(kpis.highPerfAttritionPct), icon: <Award className="w-5 h-5" /> },
    { label: 'Top Talent Attrition %', value: formatPercent(kpis.topTalentAttritionPct), icon: <Star className="w-5 h-5" /> },
  ];

  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1.5 h-8 rounded-full bg-attrition" />
        <h2 className="text-2xl font-display font-bold text-foreground">Attrition Snapshot</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {kpiCards.map((kpi, i) => (
          <KPICard key={kpi.label} {...kpi} section={section} delay={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {charts.map((spec) => (
          <SmartChart key={spec.title} spec={spec} />
        ))}
      </div>
    </section>
  );
}
