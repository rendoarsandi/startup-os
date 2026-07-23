import React from 'react';
import { Card } from '../ui/card';
import { Slider } from '../ui/slider';
import { DollarSign, Users, Clock, Target } from 'lucide-react';

interface MetricsGridProps {
  cashBalance: number;
  setCashBalance: (val: number) => void;
  monthlyBurn: number;
  setMonthlyBurn: (val: number) => void;
  cac: number;
  setCac: (val: number) => void;
  leads: number;
  setLeads: (val: number) => void;
  conversionRate: number;
  setConversionRate: (val: number) => void;
  headcount: number;
  setHeadcount: (val: number) => void;
  attritionRate: number;
  setAttritionRate: (val: number) => void;
  eNps: number;
  setENps: (val: number) => void;
  projectVelocity: number;
  setProjectVelocity: (val: number) => void;
  milestoneCompletion: number;
  setMilestoneCompletion: (val: number) => void;
  calculateRunway: (cash: number, burn: number) => number;
  calculateNewCustomers: (leads: number, rate: number) => number;
}

export const MetricsGrid: React.FC<MetricsGridProps> = ({
  cashBalance, setCashBalance,
  monthlyBurn, setMonthlyBurn,
  cac, setCac,
  leads, setLeads,
  conversionRate, setConversionRate,
  headcount, setHeadcount,
  attritionRate, setAttritionRate,
  eNps, setENps,
  projectVelocity, setProjectVelocity,
  milestoneCompletion, setMilestoneCompletion,
  calculateRunway, calculateNewCustomers
}) => {
  const runwayMonths = calculateRunway(cashBalance, monthlyBurn);
  const newCust = calculateNewCustomers(leads, conversionRate);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* CFO Controls */}
      <Card className="p-4 border border-border/50 bg-card rounded-xl space-y-4">
        <div className="flex items-center space-x-2 text-indigo-500 font-semibold text-xs uppercase tracking-wider">
          <DollarSign className="w-4 h-4" />
          <span>Finance & Capital (CFO)</span>
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">Cash Balance</span>
            <span className="font-mono font-semibold">${cashBalance.toLocaleString()}</span>
          </div>
          <Slider value={[cashBalance]} min={10000} max={2000000} step={10000} onValueChange={v => setCashBalance(v[0])} />
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">Monthly Burn</span>
            <span className="font-mono font-semibold">${monthlyBurn.toLocaleString()}</span>
          </div>
          <Slider value={[monthlyBurn]} min={1000} max={200000} step={5000} onValueChange={v => setMonthlyBurn(v[0])} />
        </div>
        <div className="pt-2 border-t flex justify-between text-xs">
          <span className="text-muted-foreground">Computed Runway:</span>
          <span className={`font-mono font-bold ${runwayMonths < 6 ? 'text-rose-500' : 'text-emerald-500'}`}>{runwayMonths} Months</span>
        </div>
      </Card>

      {/* CMO Controls */}
      <Card className="p-4 border border-border/50 bg-card rounded-xl space-y-4">
        <div className="flex items-center space-x-2 text-indigo-500 font-semibold text-xs uppercase tracking-wider">
          <Target className="w-4 h-4" />
          <span>Marketing & Funnel (CMO)</span>
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">CAC ($)</span>
            <span className="font-mono font-semibold">${cac}</span>
          </div>
          <Slider value={[cac]} min={10} max={500} step={5} onValueChange={v => setCac(v[0])} />
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">Monthly Leads</span>
            <span className="font-mono font-semibold">{leads.toLocaleString()}</span>
          </div>
          <Slider value={[leads]} min={100} max={10000} step={100} onValueChange={v => setLeads(v[0])} />
        </div>
        <div className="pt-2 border-t flex justify-between text-xs">
          <span className="text-muted-foreground">New Customers / Mo:</span>
          <span className="font-mono font-bold text-foreground">+{newCust}</span>
        </div>
      </Card>

      {/* CHRO Controls */}
      <Card className="p-4 border border-border/50 bg-card rounded-xl space-y-4">
        <div className="flex items-center space-x-2 text-indigo-500 font-semibold text-xs uppercase tracking-wider">
          <Users className="w-4 h-4" />
          <span>Talent & Morale (CHRO)</span>
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">Headcount (FTEs)</span>
            <span className="font-mono font-semibold">{headcount}</span>
          </div>
          <Slider value={[headcount]} min={2} max={100} step={1} onValueChange={v => setHeadcount(v[0])} />
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">Employee eNPS</span>
            <span className="font-mono font-semibold">{eNps}/100</span>
          </div>
          <Slider value={[eNps]} min={0} max={100} step={1} onValueChange={v => setENps(v[0])} />
        </div>
        <div className="pt-2 border-t flex justify-between text-xs">
          <span className="text-muted-foreground">Annual Attrition:</span>
          <span className="font-mono font-bold text-foreground">{attritionRate}%</span>
        </div>
      </Card>

      {/* COO Controls */}
      <Card className="p-4 border border-border/50 bg-card rounded-xl space-y-4">
        <div className="flex items-center space-x-2 text-indigo-500 font-semibold text-xs uppercase tracking-wider">
          <Clock className="w-4 h-4" />
          <span>Sprint Delivery (COO)</span>
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">Sprint Velocity</span>
            <span className="font-mono font-semibold">{projectVelocity}%</span>
          </div>
          <Slider value={[projectVelocity]} min={10} max={100} step={1} onValueChange={v => setProjectVelocity(v[0])} />
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">Milestone Completion</span>
            <span className="font-mono font-semibold">{milestoneCompletion}%</span>
          </div>
          <Slider value={[milestoneCompletion]} min={10} max={100} step={1} onValueChange={v => setMilestoneCompletion(v[0])} />
        </div>
        <div className="pt-2 border-t flex justify-between text-xs">
          <span className="text-muted-foreground">Execution Status:</span>
          <span className="font-mono font-bold text-indigo-500">{projectVelocity >= 85 ? 'ELITE' : 'STABLE'}</span>
        </div>
      </Card>
    </div>
  );
};
