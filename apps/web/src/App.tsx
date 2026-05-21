import { Layout } from './components/Layout'
import { Chat } from './components/Chat'
import { TransactionList } from './components/TransactionList'
import { TransactionModal } from './components/TransactionModal'
import { BudgetTracker } from './components/BudgetTracker'
import { SpendingTrendChart, CategoryBreakdownChart, RunwayProjectionChart } from './components/Charts'
import { PlaidLinkButton } from './components/PlaidLink'
import { MarketingDashboard } from './components/MarketingDashboard'
import { HRDashboard } from './components/HRDashboard'
import { useState } from 'react'
import { ScenarioPlanner } from './components/ScenarioPlanner'
import { Sparkles } from 'lucide-react'

import { useQuery } from '@tanstack/react-query'
import { useTransactions } from './hooks/useTransactions'

function App() {
  const [activeRole, setActiveRole] = useState<'cfo' | 'marketer' | 'hr'>('cfo');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [chatSeedPrompt, setChatSeedPrompt] = useState<string | undefined>(undefined);


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
  }>({
    queryKey: ['runway', refreshKey],
    queryFn: async () => {
      const res = await fetch('/api/cfo/runway');
      if (!res.ok) throw new Error('Failed to fetch runway data');
      return res.json();
    }
  });

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
                value={runwayLoading ? "Loading..." : runwayData?.runwayMonths === "Infinite" ? "Infinite Runway" : `${runwayData?.runwayMonths ?? '0'} Months`} 
                change={runwayLoading ? "Calculating" : runwayData?.runwayMonths === "Infinite" ? "Profitable" : `$${Math.round((runwayData?.netBurn ?? 0) / 100).toLocaleString()}/mo burn`} 
                isPositive={runwayData?.runwayMonths === "Infinite" || (runwayData?.runwayMonths ?? 12) >= 6} 
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
                    {!runwayLoading && runwayData && (
                      <span className={`text-xs px-2.5 py-1 rounded-md font-bold ${
                        runwayData.runwayMonths === 'Infinite' 
                          ? 'bg-green-500/10 text-green-400' 
                          : runwayData.runwayMonths < 6 
                            ? 'bg-red-500/10 text-red-400 animate-pulse' 
                            : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {runwayData.runwayMonths === 'Infinite' 
                          ? 'Profitable' 
                          : `${runwayData.runwayMonths} Mo. Runway`}
                      </span>
                    )}
                  </div>
                  <RunwayProjectionChart projections={runwayData?.projections ?? []} />
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
                    baseline={runwayData} 
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

