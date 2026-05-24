import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Slider } from './ui/slider';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { 
  Landmark, Cpu, Shield, Users, Save, Plus, Trash2, CheckCircle2 
} from 'lucide-react';

interface MockUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export const SystemSettings: React.FC = () => {
  // 1. Company Profile State
  const [companyName, setCompanyName] = useState('Startup OS Corp');
  const [companyDomain, setCompanyDomain] = useState('startupos.co');
  const [currency, setCurrency] = useState('USD');
  const [fiscalMonth, setFiscalMonth] = useState('January');

  // 2. AI Config State
  const [aiModel, setAiModel] = useState('Gemini 3.5 Flash');
  const [temperature, setTemperature] = useState<number>(0.4);
  const [autonomyLevel, setAutonomyLevel] = useState('Require Approval');
  const [systemPrompt, setSystemPrompt] = useState('You are Startup OS, an autonomous C-Suite AI assistant.');

  // 3. Module Toggles State
  const [cfoEnabled, setCfoEnabled] = useState(true);
  const [cmoEnabled, setCmoEnabled] = useState(true);
  const [chroEnabled, setChroEnabled] = useState(true);
  const [cooEnabled, setCooEnabled] = useState(true);

  // 4. Mock Users State
  const [users, setUsers] = useState<MockUser[]>([
    { id: '1', name: 'Rendo Arsandi', email: 'rendo@startupos.co', role: 'Administrator / Founder' },
    { id: '2', name: 'Alice Smith', email: 'alice@startupos.co', role: 'Finance (CFO)' },
    { id: '3', name: 'Bob Jones', email: 'bob@startupos.co', role: 'Operations (COO)' },
  ]);

  // Form state for adding user
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('Finance (CFO)');
  
  // Notification save status
  const [savedStatus, setSavedStatus] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const localCompany = localStorage.getItem('sys_company_name');
    if (localCompany) setCompanyName(localCompany);
    
    const localDomain = localStorage.getItem('sys_company_domain');
    if (localDomain) setCompanyDomain(localDomain);

    const localCurrency = localStorage.getItem('sys_currency');
    if (localCurrency) setCurrency(localCurrency);

    const localFiscal = localStorage.getItem('sys_fiscal_month');
    if (localFiscal) setFiscalMonth(localFiscal);

    const localModel = localStorage.getItem('sys_ai_model');
    if (localModel) setAiModel(localModel);

    const localTemp = localStorage.getItem('sys_temperature');
    if (localTemp) setTemperature(parseFloat(localTemp));

    const localAutonomy = localStorage.getItem('sys_autonomy');
    if (localAutonomy) setAutonomyLevel(localAutonomy);

    const localPrompt = localStorage.getItem('sys_system_prompt');
    if (localPrompt) setSystemPrompt(localPrompt);

    const localCfo = localStorage.getItem('sys_cfo_enabled');
    if (localCfo) setCfoEnabled(localCfo === 'true');
    const localCmo = localStorage.getItem('sys_cmo_enabled');
    if (localCmo) setCmoEnabled(localCmo === 'true');
    const localChro = localStorage.getItem('sys_chro_enabled');
    if (localChro) setChroEnabled(localChro === 'true');
    const localCoo = localStorage.getItem('sys_coo_enabled');
    if (localCoo) setCooEnabled(localCoo === 'true');

