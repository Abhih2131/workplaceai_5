import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { Employee, UploadResult, FILTER_FIELDS } from '@/lib/types';
import { generateDemoData } from '@/lib/demoData';
import { MASTER_FILE_TEST_MODE } from '@/lib/config';
import { loadMasterFile } from '@/lib/masterFileLoader';
import { titleCase } from '@/lib/formatters';
import { getFiscalYear } from '@/lib/businessConfig';

interface DataContextType {
  employees: Employee[];
  filteredEmployees: Employee[];
  uploadResult: UploadResult | null;
  isDemo: boolean;
  isMasterFileMode: boolean;
  isLoading: boolean;
  loadError: string | null;
  setData: (employees: Employee[], upload: UploadResult) => void;
  loadDemo: () => void;
  asOfDate: Date;
  setAsOfDate: (d: Date) => void;
  useToday: boolean;
  setUseToday: (b: boolean) => void;
  fyStart: Date;
  fyEnd: Date;
  filters: Record<string, string[] | null>;
  setFilter: (key: string, values: string[] | null) => void;
  clearAllFilters: () => void;
  availableFilterValues: Record<string, string[]>;
  activeFilterCount: number;
  appliedFiltersSnapshot: Record<string, string>;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [isMasterFileMode, setIsMasterFileMode] = useState(MASTER_FILE_TEST_MODE);
  const [isLoading, setIsLoading] = useState(MASTER_FILE_TEST_MODE);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Date state
  const [useToday, setUseTodayState] = useState(true);
  const [asOfDate, setAsOfDateState] = useState(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d;
  });

  // Use centralised FY logic from businessConfig
  const { fyStart, fyEnd } = useMemo(() => getFiscalYear(asOfDate), [asOfDate]);

  const setUseToday = useCallback((val: boolean) => {
    setUseTodayState(val);
    if (val) { const d = new Date(); d.setHours(0, 0, 0, 0); setAsOfDateState(d); }
  }, []);

  const setAsOfDate = useCallback((d: Date) => {
    setUseTodayState(false);
    setAsOfDateState(d);
  }, []);

  // Multi-select filters: null = all selected
  const [filters, setFilters] = useState<Record<string, string[] | null>>({});

  const setFilter = useCallback((key: string, values: string[] | null) => {
    setFilters(prev => ({ ...prev, [key]: values }));
  }, []);

  const clearAllFilters = useCallback(() => setFilters({}), []);

  // Available filter values from data
  const availableFilterValues = useMemo(() => {
    const result: Record<string, string[]> = {};
    for (const { key, field } of FILTER_FIELDS) {
      const vals = new Set<string>();
      employees.forEach(e => {
        const v = e[field];
        if (v) vals.add(titleCase(String(v)));
      });
      const sorted = Array.from(vals).sort();
      if (sorted.length > 0) result[key] = sorted;
    }
    return result;
  }, [employees]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    for (const { key } of FILTER_FIELDS) {
      const sel = filters[key];
      if (sel !== null && sel !== undefined) {
        const all = availableFilterValues[key];
        if (all && sel.length !== all.length) count++;
      }
    }
    return count;
  }, [filters, availableFilterValues]);

  // Snapshot for exports
  const appliedFiltersSnapshot = useMemo(() => {
    const snap: Record<string, string> = {};
    for (const { key, label } of FILTER_FIELDS) {
      const sel = filters[key];
      if (sel !== null && sel !== undefined) {
        const all = availableFilterValues[key];
        if (all && sel.length !== all.length) {
          snap[label] = sel.length <= 3 ? sel.join(', ') : `${sel.length} of ${all.length}`;
        }
      }
    }
    return snap;
  }, [filters, availableFilterValues]);

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      for (const { key, field } of FILTER_FIELDS) {
        const sel = filters[key];
        if (!sel || sel.length === 0) {
          if (sel !== null && sel !== undefined && sel.length === 0) return false;
          continue;
        }
        const val = emp[field];
        const normalized = val ? titleCase(String(val)) : null;
        if (!normalized || !sel.includes(normalized)) return false;
      }
      return true;
    });
  }, [employees, filters]);

  // Auto-load master file
  useEffect(() => {
    if (!MASTER_FILE_TEST_MODE) return;
    let cancelled = false;
    (async () => {
      try {
        const result = await loadMasterFile();
        if (cancelled) return;
        setEmployees(result.employees);
        setUploadResult(result.upload);
        setIsDemo(false);
        setIsMasterFileMode(true);
      } catch (e: any) {
        if (cancelled) return;
        console.error('[MasterFile] Load failed:', e);
        setLoadError(e.message || 'Failed to load master file');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const setData = useCallback((emps: Employee[], upload: UploadResult) => {
    setEmployees(emps); setUploadResult(upload);
    setIsDemo(false); setIsMasterFileMode(false); setFilters({});
  }, []);

  const loadDemo = useCallback(() => {
    const demo = generateDemoData(250);
    setEmployees(demo);
    setUploadResult({
      fileName: 'demo_data.xlsx', sheetName: 'Master', rowCount: demo.length, colCount: 30,
      timestamp: new Date(),
      validation: { missingColumns: [], duplicateIds: 0, invalidDates: {}, invalidNumbers: {}, nullRates: {} },
      sheetNames: ['Master'],
    });
    setIsDemo(true); setIsMasterFileMode(false); setFilters({});
  }, []);

  return (
    <DataContext.Provider value={{
      employees, filteredEmployees, uploadResult, isDemo, isMasterFileMode, isLoading, loadError,
      setData, loadDemo,
      asOfDate, setAsOfDate, useToday, setUseToday,
      fyStart, fyEnd,
      filters, setFilter, clearAllFilters, availableFilterValues, activeFilterCount, appliedFiltersSnapshot,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be within DataProvider');
  return ctx;
}
