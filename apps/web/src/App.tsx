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
import { SystemSettings } from './components/SystemSettings'
import { FunnelAnalysis } from './components/FunnelAnalysis'
import { HRBoardroom } from './components/HRBoardroom'
import { ScenarioPlanner } from './components/ScenarioPlanner'
import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'

import { useQuery, useMutation } from '@tanstack/react-query'
import { useTransactions } from './hooks/useTransactions'
import { calculateCustomProjections } from './hooks/useScenario'

import { Card } from './components/ui/card'
import { Button } from './components/ui/button'
import { Input } from './components/ui/input'
import { Badge } from './components/ui/badge'
import { Slider } from './components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './components/ui/select'
import { Tabs, TabsList, TabsTrigger } from './components/ui/tabs'

function App() {
  const [activeRole, setActiveRole] = useState<'cfo' | 'marketer' | 'hr' | 'operations'>('cfo');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [chatSeedPrompt, setChatSeedPrompt] = useState<string | undefined>(undefined);

  // View states to toggle between original AI dashboard and clean structured ERP registers
  const [cfoView, setCfoView] = useState<'overview' | 'invoices'>('overview');
  const [cmoView, setCmoView] = useState<'analytics' | 'brainstorm'>('analytics');

  const [currentView, setCurrentView] = useState<string>('dashboard');

  useEffect(() => {
    // If transitioning to settings, keep it, otherwise reset to role default dashboard
    if (currentView !== 'settings') {
      setCurrentView('dashboard');
    }
  }, [activeRole]);

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
    : 0;

  const monthlySpendingCents = transactions
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const formattedBalance = `$${(totalBalanceCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formattedSpending = `$${(monthlySpendingCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  if (loadingSession) {
    return (
      <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-background relative overflow-hidden text-foreground">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[130px] rounded-full -z-10 animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-secondary/10 blur-[120px] rounded-full -z-10" />
        <Card className="p-8 border border-border bg-card/60 backdrop-blur-md flex flex-col items-center gap-4 max-w-xs w-full shadow-2xl">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Securing environment...</p>
        </Card>
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
      currentView={currentView}
      onViewChange={setCurrentView}
    >
      <div className="space-y-6">
        {currentView === 'settings' ? (
          <SystemSettings />
        ) : (
          <>
            {activeRole === 'cfo' && (
              <div className="space-y-6">
                {currentView === 'dashboard' && (
                  <Tabs 
                    value={cfoView} 
                    onValueChange={(val) => {
                      setCfoView(val as any);
                      if (val === 'invoices') setCurrentView('invoices');
                    }} 
                    className="w-full sm:w-auto self-start"
                  >
                    <TabsList className="grid grid-cols-2 w-full sm:w-80 h-9 bg-black/10">
                      <TabsTrigger value="overview" className="py-1 text-[10px]">Financial Analytics</TabsTrigger>
                      <TabsTrigger value="invoices" className="py-1 text-[10px]">Invoices & Billing</TabsTrigger>
                    </TabsList>
                  </Tabs>
                )}

                {(currentView === 'dashboard' || currentView === 'overview') && cfoView === 'overview' && (
                  <>
                    <header>
                      <h2 className="text-2xl font-bold mb-1 text-foreground tracking-tight">
                        CFO Financial Dashboard
                      </h2>
                      <p className="text-muted-foreground text-xs font-semibold">Your AI CFO has analyzed {transactions.length} transactions.</p>
                    </header>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <StatCard 
                        title="Total Balance" 
                        value={formattedBalance} 
                        change={accounts.length > 0 ? "Live" : "No Accounts"} 
                        isPositive={true} 
                      />
                      <StatCard 
                        title="Monthly Spending" 
                        value={formattedSpending} 
                        change={transactions.length > 0 ? "Calculated" : "No Spend"} 
                        isPositive={true} 
                      />
                      <StatCard 
                        title="AI Cash Runway" 
                        value={runwayLoading ? "Loading..." : customRunway?.runwayMonths === "Infinite" ? "Infinite Runway" : `${customRunway?.runwayMonths ?? '0'} Months`} 
                        change={runwayLoading ? "Calculating" : customRunway?.runwayMonths === "Infinite" ? "Profitable" : `$${Math.round((customRunway?.netBurn ?? 0) / 100).toLocaleString()}/mo burn`} 
                        isPositive={customRunway?.runwayMonths === "Infinite" || (customRunway?.runwayMonths ?? 12) >= 6} 
                      />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2 space-y-6">
                        <Card className="p-6 min-h-[400px]">
                          <h3 className="text-base font-bold mb-5 text-foreground/90">Spending Trends</h3>
                          <SpendingTrendChart />
                        </Card>

                        <Card className="p-6 min-h-[400px]">
                          <div className="flex items-center justify-between mb-5">
                            <h3 className="text-base font-bold text-foreground/90">Cash Runway Projections</h3>
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="outline"
                                onClick={() => setIsParamsOpen(!isParamsOpen)}
                                className="h-8 text-[10px] font-bold px-3 uppercase tracking-wider gap-1.5"
                              >
                                ⚙️ Model Parameters {isParamsOpen ? '▲' : '▼'}
                              </Button>
                              {!runwayLoading && customRunway && (
                                <Badge variant={customRunway.runwayMonths === 'Infinite' ? 'success' : customRunway.runwayMonths < 6 ? 'destructive' : 'warning'} className="text-[9px] font-black uppercase tracking-wider py-0.5">
                                  {customRunway.runwayMonths === 'Infinite' 
                                    ? 'Profitable' 
                                    : `${customRunway.runwayMonths} Mo. Runway`}
                                </Badge>
                              )}
                            </div>
                          </div>

                          {isParamsOpen && (
                            <div className="mb-5 p-5 rounded-xl border border-border bg-black/15 space-y-5 animate-in slide-in-from-top duration-200">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center text-[10px] font-bold">
                                    <span className="text-muted-foreground uppercase">Revenue Growth Rate</span>
                                    <span className="text-primary font-black">{revGrowth >= 0 ? '+' : ''}{revGrowth}% MoM</span>
                                  </div>
                                  <Slider 
                                    min={-10}
                                    max={20}
                                    step={0.5}
                                    value={[revGrowth]}
                                    onValueChange={(val) => setRevGrowth(val[0])}
                                    className="py-2"
                                  />
                                  <p className="text-[9px] text-muted-foreground/60 font-semibold">Compounds baseline monthly revenue.</p>
                                </div>

                                <div className="space-y-2">
                                  <div className="flex justify-between items-center text-[10px] font-bold">
                                    <span className="text-muted-foreground uppercase">Expense Growth Rate</span>
                                    <span className="text-foreground/80 font-black">{expGrowth >= 0 ? '+' : ''}{expGrowth}% MoM</span>
                                  </div>
                                  <Slider 
                                    min={-10}
                                    max={20}
                                    step={0.5}
                                    value={[expGrowth]}
                                    onValueChange={(val) => setExpGrowth(val[0])}
                                    className="py-2"
                                  />
                                  <p className="text-[9px] text-muted-foreground/60 font-semibold">Compounds baseline monthly expenses.</p>
                                </div>

                                <div className="space-y-2">
                                  <label className="block text-[10px] text-muted-foreground font-bold uppercase tracking-widest pl-0.5">Seasonality Profile</label>
                                  <Select 
                                    value={seasonalityProfile} 
                                    onValueChange={(val) => setSeasonalityProfile(val)}
                                  >
                                    <SelectTrigger className="w-full text-xs h-9 uppercase font-bold tracking-wider">
                                      <SelectValue placeholder="Profile" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="steady">Steady state (No seasonality)</SelectItem>
                                      <SelectItem value="growth">Hyper growth (Q3 surge)</SelectItem>
                                      <SelectItem value="summer-dip">Summer Dip (August slump)</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </div>
                          )}

                          <RunwayProjectionChart projections={customRunway?.projections || []} />
                        </Card>

                        <Card className="p-6 min-h-[400px]">
                          <div className="flex items-center justify-between mb-5">
                            <h3 className="text-base font-bold text-foreground/90">Transaction History</h3>
                            <Button 
                              onClick={() => setIsModalOpen(true)}
                              className="h-8 text-[10px] font-bold px-3 uppercase tracking-wider gap-1"
                            >
                              <span className="text-sm font-semibold">+</span> Add Transaction
                            </Button>
                          </div>
                          <TransactionList />
                        </Card>
                      </div>

                      <div className="space-y-6">
                        <Card className="p-6">
                          <h3 className="text-base font-bold mb-4 text-foreground/90">SaaS Valuation Metrics</h3>
                          <div className="space-y-4">
                            <div className="space-y-1.5">
                              <label className="block text-[10px] text-muted-foreground font-bold uppercase tracking-widest pl-0.5">Starting MRR (USD)</label>
                              <Input 
                                type="number"
                                value={mrrInput || ''}
                                onChange={(e) => setMrrInput(Number(e.target.value))}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label className="block text-[10px] text-muted-foreground font-bold uppercase tracking-widest pl-0.5">Churn Rate (%)</label>
                                <Input 
                                  type="number"
                                  step="0.1"
                                  value={churnInput || ''}
                                  onChange={(e) => setChurnInput(Number(e.target.value))}
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label className="block text-[10px] text-muted-foreground font-bold uppercase tracking-widest pl-0.5">CAC (USD)</label>
                                <Input 
                                  type="number"
                                  value={cacInput || ''}
                                  onChange={(e) => setCacInput(Number(e.target.value))}
                                />
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <label className="block text-[10px] text-muted-foreground font-bold uppercase tracking-widest pl-0.5">ARPU (USD)</label>
                              <Input 
                                type="number"
                                value={arpuInput || ''}
                                onChange={(e) => setArpuInput(Number(e.target.value))}
                              />
                            </div>
                            <Button
                              onClick={() => saasMutation.mutate({
                                startingMrr: mrrInput * 100,
                                churnRate: Math.round(churnInput * 100),
                                cac: cacInput * 100,
                                arpu: arpuInput * 100
                              })}
                              disabled={saasMutation.isPending}
                              variant="outline"
                              className="w-full h-10 text-xs font-bold"
                            >
                              {saasMutation.isPending ? "Updating..." : "Recalculate SaaS Model"}
                            </Button>
                          </div>
                        </Card>

                        <Card className="p-6">
                          <h3 className="text-base font-bold mb-4 text-foreground/90">Budget Limits</h3>
                          <BudgetTracker />
                        </Card>

                        <Card className="p-6 space-y-4">
                          <div className="flex justify-between items-center border-b border-border pb-3">
                            <div>
                              <h3 className="text-sm font-bold text-foreground">SVB Connected</h3>
                              <p className="text-[8px] text-muted-foreground uppercase tracking-widest font-black mt-0.5">Plaid secure credential integration</p>
                            </div>
                            {accounts.length > 0 && (
                              <SyncBankButton onSyncSuccess={() => setRefreshKey(prev => prev + 1)} />
                            )}
                          </div>
                          
                          {accounts.length > 0 ? (
                            <div className="space-y-2">
                              {accounts.map((acc: any) => (
                                <div key={acc.id} className="flex justify-between items-center p-3 rounded-lg bg-black/10 border border-border/80">
                                  <div>
                                    <p className="text-xs font-bold text-foreground">{acc.name}</p>
                                    <p className="text-[9px] text-muted-foreground capitalize mt-0.5 font-medium">{acc.type}</p>
                                  </div>
                                  <p className="text-xs font-bold text-foreground font-mono">
                                    ${(acc.balance / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                  </p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-muted-foreground text-xs">No bank accounts linked yet.</p>
                          )}
                          
                          <PlaidLinkButton onSuccess={() => setRefreshKey(prev => prev + 1)} />
                        </Card>
                      </div>
                    </div>
                  </>
                )}

                {currentView === 'invoices' && (
                  <InvoicesDashboard />
                )}

                {currentView === 'ledger' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <Card className="p-6 min-h-[400px]">
                      <div className="flex items-center justify-between mb-5">
                        <div>
                          <h3 className="text-base font-bold text-foreground/90">General Ledger Logs</h3>
                          <p className="text-muted-foreground text-[10px] uppercase tracking-widest font-black mt-0.5">Corporate transaction database</p>
                        </div>
                        <Button 
                          onClick={() => setIsModalOpen(true)}
                          className="h-8 text-[10px] font-bold px-3 uppercase tracking-wider gap-1"
                        >
                          <span className="text-sm font-semibold">+</span> Add Transaction
                        </Button>
                      </div>
                      <TransactionList />
                    </Card>
                  </div>
                )}

                {currentView === 'budgets' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <Card className="p-6">
                      <h3 className="text-base font-bold mb-4 text-foreground/90">Budget Limits</h3>
                      <BudgetTracker />
                    </Card>
                  </div>
                )}

                {currentView === 'forecasting' && (
                  <ScenarioPlanner 
                    baseline={runwayData} 
                    onOpenChat={(seedPrompt) => {
                      if (seedPrompt) {
                        setChatSeedPrompt(seedPrompt);
                      }
                    }} 
                  />
                )}
              </div>
            )}

            {activeRole === 'marketer' && (
              <div className="space-y-6">
                {currentView === 'dashboard' && (
                  <Tabs 
                    value={cmoView} 
                    onValueChange={(val) => setCmoView(val as any)} 
                    className="w-full sm:w-auto self-start"
                  >
                    <TabsList className="grid grid-cols-2 w-full sm:w-80 h-9 bg-black/10">
                      <TabsTrigger value="analytics" className="py-1 text-[10px]">Growth Analytics</TabsTrigger>
                      <TabsTrigger value="brainstorm" className="py-1 text-[10px]">Campaign Brainstormer</TabsTrigger>
                    </TabsList>
                  </Tabs>
                )}
                {currentView === 'dashboard' && cmoView === 'analytics' && <MarketingDashboard showOnlyAnalytics={true} />}
                {currentView === 'dashboard' && cmoView === 'brainstorm' && <MarketingDashboard showOnlyBrainstorm={true} />}
                {currentView === 'crm' && <CRMPipeline />}
                {currentView === 'campaigns' && <MarketingDashboard showOnlyBrainstorm={true} />}
                {currentView === 'funnel' && <FunnelAnalysis />}
              </div>
            )}

            {activeRole === 'hr' && (
              <div className="space-y-6">
                {currentView === 'dashboard' || currentView === 'boardroom' ? (
                  <HRBoardroom />
                ) : currentView === 'roster' ? (
                  <HRDashboard filterSection="roster" />
                ) : currentView === 'documents' ? (
                  <HRDashboard filterSection="documents" />
                ) : (
                  <HROperations 
                    activeTab={
                      currentView === 'expenses' ? 'expenses' : 
                      currentView === 'leaves' ? 'leaves' : 'attendance'
                    }
                    onTabChange={(tab) => {
                      if (tab === 'expenses') setCurrentView('expenses');
                      else if (tab === 'leaves') setCurrentView('leaves');
                      else setCurrentView('attendance');
                    }}
                  />
                )}
              </div>
            )}

            {activeRole === 'operations' && (
              <div className="space-y-6">
                <COOOperations 
                  activeTab={
                    currentView === 'projects' ? 'projects' : 
                    currentView === 'tickets' ? 'tickets' : 'inventory'
                  }
                  onTabChange={(tab) => {
                    if (tab === 'projects') setCurrentView('projects');
                    else if (tab === 'tickets') setCurrentView('tickets');
                    else setCurrentView('inventory');
                  }}
                />
              </div>
            )}
          </>
        )}

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
  <Card className="p-5 hover:border-primary/30 transition-all cursor-default">
    <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-2">{title}</p>
    <div className="flex items-end justify-between">
      <h4 className="text-xl font-black text-foreground">{value}</h4>
      <Badge variant={isPositive ? 'success' : 'destructive'} className="text-[9px] font-black py-0.5 tracking-wider">
        {change}
      </Badge>
    </div>
  </Card>
)

export const InsightItem = ({ type, message }: { type: 'opportunity' | 'warning' | 'success', message: string }) => {
  const badgeVariants = {
    opportunity: 'success' as const,
    warning: 'warning' as const,
    success: 'success' as const,
  }

  return (
    <div className="p-4 rounded-xl border border-border bg-black/10 flex gap-4 items-center shadow-sm">
      <Badge variant={badgeVariants[type]} className="w-2.5 h-2.5 rounded-full p-0 shrink-0" />
      <p className="text-xs font-semibold text-foreground/80">{message}</p>
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
      <Button
        variant="outline"
        onClick={() => {
          if (syncStatus === 'idle') {
            setSyncStatus('syncing');
            mutation.mutate();
          }
        }}
        disabled={syncStatus === 'syncing'}
        className="h-7 text-[9px] font-bold uppercase tracking-wider"
      >
        <span className={`inline-block text-xs transition-transform duration-1000 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`}>
          🔄
        </span>
        {syncStatus === 'syncing' ? 'Syncing...' : 'Sync Bank'}
      </Button>

      {syncStatus === 'success' && metrics && (
        <Card className="absolute right-0 top-8 z-30 w-56 p-3.5 border border-emerald-500/25 bg-card text-left animate-in fade-in slide-in-from-top-2 duration-200">
          <p className="text-emerald-400 font-bold text-xs flex items-center gap-1.5">
            <span>✓</span> Bank Sync Complete
          </p>
          <p className="text-[9px] text-muted-foreground mt-1.5 leading-normal font-semibold">
            Successfully updated {metrics.accountsSynced} accounts. Imported {metrics.newTransactionsSynced} new transactions.
          </p>
        </Card>
      )}

      {syncStatus === 'error' && (
        <Card className="absolute right-0 top-8 z-30 w-48 p-3.5 border border-destructive/20 bg-card text-left animate-in fade-in slide-in-from-top-2 duration-200">
          <p className="text-destructive font-bold text-xs flex items-center gap-1.5">
            <span>✕</span> Sync Failed
          </p>
          <p className="text-[9px] text-muted-foreground mt-1.5 leading-normal font-semibold">
            Please check connection or try again.
          </p>
        </Card>
      )}
    </div>
  );
}

export default App;