    const localUsers = localStorage.getItem('sys_users');
    if (localUsers) setUsers(JSON.parse(localUsers));
  }, []);

  // Save to localStorage
  const handleSaveSettings = () => {
    localStorage.setItem('sys_company_name', companyName);
    localStorage.setItem('sys_company_domain', companyDomain);
    localStorage.setItem('sys_currency', currency);
    localStorage.setItem('sys_fiscal_month', fiscalMonth);

    localStorage.setItem('sys_ai_model', aiModel);
    localStorage.setItem('sys_temperature', temperature.toString());
    localStorage.setItem('sys_autonomy', autonomyLevel);
    localStorage.setItem('sys_system_prompt', systemPrompt);

    localStorage.setItem('sys_cfo_enabled', cfoEnabled.toString());
    localStorage.setItem('sys_cmo_enabled', cmoEnabled.toString());
    localStorage.setItem('sys_chro_enabled', chroEnabled.toString());
    localStorage.setItem('sys_coo_enabled', cooEnabled.toString());

    localStorage.setItem('sys_users', JSON.stringify(users));

    setSavedStatus(true);
    setTimeout(() => setSavedStatus(false), 2500);
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;

    const newUser: MockUser = {
      id: Date.now().toString(),
      name: newUserName,
      email: newUserEmail,
      role: newUserRole,
    };

    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem('sys_users', JSON.stringify(updatedUsers));
    
    setNewUserName('');
    setNewUserEmail('');
  };

  const handleDeleteUser = (id: string) => {
    const updatedUsers = users.filter(u => u.id !== id);
    setUsers(updatedUsers);
    localStorage.setItem('sys_users', JSON.stringify(updatedUsers));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold mb-1.5 text-foreground tracking-tight flex items-center gap-2">
            System Settings
          </h2>
          <p className="text-muted-foreground text-sm font-medium">Verify company fiscal profiles, AI autonomous permissions, active modules, and user roles.</p>
        </div>
        <div className="flex items-center gap-2">
          {savedStatus && (
            <span className="text-emerald-400 font-bold text-xs flex items-center gap-1.5 animate-in fade-in duration-200">
              <CheckCircle2 size={14} /> Settings Saved
            </span>
          )}
          <Button 
            onClick={handleSaveSettings}
            className="h-10 text-xs font-bold gap-2 px-5"
          >
            <Save size={14} />
            <span>Save Settings</span>
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Profile & Modules */}
        <div className="space-y-6">
          {/* Company Profile Card */}
          <Card className="p-6">
            <CardHeader className="p-0 pb-5 border-b border-border flex flex-row items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Landmark size={16} />
              </div>
              <div>
                <CardTitle className="text-sm font-bold">Company Profile & Locale</CardTitle>
                <p className="text-muted-foreground text-[9px] uppercase tracking-widest font-black mt-0.5">ERP fiscal details</p>
              </div>
            </CardHeader>
            <CardContent className="p-0 pt-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-0.5">Company Name</label>
                  <Input 
                    type="text" 
                    value={companyName} 
                    onChange={(e) => setCompanyName(e.target.value)} 
                    className="bg-black/10" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-0.5">Primary Domain</label>
                  <Input 
                    type="text" 
                    value={companyDomain} 
                    onChange={(e) => setCompanyDomain(e.target.value)} 
                    className="bg-black/10" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-0.5">Base Currency</label>
                  <select 
                    value={currency} 
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full text-xs h-10 font-bold tracking-wider rounded-lg border border-border bg-black/10 px-2 uppercase text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="IDR">IDR (Rp)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-0.5">Fiscal Start Month</label>
                  <select 
                    value={fiscalMonth} 
                    onChange={(e) => setFiscalMonth(e.target.value)}
                    className="w-full text-xs h-10 font-bold tracking-wider rounded-lg border border-border bg-black/10 px-2 uppercase text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="January">January</option>
                    <option value="April">April</option>
                    <option value="July">July</option>
                    <option value="October">October</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Module Controls Card */}
          <Card className="p-6">
            <CardHeader className="p-0 pb-5 border-b border-border flex flex-row items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Shield size={16} />
              </div>
              <div>
                <CardTitle className="text-sm font-bold">Workspace Active Modules</CardTitle>
                <p className="text-muted-foreground text-[9px] uppercase tracking-widest font-black mt-0.5">Feature toggle manager</p>
              </div>
            </CardHeader>
            <CardContent className="p-0 pt-5 space-y-3.5">
              <div className="flex justify-between items-center p-3 rounded-lg bg-black/10 border border-border/80">
                <div>
                  <p className="text-xs font-bold text-foreground">Finance Hub (CFO)</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">Invoices, Ledgers, Budgets, Bank connection.</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={cfoEnabled} 
                  onChange={(e) => setCfoEnabled(e.target.checked)} 
                  className="w-4 h-4 accent-primary" 
                />
              </div>

              <div className="flex justify-between items-center p-3 rounded-lg bg-black/10 border border-border/80">
                <div>
                  <p className="text-xs font-bold text-foreground">Marketing Hub (CMO)</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">CRM Leads, Campaign generator, Funnel charts.</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={cmoEnabled} 
                  onChange={(e) => setCmoEnabled(e.target.checked)} 
                  className="w-4 h-4 accent-primary" 
                />
              </div>

              <div className="flex justify-between items-center p-3 rounded-lg bg-black/10 border border-border/80">
                <div>
                  <p className="text-xs font-bold text-foreground">People Ops Hub (CHRO)</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">Employee roster, AI documents, leaves & expenses.</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={chroEnabled} 
                  onChange={(e) => setChroEnabled(e.target.checked)} 
                  className="w-4 h-4 accent-primary" 
                />
              </div>

              <div className="flex justify-between items-center p-3 rounded-lg bg-black/10 border border-border/80">
                <div>
                  <p className="text-xs font-bold text-foreground">Operations Hub (COO)</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">Inventory SKU controls, Project task list, Helpdesk tickets.</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={cooEnabled} 
                  onChange={(e) => setCooEnabled(e.target.checked)} 
                  className="w-4 h-4 accent-primary" 
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: AI Config & Users */}
        <div className="space-y-6">
          {/* AI Settings Card */}
          <Card className="p-6">
            <CardHeader className="p-0 pb-5 border-b border-border flex flex-row items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Cpu size={16} />
              </div>
              <div>
                <CardTitle className="text-sm font-bold">AI & LLM Integration</CardTitle>
                <p className="text-muted-foreground text-[9px] uppercase tracking-widest font-black mt-0.5">Gemini core preferences</p>
              </div>
            </CardHeader>
            <CardContent className="p-0 pt-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-0.5">Primary AI Model</label>
                  <select 
                    value={aiModel} 
                    onChange={(e) => setAiModel(e.target.value)}
                    className="w-full text-xs h-10 font-bold tracking-wider rounded-lg border border-border bg-black/10 px-2 uppercase text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="Gemini 3.5 Flash">Gemini 3.5 Flash</option>
                    <option value="Gemini 3.5 Pro">Gemini 3.5 Pro</option>
                    <option value="Gemini 1.5 Pro">Gemini 1.5 Pro</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-0.5">Autonomy Level</label>
                  <select 
                    value={autonomyLevel} 
                    onChange={(e) => setAutonomyLevel(e.target.value)}
                    className="w-full text-xs h-10 font-bold tracking-wider rounded-lg border border-border bg-black/10 px-2 uppercase text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="None">None (Read-Only)</option>
                    <option value="Require Approval">Require Approval</option>
                    <option value="Fully Autonomous">Fully Autonomous</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-bold">
                  <span className="text-muted-foreground uppercase">Response Temperature</span>
                  <span className="text-primary font-black">{temperature}</span>
                </div>
                <Slider 
                  min={0.1}
                  max={1.0}
                  step={0.05}
                  value={[temperature]}
                  onValueChange={(val) => setTemperature(val[0])}
                  className="py-1"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-0.5">System Prompt Modifier</label>
                <textarea 
                  rows={2} 
                  value={systemPrompt} 
                  onChange={(e) => setSystemPrompt(e.target.value)} 
                  className="glass-input custom-scrollbar resize-none h-[72px] bg-black/10 text-xs font-semibold text-foreground/80 leading-normal p-3 rounded-lg border border-border/80 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </CardContent>
          </Card>

          {/* User Manager Card */}
          <Card className="p-6">
            <CardHeader className="p-0 pb-5 border-b border-border flex flex-row items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Users size={16} />
              </div>
              <div>
                <CardTitle className="text-sm font-bold">System Users & Roles</CardTitle>
                <p className="text-muted-foreground text-[9px] uppercase tracking-widest font-black mt-0.5">Identity access ledger</p>
              </div>
            </CardHeader>
            <CardContent className="p-0 pt-5 space-y-4">
              <div className="border border-border rounded-lg overflow-hidden bg-black/10 max-h-[220px] overflow-y-auto custom-scrollbar">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-4">Name</TableHead>
                      <TableHead>System Role</TableHead>
                      <TableHead className="w-10 pr-4 text-center"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="pl-4">
                          <div className="font-bold text-foreground text-xs">{user.name}</div>
                          <div className="text-[10px] text-muted-foreground font-semibold mt-0.5">{user.email}</div>
                        </TableCell>
                        <TableCell className="text-foreground/80 font-bold text-xs">{user.role}</TableCell>
                        <TableCell className="pr-4 text-center">
                          {user.id !== '1' && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleDeleteUser(user.id)}
                              className="w-7 h-7 rounded-md text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 size={13} />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Add User mini-form */}
              <form onSubmit={handleAddUser} className="border-t border-border pt-4 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                <div className="space-y-1.5 sm:col-span-1">
                  <label className="block text-[9px] font-bold text-muted-foreground uppercase tracking-widest pl-0.5">Name</label>
                  <Input 
                    type="text" 
                    required 
                    value={newUserName} 
                    onChange={(e) => setNewUserName(e.target.value)} 
                    placeholder="Jane Doe" 
                    className="bg-black/10 h-9 text-xs" 
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-1">
                  <label className="block text-[9px] font-bold text-muted-foreground uppercase tracking-widest pl-0.5">Email</label>
                  <Input 
                    type="email" 
                    required 
                    value={newUserEmail} 
                    onChange={(e) => setNewUserEmail(e.target.value)} 
                    placeholder="jane@..." 
                    className="bg-black/10 h-9 text-xs" 
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-1">
                  <label className="block text-[9px] font-bold text-muted-foreground uppercase tracking-widest pl-0.5">Role</label>
                  <select 
                    value={newUserRole} 
                    onChange={(e) => setNewUserRole(e.target.value)}
                    className="w-full text-xs h-9 font-bold tracking-wider rounded-lg border border-border bg-black/10 px-1 uppercase text-foreground focus:outline-none"
                  >
                    <option value="Finance (CFO)">CFO</option>
                    <option value="Marketing (CMO)">CMO</option>
                    <option value="People Ops (CHRO)">CHRO</option>
                    <option value="Operations (COO)">COO</option>
                  </select>
                </div>
                <Button type="submit" className="h-9 text-[10px] font-bold gap-1.5 sm:col-span-1 w-full">
                  <Plus size={12} /> Add
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
