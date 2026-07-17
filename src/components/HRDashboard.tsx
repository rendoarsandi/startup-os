import React, { useState, useEffect } from 'react';
import { 
  Users, Plus, Award, FileText, 
  Loader2, AlertCircle, Sparkles, Shield, DollarSign, Calendar, RefreshCw, Copy, Check, X
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';

interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  salary: number; // in cents
  status: 'active' | 'onboarding' | 'suspended';
  startDate: string;
}

export const HRDashboard: React.FC<{ filterSection?: 'all' | 'roster' | 'documents' }> = ({ filterSection = 'all' }) => {
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
      {filterSection === 'all' && (
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold mb-1.5 text-foreground tracking-tight">
              CHRO Boardroom
            </h2>
            <p className="text-muted-foreground text-sm font-medium">Manage headcount, roster logs, and draft premium HR documentation with Gemini AI.</p>
          </div>
          <Button 
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="h-10 text-xs font-bold gap-2 self-start md:self-auto"
          >
            <Plus size={14} />
            <span>Add Employee</span>
          </Button>
        </header>
      )}

      {filterSection === 'roster' && (
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold mb-1.5 text-foreground tracking-tight">
              Employee Roster
            </h2>
            <p className="text-muted-foreground text-sm font-medium">Verify employee profiles, base pay structures, and employment statuses.</p>
          </div>
          <Button 
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="h-10 text-xs font-bold gap-2 self-start md:self-auto"
          >
            <Plus size={14} />
            <span>Add Employee</span>
          </Button>
        </header>
      )}

      {filterSection === 'documents' && (
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold mb-1.5 text-foreground tracking-tight">
              AI Document Suite
            </h2>
            <p className="text-muted-foreground text-sm font-medium">Compose customized job specs, employment offers, and enterprise HR policies with Gemini.</p>
          </div>
        </header>
      )}

      {/* Add Employee Form Drawer */}
      {isFormOpen && (filterSection === 'all' || filterSection === 'roster') && (
        <Card className="border-primary/20 bg-card/60 backdrop-blur-md animate-in fade-in duration-300">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary animate-pulse">
                <Sparkles size={14} />
              </div>
              <CardTitle className="text-sm font-bold">Add New Employee to Roster</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddEmployee} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-0.5">Full Name</label>
                <Input 
                  type="text"
                  required
                  value={empName}
                  onChange={(e) => setEmpName(e.target.value)}
                  placeholder="e.g. Sandra Bullock"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-0.5">Job Title</label>
                <Input 
                  type="text"
                  required
                  value={empRole}
                  onChange={(e) => setEmpRole(e.target.value)}
                  placeholder="e.g. Lead HR Specialist"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-0.5">Department</label>
                <Select 
                  value={empDept} 
                  onValueChange={(val) => setEmpDept(val)}
                >
                  <SelectTrigger className="w-full text-xs font-bold uppercase tracking-wider h-10">
                    <SelectValue placeholder="DEPT" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Engineering">Engineering</SelectItem>
                    <SelectItem value="Product">Product</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="People & Culture">People & Culture</SelectItem>
                    <SelectItem value="Sales">Sales</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-0.5">Annual Base ($)</label>
                <Input 
                  type="number"
                  required
                  value={empSalary}
                  onChange={(e) => setEmpSalary(e.target.value)}
                  placeholder="e.g. 110000"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  disabled={isSaving}
                  className="flex-1 h-10 text-xs font-bold gap-1.5"
                >
                  {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                  <span>Add</span>
                </Button>
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => setIsFormOpen(false)}
                  className="h-10 px-4 text-xs font-bold"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      {filterSection === 'all' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-5 hover:border-primary/30 transition-all cursor-default relative overflow-hidden group">
            <div className="absolute -right-3 -top-3 w-14 h-14 rounded-full bg-primary/5 group-hover:scale-105 transition-transform flex items-center justify-center border border-border/30">
              <Users size={18} className="text-primary" />
            </div>
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-2">Company Headcount</p>
            <h4 className="text-2xl font-black tracking-tight text-foreground">{totalHeadcount} Employees</h4>
            <Badge variant="success" className="text-[9px] font-black uppercase tracking-wider mt-3.5">
              +{additionalEmployees} Roster growth
            </Badge>
            <p className="text-[9px] text-muted-foreground/60 mt-2.5 uppercase tracking-widest font-black">Active full-time roster</p>
          </Card>

          <Card className="p-5 hover:border-primary/30 transition-all cursor-default relative overflow-hidden group">
            <div className="absolute -right-3 -top-3 w-14 h-14 rounded-full bg-primary/5 group-hover:scale-105 transition-transform flex items-center justify-center border border-border/30">
              <DollarSign size={18} className="text-primary" />
            </div>
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-2">Monthly Outflow</p>
            <h4 className="text-2xl font-black tracking-tight text-foreground">${totalPayrollMonthly.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h4>
            <Badge variant="success" className="text-[9px] font-black uppercase tracking-wider mt-3.5">
              Fully Funded
            </Badge>
            <p className="text-[9px] text-muted-foreground/60 mt-2.5 uppercase tracking-widest font-black">Synced with memory ledger</p>
          </Card>

          <Card className="p-5 hover:border-primary/30 transition-all cursor-default relative overflow-hidden group">
            <div className="absolute -right-3 -top-3 w-14 h-14 rounded-full bg-primary/5 group-hover:scale-105 transition-transform flex items-center justify-center border border-border/30">
              <Award size={18} className="text-primary" />
            </div>
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-2">Pipeline Candidates</p>
            <h4 className="text-2xl font-black tracking-tight text-foreground">{pipelineCandidates} Active</h4>
            <Badge variant="outline" className="text-[9px] font-black uppercase tracking-wider mt-3.5 text-primary border-primary/20 bg-primary/5">
              3 in Final Round
            </Badge>
            <p className="text-[9px] text-muted-foreground/60 mt-2.5 uppercase tracking-widest font-black">ATS sync online</p>
          </Card>

          <Card className="p-5 hover:border-primary/30 transition-all cursor-default relative overflow-hidden group">
            <div className="absolute -right-3 -top-3 w-14 h-14 rounded-full bg-primary/5 group-hover:scale-105 transition-transform flex items-center justify-center border border-border/30">
              <Shield size={18} className="text-primary" />
            </div>
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-2">Employee Sentiment (eNPS)</p>
            <h4 className="text-2xl font-black tracking-tight text-foreground">{eNpsScore} / 100</h4>
            <Badge variant="success" className="text-[9px] font-black uppercase tracking-wider mt-3.5">
              Top 10% Industry
            </Badge>
            <p className="text-[9px] text-muted-foreground/60 mt-2.5 uppercase tracking-widest font-black">Anonymous survey</p>
          </Card>
        </div>
      )}

      {filterSection === 'all' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Roster Grid */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6 relative overflow-hidden shadow-md">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <CardTitle className="text-sm font-bold">Official Employee Roster</CardTitle>
                  <p className="text-muted-foreground text-[10px] uppercase tracking-widest font-black mt-0.5">Database record log</p>
                </div>
                <Button 
                  variant="outline"
                  size="icon"
                  onClick={fetchEmployees}
                  className="w-8 h-8 rounded-full border-border/80"
                  title="Synchronize Roster"
                >
                  <RefreshCw size={12} />
                </Button>
              </div>
              {loading ? (
                <div className="h-64 flex items-center justify-center">
                  <Loader2 className="animate-spin text-primary" size={24} />
                </div>
              ) : error ? (
                <div className="p-4 rounded-xl border border-destructive/20 bg-destructive/10 text-destructive flex items-center gap-2 text-xs font-semibold">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              ) : (
                <div className="border border-border rounded-lg overflow-hidden bg-black/10">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="pl-4">Employee</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead className="text-right w-32">Annual Base</TableHead>
                        <TableHead className="text-right w-36">Start Date</TableHead>
                        <TableHead className="text-center w-28 pr-4">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employees.map((emp) => (
                        <TableRow key={emp.id}>
                          <TableCell className="pl-4">
                            <div className="font-bold text-foreground text-xs">{emp.name}</div>
                            <div className="text-[10px] text-muted-foreground font-bold mt-0.5 tracking-tight">{emp.role}</div>
                          </TableCell>
                          <TableCell className="text-foreground/80 font-bold text-xs">{emp.department}</TableCell>
                          <TableCell className="text-right font-bold text-foreground text-xs font-mono">
                            ${(emp.salary / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground text-[10px] font-semibold">
                            <div className="flex items-center justify-end gap-1.5">
                              <Calendar size={11} className="text-muted-foreground/60" />
                              <span>{new Date(emp.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center pr-4">
                            <Badge variant={emp.status === 'active' ? 'success' : emp.status === 'onboarding' ? 'outline' : 'secondary'} className="text-[9px] font-black uppercase tracking-wider">
                              {emp.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </Card>
          </div>

          {/* AI Job Desk & Policy Writer */}
          <div className="space-y-6">
            <Card className="p-6 relative overflow-hidden shadow-md">
              <div className="flex items-center gap-2.5 border-b border-border pb-4 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Sparkles size={16} />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold">CHRO Document Suite</CardTitle>
                  <p className="text-muted-foreground text-[9px] uppercase tracking-widest font-black mt-0.5">AI Policy Draft Engine</p>
                </div>
              </div>

              <form onSubmit={handleGenerateDoc} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-0.5">Document Target Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button 
                      type="button" 
                      variant={docType === 'job_description' ? 'default' : 'outline'}
                      onClick={() => { setDocType('job_description'); setGeneratedDoc(''); }}
                      className="py-1 text-[9px] font-black uppercase h-9 rounded-lg"
                    >
                      Job Desc
                    </Button>
                    <Button 
                      type="button" 
                      variant={docType === 'offer_letter' ? 'default' : 'outline'}
                      onClick={() => { setDocType('offer_letter'); setGeneratedDoc(''); }}
                      className="py-1 text-[9px] font-black uppercase h-9 rounded-lg"
                    >
                      Offer Let
                    </Button>
                    <Button 
                      type="button" 
                      variant={docType === 'policy' ? 'default' : 'outline'}
                      onClick={() => { setDocType('policy'); setGeneratedDoc(''); }}
                      className="py-1 text-[9px] font-black uppercase h-9 rounded-lg"
                    >
                      HR Policy
                    </Button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-0.5">
                    {docType === 'job_description' ? "Job Title" : docType === 'offer_letter' ? "Role Title" : "Policy Name"}
                  </label>
                  <Input 
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={docType === 'job_description' ? "e.g. Senior Backend Dev" : docType === 'offer_letter' ? "e.g. Senior Designer" : "e.g. Hybrid Work Policy"}
                    className="bg-black/10"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-0.5">Department</label>
                    <Input 
                      type="text"
                      required
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g. Engineering"
                      className="bg-black/10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-0.5">Compensation</label>
                    <Input 
                      type="text"
                      required
                      value={salaryRange}
                      onChange={(e) => setSalaryRange(e.target.value)}
                      placeholder="e.g. $120k - $140k"
                      className="bg-black/10"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-0.5">
                    {docType === 'offer_letter' ? "Candidate Name / Special Perks" : "Requirements / Context Details"}
                  </label>
                  <textarea 
                    rows={4}
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder={docType === 'offer_letter' ? "Enter Candidate name..." : "Provide custom requirements..."}
                    className="glass-input custom-scrollbar resize-none h-[96px] bg-black/10"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <Button 
                    type="submit" 
                    disabled={isGenerating}
                    className="flex-1 h-10 text-xs font-bold gap-1.5"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        <span>Writing Draft...</span>
                      </>
                    ) : (
                      <>
                        <FileText size={13} />
                        <span>Generate Document</span>
                      </>
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={handleTryDemoInput}
                    title="Load Demo Parameters"
                    className="h-10 px-3.5 text-xs font-bold"
                  >
                    Demo
                  </Button>
                </div>
              </form>

              {generatedDoc && (
                <div className="mt-6 border-t border-border pt-5 space-y-3 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-widest font-black text-primary">Draft Document Compiled</span>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline"
                        size="icon"
                        onClick={handleCopy}
                        className="w-7 h-7 rounded-lg text-muted-foreground hover:text-foreground"
                        title="Copy to clipboard"
                      >
                        {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      </Button>
                      <Button 
                        variant="outline"
                        size="icon"
                        onClick={() => setGeneratedDoc('')}
                        className="w-7 h-7 rounded-lg text-muted-foreground hover:text-foreground"
                        title="Clear draft"
                      >
                        <X size={12} />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="bg-black/20 border border-border p-4 rounded-xl max-h-[350px] overflow-y-auto custom-scrollbar shadow-inner">
                    <MarkdownRenderer text={generatedDoc} />
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {filterSection === 'roster' && (
        <div className="space-y-6 w-full animate-in fade-in duration-300">
          <Card className="p-6 relative overflow-hidden shadow-md">
            <div className="flex items-center justify-between mb-5">
              <div>
                <CardTitle className="text-sm font-bold">Official Employee Roster</CardTitle>
                <p className="text-muted-foreground text-[10px] uppercase tracking-widest font-black mt-0.5">Database record log</p>
              </div>
              <Button 
                variant="outline"
                size="icon"
                onClick={fetchEmployees}
                className="w-8 h-8 rounded-full border-border/80"
                title="Synchronize Roster"
              >
                <RefreshCw size={12} />
              </Button>
            </div>
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={24} />
              </div>
            ) : error ? (
              <div className="p-4 rounded-xl border border-destructive/20 bg-destructive/10 text-destructive flex items-center gap-2 text-xs font-semibold">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            ) : (
              <div className="border border-border rounded-lg overflow-hidden bg-black/10">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-4">Employee</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead className="text-right w-32">Annual Base</TableHead>
                      <TableHead className="text-right w-36">Start Date</TableHead>
                      <TableHead className="text-center w-28 pr-4">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map((emp) => (
                      <TableRow key={emp.id}>
                        <TableCell className="pl-4">
                          <div className="font-bold text-foreground text-xs">{emp.name}</div>
                          <div className="text-[10px] text-muted-foreground font-bold mt-0.5 tracking-tight">{emp.role}</div>
                        </TableCell>
                        <TableCell className="text-foreground/80 font-bold text-xs">{emp.department}</TableCell>
                        <TableCell className="text-right font-bold text-foreground text-xs font-mono">
                          ${(emp.salary / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground text-[10px] font-semibold">
                          <div className="flex items-center justify-end gap-1.5">
                            <Calendar size={11} className="text-muted-foreground/60" />
                            <span>{new Date(emp.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center pr-4">
                          <Badge variant={emp.status === 'active' ? 'success' : emp.status === 'onboarding' ? 'outline' : 'secondary'} className="text-[9px] font-black uppercase tracking-wider">
                            {emp.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </div>
      )}

      {filterSection === 'documents' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
          <div className="lg:col-span-1 space-y-6">
            <Card className="p-6 relative overflow-hidden shadow-md">
              <div className="flex items-center gap-2.5 border-b border-border pb-4 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Sparkles size={16} />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold">CHRO Document Suite</CardTitle>
                  <p className="text-muted-foreground text-[9px] uppercase tracking-widest font-black mt-0.5">AI Policy Draft Engine</p>
                </div>
              </div>

              <form onSubmit={handleGenerateDoc} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-0.5">Document Target Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button 
                      type="button" 
                      variant={docType === 'job_description' ? 'default' : 'outline'}
                      onClick={() => { setDocType('job_description'); setGeneratedDoc(''); }}
                      className="py-1 text-[9px] font-black uppercase h-9 rounded-lg"
                    >
                      Job Desc
                    </Button>
                    <Button 
                      type="button" 
                      variant={docType === 'offer_letter' ? 'default' : 'outline'}
                      onClick={() => { setDocType('offer_letter'); setGeneratedDoc(''); }}
                      className="py-1 text-[9px] font-black uppercase h-9 rounded-lg"
                    >
                      Offer Let
                    </Button>
                    <Button 
                      type="button" 
                      variant={docType === 'policy' ? 'default' : 'outline'}
                      onClick={() => { setDocType('policy'); setGeneratedDoc(''); }}
                      className="py-1 text-[9px] font-black uppercase h-9 rounded-lg"
                    >
                      HR Policy
                    </Button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-0.5">
                    {docType === 'job_description' ? "Job Title" : docType === 'offer_letter' ? "Role Title" : "Policy Name"}
                  </label>
                  <Input 
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={docType === 'job_description' ? "e.g. Senior Backend Dev" : docType === 'offer_letter' ? "e.g. Senior Designer" : "e.g. Hybrid Work Policy"}
                    className="bg-black/10"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-0.5">Department</label>
                    <Input 
                      type="text"
                      required
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g. Engineering"
                      className="bg-black/10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-0.5">Compensation</label>
                    <Input 
                      type="text"
                      required
                      value={salaryRange}
                      onChange={(e) => setSalaryRange(e.target.value)}
                      placeholder="e.g. $120k - $140k"
                      className="bg-black/10"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-0.5">
                    {docType === 'offer_letter' ? "Candidate Name / Special Perks" : "Requirements / Context Details"}
                  </label>
                  <textarea 
                    rows={4}
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder={docType === 'offer_letter' ? "Enter Candidate name..." : "Provide custom requirements..."}
                    className="glass-input custom-scrollbar resize-none h-[96px] bg-black/10"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <Button 
                    type="submit" 
                    disabled={isGenerating}
                    className="flex-1 h-10 text-xs font-bold gap-1.5"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        <span>Writing Draft...</span>
                      </>
                    ) : (
                      <>
                        <FileText size={13} />
                        <span>Generate Document</span>
                      </>
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={handleTryDemoInput}
                    title="Load Demo Parameters"
                    className="h-10 px-3.5 text-xs font-bold"
                  >
                    Demo
                  </Button>
                </div>
              </form>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {generatedDoc ? (
              <Card className="p-6 relative overflow-hidden shadow-md h-full">
                <div className="flex items-center justify-between mb-4 border-b border-border pb-4">
                  <span className="text-[10px] uppercase tracking-widest font-black text-primary">Draft Document Compiled</span>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      size="icon"
                      onClick={handleCopy}
                      className="w-7 h-7 rounded-lg text-muted-foreground hover:text-foreground"
                      title="Copy to clipboard"
                    >
                      {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    </Button>
                    <Button 
                      variant="outline"
                      size="icon"
                      onClick={() => setGeneratedDoc('')}
                      className="w-7 h-7 rounded-lg text-muted-foreground hover:text-foreground"
                      title="Clear draft"
                    >
                      <X size={12} />
                    </Button>
                  </div>
                </div>
                <div className="bg-black/20 border border-border p-5 rounded-xl max-h-[600px] overflow-y-auto custom-scrollbar shadow-inner">
                  <MarkdownRenderer text={generatedDoc} />
                </div>
              </Card>
            ) : (
              <Card className="p-6 flex flex-col items-center justify-center text-center border-dashed border-border/60 bg-card/20 h-full min-h-[300px]">
                <FileText size={40} className="text-muted-foreground/30 mb-3 animate-pulse" />
                <h4 className="text-xs font-bold text-foreground/75 uppercase tracking-wider">No Active Draft Document</h4>
                <p className="text-[10px] text-muted-foreground mt-1 max-w-xs leading-normal">
                  Select a document target type, input job parameters, and click "Generate Document" to compile draft with Gemini AI.
                </p>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Markdown rendering helper
const MarkdownRenderer: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return null;
  const lines = text.split('\n');
  return (
    <div className="space-y-2 text-foreground/80 text-[11px] leading-relaxed font-medium">
      {lines.map((line, i) => {
        const content = line.trim();
        if (!content) return <div key={i} className="h-1.5" />;
        
        // Headers
        if (content.startsWith('### ')) {
          return <h5 key={i} className="text-[11px] font-bold text-primary mt-3 mb-1 uppercase tracking-wide">{content.slice(4)}</h5>;
        }
        if (content.startsWith('## ')) {
          return <h4 key={i} className="text-[11px] font-black text-foreground mt-4 mb-1.5 border-l-2 border-primary pl-2">{content.slice(3)}</h4>;
        }
        if (content.startsWith('# ')) {
          return <h3 key={i} className="text-xs font-black text-foreground mt-5 mb-2 border-b border-border pb-1">{content.slice(2)}</h3>;
        }

        // Bullet points
        if (content.startsWith('* ') || content.startsWith('- ')) {
          const formatted = parseBoldText(content.slice(2));
          return (
            <div key={i} className="flex gap-2 items-start pl-1 my-1">
              <span className="text-primary mt-1.5 shrink-0 w-1 h-1 rounded-full bg-primary" />
              <span>{formatted}</span>
            </div>
          );
        }

        // Numbered lists
        const numMatch = content.match(/^(\d+)\.\s(.*)/);
        if (numMatch) {
          const formatted = parseBoldText(numMatch[2]);
          return (
            <div key={i} className="flex gap-2 items-start pl-1 my-1">
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

const parseBoldText = (text: string) => {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, index) => {
    if (index % 2 === 1) {
      return <strong key={index} className="font-bold text-foreground">{part}</strong>;
    }
    return part;
  });
};
