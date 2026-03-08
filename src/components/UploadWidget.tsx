import { useCallback, useState } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, Download, Database, FileUp, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { parseExcelFile } from '@/lib/excelParser';
import { useData } from '@/contexts/DataContext';
import { useNavigate } from 'react-router-dom';
import { downloadTemplate, REQUIRED_COLUMNS_LIST, RECOMMENDED_COLUMNS_LIST } from '@/lib/templateGenerator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

type DataSource = 'upload' | 'demo';

export default function UploadWidget() {
  const { setData, loadDemo, uploadResult } = useData();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [dataSource, setDataSource] = useState<DataSource>('upload');

  const handleFile = useCallback(async (file: File) => {
    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
    ];
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext || '') && !validTypes.includes(file.type)) {
      setError('Invalid file format. Please upload an Excel (.xlsx, .xls) or CSV (.csv) file.');
      return;
    }

    // Validate file size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      setError('File too large. Maximum file size is 20MB.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await parseExcelFile(file);
      
      // Check if file is empty
      if (result.employees.length === 0) {
        setError('The uploaded file is empty. Please upload a file with employee data.');
        setLoading(false);
        return;
      }

      // Warn about missing critical columns
      const missingCritical = result.upload.validation.missingColumns.filter(
        col => REQUIRED_COLUMNS_LIST.map(c => c.toLowerCase().replace(/_/g, '')).includes(col.replace(/_/g, ''))
      );
      
      if (missingCritical.length > 3) {
        setError(`The uploaded file does not match the required Employee Master format. Missing columns: ${missingCritical.slice(0, 5).join(', ')}${missingCritical.length > 5 ? '...' : ''}`);
        setLoading(false);
        return;
      }

      setData(result.employees, result.upload);
    } catch (e: any) {
      console.error('File parse error:', e);
      if (e.message?.includes('password') || e.message?.includes('encrypted')) {
        setError('Cannot read password-protected files. Please remove protection and try again.');
      } else if (e.message?.includes('corrupt') || e.message?.includes('invalid')) {
        setError('The file appears to be corrupted. Please try re-saving it and uploading again.');
      } else {
        setError(e.message || 'Failed to parse file. Please check the file format and try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [setData]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleUseDemoData = useCallback(() => {
    loadDemo();
  }, [loadDemo]);

  if (uploadResult) {
    return (
      <div className="animate-fade-in">
        <div className="rounded-2xl bg-card border border-border p-8 shadow-sm max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-joiners-muted flex items-center justify-center">
              <CheckCircle className="w-7 h-7 text-joiners" />
            </div>
            <div>
              <h3 className="text-lg font-display font-bold text-card-foreground">Upload Successful</h3>
              <p className="text-sm text-muted-foreground">{uploadResult.timestamp.toLocaleString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="rounded-lg bg-secondary p-3">
              <p className="text-xs text-muted-foreground">File Name</p>
              <p className="font-semibold text-sm text-secondary-foreground truncate">{uploadResult.fileName}</p>
            </div>
            <div className="rounded-lg bg-secondary p-3">
              <p className="text-xs text-muted-foreground">Sheet</p>
              <p className="font-semibold text-sm text-secondary-foreground">{uploadResult.sheetName}</p>
            </div>
            <div className="rounded-lg bg-secondary p-3">
              <p className="text-xs text-muted-foreground">Rows</p>
              <p className="font-semibold text-sm text-secondary-foreground">{uploadResult.rowCount.toLocaleString()}</p>
            </div>
            <div className="rounded-lg bg-secondary p-3">
              <p className="text-xs text-muted-foreground">Columns</p>
              <p className="font-semibold text-sm text-secondary-foreground">{uploadResult.colCount}</p>
            </div>
          </div>

          {/* Validation Summary */}
          {uploadResult.validation.missingColumns.length > 0 && (
            <div className="rounded-lg bg-attrition-muted border border-attrition/20 p-3 mb-4">
              <p className="text-xs font-semibold text-attrition mb-1">Missing Columns ({uploadResult.validation.missingColumns.length})</p>
              <p className="text-xs text-muted-foreground">{uploadResult.validation.missingColumns.join(', ')}</p>
            </div>
          )}

          {uploadResult.validation.duplicateIds > 0 && (
            <div className="rounded-lg bg-attrition-muted border border-attrition/20 p-3 mb-4">
              <p className="text-xs font-semibold text-attrition">Duplicate IDs: {uploadResult.validation.duplicateIds}</p>
            </div>
          )}

          {Object.keys(uploadResult.validation.invalidDates).length > 0 && (
            <div className="rounded-lg bg-people-muted border border-people/20 p-3 mb-4">
              <p className="text-xs font-semibold text-people mb-1">Invalid Dates</p>
              {Object.entries(uploadResult.validation.invalidDates).map(([col, count]) => (
                <p key={col} className="text-xs text-muted-foreground">{col}: {count} invalid</p>
              ))}
            </div>
          )}

          <Button onClick={() => navigate('/dashboard')} className="w-full mt-2 bg-primary text-primary-foreground hover:bg-primary/90" size="lg">
            Open Dashboard →
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in space-y-6">
      {/* Data Source Toggle */}
      <div className="rounded-xl bg-card border border-border p-6">
        <h3 className="font-display font-semibold text-card-foreground mb-4">Select Data Source</h3>
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => setDataSource('upload')}
            className={`flex-1 flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
              dataSource === 'upload' 
                ? 'border-people bg-people-muted' 
                : 'border-border hover:border-people/50'
            }`}
          >
            <FileUp className={`w-5 h-5 ${dataSource === 'upload' ? 'text-people' : 'text-muted-foreground'}`} />
            <div className="text-left">
              <p className={`font-medium ${dataSource === 'upload' ? 'text-people' : 'text-card-foreground'}`}>
                Upload New Master File
              </p>
              <p className="text-xs text-muted-foreground">Upload your own Excel/CSV</p>
            </div>
          </button>
          <button
            onClick={() => setDataSource('demo')}
            className={`flex-1 flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
              dataSource === 'demo' 
                ? 'border-people bg-people-muted' 
                : 'border-border hover:border-people/50'
            }`}
          >
            <Database className={`w-5 h-5 ${dataSource === 'demo' ? 'text-people' : 'text-muted-foreground'}`} />
            <div className="text-left">
              <p className={`font-medium ${dataSource === 'demo' ? 'text-people' : 'text-card-foreground'}`}>
                Use Demo Data
              </p>
              <p className="text-xs text-muted-foreground">Try with sample dataset</p>
            </div>
          </button>
        </div>
      </div>

      {/* Upload Area or Demo Button */}
      {dataSource === 'upload' ? (
        <>
          {/* Upload Drop Zone */}
          <div
            className={`rounded-2xl border-2 border-dashed p-12 text-center transition-all duration-300 cursor-pointer ${
              dragOver ? 'border-people bg-people-muted scale-[1.02]' : 'border-border bg-card hover:border-people/50'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <input id="file-input" type="file" accept=".xlsx,.xls,.csv" onChange={onFileInput} className="hidden" />
            <div className="w-16 h-16 rounded-2xl bg-people-muted mx-auto mb-4 flex items-center justify-center">
              {loading ? (
                <div className="w-8 h-8 border-3 border-people border-t-transparent rounded-full animate-spin" />
              ) : (
                <Upload className="w-8 h-8 text-people" />
              )}
            </div>
            <h3 className="text-lg font-display font-bold text-card-foreground mb-2">
              {loading ? 'Processing...' : 'Upload Employee Master File'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Drag & drop your Excel file or click to browse
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <FileSpreadsheet className="w-4 h-4" />
              <span>.xlsx, .xls, .csv supported (max 20MB, up to 20,000 rows)</span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-destructive">Upload Error</p>
                <p className="text-sm text-destructive/80">{error}</p>
              </div>
            </div>
          )}

          {/* Template Download */}
          <div className="rounded-xl bg-card border border-border p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="font-display font-semibold text-card-foreground mb-1">Need a template?</h4>
                <p className="text-sm text-muted-foreground">
                  Download our template file with all required columns and an example row.
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={downloadTemplate}
                className="flex-shrink-0 border-people/30 text-people hover:bg-people-muted"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Template
              </Button>
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-2xl bg-card border border-border p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-people-muted mx-auto mb-4 flex items-center justify-center">
            <Database className="w-8 h-8 text-people" />
          </div>
          <h3 className="text-lg font-display font-bold text-card-foreground mb-2">
            Use Demo Data
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            Load 250 sample employee records to explore the dashboard features.
          </p>
          <Button 
            onClick={handleUseDemoData} 
            className="bg-people text-people-foreground hover:bg-people/90"
            size="lg"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Load Demo Data
          </Button>
        </div>
      )}
    </div>
  );
}
