import { useMemo, useRef, useState } from 'react';
import {
  ResponsiveContainer, LineChart, BarChart, PieChart,
  Line, Bar, Pie, Cell, LabelList,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import { Download, FileSpreadsheet, FileText, FileImage, Loader2 } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { ChartSpec } from '@/lib/types';
import { exportToExcel, exportToPDF, exportToPPT } from '@/lib/exportUtils';

const COLORS = [
  'hsl(190, 80%, 42%)', 'hsl(152, 70%, 40%)', 'hsl(25, 95%, 53%)',
  'hsl(280, 65%, 55%)', 'hsl(340, 75%, 55%)', 'hsl(45, 90%, 50%)',
  'hsl(200, 70%, 55%)', 'hsl(120, 50%, 45%)', 'hsl(0, 70%, 55%)',
  'hsl(60, 70%, 45%)',
];

function truncateLabel(str: string, max: number = 14): string {
  if (!str) return '';
  return str.length > max ? str.substring(0, max - 1) + '…' : str;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-lg">
      <p className="text-xs font-medium text-popover-foreground mb-1">{label || payload[0]?.name}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-xs text-muted-foreground">
          {p.name || 'Value'}: <span className="font-semibold text-popover-foreground">{p.value?.toLocaleString()}</span>
        </p>
      ))}
    </div>
  );
};

function WordCloud({ data }: { data: { name: string; value: number }[] }) {
  const maxVal = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex flex-wrap gap-2 justify-center items-center p-4 min-h-[250px]">
      {data.map((item, i) => {
        const size = 0.7 + (item.value / maxVal) * 1.3;
        return (
          <span
            key={i}
            className="inline-block px-2 py-1 rounded-md font-medium transition-transform hover:scale-110 cursor-default"
            style={{ fontSize: `${size}rem`, color: COLORS[i % COLORS.length], opacity: 0.7 + (item.value / maxVal) * 0.3 }}
            title={`${item.name}: ${item.value}`}
          >
            {item.name}
          </span>
        );
      })}
    </div>
  );
}

const renderPieLabel = ({ name, percent, cx, x }: any) => {
  const pct = (percent * 100).toFixed(0);
  const displayName = truncateLabel(name, 12);
  const anchor = x > cx ? 'start' : 'end';
  return `${displayName} ${pct}%`;
};

export default function SmartChart({ spec }: { spec: ChartSpec }) {
  const { type, data, yLabel } = spec;
  const chartRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const handleExport = async (format: 'excel' | 'pdf' | 'ppt') => {
    setExporting(true);
    try {
      if (format === 'excel') await exportToExcel(spec.title, data);
      else if (format === 'pdf') await exportToPDF(spec.title, data, chartRef.current);
      else await exportToPPT(spec.title, data, chartRef.current);
    } catch (e) { console.error('Export failed:', e); }
    setExporting(false);
  };

  const content = useMemo(() => {
    if (!data || data.length === 0) {
      return <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">No data available</div>;
    }

    const needsRotation = type === 'bar' && data.length > 5;

    switch (type) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data} margin={{ top: 20, right: 20, bottom: 5, left: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 90%)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} label={yLabel ? { value: yLabel, angle: -90, position: 'insideLeft', style: { fontSize: 11 } } : undefined} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line type="monotone" dataKey="value" stroke={COLORS[0]} strokeWidth={3} dot={{ r: 5, fill: COLORS[0] }} name={yLabel || 'Value'}>
                <LabelList dataKey="value" position="top" fontSize={10} fill="hsl(220, 25%, 30%)" formatter={(v: number) => v.toLocaleString()} />
              </Line>
            </LineChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 20, right: 10, bottom: needsRotation ? 50 : 10, left: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 90%)" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10 }}
                angle={needsRotation ? -35 : 0}
                textAnchor={needsRotation ? 'end' : 'middle'}
                height={needsRotation ? 70 : 40}
                tickFormatter={(v) => truncateLabel(v, 16)}
              />
              <YAxis tick={{ fontSize: 11 }} label={yLabel ? { value: yLabel, angle: -90, position: 'insideLeft', style: { fontSize: 11 } } : undefined} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} name={yLabel || 'Count'}>
                <LabelList dataKey="value" position="top" fontSize={10} fill="hsl(220, 25%, 30%)" formatter={(v: number) => v.toLocaleString()} />
                {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );

      case 'donut':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={95}
                dataKey="value" paddingAngle={2}
                label={renderPieLabel} labelLine
              >
                {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend formatter={(value) => truncateLabel(value, 18)} />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data} cx="50%" cy="50%" outerRadius={95}
                dataKey="value" label={renderPieLabel} labelLine
              >
                {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend formatter={(value) => truncateLabel(value, 18)} />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'wordcloud':
        return <WordCloud data={data} />;

      default:
        return null;
    }
  }, [type, data, yLabel]);

  return (
    <div className="rounded-xl bg-card border border-border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <h3 className="text-sm font-semibold text-card-foreground font-display truncate pr-2">{spec.title}</h3>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center justify-center w-7 h-7 rounded-md hover:bg-secondary transition-colors shrink-0"
              disabled={exporting}
            >
              {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" /> : <Download className="w-3.5 h-3.5 text-muted-foreground" />}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={() => handleExport('excel')} className="text-xs gap-2">
              <FileSpreadsheet className="w-3.5 h-3.5" /> Export to Excel
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('pdf')} className="text-xs gap-2">
              <FileText className="w-3.5 h-3.5" /> Export to PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('ppt')} className="text-xs gap-2">
              <FileImage className="w-3.5 h-3.5" /> Export to PPT
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {/* Chart */}
      <div ref={chartRef} className="px-3 pb-4">
        {content}
      </div>
    </div>
  );
}
