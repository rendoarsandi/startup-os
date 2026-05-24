import React, { useEffect, useState } from 'react';
import { 
  LayoutDashboard, Wallet, PieChart, TrendingUp, Settings, LogOut, Bell, Search, 
  Users, Sparkles, Briefcase, Award, Menu, Package, FileText, CheckSquare, Ticket
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeRole: 'cfo' | 'marketer' | 'hr' | 'operations';
  setActiveRole: (role: 'cfo' | 'marketer' | 'hr' | 'operations') => void;
  userName?: string;
  onSignOut?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeRole, setActiveRole, userName, onSignOut }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-cfo', 'theme-marketer', 'theme-hr', 'theme-operations');
    if (activeRole === 'marketer') {
      root.classList.add('theme-marketer');
    } else if (activeRole === 'hr') {
      root.classList.add('theme-hr');
    } else if (activeRole === 'operations') {
      root.classList.add('theme-operations');
    } else {
      root.classList.add('theme-cfo');
    }
  }, [activeRole]);

  const getInitials = (name?: string) => {
    if (!name) return 'JD';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.trim().slice(0, 2).toUpperCase();
  };

  const searchPlaceholder = {
    cfo: "Ask AI CFO about outstanding invoices, cashflow, budgets...",
    marketer: "Ask AI CMO about CRM leads, conversion value, ad copy...",
    hr: "Ask AI CHRO about clock-in logs, leave approvals, expense claims...",
    operations: "Ask AI COO about stock quantities, project tasks, support tickets..."
  };

  const departmentLabel = {
    cfo: "Finance & Accounting",
    marketer: "Growth & Campaigns",
    hr: "People Ops & Talent",
    operations: "Operations & Logistics"
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background font-sans">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden transition-opacity duration-300 animate-in fade-in"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`w-64 glass-card fixed lg:relative inset-y-0 left-0 z-50 m-0 rounded-none border-y-0 border-l-0 lg:m-4 lg:mr-0 lg:rounded-xl lg:border flex flex-col shrink-0 transition-transform duration-300 lg:translate-x-0 bg-surface ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Sidebar Header with clean flat branding */}
        <div className="p-5 border-b border-border flex items-center gap-3.5 bg-[#0f111a]">
          <div className="h-9 w-9 rounded-lg border border-border p-1.5 flex items-center justify-center bg-[#0d0f17]">
            <img 
              src="/logo.png" 
              alt="Startup OS" 
              className="w-full h-full object-contain" 
            />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-wider leading-none">
              STARTUP OS
            </h1>
            <p className="text-[9px] text-slate-500 uppercase tracking-widest font-extrabold mt-1">C-Suite ERP system</p>
          </div>
        </div>

        {/* Department / Office Switcher */}
        <div className="p-4 space-y-2 border-b border-border bg-[#0f111a]">
          <div className="px-2 pb-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            ACTIVE C-SUITE OFFICE
          </div>
          
          <button 
            onClick={() => { setActiveRole('cfo'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeRole === 'cfo' 
                ? 'bg-primary/15 text-white border border-primary/20 shadow-sm font-extrabold' 
                : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Briefcase size={14} className={activeRole === 'cfo' ? 'text-primary' : ''} />
              <span>Finance (CFO)</span>
            </div>
            {activeRole === 'cfo' && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
          </button>
          
          <button 
            onClick={() => { setActiveRole('marketer'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeRole === 'marketer' 
                ? 'bg-primary/15 text-white border border-primary/20 shadow-sm font-extrabold' 
                : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Sparkles size={14} className={activeRole === 'marketer' ? 'text-primary' : ''} />
              <span>Marketing (CMO)</span>
            </div>
            {activeRole === 'marketer' && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
          </button>

          <button 
            onClick={() => { setActiveRole('hr'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeRole === 'hr' 
                ? 'bg-primary/15 text-white border border-primary/20 shadow-sm font-extrabold' 
                : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Users size={14} className={activeRole === 'hr' ? 'text-primary' : ''} />
              <span>People Ops (CHRO)</span>
            </div>
            {activeRole === 'hr' && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
          </button>

          <button 
            onClick={() => { setActiveRole('operations'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeRole === 'operations' 
                ? 'bg-primary/15 text-white border border-primary/20 shadow-sm font-extrabold' 
                : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Package size={14} className={activeRole === 'operations' ? 'text-primary' : ''} />
              <span>Operations (COO)</span>
            </div>
            {activeRole === 'operations' && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto custom-scrollbar bg-surface">
          <div className="px-3 pb-2 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
            ERP WORKSPACE MODULES
          </div>
          <NavLink icon={<LayoutDashboard size={18} />} label="Operational Hub" active />
          
          {activeRole === 'cfo' && (
            <>
              <NavLink icon={<FileText size={18} />} label="Sales & Bills" />
              <NavLink icon={<Wallet size={18} />} label="Ledger Logs" />
              <NavLink icon={<PieChart size={18} />} label="Budget Limits" />
              <NavLink icon={<TrendingUp size={18} />} label="Forecasting" />
            </>
          )}
          {activeRole === 'marketer' && (
            <>
              <NavLink icon={<Users size={18} />} label="CRM Pipeline" />
              <NavLink icon={<Sparkles size={18} />} label="Campaign Ideas" />
              <NavLink icon={<TrendingUp size={18} />} label="Funnel Analysis" />
            </>
          )}
          {activeRole === 'hr' && (
            <>
              <NavLink icon={<CheckSquare size={18} />} label="HR Boardroom" />
              <NavLink icon={<Users size={18} />} label="Roster logs" />
              <NavLink icon={<Award size={18} />} label="AI Document Suite" />
            </>
          )}
          {activeRole === 'operations' && (
            <>
              <NavLink icon={<Package size={18} />} label="Inventory & Stock" />
              <NavLink icon={<Briefcase size={18} />} label="Projects & Tasks" />
              <NavLink icon={<Ticket size={18} />} label="Support Helpdesk" />
            </>
          )}
          
          <div className="pt-6 pb-2 px-3 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
            SYSTEM
          </div>
          <NavLink icon={<Settings size={18} />} label="System Settings" />
        </nav>

        {/* Sidebar Footer with Sign Out */}
        <div className="p-4 border-t border-border bg-[#0f111a]">
          <button 
            onClick={onSignOut}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg hover:bg-red-500/10 text-red-400 hover:text-red-300 font-bold text-xs tracking-wider uppercase transition-all cursor-pointer justify-center border border-transparent hover:border-red-500/10"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="h-20 flex items-center justify-between px-6 sm:px-10 shrink-0 border-b border-border bg-surface z-30">
          <div className="flex items-center gap-4 flex-1">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden text-slate-400 hover:text-white p-2.5 rounded-lg hover:bg-white/5 cursor-pointer transition-colors border border-transparent hover:border-white/5"
            >
              <Menu size={20} />
            </button>
            <div className="relative max-w-md w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                type="text" 
                placeholder={searchPlaceholder[activeRole]} 
                className="glass-input pl-11 py-2.5 text-xs focus:border-primary/40 bg-[#0d0f17] border-border text-white placeholder-slate-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-5 sm:gap-6">
            <div className="hidden sm:block text-right">
              <div className="text-xs font-bold text-white/90">{departmentLabel[activeRole]}</div>
              <div className="text-[9px] text-slate-500 uppercase tracking-widest font-extrabold mt-0.5">Enterprise Suite</div>
            </div>
            
            <button className="relative text-slate-400 hover:text-white transition-colors cursor-pointer p-2.5 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/5">
              <Bell size={18} />
              <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-primary rounded-full" />
            </button>
            
            <div className="h-9 w-9 rounded-lg border border-border p-[1px] bg-slate-800">
              <div className="h-full w-full rounded-[7px] bg-[#0c0b16] flex items-center justify-center font-bold text-xs text-white/90">
                {getInitials(userName)}
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-10 custom-scrollbar z-20">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

interface NavLinkProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}

const NavLink: React.FC<NavLinkProps> = ({ icon, label, active }) => (
  <a href="#" className={`nav-link ${active ? 'active' : ''}`} onClick={(e) => e.preventDefault()}>
    {icon}
    <span className="font-semibold">{label}</span>
  </a>
);


