import { BarChart3, Database, MessageSquare, Shield, FileCheck } from 'lucide-react';
import UploadWidget from '@/components/UploadWidget';
import { useData } from '@/contexts/DataContext';
import { REQUIRED_COLUMNS_LIST, RECOMMENDED_COLUMNS_LIST } from '@/lib/templateGenerator';

const Index = () => {
  const { employees } = useData();

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col">
      {/* Hero */}
      <div className="bg-primary py-16 px-4">
        <div className="container max-w-3xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-people mx-auto mb-6 flex items-center justify-center">
            <BarChart3 className="w-9 h-9 text-people-foreground" />
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-primary-foreground mb-4">
            WorkplaceAI
          </h1>
          <p className="text-lg text-primary-foreground/70 mb-2">
            HR Data Copilot — Upload your employee master file and get instant KPIs, charts, and AI-powered analytics.
          </p>
        </div>
      </div>

      {/* Upload Section */}
      <div className="flex-1 py-12 px-4">
        <div className="container max-w-3xl">
          <UploadWidget />

          {/* Features & Info - Only show when no data loaded */}
          {employees.length === 0 && (
            <>
              {/* Features */}
              <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { icon: FileCheck, title: 'Smart Parsing', desc: 'Auto-detect columns, validate data, handle up to 20K rows seamlessly.' },
                  { icon: BarChart3, title: '24 KPIs + 20 Charts', desc: 'People, Joiners, and Attrition snapshots with production-grade accuracy.' },
                  { icon: MessageSquare, title: 'Data Chatbot', desc: 'Ask questions about your HR data in natural language.' },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="rounded-xl bg-card border border-border p-6 text-center">
                    <div className="w-10 h-10 rounded-lg bg-people-muted mx-auto mb-3 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-people" />
                    </div>
                    <h3 className="font-display font-semibold text-card-foreground mb-1">{title}</h3>
                    <p className="text-sm text-muted-foreground">{desc}</p>
                  </div>
                ))}
              </div>

              {/* Required Columns Info */}
              <div className="mt-12 rounded-xl bg-card border border-border p-6">
                <h3 className="font-display font-semibold text-card-foreground mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-people" />
                  Expected File Structure
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Your Excel file should contain the following columns. The dashboard gracefully handles missing optional columns.
                </p>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-card-foreground mb-2 uppercase tracking-wide">Required Columns</p>
                    <div className="flex flex-wrap gap-2">
                      {REQUIRED_COLUMNS_LIST.map(col => (
                        <span key={col} className="inline-block px-2 py-1 rounded-md bg-people-muted text-xs font-mono text-people">{col}</span>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-xs font-semibold text-card-foreground mb-2 uppercase tracking-wide">Recommended Columns</p>
                    <div className="flex flex-wrap gap-2">
                      {RECOMMENDED_COLUMNS_LIST.map(col => (
                        <span key={col} className="inline-block px-2 py-1 rounded-md bg-secondary text-xs font-mono text-secondary-foreground">{col}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Note */}
              <div className="mt-6 rounded-xl bg-secondary/50 border border-border p-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-card-foreground">Your data is secure</p>
                    <p className="text-xs text-muted-foreground">
                      Uploaded files are processed in your browser and not stored on our servers. Data is only kept in memory for your session.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
