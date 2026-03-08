import { useNavigate } from 'react-router-dom';
import { AlertTriangle, FileSpreadsheet, Loader2, Presentation } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useDashboardExport } from '@/hooks/useDashboardExport';
import { MASTER_FILE_NAME } from '@/lib/config';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import FilterBar from '@/components/FilterBar';
import PeopleSection from '@/components/dashboard/PeopleSection';
import JoinersSection from '@/components/dashboard/JoinersSection';
import AttritionSection from '@/components/dashboard/AttritionSection';
import OrganizationSection from '@/components/dashboard/OrganizationSection';
import DemographicsSection from '@/components/dashboard/DemographicsSection';
import TalentProfileSection from '@/components/dashboard/TalentProfileSection';

export default function Dashboard() {
  const { employees, filteredEmployees, uploadResult, isDemo, isMasterFileMode, isLoading, loadError, asOfDate, fyStart, fyEnd, loadDemo, appliedFiltersSnapshot } = useData();
  const navigate = useNavigate();
  const { exporting, exportDashboard } = useDashboardExport();

  const handleExportDashboard = () => {
    exportDashboard(filteredEmployees, asOfDate, fyStart, fyEnd, appliedFiltersSnapshot, {
      isDemo,
      fileName: uploadResult?.fileName,
    });
  };

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
    <div className="min-h-[calc(100vh-64px)] p-4 md:p-6">
      <div className="container max-w-7xl space-y-5">
        {/* Master File Banner */}
        {isMasterFileMode && (
          <div className="flex items-center gap-3 rounded-xl bg-people-muted border border-people/20 px-5 py-3">
            <FileSpreadsheet className="w-5 h-5 text-people flex-shrink-0" />
            <p className="text-sm font-medium text-people">
              Master File Mode – {uploadResult?.fileName || MASTER_FILE_NAME}
            </p>
            <span className="ml-auto text-xs text-muted-foreground">
              {uploadResult?.rowCount?.toLocaleString()} rows · {uploadResult?.colCount} cols
            </span>
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-1">HR Analytics Dashboard</h1>
            <p className="text-muted-foreground text-sm">
              {isDemo ? 'Demo data' : uploadResult?.fileName} · {filteredEmployees.length.toLocaleString()} employees
              {filteredEmployees.length !== employees.length && (
                <span className="text-muted-foreground/60 ml-1">(of {employees.length.toLocaleString()})</span>
              )}
            </p>
          </div>
          <button
            onClick={handleExportDashboard}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 shrink-0"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Presentation className="w-4 h-4" />}
            {exporting ? 'Generating…' : 'Download Dashboard PPT'}
          </button>
        </div>

        {/* Filters */}
        <FilterBar />

        {/* Validation warnings */}
        {uploadResult?.validation?.missingColumns && uploadResult.validation.missingColumns.length > 0 && (
          <div className="rounded-xl bg-attrition-muted border border-attrition/20 px-5 py-3">
            <p className="text-sm font-semibold text-attrition mb-1">
              ⚠ Missing {uploadResult.validation.missingColumns.length} expected column(s)
            </p>
            <p className="text-xs text-muted-foreground">{uploadResult.validation.missingColumns.join(', ')}</p>
          </div>
        )}

        {/* Tab-based Reports */}
        <Tabs defaultValue="people" className="w-full">
          <div className="sticky top-16 z-10 bg-background pb-2">
            <TabsList className="w-full justify-start bg-card border border-border rounded-xl h-11 p-1 overflow-x-auto">
              <TabsTrigger value="people" className="rounded-lg text-xs font-medium">People Snapshot</TabsTrigger>
              <TabsTrigger value="hiring" className="rounded-lg text-xs font-medium">Hiring</TabsTrigger>
              <TabsTrigger value="attrition" className="rounded-lg text-xs font-medium">Attrition</TabsTrigger>
              <TabsTrigger value="organization" className="rounded-lg text-xs font-medium">Organization</TabsTrigger>
              <TabsTrigger value="demographics" className="rounded-lg text-xs font-medium">Demographics</TabsTrigger>
              <TabsTrigger value="talent" className="rounded-lg text-xs font-medium">Talent Profile</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="people" className="mt-4">
            <PeopleSection employees={filteredEmployees} asOfDate={asOfDate} fyStart={fyStart} fyEnd={fyEnd} />
          </TabsContent>
          <TabsContent value="hiring" className="mt-4">
            <JoinersSection employees={filteredEmployees} asOfDate={asOfDate} fyStart={fyStart} fyEnd={fyEnd} />
          </TabsContent>
          <TabsContent value="attrition" className="mt-4">
            <AttritionSection employees={filteredEmployees} asOfDate={asOfDate} fyStart={fyStart} fyEnd={fyEnd} />
          </TabsContent>
          <TabsContent value="organization" className="mt-4">
            <OrganizationSection employees={filteredEmployees} asOfDate={asOfDate} />
          </TabsContent>
          <TabsContent value="demographics" className="mt-4">
            <DemographicsSection employees={filteredEmployees} asOfDate={asOfDate} />
          </TabsContent>
          <TabsContent value="talent" className="mt-4">
            <TalentProfileSection employees={filteredEmployees} asOfDate={asOfDate} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
