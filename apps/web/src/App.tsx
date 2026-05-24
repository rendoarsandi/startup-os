import { Layout } from './components/Layout'
import { AuthPage } from './components/AuthPage'
import { Chat } from './components/Chat'
import { TransactionList } from './components/TransactionList'
import { TransactionModal } from './components/TransactionModal'
import { BudgetTracker } from './components/BudgetTracker'
import { SpendingTrendChart, RunwayProjectionChart } from './components/Charts'
import { PlaidLinkButton } from './components/PlaidLink'
import { MarketingDashboard } from './components/MarketingDashboard'
import { HRDashboard } from './components/HRDashboard'
import { InvoicesDashboard } from './components/InvoicesDashboard'
import { CRMPipeline } from './components/CRMPipeline'
import { HROperations } from './components/HROperations'
import { COOOperations } from './components/COOOperations'
import { useState, useEffect } from 'react'

import { useQuery, useMutation } from '@tanstack/react-query'
import { useTransactions } from './hooks/useTransactions'
import { calculateCustomProjections } from './hooks/useScenario'

function App() {
  const [activeRole, setActiveRole] = useState<'cfo' | 'marketer' | 'hr' | 'operations'>('cfo');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [chatSeedPrompt, setChatSeedPrompt] = useState<string | undefined>(undefined);

  // View states to toggle between original AI dashboard and clean structured ERP registers
  const [cfoView, setCfoView] = useState<'overview' | 'invoices'>('overview');
  const [cmoView, setCmoView] = useState<'campaigns' | 'crm'>('crm');
  const [chroView, setChroView] = useState<'roster' | 'operations'>('operations');

  // Session state
  const [session, setSession] = useState<{ user: { id: string, email: string, name: string } } | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  // Custom Runway Projection growth and seasonality parameters
  const [revGrowth, setRevGrowth] = useState<number>(0);
  const [expGrowth, setExpGrowth] = useState<number>(0);
  const [seasonalityProfile, setSeasonalityProfile] = useState<string>('steady');
  const [isParamsOpen, setIsParamsOpen] = useState<boolean>(false);

  const checkSession = async () => {
    try {
      const res = await fetch('/api/auth/get-session');
      if (res.ok) {
        const data = await res.json();
        if (data && data.user) {
          setSession(data);
        } else {
          setSession(null);
        }
      } else {
        setSession(null);
      }
    } catch (err) {
      console.error("Session check failed", err);
      setSession(null);
    } finally {
      setLoadingSession(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/sign-out', { method: 'POST' });
    } catch (err) {
      console.error("Sign out failed", err);
    }
    setSession(null);
  };

  const { transactions } = useTransactions(!!session);

  // Query for bank accounts
  const { data: accounts = [] } = useQuery<{ id: string, name: string, balance: number, type: string }[]>({
    queryKey: ['accounts', refreshKey, session?.user?.id],
    queryFn: async () => {
      const res = await fetch('/api/accounts');
      if (!res.ok) throw new Error('Failed to fetch accounts');
      return res.json();
    },
    enabled: !!session,
  });


  // Query for Cash Runway and Burn Rate details
  const { data: runwayData, isLoading: runwayLoading } = useQuery<{
    cashBalance: number;
    fixedCosts: { payroll: number; subscriptions: number; total: number };
    variableExpenses: number;
    monthlyRevenue: number;
    netBurn: number;
    runwayMonths: number | "Infinite";
    projections: { month: string; balance: number }[];
    startingMrr?: number;
    churnRate?: number;
    cac?: number;
    arpu?: number;
  }>({
    queryKey: ['runway', refreshKey, session?.user?.id],
    queryFn: async () => {
      const res = await fetch('/api/cfo/runway');
      if (!res.ok) throw new Error('Failed to fetch runway data');
      return res.json();
    },
    enabled: !!session,
  });

  // Query for SaaS config
  const { data: saasConfig, refetch: refetchSaasConfig } = useQuery<{
    startingMrr: number;
    churnRate: number;
    cac: number;
    arpu: number;
  }>({
    queryKey: ['saasConfig', refreshKey, session?.user?.id],
    queryFn: async () => {
      const res = await fetch('/api/cfo/saas-config');
      if (!res.ok) throw new Error('Failed to fetch SaaS config');
      return res.json();
    },
    enabled: !!session,
  });

  const [mrrInput, setMrrInput] = useState<number>(0);
  const [churnInput, setChurnInput] = useState<number>(0);
  const [cacInput, setCacInput] = useState<number>(0);
  const [arpuInput, setArpuInput] = useState<number>(0);

  useEffect(() => {
    if (saasConfig) {
      setMrrInput(Math.round(saasConfig.startingMrr / 100));
      setChurnInput(saasConfig.churnRate / 100);
      setCacInput(Math.round(saasConfig.cac / 100));
      setArpuInput(Math.round(saasConfig.arpu / 100));
    }
  }, [saasConfig]);

  const saasMutation = useMutation({
    mutationFn: async (newConfig: { startingMrr: number; churnRate: number; cac: number; arpu: number }) => {
      const res = await fetch('/api/cfo/saas-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
      });
      if (!res.ok) throw new Error('Failed to update SaaS config');
      return res.json();
    },
    onSuccess: () => {
      setRefreshKey(prev => prev + 1); // refresh runway query which fetches from db
      refetchSaasConfig();
    }
  });

  // Calculate custom runway based on growth and seasonality parameters
  const customRunway = runwayData
    ? calculateCustomProjections(runwayData, revGrowth, expGrowth, seasonalityProfile)
    : undefined;

  // Calculate dynamic stats
  const totalBalanceCents = accounts.length > 0
    ? accounts.reduce((sum, acc) => sum + acc.balance, 0)
    : 4259020; // fallback default cents

  const monthlySpendingCents = transactions
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const formattedBalance = `$${(totalBalanceCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formattedSpending = `$${(monthlySpendingCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  if (loadingSession) {
    return (
      <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-background relative overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[130px] rounded-full -z-10 animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-secondary/20 blur-[120px] rounded-full -z-10" />
        <div className="glass-card p-8 flex flex-col items-center gap-4 max-w-xs w-full border border-white/10 shadow-2xl">
          <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-white/60">Securing environment...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <AuthPage onAuthSuccess={checkSession} />;
  }

  return (
    <Layout 
      activeRole={activeRole} 
      setActiveRole={setActiveRole}
      userName={session.user.name}
      onSignOut={handleSignOut}
    >
      <div className="space-y-8">
        {activeRole === 'cfo' && (
          <div className="space-y-6">
            {/* View toggles */}
            <div className="flex border border-white/5 rounded-lg overflow-hidden bg-white/[0.02] p-[2px] w-full sm:w-auto self-start">
              <button 
                onClick={() => setCfoView('overview')}
                className={`px-4 py-2 text-xs font-bold uppercase rounded-md tracking-wider transition-all cursor-pointer ${cfoView === 'overview' ? 'bg-white/10 text-white font-extrabold' : 'text-white/40 hover:text-white/70'}`}
              >
                Financial Analytics
              </button>
              <button 
                onClick={() => setCfoView('invoices')}
                className={`px-4 py-2 text-xs font-bold uppercase rounded-md tracking-wider transition-all cursor-pointer ${cfoView === 'invoices' ? 'bg-white/10 text-white font-extrabold' : 'text-white/40 hover:text-white/70'}`}
              >
                Invoices & Billing Register
              </button>
            </div>

            {cfoView === 'overview' ? (
              <>
                <header>
                  <h2 className="text-3xl font-bold mb-2 text-white">
                    CFO Financial Dashboard
                  </h2>
                  <p className="text-slate-400 text-sm">Your AI CFO has analyzed 12 new transactions today.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <StatCard 
                    title="Total Balance" 
                    value={formattedBalance} 
                    change={accounts.length > 0 ? "Live" : "+2.5%"} 
                    isPositive={true} 
                  />
                  <StatCard 
                    title="Monthly Spending" 
                    value={formattedSpending} 
                    change={transactions.length > 0 ? "Calculated" : "-12%"} 
                    isPositive={true} 
                  />
                  <StatCard 
                    title="AI Cash Runway" 
                    value={runwayLoading ? "Loading..." : customRunway?.runwayMonths === "Infinite" ? "Infinite Runway" : `${customRunway?.runwayMonths ?? '0'} Months`} 
                    change={runwayLoading ? "Calculating" : customRunway?.runwayMonths === "Infinite" ? "Profitable" : `$${Math.round((customRunway?.netBurn ?? 0) / 100).toLocaleString()}/mo burn`} 
                    isPositive={customRunway?.runwayMonths === "Infinite" || (customRunway?.runwayMonths ?? 12) >= 6} 
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-8">
                    <div className="glass-card p-8 min-h-[400px]">
                      <h3 className="text-xl font-bold mb-6">Spending Trends</h3>
                      <SpendingTrendChart />
                    </div>

                    <div className="glass-card p-8 min-h-[400px]">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold">Cash Runway Projections</h3>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => setIsParamsOpen(!isParamsOpen)}
                            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20 bg-white/5 text-white/70 hover:text-white transition-all cursor-pointer animate-pulse"
                          >
                            ⚙️ Model Parameters {isParamsOpen ? '▲' : '▼'}
                          </button>
                          {!runwayLoading && customRunway && (
                            <span className={`text-xs px-2.5 py-1 rounded-md font-bold ${
                              customRunway.runwayMonths === 'Infinite' 
                                ? 'bg-green-500/10 text-green-400' 
                                : customRunway.runwayMonths < 6 
                                  ? 'bg-red-500/10 text-red-400 animate-pulse' 
                                  : 'bg-amber-500/10 text-amber-400'
                            }`}>
                              {customRunway.runwayMonths === 'Infinite' 
                                ? 'Profitable' 
                                : `${customRunway.runwayMonths} Mo. Runway`}
                            </span>
                          )}
                        </div>
                      </div>

                      {isParamsOpen && (
                        <div className="mb-6 p-6 rounded-xl border border-white/5 bg-white/[0.02] space-y-6 animate-in slide-in-from-top duration-200">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-white/60 font-medium">Revenue Growth Rate</span>
                                <span className="text-primary font-bold">{revGrowth >= 0 ? '+' : ''}{revGrowth}% MoM</span>
                              </div>
                              <input 
                                type="range"
                                min="-10"
                                max="20"
                                step="0.5"
                                value={revGrowth}
                                onChange={(e) => setRevGrowth(parseFloat(e.target.value))}
                                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                              />
                              <p className="text-[10px] text-white/30">Compounds baseline monthly revenue.</p>
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-white/60 font-medium">Expense Growth Rate</span>
                                <span className="text-secondary font-bold">{expGrowth >= 0 ? '+' : ''}{expGrowth}% MoM</span>
                              </div>
                              <input 
                                type="range"
                                min="-10"
                                max="20"
                                step="0.5"
                                value={expGrowth}
                                onChange={(e) => setExpGrowth(parseFloat(e.target.value))}
                                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-secondary"
                              />
                              <p className="text-[10px] text-white/30">Compounds baseline monthly expenses.</p>
                            </div>

                            <div className="space-y-2">
                              <label className="block text-xs text-white/60 font-medium mb-2.5">Seasonality Profile</label>
                              <div className="relative">
                                <select 
                                  value={seasonalityProfile}
                                  onChange={(e) => setSeasonalityProfile(e.target.value)}
                                  className="w-full h-9 bg-black/40 border border-white/10 rounded-lg px-3.5 text-xs text-white/80 focus:outline-none focus:border-primary cursor-pointer appearance-none"
                                >
                                  <option value="steady">Steady state (No seasonality)</option>
                                  <option value="growth">Hyper growth (Q3 surge)</option>
                                  <option value="summer-dip">Summer Dip (August slump)</option>
                                </select>
                                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-white/40 text-[9px]">
                                  ▼
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <RunwayProjectionChart projections={customRunway?.projections || []} />
                    </div>

                    <div className="glass-card p-8 min-h-[400px]">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold">Transaction History</h3>
                        <button 
                          onClick={() => setIsModalOpen(true)}
                          className="btn-primary flex items-center gap-1.5 text-xs font-bold px-4 py-2 cursor-pointer"
                        >
                          <span className="text-sm">+</span> Add Transaction
                        </button>
                      </div>
                      <TransactionList />
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="glass-card p-8">
                      <h3 className="text-xl font-bold mb-4">SaaS Valuation Metrics</h3>
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <label className="block text-xs text-white/60 font-medium">Starting MRR (USD)</label>
                          <input 
                            type="number"
                            value={mrrInput}
                            onChange={(e) => setMrrInput(Number(e.target.value))}
                            className="w-full h-10 bg-black/40 border border-white/10 rounded-xl px-4 text-sm text-white focus:outline-none focus:border-primary"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="block text-xs text-white/60 font-medium">Churn Rate (%)</label>
                            <input 
                              type="number"
                              step="0.1"
                              value={churnInput}
                              onChange={(e) => setChurnInput(Number(e.target.value))}
                              className="w-full h-10 bg-black/40 border border-white/10 rounded-xl px-4 text-sm text-white focus:outline-none focus:border-primary"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-xs text-white/60 font-medium">CAC (USD)</label>
                            <input 
                              type="number"
                              value={cacInput}
                              onChange={(e) => setCacInput(Number(e.target.value))}
                              className="w-full h-10 bg-black/40 border border-white/10 rounded-xl px-4 text-sm text-white focus:outline-none focus:border-primary"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="block text-xs text-white/60 font-medium">ARPU (USD)</label>
                          <input 
                            type="number"
                            value={arpuInput}
                            onChange={(e) => setArpuInput(Number(e.target.value))}
                            className="w-full h-10 bg-black/40 border border-white/10 rounded-xl px-4 text-sm text-white focus:outline-none focus:border-primary"
                          />
                        </div>
                        <button
                          onClick={() => saasMutation.mutate({
                            startingMrr: mrrInput * 100,
                            churnRate: Math.round(churnInput * 100),
                            cac: cacInput * 100,
                            arpu: arpuInput * 100
                          })}
                          disabled={saasMutation.isPending}
                          className="w-full h-11 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl font-bold text-xs tracking-wider uppercase transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          {saasMutation.isPending ? "Updating..." : "Recalculate SaaS Model"}
                        </button>
                      </div>
                    </div>

                    <div className="glass-card p-8">
                      <h3 className="text-xl font-bold mb-4">Budget Limits</h3>
                      <BudgetTracker />
                    </div>

                    <div className="glass-card p-8 space-y-6">
                      <div className="flex justify-between items-center border-b border-white/5 pb-4">
                        <div>
                          <h3 className="text-xl font-bold">SVB Connected</h3>
                          <p className="text-[10px] text-white/40 uppercase tracking-widest font-black mt-0.5">Plaid secure credential integration</p>
                        </div>
                        {accounts.length > 0 && (
                          <SyncBankButton onSyncSuccess={() => setRefreshKey(prev => prev + 1)} />
                        )}
                      </div>
                      
                      {accounts.length > 0 ? (
                        <div className="space-y-3">
                          {accounts.map((acc: any) => (
                            <div key={acc.id} className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/10">
                              <div>
                                <p className="text-sm font-semibold text-white">{acc.name}</p>
                                <p className="text-[10px] text-white/40 capitalize">{acc.type}</p>
                              </div>
                              <p className="text-sm font-bold text-white">
                                ${(acc.balance / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-zinc-500 text-xs">No bank accounts linked yet.</p>
                      )}
                      
                      <PlaidLinkButton onSuccess={() => setRefreshKey(prev => prev + 1)} />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <InvoicesDashboard />
            )}
          </div>
        )}

        {activeRole === 'marketer' && (
          <div className="space-y-6">
            <div className="flex border border-white/5 rounded-lg overflow-hidden bg-white/[0.02] p-[2px] w-full sm:w-auto self-start mb-2">
              <button 
                onClick={() => setCmoView('crm')}
                className={`px-4 py-2 text-xs font-bold uppercase rounded-md tracking-wider transition-all cursor-pointer ${cmoView === 'crm' ? 'bg-white/10 text-white font-extrabold' : 'text-white/40 hover:text-white/70'}`}
              >
                CRM Lead Pipeline
              </button>
              <button 
                onClick={() => setCmoView('campaigns')}
                className={`px-4 py-2 text-xs font-bold uppercase rounded-md tracking-wider transition-all cursor-pointer ${cmoView === 'campaigns' ? 'bg-white/10 text-white font-extrabold' : 'text-white/40 hover:text-white/70'}`}
              >
                AI Marketing Campaigns
              </button>
            </div>
            {cmoView === 'crm' ? <CRMPipeline /> : <MarketingDashboard />}
          </div>
        )}

        {activeRole === 'hr' && (
          <div className="space-y-6">
            <div className="flex border border-white/5 rounded-lg overflow-hidden bg-white/[0.02] p-[2px] w-full sm:w-auto self-start mb-2">
              <button 
                onClick={() => setChroView('operations')}
                className={`px-4 py-2 text-xs font-bold uppercase rounded-md tracking-wider transition-all cursor-pointer ${chroView === 'operations' ? 'bg-white/10 text-white font-extrabold' : 'text-white/40 hover:text-white/70'}`}
              >
                HR Punch Card & Claims
              </button>
              <button 
                onClick={() => setChroView('roster')}
                className={`px-4 py-2 text-xs font-bold uppercase rounded-md tracking-wider transition-all cursor-pointer ${chroView === 'roster' ? 'bg-white/10 text-white font-extrabold' : 'text-white/40 hover:text-white/70'}`}
              >
                AI Job Desk Roster
              </button>
            </div>
            {chroView === 'operations' ? <HROperations /> : <HRDashboard />}
          </div>
        )}

        {activeRole === 'operations' && <COOOperations />}

        <Chat activeRole={activeRole} seedPrompt={chatSeedPrompt} setSeedPrompt={setChatSeedPrompt} />

        <TransactionModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={() => setRefreshKey(prev => prev + 1)}
        />
      </div>
    </Layout>
  )
}

const StatCard = ({ title, value, change, isPositive }: { title: string, value: string, change: string, isPositive: boolean }) => (
  <div className="glass-card p-6 group hover:border-primary/50 transition-all cursor-default">
    <p className="text-white/50 text-sm font-medium mb-1">{title}</p>
    <div className="flex items-end justify-between">
      <h4 className="text-2xl font-bold">{value}</h4>
      <span className={`text-xs font-bold px-2 py-1 rounded-lg ${isPositive ? 'bg-green-400/10 text-green-400' : 'bg-red-400/10 text-red-400'}`}>
        {change}
      </span>
    </div>
  </div>
)

export const InsightItem = ({ type, message }: { type: 'opportunity' | 'warning' | 'success', message: string }) => {
  const colors = {
    opportunity: 'text-primary border-primary/20 bg-primary/5',
    warning: 'text-orange-400 border-orange-400/20 bg-orange-400/5',
    success: 'text-green-400 border-green-400/20 bg-green-400/5',
  }

  return (
    <div className={`p-4 rounded-xl border ${colors[type]} flex gap-4 items-center`}>
      <div className={`w-2 h-2 rounded-full shrink-0 ${type === 'opportunity' ? 'bg-primary' : type === 'warning' ? 'bg-orange-400' : 'bg-green-400'}`} />
      <p className="text-sm font-medium opacity-90">{message}</p>
    </div>
  )
}

function SyncBankButton({ onSyncSuccess }: { onSyncSuccess: () => void }) {
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [metrics, setMetrics] = useState<{ accountsSynced: number; newTransactionsSynced: number } | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/plaid/sync-transactions', { method: 'POST' });
      if (!res.ok) throw new Error('Sync failed');
      return res.json();
    },
    onSuccess: (data) => {
      setMetrics(data);
      setSyncStatus('success');
      onSyncSuccess();
      setTimeout(() => {
        setSyncStatus('idle');
        setMetrics(null);
      }, 3000);
    },
    onError: () => {
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  });

  return (
    <div className="relative">
      <button
        onClick={() => {
          if (syncStatus === 'idle') {
            setSyncStatus('syncing');
            mutation.mutate();
          }
        }}
        disabled={syncStatus === 'syncing'}
        className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] uppercase font-black bg-white/5 hover:bg-white/10 text-white rounded-md tracking-wider transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className={`inline-block text-xs transition-transform duration-1000 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`}>
          🔄
        </span>
        {syncStatus === 'syncing' ? 'Syncing...' : 'Sync Bank'}
      </button>

      {syncStatus === 'success' && metrics && (
        <div className="absolute right-0 top-8 z-30 w-56 p-3 bg-zinc-900 border border-green-500/30 rounded-xl shadow-xl text-left animate-in fade-in slide-in-from-top-2 duration-200 text-white">
          <p className="text-green-400 font-bold text-xs flex items-center gap-1">
            <span>✓</span> Bank Sync Complete
          </p>
          <p className="text-[10px] text-zinc-400 mt-1">
            Successfully updated {metrics.accountsSynced} accounts. Imported {metrics.newTransactionsSynced} new transactions.
          </p>
        </div>
      )}

      {syncStatus === 'error' && (
        <div className="absolute right-0 top-8 z-30 w-48 p-3 bg-zinc-900 border border-red-500/30 rounded-xl shadow-xl text-left animate-in fade-in slide-in-from-top-2 duration-200 text-white">
          <p className="text-red-400 font-bold text-xs flex items-center gap-1">
            <span>✕</span> Sync Failed
          </p>
          <p className="text-[10px] text-zinc-400 mt-1">
            Please check connection or try again.
          </p>
        </div>
      )}
    </div>
  );
}

export default App;
