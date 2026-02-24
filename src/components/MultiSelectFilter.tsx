import { useState, useMemo } from 'react';
import { ChevronsUpDown, Search, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';

interface Props {
  label: string;
  options: string[];
  selected: string[] | null; // null = all selected
  onChange: (values: string[] | null) => void;
}

export default function MultiSelectFilter({ label, options, selected, onChange }: Props) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  const allSelected = selected === null;
  const selectedSet = useMemo(() => new Set(selected ?? options), [selected, options]);

  const filteredOptions = useMemo(() => {
    if (!search) return options;
    const lower = search.toLowerCase();
    return options.filter(o => o.toLowerCase().includes(lower));
  }, [options, search]);

  const handleToggle = (value: string) => {
    if (allSelected) {
      onChange(options.filter(o => o !== value));
    } else {
      const newSet = new Set(selectedSet);
      if (newSet.has(value)) newSet.delete(value);
      else newSet.add(value);
      if (newSet.size === options.length) onChange(null);
      else onChange(Array.from(newSet));
    }
  };

  const selectAll = () => onChange(null);
  const clearAll = () => onChange([]);

  const count = allSelected ? options.length : (selected?.length ?? 0);
  const isFiltered = !allSelected && count !== options.length;

  return (
    <Popover open={open} onOpenChange={(v) => { setOpen(v); if (!v) setSearch(''); }}>
      <PopoverTrigger asChild>
        <button
          className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border text-xs font-medium transition-colors
            ${isFiltered
              ? 'border-primary/40 bg-primary/5 text-primary'
              : 'border-input bg-card text-foreground hover:bg-secondary'
            }`}
        >
          <span className="truncate max-w-[100px]">{label}</span>
          {isFiltered && (
            <span className="flex items-center justify-center w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold">
              {count}
            </span>
          )}
          <ChevronsUpDown className="w-3 h-3 opacity-40 shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-60 p-0" align="start">
        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
          <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={`Search ${label.toLowerCase()}...`}
            className="flex-1 text-sm bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
            autoFocus
          />
          {search && (
            <button onClick={() => setSearch('')}>
              <X className="w-3 h-3 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>
        {/* Actions */}
        <div className="flex gap-3 px-3 py-1.5 border-b border-border bg-secondary/30">
          <button onClick={selectAll} className="text-xs font-medium text-primary hover:underline">Select All</button>
          <span className="text-border">|</span>
          <button onClick={clearAll} className="text-xs font-medium text-destructive hover:underline">Clear All</button>
          <span className="ml-auto text-[10px] text-muted-foreground">{count}/{options.length}</span>
        </div>
        {/* Options */}
        <div className="max-h-52 overflow-y-auto p-1">
          {filteredOptions.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No matches found</p>
          ) : (
            filteredOptions.map(opt => (
              <label
                key={opt}
                className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md hover:bg-secondary cursor-pointer text-sm"
              >
                <Checkbox
                  checked={selectedSet.has(opt)}
                  onCheckedChange={() => handleToggle(opt)}
                  className="h-3.5 w-3.5"
                />
                <span className="truncate text-foreground">{opt}</span>
              </label>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
