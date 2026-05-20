import React from 'react';
import { LayoutDashboard, Wallet, PieChart, TrendingUp, Settings, LogOut, Bell, Search } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 glass-card m-4 mr-0 flex flex-col">
        <div className="p-8">
          <h1 className="text-2xl font-black bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent italic">
            AI CFO
          </h1>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <NavLink icon={<LayoutDashboard size={20} />} label="Dashboard" active />
          <NavLink icon={<Wallet size={20} />} label="Transactions" />
          <NavLink icon={<PieChart size={20} />} label="Budgeting" />
          <NavLink icon={<TrendingUp size={20} />} label="Investments" />
          <div className="pt-8 pb-4 px-4 text-xs font-semibold text-white/30 uppercase tracking-wider">
            System
          </div>
          <NavLink icon={<Settings size={20} />} label="Settings" />
        </nav>

        <div className="p-4 border-t border-border">
          <button className="nav-link w-full text-red-400 hover:bg-red-400/10">
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
        <header className="h-20 flex items-center justify-between px-8">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
              <input 
                type="text" 
                placeholder="Ask AI CFO anything..." 
                className="w-full bg-white/5 border border-border rounded-xl py-2.5 pl-12 pr-4 focus:outline-none focus:border-primary/50 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button className="relative text-white/60 hover:text-white transition-colors">
              <Bell size={22} />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--color-primary),0.5)]" />
            </button>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-secondary p-[2px]">
              <div className="h-full w-full rounded-[10px] bg-background flex items-center justify-center font-bold">
                JD
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
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
