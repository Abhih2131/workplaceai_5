import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { Employee, UploadResult } from '@/lib/types';
import { generateDemoData } from '@/lib/demoData';
import { MASTER_FILE_TEST_MODE } from '@/lib/config';
import { loadMasterFile } from '@/lib/masterFileLoader';

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
  fyStart: Date;
  fyEnd: Date;
  setAsOfDate: (d: Date) => void;
  setFyStart: (d: Date) => void;
  setFyEnd: (d: Date) => void;
  
  // Filters
  departments: string[];
  locations: string[];
  ratings: string[];
  selectedDepartment: string;
  selectedLocation: string;
  selectedRating: string;
  setDepartment: (d: string) => void;
  setLocation: (l: string) => void;
  setRating: (r: string) => void;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [isMasterFileMode, setIsMasterFileMode] = useState(MASTER_FILE_TEST_MODE);
  const [isLoading, setIsLoading] = useState(MASTER_FILE_TEST_MODE);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [asOfDate, setAsOfDate] = useState(new Date(2025, 3, 30));
  const [fyStart, setFyStart] = useState(new Date(2025, 3, 1));
  const [fyEnd, setFyEnd] = useState(new Date(2026, 2, 31));

  // Filter states
  const [selectedDepartment, setDepartment] = useState('All');
  const [selectedLocation, setLocation] = useState('All');
  const [selectedRating, setRating] = useState('All');

  // Derived lists for dropdowns
  const departments = useMemo(() => {
    const depts = new Set(employees.map(e => e.employment_sector).filter(Boolean) as string[]);
    return ['All', ...Array.from(depts).sort()];
  }, [employees]);

  const locations = useMemo(() => {
    const locs = new Set(employees.map(e => e.zone).filter(Boolean) as string[]);
    return ['All', ...Array.from(locs).sort()];
  }, [employees]);

  const ratings = useMemo(() => {
    const rates = new Set(employees.map(e => e.rating_25).filter(Boolean) as string[]);
    return ['All', ...Array.from(rates).sort()];
  }, [employees]);

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return employees.filter(e => {
      if (selectedDepartment !== 'All' && e.employment_sector !== selectedDepartment) return false;
      if (selectedLocation !== 'All' && e.zone !== selectedLocation) return false;
      if (selectedRating !== 'All' && e.rating_25 !== selectedRating) return false;
      return true;
    });
  }, [employees, selectedDepartment, selectedLocation, selectedRating]);

  // Auto-load master file in test mode
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
    setEmployees(emps);
    setUploadResult(upload);
    setIsDemo(false);
    setIsMasterFileMode(false);
  }, []);

  const loadDemo = useCallback(() => {
    const demo = generateDemoData(250);
    setEmployees(demo);
    setUploadResult({
      fileName: 'demo_data.xlsx',
      sheetName: 'Master',
      rowCount: demo.length,
      colCount: 22,
      timestamp: new Date(),
      validation: { missingColumns: [], duplicateIds: 0, invalidDates: {}, invalidNumbers: {}, nullRates: {} },
      sheetNames: ['Master'],
    });
    setIsDemo(true);
    setIsMasterFileMode(false);
  }, []);

  return (
    <DataContext.Provider value={{
      employees, uploadResult, isDemo, isMasterFileMode, isLoading, loadError,
      setData, loadDemo,
      asOfDate, fyStart, fyEnd,
      setAsOfDate, setFyStart, setFyEnd,
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
