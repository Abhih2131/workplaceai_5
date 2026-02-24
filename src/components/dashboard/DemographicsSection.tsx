import { useMemo } from 'react';
import { Users } from 'lucide-react';
import { Employee } from '@/lib/types';
import { computeDemographicsCharts } from '@/lib/chartEngine';
import SmartChart from '@/components/SmartChart';

interface Props {
  employees: Employee[];
  asOfDate: Date;
}

export default function DemographicsSection({ employees, asOfDate }: Props) {
  const charts = useMemo(() => computeDemographicsCharts(employees, asOfDate), [employees, asOfDate]);

  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1.5 h-8 rounded-full bg-joiners" />
        <h2 className="text-2xl font-display font-bold text-foreground">Demographics & Diversity</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {charts.map(spec => <SmartChart key={spec.title} spec={spec} />)}
      </div>
    </section>
  );
}
