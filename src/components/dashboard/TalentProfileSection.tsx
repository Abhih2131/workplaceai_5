import { useState, useMemo, useRef, useCallback } from 'react';
import { Search, Download, User, Building2, Calendar, Briefcase, IndianRupee, Star, BookOpen, GraduationCap } from 'lucide-react';
import { Employee } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface Props {
  employees: Employee[];
  asOfDate: Date;
}

function formatINR(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return '-';
  return `₹ ${(val / 100000).toFixed(2)} Lakhs`;
}

function formatProfileDate(val: Date | null | undefined): string {
  if (!val || isNaN(val.getTime())) return '-';
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${String(val.getDate()).padStart(2,'0')}-${months[val.getMonth()]}-${val.getFullYear()}`;
}

function computeAge(dob: Date | null, today: Date): string {
  if (!dob) return '-';
  const age = Math.floor((today.getTime() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  return `${age} yrs`;
}

function computeTenure(doj: Date | null, today: Date): string {
  if (!doj) return '-';
  const totalDays = Math.floor((today.getTime() - doj.getTime()) / (24 * 60 * 60 * 1000));
  const years = Math.floor(totalDays / 365);
  const months = Math.floor((totalDays % 365) / 30);
  return years > 0 ? `${years} yrs ${months} months` : `${months} months`;
}

function getMergedSkills(emp: Employee): string {
  const parts = [emp.skills_1, emp.skills_2, emp.skills_3].filter(s => s && s.trim());
  return parts.length > 0 ? parts.join(', ') : '-';
}

function getMergedCompetency(emp: Employee): string {
  const parts = [emp.competency_type, emp.competency_level].filter(s => s && s.trim());
  return parts.length > 0 ? parts.join(' - ') : '-';
}

interface FieldRow {
  label: string;
  value: string;
}

function ProfileSection({ title, icon, fields }: { title: string; icon: React.ReactNode; fields: FieldRow[] }) {
  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3 pt-4 px-5">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-4 space-y-0">
        {fields.map((f, i) => (
          <div key={f.label} className={`flex justify-between py-2 text-sm ${i < fields.length - 1 ? 'border-b border-border/30' : ''}`}>
            <span className="text-muted-foreground font-medium">{f.label}</span>
            <span className="text-foreground text-right max-w-[60%] break-words">{f.value || '-'}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function TalentProfileSection({ employees, asOfDate }: Props) {
  const [searchId, setSearchId] = useState('');
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [error, setError] = useState('');
  const profileRef = useRef<HTMLDivElement>(null);

  // Python: df_active = df[df["date_of_exit"].isna() | (df["date_of_exit"] > today)]
  const activeEmployees = useMemo(() =>
    employees.filter(e => !e.date_of_exit || e.date_of_exit > asOfDate),
    [employees, asOfDate]
  );

  const handleSearch = useCallback(() => {
    setError('');
    setSelectedEmp(null);
    const trimmed = searchId.trim();
    if (!trimmed) { setError('Please enter an Employee ID.'); return; }

    // Python: emp_id = int(emp_id)
    const numId = Number(trimmed);
    if (isNaN(numId)) { setError('Employee ID must be numeric.'); return; }

    const found = activeEmployees.find(e => {
      const eid = e.employee_id;
      return eid && Number(eid) === numId;
    });

    if (!found) { setError('No active employee found with this ID.'); return; }
    setSelectedEmp(found);
  }, [searchId, activeEmployees]);

  const handleExportPDF = useCallback(async () => {
    if (!selectedEmp || !profileRef.current) return;
    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;
      const canvas = await html2canvas(profileRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, Math.min(pdfHeight, pdf.internal.pageSize.getHeight()));
      pdf.save(`profile_${selectedEmp.employee_id}.pdf`);
    } catch (e) {
      console.error('PDF export failed:', e);
    }
  }, [selectedEmp]);

  const emp = selectedEmp;
  const age = emp ? computeAge(emp.date_of_birth, asOfDate) : '';
  const tenure = emp ? computeTenure(emp.date_of_joining, asOfDate) : '';

  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1.5 h-8 rounded-full bg-primary" />
        <h2 className="text-2xl font-display font-bold text-foreground">Talent Profile</h2>
      </div>

      {/* Search */}
      <Card className="mb-6 border-border/50">
        <CardContent className="p-4">
          <div className="flex gap-3 items-center">
            <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            <Input
              placeholder="Enter Employee ID"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="max-w-xs"
            />
            <Button onClick={handleSearch} size="sm">Search</Button>
          </div>
          {error && <p className="text-destructive text-sm mt-2">{error}</p>}
        </CardContent>
      </Card>

      {!emp && !error && (
        <div className="text-center py-16 text-muted-foreground">
          <User className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Enter an Employee ID to view their Talent Profile</p>
          <p className="text-xs mt-1">Only active employees are shown</p>
        </div>
      )}

      {emp && (
        <div ref={profileRef}>
          {/* Header - Python: profile-header with dark bg */}
          <Card className="mb-6 bg-[hsl(var(--primary))] text-primary-foreground border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">{emp.employee_name || 'N/A'}</h3>
                  <p className="text-sm opacity-90 mt-1">Employee ID: <strong>{emp.employee_id}</strong></p>
                  <p className="text-sm opacity-80 mt-1">
                    {emp.function_name || ''} | {emp.department || ''} | Band: {emp.band || '-'} | Grade: {emp.grade || '-'}
                  </p>
                  <p className="text-sm opacity-80 mt-1">Age: {age} | Tenure: {tenure}</p>
                </div>
                <Button variant="secondary" size="sm" onClick={handleExportPDF} className="flex gap-2">
                  <Download className="w-4 h-4" /> Export PDF
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Python: gridbox with 2 columns of sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Organizational Context - Python: 4_Talent_Profile.py line 202-205 */}
            <ProfileSection
              title="Organizational Context"
              icon={<Building2 className="w-4 h-4" />}
              fields={[
                { label: 'Company', value: emp.company || '-' },
                { label: 'Business Unit', value: emp.business_unit || '-' },
                { label: 'Department', value: emp.department || '-' },
                { label: 'Function', value: emp.function_name || '-' },
                { label: 'Zone', value: emp.zone || '-' },
                { label: 'Cluster', value: emp.cluster || '-' },
                { label: 'Area', value: emp.area || '-' },
                { label: 'Location', value: emp.location || '-' },
              ]}
            />
            {/* Tenure & Movement - Python: line 206-209 */}
            <ProfileSection
              title="Tenure & Movement"
              icon={<Calendar className="w-4 h-4" />}
              fields={[
                { label: 'Date of Joining', value: formatProfileDate(emp.date_of_joining) },
                { label: 'Last Promotion', value: formatProfileDate(emp.last_promotion) },
                { label: 'Last Transfer', value: formatProfileDate(emp.last_transfer) },
                { label: 'Total Experience', value: emp.total_exp_yrs != null ? `${emp.total_exp_yrs} yrs` : '-' },
                { label: 'Previous Experience', value: emp.prev_exp_in_yrs != null ? `${emp.prev_exp_in_yrs} yrs` : '-' },
                { label: 'Employment Type', value: emp.employment_type || '-' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Compensation - Python: line 212-214 */}
            <ProfileSection
              title="Compensation"
              icon={<IndianRupee className="w-4 h-4" />}
              fields={[
                { label: 'Fixed CTC', value: formatINR(emp.fixed_ctc_pa) },
                { label: 'Variable CTC', value: formatINR(emp.variable_ctc_pa) },
                { label: 'Total CTC', value: formatINR(emp.total_ctc_pa) },
              ]}
            />
            {/* Performance & Potential - Python: line 215-219 */}
            <ProfileSection
              title="Performance & Potential"
              icon={<Star className="w-4 h-4" />}
              fields={[
                { label: 'Satisfaction Score', value: emp.satisfaction_score != null ? String(emp.satisfaction_score) : '-' },
                { label: 'Engagement Score', value: emp.engagement_score != null ? String(emp.engagement_score) : '-' },
                { label: 'Rating 2025', value: emp.rating_25 || '-' },
                { label: 'Rating 2024', value: emp.rating_24 || '-' },
                { label: 'Top Talent', value: emp.top_talent || '-' },
                { label: 'Succession Ready', value: emp.succession_ready || '-' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Development & Learning - Python: line 221-222 */}
            <ProfileSection
              title="Development & Learning"
              icon={<BookOpen className="w-4 h-4" />}
              fields={[
                { label: 'Learning Program', value: emp.learning_program || '-' },
                { label: 'Training Hours', value: emp.training_hours != null ? `${emp.training_hours} hrs` : '-' },
              ]}
            />
            {/* Competency & Skills - Python: line 223-224 */}
            <ProfileSection
              title="Competency & Skills"
              icon={<Briefcase className="w-4 h-4" />}
              fields={[
                { label: 'Competency', value: emp.competency || '-' },
                { label: 'Competency Details', value: getMergedCompetency(emp) },
                { label: 'Skills', value: getMergedSkills(emp) },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Education & Background - Python: line 227-231 */}
            <ProfileSection
              title="Education & Background"
              icon={<GraduationCap className="w-4 h-4" />}
              fields={[
                { label: 'Qualification', value: emp.qualification || '-' },
                { label: 'Highest Qualification', value: emp.highest_qualification || '-' },
                { label: 'Qualification Type', value: emp.qualification_type || '-' },
                { label: 'Previous Employers', value: emp.previous_employers || '-' },
                { label: 'Last Employer', value: emp.last_employer || '-' },
                { label: 'Employment Sector', value: emp.employment_sector || '-' },
              ]}
            />
          </div>
        </div>
      )}
    </section>
  );
}
