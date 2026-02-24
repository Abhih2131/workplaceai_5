import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, FileSpreadsheet, Loader2 } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { MASTER_FILE_NAME } from '@/lib/config';
import DateControls from '@/components/DateControls';
import PeopleSection from '@/components/dashboard/PeopleSection';
import JoinersSection from '@/components/dashboard/JoinersSection';
import AttritionSection from '@/components/dashboard/AttritionSection';

export default function Dashboard() {
  const { employees, filteredEmployees, uploadResult, isDemo, isMasterFileMode, isLoading, loadError, asOfDate, fyStart, fyEnd, loadDemo } = useData();
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = useCallback(() => setRefreshKey(k => k + 1), []);

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-8">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-people animate-spin mx-auto mb-4" />
          <h2 className="text-lg font-display font-bold text-foreground mb-1">Loading Master File…</h2>
          <p className="text-sm text-muted-foreground">{MASTER_FILE_NAME}</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-attrition mx-auto mb-4" />
          <h2 className="text-xl font-display font-bold text-foreground mb-2">Master File Load Error</h2>
          <p className="text-muted-foreground mb-4">{loadError}</p>
          <button onClick={loadDemo} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            Load Demo Data Instead
          </button>
        </div>
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-attrition mx-auto mb-4" />
          <h2 className="text-xl font-display font-bold text-foreground mb-2">No Data Loaded</h2>
          <p className="text-muted-foreground mb-6">Upload an employee master Excel file or load demo data to view the dashboard.</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => navigate('/')} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
              Go to Upload
            </button>
            <button onClick={loadDemo} className="px-4 py-2 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-secondary transition-colors">
              Load Demo
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] p-6">
      <div className="container max-w-7xl space-y-10">
        {/* Master File Banner */}
        {isMasterFileMode && (
          <div className="flex items-center gap-3 rounded-xl bg-people-muted border border-people/20 px-5 py-3">
            <FileSpreadsheet className="w-5 h-5 text-people flex-shrink-0" />
            <p className="text-sm font-medium text-people">
              Master File Test Mode – using {uploadResult?.fileName || MASTER_FILE_NAME}
            </p>
            <span className="ml-auto text-xs text-muted-foreground">
              {uploadResult?.rowCount?.toLocaleString()} rows · {uploadResult?.colCount} cols · Sheet: {uploadResult?.sheetName}
            </span>
          </div>
        )}

        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-1">HR Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            {isDemo ? 'Viewing demo data' : `Viewing ${uploadResult?.fileName}`} · {filteredEmployees.length.toLocaleString()} employees
            {filteredEmployees.length !== employees.length && <span className="text-muted-foreground/70 ml-1">(filtered from {employees.length.toLocaleString()})</span>}
          </p>
        </div>

        {/* Validation warnings */}
        {uploadResult?.validation?.missingColumns && uploadResult.validation.missingColumns.length > 0 && (
          <div className="rounded-xl bg-attrition-muted border border-attrition/20 px-5 py-3">
            <p className="text-sm font-semibold text-attrition mb-1">
              ⚠ Missing {uploadResult.validation.missingColumns.length} expected column(s)
            </p>
            <p className="text-xs text-muted-foreground">
              {uploadResult.validation.missingColumns.join(', ')}
            </p>
          </div>
        )}

        <DateControls onRefresh={handleRefresh} />

        <PeopleSection key={`p-${refreshKey}`} employees={employees} asOfDate={asOfDate} fyStart={fyStart} fyEnd={fyEnd} />
        <JoinersSection key={`j-${refreshKey}`} employees={employees} asOfDate={asOfDate} fyStart={fyStart} fyEnd={fyEnd} />
        <AttritionSection key={`a-${refreshKey}`} employees={employees} asOfDate={asOfDate} fyStart={fyStart} fyEnd={fyEnd} />
      </div>
    </div>
  );
}
