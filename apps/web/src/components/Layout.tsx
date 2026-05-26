import React, { useEffect, useState } from 'react';
import { 
  LayoutDashboard, Wallet, PieChart, TrendingUp, Settings, LogOut, Bell, Search, 
  Users, Sparkles, Briefcase, Award, Menu, Package, FileText, CheckSquare, Ticket, ChevronDown, Calendar, Sun, Moon
} from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import { cn } from '../utils/cn';

interface LayoutProps {
  children: React.ReactNode;
  activeRole: 'cfo' | 'marketer' | 'hr' | 'operations';
  setActiveRole: (role: 'cfo' | 'marketer' | 'hr' | 'operations') => void;
  userName?: string;
  onSignOut?: () => void;
  currentView: string;
  onViewChange: (view: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeRole, setActiveRole, userName, onSignOut, currentView, onViewChange }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('sys_theme');
    return (saved as 'light' | 'dark') || 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
    }
    localStorage.setItem('sys_theme', theme);
  }, [theme]);

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
    <TooltipProvider>
      <div className="flex h-screen overflow-hidden bg-background text-foreground font-sans">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/80 z-40 lg:hidden transition-opacity duration-300 animate-in fade-in"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={cn(
          "w-66 border-r border-border bg-card/40 backdrop-blur-md fixed lg:relative inset-y-0 left-0 z-50 flex flex-col shrink-0 transition-transform duration-300 lg:translate-x-0",
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}>
          {/* Sidebar Header */}
          <div className="p-6 border-b border-border flex items-center gap-3.5 bg-black/10">
            <div className="h-9 w-9 rounded-lg border border-border p-1.5 flex items-center justify-center bg-background">
              <img 
                src="/logo.png" 
                alt="Startup OS" 
                className="w-full h-full object-contain" 
              />
            </div>
            <div>
              <h1 className="text-xs font-black text-foreground tracking-wider leading-none">
                STARTUP OS
              </h1>
              <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-black mt-1">C-Suite ERP system</p>
            </div>
          </div>

          {/* Department Switcher */}
          <div className="p-4 space-y-2 border-b border-border bg-black/10">
            <div className="px-2 pb-1.5 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
              ACTIVE C-SUITE OFFICE
            </div>
            
            <Button 
              variant="ghost"
              onClick={() => { setActiveRole('cfo'); setIsSidebarOpen(false); }}
              className={cn(
                "w-full justify-start text-xs font-bold gap-2.5 h-9 px-3 rounded-lg border border-transparent",
                activeRole === 'cfo' 
                  ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 hover:text-primary" 
                  : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
              )}
            >
              <Briefcase size={14} className={cn("shrink-0", activeRole === 'cfo' ? 'text-primary' : 'text-muted-foreground')} />
              <span>Finance (CFO)</span>
            </Button>
            
            <Button 
              variant="ghost"
              onClick={() => { setActiveRole('marketer'); setIsSidebarOpen(false); }}
              className={cn(
                "w-full justify-start text-xs font-bold gap-2.5 h-9 px-3 rounded-lg border border-transparent",
                activeRole === 'marketer' 
                  ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 hover:text-primary" 
                  : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
              )}
            >
              <Sparkles size={14} className={cn("shrink-0", activeRole === 'marketer' ? 'text-primary' : 'text-muted-foreground')} />
              <span>Marketing (CMO)</span>
            </Button>

            <Button 
              variant="ghost"
              onClick={() => { setActiveRole('hr'); setIsSidebarOpen(false); }}
              className={cn(
                "w-full justify-start text-xs font-bold gap-2.5 h-9 px-3 rounded-lg border border-transparent",
                activeRole === 'hr' 
                  ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 hover:text-primary" 
                  : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
              )}
            >
              <Users size={14} className={cn("shrink-0", activeRole === 'hr' ? 'text-primary' : 'text-muted-foreground')} />
              <span>People Ops (CHRO)</span>
            </Button>

            <Button 
              variant="ghost"
              onClick={() => { setActiveRole('operations'); setIsSidebarOpen(false); }}
              className={cn(
                "w-full justify-start text-xs font-bold gap-2.5 h-9 px-3 rounded-lg border border-transparent",
                activeRole === 'operations' 
                  ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 hover:text-primary" 
                  : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
              )}
            >
              <Package size={14} className={cn("shrink-0", activeRole === 'operations' ? 'text-primary' : 'text-muted-foreground')} />
              <span>Operations (COO)</span>
            </Button>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto bg-transparent">
            <div className="px-3 pb-2 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
              ERP WORKSPACE MODULES
            </div>
            <NavLink 
              icon={<LayoutDashboard size={16} />} 
              label="Operational Hub" 
              active={currentView === 'dashboard'} 
              onClick={() => onViewChange('dashboard')}
            />
            
            {activeRole === 'cfo' && (
              <>
                <NavLink 
                  icon={<FileText size={16} />} 
                  label="Sales & Bills" 
                  active={currentView === 'invoices'}
                  onClick={() => onViewChange('invoices')}
                />
                <NavLink 
                  icon={<Wallet size={16} />} 
                  label="Ledger Logs" 
                  active={currentView === 'ledger'}
                  onClick={() => onViewChange('ledger')}
                />
                <NavLink 
                  icon={<PieChart size={16} />} 
                  label="Budget Limits" 
                  active={currentView === 'budgets'}
                  onClick={() => onViewChange('budgets')}
                />
                <NavLink 
                  icon={<TrendingUp size={16} />} 
                  label="Forecasting" 
                  active={currentView === 'forecasting'}
                  onClick={() => onViewChange('forecasting')}
                />
              </>
            )}
            {activeRole === 'marketer' && (
              <>
                <NavLink 
                  icon={<Users size={16} />} 
                  label="CRM Pipeline" 
                  active={currentView === 'crm'}
                  onClick={() => onViewChange('crm')}
                />
                <NavLink 
                  icon={<Sparkles size={16} />} 
                  label="Campaign Ideas" 
                  active={currentView === 'campaigns'}
                  onClick={() => onViewChange('campaigns')}
                />
                <NavLink 
                  icon={<TrendingUp size={16} />} 
                  label="Funnel Analysis" 
                  active={currentView === 'funnel'}
                  onClick={() => onViewChange('funnel')}
                />
              </>
            )}
            {activeRole === 'hr' && (
              <>
                <NavLink 
                  icon={<CheckSquare size={16} />} 
                  label="HR Boardroom" 
                  active={currentView === 'boardroom'}
                  onClick={() => onViewChange('boardroom')}
                />
                <NavLink 
                  icon={<Users size={16} />} 
                  label="Roster Logs" 
                  active={currentView === 'roster'}
                  onClick={() => onViewChange('roster')}
                />
                <NavLink 
                  icon={<Award size={16} />} 
                  label="AI Document Suite" 
                  active={currentView === 'documents'}
                  onClick={() => onViewChange('documents')}
                />
                <NavLink 
                  icon={<Calendar size={16} />} 
                  label="Attendance & Leaves" 
                  active={currentView === 'attendance'}
                  onClick={() => onViewChange('attendance')}
                />
                <NavLink 
                  icon={<FileText size={16} />} 
                  label="Expense Claims" 
                  active={currentView === 'expenses'}
                  onClick={() => onViewChange('expenses')}
                />
              </>
            )}
            {activeRole === 'operations' && (
              <>
                <NavLink 
                  icon={<Package size={16} />} 
                  label="Inventory & Stock" 
                  active={currentView === 'inventory'}
                  onClick={() => onViewChange('inventory')}
                />
                <NavLink 
                  icon={<Briefcase size={16} />} 
                  label="Projects & Tasks" 
                  active={currentView === 'projects'}
                  onClick={() => onViewChange('projects')}
                />
                <NavLink 
                  icon={<Ticket size={16} />} 
                  label="Support Helpdesk" 
                  active={currentView === 'tickets'}
                  onClick={() => onViewChange('tickets')}
                />
              </>
            )}
            
            <div className="pt-6 pb-2 px-3 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
              SYSTEM
            </div>
            <NavLink 
              icon={<Settings size={16} />} 
              label="System Settings" 
              active={currentView === 'settings'}
              onClick={() => onViewChange('settings')}
            />
          </nav>

          {/* Sidebar Footer with Sign Out */}
          <div className="p-4 border-t border-border bg-black/10">
            <Button 
              variant="ghost"
              onClick={onSignOut}
              className="w-full justify-start text-xs font-bold text-destructive hover:bg-destructive/10 hover:text-destructive h-10 px-3 rounded-lg"
            >
              <LogOut size={14} className="mr-2" />
              <span>Sign Out</span>
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Header */}
          <header className="h-20 flex items-center justify-between px-6 sm:px-8 shrink-0 border-b border-border bg-card/20 backdrop-blur-md z-30">
            <div className="flex items-center gap-4 flex-1">
              <Button 
                variant="outline"
                size="icon"
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden h-9 w-9"
              >
                <Menu size={16} />
              </Button>
              <div className="relative max-w-md w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                <input 
                  type="text" 
                  placeholder={searchPlaceholder[activeRole]} 
                  className="glass-input pl-10 py-2.5 text-xs bg-black/10 hover:bg-black/20 focus:bg-black/30 border-border"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-right">
                <div className="text-xs font-bold text-foreground">{departmentLabel[activeRole]}</div>
                <div className="text-[9px] text-muted-foreground uppercase tracking-widest font-black mt-0.5">Enterprise Suite</div>
              </div>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
                    className="h-9 w-9"
                  >
                    {theme === 'dark' ? (
                      <Sun size={16} className="text-muted-foreground hover:text-foreground" />
                    ) : (
                      <Moon size={16} className="text-muted-foreground hover:text-foreground" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{theme === 'dark' ? "Light Mode" : "Dark Mode"}</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative h-9 w-9">
                    <Bell size={16} className="text-muted-foreground hover:text-foreground" />
                    <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-primary rounded-full" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Notifications</p>
                </TooltipContent>
              </Tooltip>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-9 p-1 pr-2 gap-2 rounded-lg border border-border hover:bg-accent/40">
                    <div className="h-7 w-7 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-xs text-primary">
                      {getInitials(userName)}
                    </div>
                    <ChevronDown size={12} className="text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="px-2.5 py-1.5">
                    <p className="text-xs font-bold text-foreground">{userName || 'User'}</p>
                    <p className="text-[10px] text-muted-foreground">{departmentLabel[activeRole]}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setActiveRole('cfo')}>
                    Finance (CFO)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveRole('marketer')}>
                    Marketing (CMO)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveRole('hr')}>
                    People Ops (CHRO)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveRole('operations')}>
                    Operations (COO)
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive" onClick={onSignOut}>
                    <LogOut size={12} className="mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Scrollable Area */}
          <main className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar z-20">
            <div className="max-w-7xl mx-auto w-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
};

interface NavLinkProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

const NavLink: React.FC<NavLinkProps> = ({ icon, label, active, onClick }) => (
  <a 
    href="#" 
    className={cn("nav-link", active && "active")} 
    onClick={(e) => {
      e.preventDefault();
      if (onClick) onClick();
    }}
  >
    {icon}
    <span>{label}</span>
  </a>
);
