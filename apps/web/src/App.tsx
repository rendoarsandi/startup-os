import { Layout } from './components/Layout'
import { Chat } from './components/Chat'
import { TransactionList } from './components/TransactionList'
import { TransactionModal } from './components/TransactionModal'
import { BudgetTracker } from './components/BudgetTracker'
import { SpendingTrendChart, CategoryBreakdownChart, RunwayProjectionChart } from './components/Charts'
import { PlaidLinkButton } from './components/PlaidLink'
import { MarketingDashboard } from './components/MarketingDashboard'
import { HRDashboard } from './components/HRDashboard'
import { useState, useEffect } from 'react'
import { ScenarioPlanner } from './components/ScenarioPlanner'
import { Sparkles } from 'lucide-react'

import { useQuery, useMutation } from '@tanstack/react-query'
import { useTransactions } from './hooks/useTransactions'
import { calculateCustomProjections } from './hooks/useScenario'

function App() {
  const [activeRole, setActiveRole] = useState<'cfo' | 'marketer' | 'hr'>('cfo');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [chatSeedPrompt, setChatSeedPrompt] = useState<string | undefined>(undefined);

  // Custom Runway Projection growth and seasonality parameters
  const [revGrowth, setRevGrowth] = useState<number>(0);
  const [expGrowth, setExpGrowth] = useState<number>(0);
  const [seasonalityProfile, setSeasonalityProfile] = useState<string>('steady');
  const [isParamsOpen, setIsParamsOpen] = useState<boolean>(false);


  const { transactions } = useTransactions();

  // Query for bank accounts
  const { data: accounts = [] } = useQuery<{ id: string, name: string, balance: number, type: string }[]>({
    queryKey: ['accounts', refreshKey],
    queryFn: async () => {
      const res = await fetch('/api/accounts');
      if (!res.ok) throw new Error('Failed to fetch accounts');
      return res.json();
    }
  });

  // Query for AI CFO Insights
  const { data: insightsData, isLoading: insightsLoading } = useQuery<{ advice: string, items?: any[] }>({
    queryKey: ['insights', refreshKey],
    queryFn: async () => {
      const res = await fetch('/api/insights');
      if (!res.ok) throw new Error('Failed to fetch insights');
      return res.json();
    }
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
    queryKey: ['runway', refreshKey],
    queryFn: async () => {
      const res = await fetch('/api/cfo/runway');
      if (!res.ok) throw new Error('Failed to fetch runway data');
      return res.json();
    }
  });

  // Query for SaaS config
  const { data: saasConfig, refetch: refetchSaasConfig } = useQuery<{
    startingMrr: number;
    churnRate: number;
    cac: number;
    arpu: number;
  }>({
    queryKey: ['saasConfig', refreshKey],
    queryFn: async () => {
      const res = await fetch('/api/cfo/saas-config');
      if (!res.ok) throw new Error('Failed to fetch SaaS config');
      return res.json();
    }
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

  return (
    <Layout activeRole={activeRole} setActiveRole={setActiveRole}>
      <div className="space-y-8">
        {activeRole === 'cfo' && (
          <>
            <header>
              <h2 className="text-4xl font-black mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent italic">
                CFO Financial Dashboard
              </h2>
              <p className="text-white/50 text-lg">Your AI CFO has analyzed 12 new transactions today.</p>
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
                          <p className="text-[10px] text-white/30">Compounds variable operating costs.</p>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-xs text-white/60 font-medium">Seasonality Profile</label>
                          <select 
                            value={seasonalityProfile}
                            onChange={(e) => setSeasonalityProfile(e.target.value)}
                            className="w-full px-3 py-1.5 bg-zinc-950 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-primary/50 transition-colors"
                          >
                            <option value="steady">Steady SaaS / Constant</option>
                            <option value="holiday">Holiday/Q4 Surge (E-commerce)</option>
                            <option value="quarterly">B2B Quarterly Spikes</option>
                            <option value="summer">Summer Slump Profile</option>
                          </select>
                          <p className="text-[10px] text-white/30">Applies cyclical peaks and valleys.</p>
                        </div>
                      </div>

                      <div className="border-t border-white/5 pt-4">
                        <h4 className="text-xs uppercase tracking-widest font-black text-indigo-400 mb-4 flex items-center gap-1.5 font-bold">
                          <Sparkles size={12} /> Baseline SaaS Setup (Saved to DB)
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                          <div>
                            <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Starting MRR ($)</label>
                            <input 
                              type="number"
                              value={mrrInput || ''}
                              onChange={(e) => setMrrInput(Number(e.target.value))}
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Monthly Churn (%)</label>
                            <input 
                              type="number"
                              step="0.1"
                              value={churnInput || ''}
                              onChange={(e) => setChurnInput(Number(e.target.value))}
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Target CAC ($)</label>
                            <input 
                              type="number"
                              value={cacInput || ''}
                              onChange={(e) => setCacInput(Number(e.target.value))}
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                            />
                          </div>
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Target ARPU ($)</label>
                              <input 
                                type="number"
                                value={arpuInput || ''}
                                onChange={(e) => setArpuInput(Number(e.target.value))}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                              />
                            </div>
                            <button
                              onClick={() => {
                                saasMutation.mutate({
                                  startingMrr: mrrInput * 100,
                                  churnRate: Math.round(churnInput * 100),
                                  cac: cacInput * 100,
                                  arpu: arpuInput * 100
                                });
                              }}
                              disabled={saasMutation.isPending}
                              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-3 py-2 rounded-lg shrink-0 cursor-pointer h-[32px] flex items-center justify-center transition-colors disabled:opacity-50"
                            >
                              {saasMutation.isPending ? 'Saving...' : 'Save'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <RunwayProjectionChart projections={customRunway?.projections ?? []} />
                </div>

                {/* Interactive What-If Scenario Simulator */}
                <div className="glass-card p-8 border-emerald-500/10 bg-gradient-to-b from-white/[0.01] to-emerald-950/[0.02]">
                  <header className="mb-6">
                    <h3 className="text-xl font-extrabold flex items-center gap-2 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent italic">
                      <Sparkles size={20} className="text-emerald-400 shrink-0" />
                      <span>Interactive What-If Scenario Simulator</span>
                    </h3>
                    <p className="text-white/50 text-xs mt-1">Run predictive growth models, overhead adjustments, and simulate new hiring impacts on your business.</p>
                  </header>
                  <ScenarioPlanner 
                    baseline={customRunway} 
                    onOpenChat={(seed) => {
                      setChatSeedPrompt(seed);
                    }} 
                  />
                </div>


                <div className="glass-card p-8">
                  <h3 className="text-xl font-bold mb-6">Category Breakdown</h3>
                  <CategoryBreakdownChart />
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-lg">Recent Activity</h3>
                    <div className="flex gap-4">
                      <button 
                        onClick={() => setIsModalOpen(true)}
                        className="text-[10px] bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-md uppercase tracking-widest font-black transition-colors cursor-pointer"
                      >
                        + Add
                      </button>
                      <button className="text-xs text-primary font-bold hover:underline text-[10px] uppercase tracking-widest cursor-pointer">View All</button>
                    </div>
                  </div>
                  <TransactionList key={refreshKey} />
                </div>
              </div>

              <div className="space-y-8">
                {/* SaaS Unit Economics & Metrics Card */}
                <div className="glass-card p-6 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20">
                  <h3 className="text-base font-bold mb-4 flex items-center gap-2">
                    <Sparkles className="text-indigo-400 shrink-0" size={16} />
                    <span>SaaS Unit Economics</span>
                  </h3>
                  {runwayLoading ? (
                    <div className="h-24 rounded-xl bg-white/5 animate-pulse flex items-center justify-center text-xs opacity-50 text-white/50">
                      Analyzing SaaS metrics...
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                        <p className="text-white/40 text-[9px] font-bold uppercase tracking-wider mb-1">MRR</p>
                        <p className="text-base font-black text-white">
                          ${Math.round((runwayData?.startingMrr ?? 0) / 100).toLocaleString()}
                        </p>
                      </div>
                      <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                        <p className="text-white/40 text-[9px] font-bold uppercase tracking-wider mb-1">ARR</p>
                        <p className="text-base font-black text-white">
                          ${Math.round(((runwayData?.startingMrr ?? 0) * 12) / 100).toLocaleString()}
                        </p>
                      </div>
                      <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                        <p className="text-white/40 text-[9px] font-bold uppercase tracking-wider mb-1">Monthly Churn</p>
                        <p className="text-base font-black text-rose-400">
                          {((runwayData?.churnRate ?? 0) / 100).toFixed(1)}%
                        </p>
                      </div>
                      <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                        <p className="text-white/40 text-[9px] font-bold uppercase tracking-wider mb-1">LTV : CAC</p>
                        <p className="text-base font-black text-emerald-400">
                          {runwayData && runwayData.cac !== undefined && runwayData.cac > 0 && runwayData.churnRate !== undefined && runwayData.churnRate > 0 && runwayData.arpu !== undefined ? (
                            ((runwayData.arpu * 10000) / (runwayData.churnRate * runwayData.cac)).toFixed(1) + 'x'
                          ) : (
                            'N/A'
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                  {runwayData && runwayData.cac !== undefined && runwayData.cac > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/5 flex justify-between text-[9px] text-white/50">
                      <span>CAC: ${Math.round(runwayData.cac / 100)}</span>
                      <span>ARPU: ${runwayData.arpu !== undefined ? Math.round(runwayData.arpu / 100) : 0}</span>
                    </div>
                  )}
                </div>

                <div className="glass-card p-8">
                  <h3 className="text-xl font-bold mb-6">Budget Tracker</h3>
                  <BudgetTracker />
                </div>

                <div className="glass-card p-8">
                  <h3 className="text-xl font-bold mb-6">AI Insights</h3>
                  <div className="space-y-4">
                    {insightsLoading ? (
                      <div className="h-20 rounded-xl bg-white/5 animate-pulse flex items-center justify-center text-xs opacity-50">
                        Analyzing financial data...
                      </div>
                    ) : insightsData?.items && Array.isArray(insightsData.items) ? (
                      insightsData.items.map((item: any, idx: number) => (
                        <InsightItem 
                          key={idx}
                          type={item.type}
                          message={item.message}
                        />
                      ))
                    ) : insightsData?.advice ? (
                      <InsightItem 
                        type="opportunity"
                        message={insightsData.advice}
                      />
                    ) : (
                      <>
                        <InsightItem 
                          type="opportunity"
                          message="You could save $45/mo by switching your Netflix plan."
                        />
                        <InsightItem 
                          type="warning"
                          message="Unexpected $200 charge from 'AWS'. Investigate?"
                        />
                        <InsightItem 
                          type="success"
                          message="Your investment portfolio is up 5% this week!"
                        />
                      </>
                    )}
                  </div>
                </div>

                <div className="glass-card p-8 bg-gradient-to-br from-primary/20 to-secondary/20 border-primary/30">
                  <h3 className="text-xl font-bold mb-2">Ask AI CFO</h3>
                  <p className="text-white/60 text-sm mb-6">Get instant answers about your finances using Gemini AI.</p>
                  <button className="btn-primary w-full cursor-pointer">Start Conversation</button>
                </div>

                <div className="glass-card p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold">Bank Accounts</h3>
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
        )}

        {activeRole === 'marketer' && <MarketingDashboard />}

        {activeRole === 'hr' && <HRDashboard />}

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

const InsightItem = ({ type, message }: { type: 'opportunity' | 'warning' | 'success', message: string }) => {
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

