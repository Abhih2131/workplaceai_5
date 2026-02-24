import { useMemo } from 'react';
import { Building2 } from 'lucide-react';
import { Employee } from '@/lib/types';
import { computeOrganizationCharts } from '@/lib/chartEngine';
import SmartChart from '@/components/SmartChart';

interface Props {
  employees: Employee[];
  asOfDate: Date;
}

export default function OrganizationSection({ employees, asOfDate }: Props) {
  const charts = useMemo(() => computeOrganizationCharts(employees, asOfDate), [employees, asOfDate]);

  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1.5 h-8 rounded-full bg-primary" />
        <h2 className="text-2xl font-display font-bold text-foreground">Organization Structure</h2>
      </div>
      {charts.every(c => c.data.length === 0 || (c.data.length === 1 && c.data[0].name === 'Unknown')) ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <Building2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Organization data not available in master file. Add columns like Department, Band, Company, Function, or Business Unit.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {charts.map(spec => <SmartChart key={spec.title} spec={spec} />)}
        </div>
      )}
    </section>
  );
}
