import React, { useState, useEffect } from 'react';
import { 
  Users, Plus, Award, FileText, 
  Loader2, AlertCircle, Sparkles, Shield, DollarSign, Calendar, RefreshCw, Copy, Check
} from 'lucide-react';

interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  salary: number; // in cents
  status: 'active' | 'onboarding' | 'suspended';
  startDate: string;
}

export const HRDashboard: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Document Generator Form State
  const [docType, setDocType] = useState<'job_description' | 'offer_letter' | 'policy'>('job_description');
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [salaryRange, setSalaryRange] = useState('$120,000 - $150,000');
  const [details, setDetails] = useState('');
  const [generatedDoc, setGeneratedDoc] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // New Employee Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [empName, setEmpName] = useState('');
  const [empRole, setEmpRole] = useState('');
  const [empDept, setEmpDept] = useState('Engineering');
  const [empSalary, setEmpSalary] = useState('110000');
  const empStatus = 'active';
  const [isSaving, setIsSaving] = useState(false);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/hr/employees');
      if (!res.ok) throw new Error('Failed to fetch employee list');
      const data = await res.json();
      setEmployees(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empName.trim() || !empRole.trim()) return;

    setIsSaving(true);
    try {
      const salaryInCents = Math.round(parseFloat(empSalary) * 100) || 10000000;
      const res = await fetch('/api/hr/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: empName,
          role: empRole,
          department: empDept,
          salary: salaryInCents,
          status: empStatus,
          startDate: new Date().toISOString()
        })
      });
      if (res.ok) {
        setEmpName('');
        setEmpRole('');
        setEmpSalary('110000');
        setIsFormOpen(false);
        fetchEmployees();
      }
    } catch (err) {
      console.error('Error adding employee:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !department.trim()) return;

    setIsGenerating(true);
    setGeneratedDoc('');
    try {
      const res = await fetch('/api/hr/generate-doc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docType,
          title,
          department,
          salary: salaryRange,
          details
        })
      });
      if (!res.ok) throw new Error('Document generation failed');
      const data = await res.json();
      setGeneratedDoc(data.document || 'No document text returned.');
    } catch (err: any) {
      setGeneratedDoc(`### Draft Creation Failure\nFailed to compile requested document: ${err.message}. Please check Gemini server connection.`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTryDemoInput = () => {
    if (docType === 'job_description') {
      setTitle("Staff Frontend Engineer");
      setDepartment("Engineering");
      setSalaryRange("$160,000 - $195,000 USD");
      setDetails("Requires 6+ years of React experience, typescript proficiency, and familiarity with micro-frontend architectures. Lead a team of 4 devs.");
    } else if (docType === 'offer_letter') {
      setTitle("Senior Product Designer");
      setDepartment("Product Design");
      setSalaryRange("$135,000 USD Annual Base");
      setDetails("Jane Doe");
    } else {
      setTitle("Hybrid Work Policy");
      setDepartment("All Departments");
      setSalaryRange("N/A");
      setDetails("Company expects 2 days in the local office (Tue/Thu) and 3 days remote. Offers a $500 home-office stipend once per year.");
    }
  };

  const handleCopy = () => {
    if (!generatedDoc) return;
    navigator.clipboard.writeText(generatedDoc);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const additionalEmployees = employees.length > 5 ? employees.length - 5 : 0;
  const totalHeadcount = 18 + additionalEmployees;

  const addedSalaryMonthly = employees.slice(5).reduce((sum, e) => sum + (e.salary / 100), 0) / 12;
  const totalPayrollMonthly = 142500.00 + addedSalaryMonthly;
  
  const pipelineCandidates = 12;
  const eNpsScore = 78;

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black mb-1.5 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent italic tracking-tight">
            CHRO Boardroom
          </h2>
          <p className="text-white/40 text-sm font-medium">Manage headcount, roster logs, and draft premium HR documentation with Gemini AI.</p>
        </div>
        <button 
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="btn-primary h-12 text-sm font-extrabold flex items-center gap-2 cursor-pointer self-start md:self-auto"
        >
          <Plus size={16} />
          <span>Add Employee</span>
        </button>
      </header>

      {/* Add Employee Form Drawer */}
      {isFormOpen && (
        <div className="glass-card p-6 border-primary/20 bg-gradient-to-b from-primary/5 to-transparent animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
              <Sparkles size={14} className="text-primary animate-pulse" />
            </div>
            <h3 className="text-base font-extrabold text-white">Add New Employee to Roster</h3>
          </div>
          <form onSubmit={handleAddEmployee} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest">Full Name</label>
              <input 
                type="text"
                required
                value={empName}
                onChange={(e) => setEmpName(e.target.value)}
                placeholder="e.g. Sandra Bullock"
                className="glass-input"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest">Job Title</label>
              <input 
                type="text"
                required
                value={empRole}
                onChange={(e) => setEmpRole(e.target.value)}
                placeholder="e.g. Lead HR Specialist"
                className="glass-input"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest">Department</label>
              <div className="relative">
                <select
                  value={empDept}
                  onChange={(e) => setEmpDept(e.target.value)}
                  className="glass-input appearance-none pr-8 cursor-pointer"
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Product">Product</option>
                  <option value="Marketing">Marketing</option>
                  <option value="People & Culture">People & Culture</option>
                  <option value="Sales">Sales</option>
                </select>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-white/30 text-xs">
                  ▼
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest">Annual Base Salary ($)</label>
              <input 
                type="number"
                required
                value={empSalary}
                onChange={(e) => setEmpSalary(e.target.value)}
                placeholder="e.g. 110000"
                className="glass-input"
              />
            </div>
            <div className="flex gap-2">
              <button 
                type="submit" 
                disabled={isSaving}
                className="btn-primary flex-1 h-[46px] justify-center flex items-center gap-1.5 cursor-pointer text-xs font-bold"
              >
                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                <span>Add</span>
              </button>
              <button 
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="btn-secondary h-[46px] text-xs font-bold"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Key HR Dashboard Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card p-5 group hover:border-primary/20 transition-all cursor-default relative overflow-hidden">
          <div className="absolute -right-3 -top-3 w-16 h-16 rounded-full bg-primary/5 group-hover:scale-110 transition-transform flex items-center justify-center border border-white/5">
            <Users size={20} className="text-primary/40" />
          </div>
          <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-2">Company Headcount</p>
          <h4 className="text-2xl font-black tracking-tight">{totalHeadcount} Employees</h4>
          <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 inline-block mt-3.5 animate-pulse">
            +{additionalEmployees} Roster growth
          </span>
          <p className="text-[9px] text-white/30 mt-2.5 uppercase tracking-widest font-black">Active full-time roster</p>
        </div>

        <div className="glass-card p-5 group hover:border-primary/20 transition-all cursor-default relative overflow-hidden">
          <div className="absolute -right-3 -top-3 w-16 h-16 rounded-full bg-primary/5 group-hover:scale-110 transition-transform flex items-center justify-center border border-white/5">
            <DollarSign size={20} className="text-primary/40" />
          </div>
          <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-2">Monthly Outflow</p>
          <h4 className="text-2xl font-black tracking-tight">${totalPayrollMonthly.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h4>
          <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 inline-block mt-3.5">
            Fully Funded
          </span>
          <p className="text-[9px] text-white/30 mt-2.5 uppercase tracking-widest font-black">Synced with memory ledger</p>
        </div>

        <div className="glass-card p-5 group hover:border-primary/20 transition-all cursor-default relative overflow-hidden">
          <div className="absolute -right-3 -top-3 w-16 h-16 rounded-full bg-primary/5 group-hover:scale-110 transition-transform flex items-center justify-center border border-white/5">
            <Award size={20} className="text-primary/40" />
          </div>
          <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-2">Pipeline Candidates</p>
          <h4 className="text-2xl font-black tracking-tight">{pipelineCandidates} Active</h4>
          <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-primary/20 border border-primary/20 text-primary inline-block mt-3.5">
            3 in Final Round
          </span>
          <p className="text-[9px] text-white/30 mt-2.5 uppercase tracking-widest font-black">ATS sync online</p>
        </div>

        <div className="glass-card p-5 group hover:border-primary/20 transition-all cursor-default relative overflow-hidden">
          <div className="absolute -right-3 -top-3 w-16 h-16 rounded-full bg-primary/5 group-hover:scale-110 transition-transform flex items-center justify-center border border-white/5">
            <Shield size={20} className="text-primary/40" />
          </div>
          <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-2">Employee Sentiment (eNPS)</p>
          <h4 className="text-2xl font-black tracking-tight">{eNpsScore} / 100</h4>
          <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 inline-block mt-3.5">
            Top 10% Industry
          </span>
          <p className="text-[9px] text-white/30 mt-2.5 uppercase tracking-widest font-black">Anonymous survey</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Roster Grid */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6 overflow-hidden relative">
            <div className="absolute -right-16 -top-16 w-36 h-36 rounded-full bg-primary/5 blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-extrabold text-white">Official Employee Roster</h3>
                <p className="text-white/40 text-[10px] uppercase tracking-widest font-black mt-0.5">Database record log</p>
              </div>
              <button 
                onClick={fetchEmployees}
                className="w-8 h-8 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all cursor-pointer"
                title="Synchronize Roster"
              >
                <RefreshCw size={14} />
              </button>
            </div>
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={24} />
              </div>
            ) : error ? (
              <div className="p-4 rounded-xl border border-rose-500/10 bg-rose-500/5 text-rose-400 flex items-center gap-2 text-xs font-semibold">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            ) : (
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-[9px] uppercase font-black text-white/30 tracking-widest pb-4">
                      <th className="py-3 px-4">Employee</th>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4 text-right">Annual Base</th>
                      <th className="py-3 px-4 text-right">Start Date</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((emp) => (
                      <tr key={emp.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors group">
                        <td className="py-3.5 px-4">
                          <div className="font-extrabold text-white group-hover:text-primary transition-colors text-xs">{emp.name}</div>
                          <div className="text-[10px] text-white/40 font-bold mt-0.5 tracking-tight">{emp.role}</div>
                        </td>
                        <td className="py-3.5 px-4 text-white/70 font-bold text-xs">{emp.department}</td>
                        <td className="py-3.5 px-4 text-right font-black text-white/80 text-xs">
                          ${(emp.salary / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4 text-right text-white/40 text-[10px] font-semibold">
                          <div className="flex items-center justify-end gap-1.5">
                            <Calendar size={11} className="text-white/20" />
                            <span>{new Date(emp.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${
                            emp.status === 'active' 
                              ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400' 
                              : emp.status === 'onboarding'
                                ? 'bg-primary/5 border-primary/10 text-primary'
                                : 'bg-white/5 border-white/5 text-white/30'
                          }`}>
                            {emp.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* AI Job Desk & Policy Writer */}
        <div className="space-y-6">
          <div className="glass-card p-6 space-y-5 relative overflow-hidden">
            <div className="absolute -right-16 -top-16 w-36 h-36 rounded-full bg-secondary/5 blur-2xl pointer-events-none" />
            
            <div className="flex items-center gap-2.5 border-b border-white/5 pb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-inner">
                <Sparkles size={16} className="text-white" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white">CHRO Document Suite</h3>
                <p className="text-white/40 text-[9px] uppercase tracking-widest font-black mt-0.5">AI Policy Draft Engine</p>
              </div>
            </div>

            <form onSubmit={handleGenerateDoc} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest">Document Target Type</label>
                <div className="grid grid-cols-3 gap-2">
                  <button 
                    type="button" 
                    onClick={() => { setDocType('job_description'); setGeneratedDoc(''); }}
                    className={`px-2 py-2 text-[9px] font-black uppercase tracking-wider rounded-lg border text-center transition-all cursor-pointer ${
                      docType === 'job_description' 
                        ? 'bg-primary/20 text-white border-primary/30 shadow-md shadow-primary/5' 
                        : 'bg-white/5 text-white/40 border-transparent hover:bg-white/10 hover:text-white/60'
                    }`}
                  >
                    Job Desc
                  </button>
                  <button 
                    type="button" 
                    onClick={() => { setDocType('offer_letter'); setGeneratedDoc(''); }}
                    className={`px-2 py-2 text-[9px] font-black uppercase tracking-wider rounded-lg border text-center transition-all cursor-pointer ${
                      docType === 'offer_letter' 
                        ? 'bg-primary/20 text-white border-primary/30 shadow-md shadow-primary/5' 
                        : 'bg-white/5 text-white/40 border-transparent hover:bg-white/10 hover:text-white/60'
                    }`}
                  >
                    Offer Let
                  </button>
                  <button 
                    type="button" 
                    onClick={() => { setDocType('policy'); setGeneratedDoc(''); }}
                    className={`px-2 py-2 text-[9px] font-black uppercase tracking-wider rounded-lg border text-center transition-all cursor-pointer ${
                      docType === 'policy' 
                        ? 'bg-primary/20 text-white border-primary/30 shadow-md shadow-primary/5' 
                        : 'bg-white/5 text-white/40 border-transparent hover:bg-white/10 hover:text-white/60'
                    }`}
                  >
                    HR Policy
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest">
                  {docType === 'job_description' ? "Job Title" : docType === 'offer_letter' ? "Role Title" : "Policy Name"}
                </label>
                <input 
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={docType === 'job_description' ? "e.g. Senior Backend Dev" : docType === 'offer_letter' ? "e.g. Senior Designer" : "e.g. Hybrid Work Policy"}
                  className="glass-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest">Department</label>
                  <input 
                    type="text"
                    required
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Engineering"
                    className="glass-input"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest">Compensation</label>
                  <input 
                    type="text"
                    required
                    value={salaryRange}
                    onChange={(e) => setSalaryRange(e.target.value)}
                    placeholder="e.g. $120k - $140k"
                    className="glass-input"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest">
                  {docType === 'offer_letter' ? "Candidate Name / Special Perks" : "Requirements / Context Details"}
                </label>
                <textarea 
                  rows={4}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder={docType === 'offer_letter' ? "Enter Candidate name, special health benefits..." : "Provide custom requirements or key parameters to embed..."}
                  className="glass-input custom-scrollbar resize-none h-[96px]"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button 
                  type="submit" 
                  disabled={isGenerating}
                  className="btn-primary flex-1 h-[42px] text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Writing Draft...</span>
                    </>
                  ) : (
                    <>
                      <FileText size={14} />
                      <span>Generate Document</span>
                    </>
                  )}
                </button>
                <button 
                  type="button" 
                  onClick={handleTryDemoInput}
                  title="Load Demo Parameters"
                  className="btn-secondary h-[42px] px-3.5 text-xs font-bold"
                >
                  Demo
                </button>
              </div>
            </form>

            {generatedDoc && (
              <div className="mt-6 border-t border-white/[0.06] pt-5 space-y-3.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-widest font-black text-primary">Draft Document Compiled</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleCopy}
                      className="w-7 h-7 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all cursor-pointer"
                      title="Copy to clipboard"
                    >
                      {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    </button>
                    <button 
                      onClick={() => setGeneratedDoc('')}
                      className="w-7 h-7 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all cursor-pointer font-bold text-xs"
                      title="Clear draft"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                
                <div className="bg-[#080710]/50 border border-white/[0.04] p-4.5 rounded-2xl max-h-[350px] overflow-y-auto custom-scrollbar shadow-inner">
                  <MarkdownRenderer text={generatedDoc} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Markdown rendering helper inside TSX
const MarkdownRenderer: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return null;
  const lines = text.split('\n');
  return (
    <div className="space-y-3 text-white/80 text-xs leading-relaxed font-medium">
      {lines.map((line, i) => {
        const content = line.trim();
        if (!content) return <div key={i} className="h-2" />;
        
        // Headers
        if (content.startsWith('### ')) {
          return <h5 key={i} className="text-xs font-bold text-primary mt-4 mb-1 uppercase tracking-wide">{content.slice(4)}</h5>;
        }
        if (content.startsWith('## ')) {
          return <h4 key={i} className="text-xs font-black text-white mt-5 mb-2 border-l-2 border-primary pl-2">{content.slice(3)}</h4>;
        }
        if (content.startsWith('# ')) {
          return <h3 key={i} className="text-sm font-black text-white mt-6 mb-3 border-b border-white/10 pb-1.5">{content.slice(2)}</h3>;
        }

        // Bullet points
        if (content.startsWith('* ') || content.startsWith('- ')) {
          const formatted = parseBoldText(content.slice(2));
          return (
            <div key={i} className="flex gap-2 items-start pl-1.5 my-1">
              <span className="text-primary mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_6px_var(--glow-color)]" />
              <span>{formatted}</span>
            </div>
          );
        }

        // Numbered lists
        const numMatch = content.match(/^(\d+)\.\s(.*)/);
        if (numMatch) {
          const formatted = parseBoldText(numMatch[2]);
          return (
            <div key={i} className="flex gap-2 items-start pl-1.5 my-1">
              <span className="text-primary font-black shrink-0">{numMatch[1]}.</span>
              <span>{formatted}</span>
            </div>
          );
        }

        return <p key={i}>{parseBoldText(content)}</p>;
      })}
    </div>
  );
};

// Bold text highlighter
const parseBoldText = (text: string) => {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, index) => {
    if (index % 2 === 1) {
      return <strong key={index} className="font-black text-white">{part}</strong>;
    }
    return part;
  });
};
