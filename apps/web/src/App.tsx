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
import { useQuery } from '@tanstack/react-query'
import { useTransactions } from './hooks/useTransactions'

function App() {
  const [activeRole, setActiveRole] = useState<'cfo' | 'marketer' | 'hr'>('cfo');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

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

                <div className="glass-card p-8">
                  <h3 className="text-xl font-bold mb-4">Bank Accounts</h3>
                  <PlaidLinkButton />
                </div>
              </div>
            </div>
          </>
        )}

        {activeRole === 'marketer' && <MarketingDashboard />}

        {activeRole === 'hr' && <HRDashboard />}

        <Chat activeRole={activeRole} />
        
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

export default App

