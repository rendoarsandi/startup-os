import React from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Slider } from '../ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { StatCard, SyncBankButton } from './StatCard';
import { SpendingTrendChart, RunwayProjectionChart } from '../Charts';
import { TransactionList } from '../TransactionList';
import { BudgetTracker } from '../BudgetTracker';
import { PlaidLinkButton } from '../PlaidLink';

interface CfoOverviewProps {
  transactions: any[];
  accounts: any[];
  formattedBalance: string;
  formattedSpending: string;
  runwayLoading: boolean;
  customRunway: any;
  isParamsOpen: boolean;
  setIsParamsOpen: (val: boolean) => void;
  revGrowth: number;
  setRevGrowth: (val: number) => void;
  expGrowth: number;
  setExpGrowth: (val: number) => void;
  seasonalityProfile: string;
  setSeasonalityProfile: (val: string) => void;
  setIsModalOpen: (val: boolean) => void;
  mrrInput: number;
  setMrrInput: (val: number) => void;
  churnInput: number;
  setChurnInput: (val: number) => void;
  cacInput: number;
  setCacInput: (val: number) => void;
  arpuInput: number;
  setArpuInput: (val: number) => void;
  saasMutation: any;
  setRefreshKey: React.Dispatch<React.SetStateAction<number>>;
}

export const CfoOverview: React.FC<CfoOverviewProps> = ({
  transactions,
  accounts,
  formattedBalance,
  formattedSpending,
  runwayLoading,
  customRunway,
  isParamsOpen,
  setIsParamsOpen,
  revGrowth,
  setRevGrowth,
  expGrowth,
  setExpGrowth,
  seasonalityProfile,
  setSeasonalityProfile,
  setIsModalOpen,
  mrrInput,
  setMrrInput,
  churnInput,
  setChurnInput,
  cacInput,
  setCacInput,
  arpuInput,
  setArpuInput,
  saasMutation,
  setRefreshKey
}) => {
  return (
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
  );
};
