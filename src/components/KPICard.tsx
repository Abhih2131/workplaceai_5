import { ReactNode } from 'react';
import { SectionType } from '@/lib/types';

interface KPICardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  section: SectionType;
  delay?: number;
}

const sectionStyles: Record<SectionType, string> = {
  people: 'border-l-people/80',
  joiners: 'border-l-joiners/80',
  attrition: 'border-l-attrition/80',
  organization: 'border-l-primary/80',
  demographics: 'border-l-joiners/80',
  talent: 'border-l-primary/80',
};

const iconBg: Record<SectionType, string> = {
  people: 'bg-people/10 text-people',
  joiners: 'bg-joiners/10 text-joiners',
  attrition: 'bg-attrition/10 text-attrition',
  organization: 'bg-primary/10 text-primary',
  demographics: 'bg-joiners/10 text-joiners',
  talent: 'bg-primary/10 text-primary',
};

export default function KPICard({ label, value, icon, section, delay = 0 }: KPICardProps) {
  return (
    <div
      className={`relative group rounded-xl border bg-card p-5 shadow-sm transition-all duration-300 hover:shadow-md animate-fade-in overflow-hidden`}
      style={{ animationDelay: `${delay * 80}ms` }}
    >
      {/* Top accent line instead of left border for cleaner look */}
      <div className={`absolute top-0 left-0 w-full h-1 ${sectionStyles[section].replace('border-l-', 'bg-')}`} />
      
      <div className="flex items-start justify-between mt-1">
        <div className="flex-1 min-w-0 pr-3">
          <p className="text-sm font-medium text-muted-foreground mb-1.5 truncate" title={label}>{label}</p>
          <p className="text-2xl font-display font-bold text-foreground tracking-tight">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg[section]} transition-colors group-hover:scale-105`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
