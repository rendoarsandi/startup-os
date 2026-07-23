import { Layout } from './components/Layout'
import { AuthPage } from './components/AuthPage'
import { Chat } from './components/Chat'
import { TransactionList } from './components/TransactionList'
import { TransactionModal } from './components/TransactionModal'
import { BudgetTracker } from './components/BudgetTracker'
import { MarketingDashboard } from './components/MarketingDashboard'
import { HRDashboard } from './components/HRDashboard'
import { InvoicesDashboard } from './components/InvoicesDashboard'
import { CRMPipeline } from './components/CRMPipeline'
import { HROperations } from './components/HROperations'
import { COOOperations } from './components/COOOperations'
import { SystemSettings } from './components/SystemSettings'
import { FunnelAnalysis } from './components/FunnelAnalysis'
import { HRBoardroom } from './components/HRBoardroom'
import { AIBoardroom } from './components/AIBoardroom'
import { ScenarioPlanner } from './components/ScenarioPlanner'
import { SaaSEconomics } from './components/SaaSEconomics'
import { CfoOverview } from './components/app/CfoOverview'
import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'

import { useQuery, useMutation } from '@tanstack/react-query'
import { useTransactions } from './hooks/useTransactions'
import { calculateCustomProjections } from './hooks/useScenario'

import { Card } from './components/ui/card'
import { Button } from './components/ui/button'
import { Tabs, TabsList, TabsTrigger } from './components/ui/tabs'

export { StatCard, InsightItem, SyncBankButton } from './components/app/StatCard'

function App() {
  const [activeRole, setActiveRole] = useState<'cfo' | 'marketer' | 'hr' | 'operations'>('cfo');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [chatSeedPrompt, setChatSeedPrompt] = useState<string | undefined>(undefined);

  const [cfoView, setCfoView] = useState<'overview' | 'invoices'>('overview');
  const [cmoView, setCmoView] = useState<'analytics' | 'brainstorm'>('analytics');
  const [currentView, setCurrentView] = useState<string>('dashboard');

  useEffect(() => {
    if (currentView !== 'settings') {
      setCurrentView('dashboard');
    }
  }, [activeRole]);

  // Session state
  const [session, setSession] = useState<{ user: { id: string, email: string, name: string } } | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  // Custom Runway Projection parameters
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

  const { data: accounts = [] } = useQuery<{ id: string, name: string, balance: number, type: string }[]>({
    queryKey: ['accounts', refreshKey, session?.user?.id],
    queryFn: async () => {
      const res = await fetch('/api/accounts');
      if (!res.ok) throw new Error('Failed to fetch accounts');
      return res.json();
    },
    enabled: !!session,
  });

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
      setRefreshKey(prev => prev + 1);
      refetchSaasConfig();
    }
  });

  const customRunway = runwayData
    ? calculateCustomProjections(runwayData, revGrowth, expGrowth, seasonalityProfile)
    : undefined;

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
        ) : currentView === 'ai-boardroom' ? (
          <AIBoardroom />
        ) : (
          <>
            {activeRole === 'cfo' && (
              <div className="space-y-6">
                {currentView === 'dashboard' && (
                  <Tabs 
                    value={cfoView} 
                    onValueChange={(val) => setCfoView(val as any)} 
                    className="w-full sm:w-auto self-start"
                  >
                    <TabsList className="grid grid-cols-2 w-full sm:w-80 h-9 bg-black/10">
                      <TabsTrigger value="overview" className="py-1 text-[10px]">Financial Analytics</TabsTrigger>
                      <TabsTrigger value="invoices" className="py-1 text-[10px]">Invoices &amp; Billing</TabsTrigger>
                    </TabsList>
                  </Tabs>
                )}

                {(currentView === 'dashboard' || currentView === 'overview') && cfoView === 'overview' && (
                  <CfoOverview
                    transactions={transactions}
                    accounts={accounts}
                    formattedBalance={formattedBalance}
                    formattedSpending={formattedSpending}
                    runwayLoading={runwayLoading}
                    customRunway={customRunway}
                    isParamsOpen={isParamsOpen}
                    setIsParamsOpen={setIsParamsOpen}
                    revGrowth={revGrowth}
                    setRevGrowth={setRevGrowth}
                    expGrowth={expGrowth}
                    setExpGrowth={setExpGrowth}
                    seasonalityProfile={seasonalityProfile}
                    setSeasonalityProfile={setSeasonalityProfile}
                    setIsModalOpen={setIsModalOpen}
                    mrrInput={mrrInput}
                    setMrrInput={setMrrInput}
                    churnInput={churnInput}
                    setChurnInput={setChurnInput}
                    cacInput={cacInput}
                    setCacInput={setCacInput}
                    arpuInput={arpuInput}
                    setArpuInput={setArpuInput}
                    saasMutation={saasMutation}
                    setRefreshKey={setRefreshKey}
                  />
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

                {currentView === 'saas-economics' && (
                  <SaaSEconomics />
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
                
                {currentView === 'saas-economics' && (
                  <SaaSEconomics />
                )}
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

export default App;
