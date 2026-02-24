import { useData } from '@/contexts/DataContext';
import { Calendar, RefreshCw, Filter, MapPin, Briefcase, Star } from 'lucide-react';

function formatDateInput(d: Date): string {
  return d.toISOString().split('T')[0];
}

export default function DateControls({ onRefresh }: { onRefresh?: () => void }) {
  const { 
    asOfDate, fyStart, fyEnd, setAsOfDate, setFyStart, setFyEnd,
    departments, locations, ratings,
    selectedDepartment, selectedLocation, selectedRating,
    setDepartment, setLocation, setRating
  } = useData();

  return (
    <div className="flex flex-col gap-4">
      {/* Global Filters Row */}
      <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-card border border-border shadow-sm">
        <div className="flex items-center gap-2 text-muted-foreground mr-2">
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">Filters:</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Briefcase className="w-3.5 h-3.5 text-muted-foreground" />
          <select 
            value={selectedDepartment} 
            onChange={(e) => setDepartment(e.target.value)}
            className="h-8 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary min-w-[140px]"
          >
            {departments.map(d => <option key={d} value={d}>{d === 'All' ? 'All Departments' : d}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
          <select 
            value={selectedLocation} 
            onChange={(e) => setLocation(e.target.value)}
            className="h-8 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary min-w-[120px]"
          >
            {locations.map(l => <option key={l} value={l}>{l === 'All' ? 'All Zones' : l}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Star className="w-3.5 h-3.5 text-muted-foreground" />
          <select 
            value={selectedRating} 
            onChange={(e) => setRating(e.target.value)}
            className="h-8 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary min-w-[120px]"
          >
            {ratings.map(r => <option key={r} value={r}>{r === 'All' ? 'All Ratings' : r}</option>)}
          </select>
        </div>
      </div>

      {/* Date Controls Row */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl bg-card border border-border p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-muted-foreground" />
        <label className="text-xs font-medium text-muted-foreground">As of Date</label>
        <input
          type="date"
          value={formatDateInput(asOfDate)}
          onChange={(e) => setAsOfDate(new Date(e.target.value))}
          className="rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground"
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs font-medium text-muted-foreground">FY Start</label>
        <input
          type="date"
          value={formatDateInput(fyStart)}
          onChange={(e) => setFyStart(new Date(e.target.value))}
          className="rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground"
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs font-medium text-muted-foreground">FY End</label>
        <input
          type="date"
          value={formatDateInput(fyEnd)}
          onChange={(e) => setFyEnd(new Date(e.target.value))}
          className="rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground"
        />
      </div>
      {onRefresh && (
        <button onClick={onRefresh} className="ml-auto flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          <RefreshCw className="w-4 h-4" />
          Recompute
        </button>
      )}
      </div>
    </div>
  );
}
