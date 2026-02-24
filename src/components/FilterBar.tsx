import { Calendar, Filter, X, SlidersHorizontal } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { FILTER_FIELDS } from '@/lib/types';
import MultiSelectFilter from './MultiSelectFilter';

function formatDateInput(d: Date): string {
  return d.toISOString().split('T')[0];
}

export default function FilterBar() {
  const {
    asOfDate, setAsOfDate, useToday, setUseToday,
    filters, setFilter, clearAllFilters, availableFilterValues, activeFilterCount,
    fyStart, fyEnd,
  } = useData();

  return (
    <div className="space-y-2">
      {/* Main Filter Row */}
      <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-card border border-border shadow-sm">
        <div className="flex items-center gap-1.5 text-muted-foreground mr-1">
          <SlidersHorizontal className="w-4 h-4" />
          <span className="text-xs font-semibold uppercase tracking-wide">Filters</span>
        </div>

        {FILTER_FIELDS.map(({ key, label }) => {
          const options = availableFilterValues[key];
          if (!options || options.length === 0) return null;
          return (
            <MultiSelectFilter
              key={key}
              label={label}
              options={options}
              selected={filters[key] ?? null}
              onChange={vals => setFilter(key, vals)}
            />
          );
        })}

        <div className="h-6 w-px bg-border mx-1" />

        {/* As of Date */}
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
          <select
            value={useToday ? 'today' : 'custom'}
            onChange={e => {
              if (e.target.value === 'today') setUseToday(true);
              else setUseToday(false);
            }}
            className="h-7 rounded-md border border-input bg-background px-2 text-xs text-foreground"
          >
            <option value="today">Today</option>
            <option value="custom">Custom Date</option>
          </select>
          {!useToday && (
            <input
              type="date"
              value={formatDateInput(asOfDate)}
              onChange={e => { if (e.target.value) setAsOfDate(new Date(e.target.value)); }}
              className="h-7 rounded-md border border-input bg-background px-2 text-xs text-foreground"
            />
          )}
        </div>
      </div>

      {/* Active Filter Chips + FY Info */}
      <div className="flex flex-wrap items-center gap-1.5 px-1">
        <span className="text-[10px] text-muted-foreground">
          FY: {fyStart.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })} – {fyEnd.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
        </span>

        {activeFilterCount > 0 && (
          <>
            <div className="h-3 w-px bg-border mx-1" />
            <Filter className="w-3 h-3 text-muted-foreground" />
            {FILTER_FIELDS.map(({ key, label }) => {
              const sel = filters[key];
              if (!sel || sel.length === 0) return null;
              const allVals = availableFilterValues[key] || [];
              if (!allVals.length || sel.length === allVals.length) return null;
              return (
                <span
                  key={key}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-medium"
                >
                  {label}: {sel.length <= 2 ? sel.join(', ') : `${sel.length} selected`}
                  <button onClick={() => setFilter(key, null)} className="hover:text-destructive">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              );
            })}
            <button
              onClick={clearAllFilters}
              className="text-[10px] text-destructive hover:underline ml-1"
            >
              Clear All
            </button>
          </>
        )}
      </div>
    </div>
  );
}
