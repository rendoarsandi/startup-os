import React, { useEffect, useState } from 'react';
import { 
  LayoutDashboard, Wallet, PieChart, TrendingUp, Settings, LogOut, Bell, Search, 
  Users, Sparkles, Briefcase, Award, Menu 
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeRole: 'cfo' | 'marketer' | 'hr';
  setActiveRole: (role: 'cfo' | 'marketer' | 'hr') => void;
  userName?: string;
  onSignOut?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeRole, setActiveRole, userName, onSignOut }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-cfo', 'theme-marketer', 'theme-hr');
    if (activeRole === 'marketer') {
      root.classList.add('theme-marketer');
    } else if (activeRole === 'hr') {
      root.classList.add('theme-hr');
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
    cfo: "Ask AI CFO about cashflow, burn rate, budgets...",
    marketer: "Ask AI CMO about growth campaigns, ad spend, copy concepts...",
    hr: "Ask AI CHRO about headcount, job descriptions, employee policies..."
  };

  const currentTitle = {
    cfo: "AI CFO",
    marketer: "AI CMO",
    hr: "AI CHRO"
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`w-64 glass-card fixed lg:relative inset-y-0 left-0 z-50 m-0 rounded-none border-y-0 border-l-0 lg:m-4 lg:mr-0 lg:rounded-2xl lg:border flex flex-col shrink-0 transition-transform duration-300 lg:translate-x-0 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-6 border-b border-border/50">
          <h1 className="text-2xl font-black bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent italic tracking-wider">
            {currentTitle[activeRole]}
          </h1>
          <p className="text-[10px] text-white/30 uppercase tracking-widest font-black mt-1">C-Suite Workspace</p>
        </div>

        {/* Office Switcher */}
        <div className="p-4 space-y-1.5 border-b border-border/50 bg-white/5">
          <div className="px-2 pb-1 text-[10px] font-semibold text-white/30 uppercase tracking-wider">
            Select Department
          </div>
          <button 
            onClick={() => setActiveRole('cfo')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeRole === 'cfo' 
                ? 'bg-primary/20 text-primary border border-primary/20 shadow-md shadow-primary/10' 
                : 'text-white/50 hover:bg-white/5 hover:text-white border border-transparent'
            }`}
          >
            <div className="flex items-center gap-2">
              <Briefcase size={14} />
              <span>Finance (CFO)</span>
            </div>
            {activeRole === 'cfo' && <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
          </button>
          
          <button 
            onClick={() => setActiveRole('marketer')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeRole === 'marketer' 
                ? 'bg-primary/20 text-primary border border-primary/20 shadow-md shadow-primary/10' 
                : 'text-white/50 hover:bg-white/5 hover:text-white border border-transparent'
            }`}
          >
            <div className="flex items-center gap-2">
              <Sparkles size={14} />
              <span>Marketing (CMO)</span>
            </div>
            {activeRole === 'marketer' && <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
          </button>

          <button 
            onClick={() => setActiveRole('hr')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeRole === 'hr' 
                ? 'bg-primary/20 text-primary border border-primary/20 shadow-md shadow-primary/10' 
                : 'text-white/50 hover:bg-white/5 hover:text-white border border-transparent'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users size={14} />
              <span>People Ops (CHRO)</span>
            </div>
            {activeRole === 'hr' && <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto custom-scrollbar">
          <div className="px-4 pb-2 text-[10px] font-semibold text-white/30 uppercase tracking-wider">
            Workspace
          </div>
          <NavLink icon={<LayoutDashboard size={20} />} label="Dashboard" active />
          {activeRole === 'cfo' && (
            <>
              <NavLink icon={<Wallet size={20} />} label="Transactions" />
              <NavLink icon={<PieChart size={20} />} label="Budgeting" />
              <NavLink icon={<TrendingUp size={20} />} label="Investments" />
            </>
          )}
          {activeRole === 'marketer' && (
            <>
              <NavLink icon={<Sparkles size={20} />} label="Campaign Ideas" />
              <NavLink icon={<TrendingUp size={20} />} label="Funnel Analysis" />
            </>
          )}
          {activeRole === 'hr' && (
            <>
              <NavLink icon={<Users size={20} />} label="Employees" />
              <NavLink icon={<Award size={20} />} label="Documents" />
            </>
          )}
          <div className="pt-6 pb-2 px-4 text-[10px] font-semibold text-white/30 uppercase tracking-wider">
            System
          </div>
          <NavLink icon={<Settings size={20} />} label="Settings" />
        </nav>

        <div className="p-4 border-t border-border">
          <button 
            onClick={onSignOut}
            className="nav-link w-full text-red-400 hover:bg-red-400/10 justify-center cursor-pointer"
          >
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Background blobs */}
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full -z-10 animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-secondary/20 blur-[100px] rounded-full -z-10" />

        {/* Header */}
        <header className="h-20 flex items-center justify-between px-4 sm:px-8 shrink-0 border-b border-border/10 bg-background/50 backdrop-blur-md">
          <div className="flex items-center gap-3 sm:gap-4 flex-1">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden text-white/60 hover:text-white p-2 rounded-xl hover:bg-white/5 cursor-pointer transition-colors"
            >
              <Menu size={22} />
            </button>
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
              <input 
                type="text" 
                placeholder={searchPlaceholder[activeRole]} 
                className="w-full bg-white/5 border border-border rounded-xl py-2 sm:py-2.5 pl-9 sm:pl-12 pr-4 focus:outline-none focus:border-primary/50 transition-all text-xs sm:text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            <button className="relative text-white/60 hover:text-white transition-colors cursor-pointer">
              <Bell size={22} />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--color-primary),0.5)]" />
            </button>
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-primary to-secondary p-[2px]">
              <div className="h-full w-full rounded-[10px] bg-background flex items-center justify-center font-bold text-xs sm:text-sm">
                {getInitials(userName)}
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar">
          {children}
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
  <a href="#" className={`nav-link ${active ? 'active' : ''}`}>
    {icon}
    <span className="font-medium">{label}</span>
  </a>
);

