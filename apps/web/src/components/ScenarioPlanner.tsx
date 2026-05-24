import React, { useState } from 'react';
import { 
  Sliders, Plus, Trash2, Calendar, 
  Sparkles, TrendingUp, RefreshCw, MessageSquare, Users, Percent, ShieldAlert
} from 'lucide-react';
import { useScenario } from '../hooks/useScenario';
import type { BaselineRunwayData } from '../hooks/useScenario';
import { ComparativeRunwayChart } from './Charts';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Card, CardTitle } from './ui/card';
import { Slider } from './ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

interface ScenarioPlannerProps {
  baseline: BaselineRunwayData | undefined;
  onOpenChat: (seedPrompt?: string) => void;
}

export const ScenarioPlanner: React.FC<ScenarioPlannerProps> = ({ baseline, onOpenChat }) => {
  const scenario = useScenario(baseline);
  
  // Hiring Modal Form State
  const [showAddHire, setShowAddHire] = useState(false);
  const [hireName, setHireName] = useState('');
  const [hireRole, setHireRole] = useState('');
  const [hireDept, setHireDept] = useState('Engineering');
  const [hireSalary, setHireSalary] = useState('120000');
  const [hireStartMonth, setHireStartMonth] = useState('3');

  if (!baseline) {
    return (
      <Card className="p-8 flex items-center justify-center min-h-[300px]">
        <div className="flex flex-col items-center gap-3 opacity-70">
          <RefreshCw className="animate-spin text-primary" size={24} />
          <span className="text-xs font-bold text-muted-foreground tracking-widest">LOADING BASELINE PROJECTIONS...</span>
        </div>
      </Card>
    );
  }

  const handleAddHireSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hireName.trim() || !hireRole.trim()) return;

    scenario.addHire({
      name: hireName,
      role: hireRole,
      department: hireDept,
      salary: Number(hireSalary),
      startMonth: Number(hireStartMonth)
    });

    setHireName('');
    setHireRole('');
    setHireSalary('120000');
    setHireStartMonth('3');
    setShowAddHire(false);
  };

  const handleDiscussWithAI = () => {
    const activeNewHires = scenario.inputs.newHires;
    const hireSummary = activeNewHires.length > 0 
      ? activeNewHires.map(h => `${h.name} (${h.role} in ${h.department}, starting Month ${h.startMonth} at $${h.salary.toLocaleString()}/yr)`).join(', ')
      : "No new hires simulated";

    const seedPrompt = `I am running a financial forecasting scenario simulation. Here are my simulated parameters:
- MoM Revenue Growth: ${scenario.inputs.revenueGrowthRate}%
- Marketing Budget Adjustment: $${scenario.inputs.marketingSpendDelta.toLocaleString()}/mo
- Simulated CAC: $${scenario.inputs.cac}
- Simulated ARPU: $${scenario.inputs.arpu}
- Simulated Churn Rate: ${scenario.inputs.churnRate}%
- Starting MRR Delta: $${scenario.inputs.startingMrrDelta.toLocaleString()}
- Variable Overhead Multiplier: ${scenario.inputs.overheadMultiplier}%
- Simulated New Hires: ${hireSummary}

Under this simulation:
- Baseline Runway was: ${baseline.runwayMonths === "Infinite" ? "Infinite/Profitable" : `${baseline.runwayMonths} months`}
- Scenario Runway is: ${scenario.runwayMonths === "Infinite" ? "Infinite/Profitable" : `${scenario.runwayMonths} months`}
- Runway Delta is: ${scenario.runwayDelta === 999 ? "Achieved Profitability!" : scenario.runwayDelta === -999 ? "Dropped from Profitable to Deficit" : `${scenario.runwayDelta} months`}

Please analyze my active scenario. What are the key financial risks, and how can I optimize my cash runway while funding these choices?`;

    onOpenChat(seedPrompt);
  };

  const formatMoney = (cents: number) => {
    return `$${Math.round(cents / 100).toLocaleString('en-US')}`;
  };

  const deptColors: Record<string, string> = {
    Engineering: 'bg-indigo-500/5 text-indigo-400 border-indigo-500/10',
    Product: 'bg-cyan-500/5 text-cyan-400 border-cyan-500/10',
    Marketing: 'bg-rose-500/5 text-rose-400 border-rose-500/10',
    Sales: 'bg-emerald-500/5 text-emerald-400 border-emerald-500/10',
    Operations: 'bg-amber-500/5 text-amber-400 border-amber-500/10'
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Comparative Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 hover:border-primary/20 transition-all cursor-default relative overflow-hidden bg-black/10">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] uppercase tracking-widest font-black text-muted-foreground">Baseline Runway</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          </div>
          <div className="text-2xl font-black italic text-foreground mb-1.5">
            {baseline.runwayMonths === "Infinite" ? "Infinite" : `${baseline.runwayMonths} Months`}
          </div>
          <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider flex items-center gap-1">
            <span className="text-foreground font-extrabold">{formatMoney(baseline.netBurn)}/mo</span> net burn rate
          </div>
        </Card>

        <Card className="p-5 hover:border-primary/20 transition-all cursor-default border-emerald-500/20 bg-emerald-950/5 relative overflow-hidden">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] uppercase tracking-widest font-black text-emerald-400">Simulated Runway</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="text-2xl font-black italic text-emerald-400 mb-1.5">
            {scenario.runwayMonths === "Infinite" ? "Infinite" : `${scenario.runwayMonths} Months`}
          </div>
          <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider flex items-center gap-1">
            <span className="text-emerald-400 font-extrabold">{formatMoney(scenario.netBurn)}/mo</span> simulated burn
          </div>
        </Card>

        <Card className="p-5 hover:border-primary/20 transition-all cursor-default relative overflow-hidden bg-black/10 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] uppercase tracking-widest font-black text-muted-foreground">Runway Delta</span>
            <span className="text-muted-foreground/60"><TrendingUp size={14} /></span>
          </div>
          <div>
            {scenario.runwayDelta === 999 ? (
              <span className="text-xl font-black italic text-emerald-400 flex items-center gap-1.5 animate-pulse">
                <Sparkles size={16} /> Profitable Shift!
              </span>
            ) : scenario.runwayDelta === -999 ? (
              <span className="text-xl font-black italic text-rose-400 flex items-center gap-1.5">
                <ShieldAlert size={16} /> Profitable Deficit
              </span>
            ) : scenario.runwayDelta > 0 ? (
              <span className="text-2xl font-black italic text-emerald-400">
                +{scenario.runwayDelta} Months
              </span>
            ) : scenario.runwayDelta < 0 ? (
              <span className="text-2xl font-black italic text-rose-400">
                {scenario.runwayDelta} Months
              </span>
            ) : (
              <span className="text-2xl font-black italic text-muted-foreground/40">
                No Delta
              </span>
            )}
          </div>
          <div className="text-[9px] text-muted-foreground/60 font-bold mt-2 uppercase tracking-wide">
            {scenario.runwayDelta > 0 
              ? "Extends business survival runway" 
              : scenario.runwayDelta < 0 
                ? "Simulated outflows outpace revenue growth" 
                : "Aligns exactly with baseline setups"}
          </div>
        </Card>
      </div>

      {/* Dual Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Interactive Control Panel */}
        <Card className="lg:col-span-1 p-5 bg-card/60 relative overflow-hidden shadow-md space-y-5">
          <div className="flex justify-between items-center border-b border-border pb-3">
            <h3 className="font-bold flex items-center gap-2 text-foreground text-sm">
              <Sliders size={16} className="text-primary" />
              <span>Simulated Parameters</span>
            </h3>
            {scenario.active && (
              <Button 
                variant="outline"
                size="sm"
                onClick={scenario.reset}
                className="h-6 text-[9px] px-2 uppercase font-bold"
              >
                <RefreshCw size={8} className="mr-1" /> Reset
              </Button>
            )}
          </div>

          {/* Revenue Growth Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-muted-foreground">MoM Revenue Growth</span>
              <span className="text-emerald-400 flex items-center gap-0.5 font-bold">
                <Percent size={12} /> {scenario.inputs.revenueGrowthRate}%
              </span>
            </div>
            <Slider 
              min={0}
              max={25}
              step={0.5}
              value={[scenario.inputs.revenueGrowthRate]}
              onValueChange={(val) => scenario.updateInput('revenueGrowthRate', val[0])}
              className="py-2"
            />
            <span className="text-[9px] text-muted-foreground/60 block font-semibold">Compounding monthly growth added to baseline revenues.</span>
          </div>

          {/* Marketing Budget Adjustment */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-muted-foreground">Marketing Spend Delta</span>
              <span className="text-primary font-bold">
                +${scenario.inputs.marketingSpendDelta.toLocaleString()}/mo
              </span>
            </div>
            <Slider 
              min={0}
              max={20000}
              step={500}
              value={[scenario.inputs.marketingSpendDelta]}
              onValueChange={(val) => scenario.updateInput('marketingSpendDelta', val[0])}
              className="py-2"
            />
            <div className="flex justify-between text-[9px] text-muted-foreground/60 font-bold uppercase tracking-wider">
              <span>Adds to expenses</span>
              <span>Acquires at ${scenario.inputs.cac} CAC</span>
            </div>
          </div>

          {/* SaaS Unit Economics & Churn */}
          <div className="border-t border-border pt-4 space-y-4">
            <h4 className="text-[9px] uppercase tracking-widest font-black text-indigo-400 flex items-center gap-1.5">
              <Sparkles size={11} /> Unit Metrics Modulation
            </h4>

            {/* Starting MRR Delta */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-muted-foreground">Starting MRR Shift</span>
                <span className="text-indigo-400 font-bold">
                  {scenario.inputs.startingMrrDelta >= 0 ? '+' : ''}${scenario.inputs.startingMrrDelta.toLocaleString()}
                </span>
              </div>
              <Slider 
                min={-20000}
                max={20000}
                step={500}
                value={[scenario.inputs.startingMrrDelta]}
                onValueChange={(val) => scenario.updateInput('startingMrrDelta', val[0])}
                className="py-2"
              />
            </div>

            {/* Simulated Churn Rate */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-muted-foreground">Simulated Churn</span>
                <span className="text-rose-400 font-bold">
                  {scenario.inputs.churnRate}% MoM
                </span>
              </div>
              <Slider 
                min={0}
                max={15}
                step={0.1}
                value={[scenario.inputs.churnRate]}
                onValueChange={(val) => scenario.updateInput('churnRate', val[0])}
                className="py-2"
              />
            </div>

            {/* Simulated CAC */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-muted-foreground">Simulated CAC</span>
                <span className="text-amber-400 font-bold">
                  ${scenario.inputs.cac}
                </span>
              </div>
              <Slider 
                min={10}
                max={500}
                step={5}
                value={[scenario.inputs.cac]}
                onValueChange={(val) => scenario.updateInput('cac', val[0])}
                className="py-2"
              />
            </div>

            {/* Simulated ARPU */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-muted-foreground">Simulated ARPU</span>
                <span className="text-cyan-400 font-bold">
                  ${scenario.inputs.arpu}
                </span>
              </div>
              <Slider 
                min={5}
                max={250}
                step={5}
                value={[scenario.inputs.arpu]}
                onValueChange={(val) => scenario.updateInput('arpu', val[0])}
                className="py-2"
              />
            </div>
          </div>

          {/* Variable Overhead Multiplier */}
          <div className="space-y-2 border-t border-border pt-4">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-muted-foreground">Variable Overhead Scaler</span>
              <span className="text-foreground font-bold">
                {scenario.inputs.overheadMultiplier}%
              </span>
            </div>
            <Slider 
              min={50}
              max={200}
              step={5}
              value={[scenario.inputs.overheadMultiplier]}
              onValueChange={(val) => scenario.updateInput('overheadMultiplier', val[0])}
              className="py-2"
            />
            <span className="text-[9px] text-muted-foreground/60 block font-semibold">Scales non-payroll variable expenses.</span>
          </div>

          {/* Discuss with AI CFO Button */}
          <Button
            onClick={handleDiscussWithAI}
            className="w-full h-11 text-xs font-bold gap-1.5 mt-3"
          >
            <MessageSquare size={14} />
            <span>Audit Scenario with AI CFO</span>
          </Button>
        </Card>

        {/* Right Comparative Forecast Projections Chart */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-5 bg-card/60 min-h-[380px] flex flex-col justify-between relative overflow-hidden shadow-md">
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <CardTitle className="text-sm font-bold">What-If Runway Comparison</CardTitle>
                  <p className="text-muted-foreground text-[10px] uppercase tracking-widest font-black mt-0.5">12-Month Projected cash trajectories</p>
                </div>
                <Badge variant="outline" className="text-[9px] font-black uppercase tracking-wider py-1">
                  Dual Line Forecast
                </Badge>
              </div>
              <ComparativeRunwayChart 
                baselineProjections={baseline.projections} 
                scenarioProjections={scenario.projections} 
              />
            </div>
            
            {/* New Hires Tracker */}
            <div className="border-t border-border pt-5 mt-6 relative z-10">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-secondary" />
                  <h4 className="font-extrabold text-xs text-foreground">Simulated New Hires ({scenario.inputs.newHires.length})</h4>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddHire(!showAddHire)}
                  className="h-8 text-[9px] font-bold uppercase tracking-wider px-2.5 flex items-center gap-1.5"
                >
                  <Plus size={12} /> Add Hire
                </Button>
              </div>

              {/* Add Hire Form */}
              {showAddHire && (
                <Card className="p-4 border-primary/20 bg-primary/5 mb-4 animate-in slide-in-from-top duration-200">
                  <form onSubmit={handleAddHireSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-3.5 items-end">
                    <div className="space-y-1">
                      <label className="block text-[9px] font-bold text-muted-foreground uppercase tracking-widest pl-0.5">Name</label>
                      <Input 
                        type="text" 
                        required
                        value={hireName}
                        onChange={(e) => setHireName(e.target.value)}
                        placeholder="e.g. Sandra B." 
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[9px] font-bold text-muted-foreground uppercase tracking-widest pl-0.5">Role</label>
                      <Input 
                        type="text" 
                        required
                        value={hireRole}
                        onChange={(e) => setHireRole(e.target.value)}
                        placeholder="e.g. Staff Backend" 
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[9px] font-bold text-muted-foreground uppercase tracking-widest pl-0.5">Department</label>
                      <Select 
                        value={hireDept} 
                        onValueChange={(val) => setHireDept(val)}
                      >
                        <SelectTrigger className="w-full h-9 text-xs uppercase font-bold tracking-wider">
                          <SelectValue placeholder="DEPT" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Engineering">Engineering</SelectItem>
                          <SelectItem value="Product">Product</SelectItem>
                          <SelectItem value="Marketing">Marketing</SelectItem>
                          <SelectItem value="Sales">Sales</SelectItem>
                          <SelectItem value="Operations">Operations</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[9px] font-bold text-muted-foreground uppercase tracking-widest pl-0.5">Salary ($/yr)</label>
                      <Input 
                        type="number" 
                        required
                        value={hireSalary}
                        onChange={(e) => setHireSalary(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1 space-y-1">
                        <label className="block text-[9px] font-bold text-muted-foreground uppercase tracking-widest pl-0.5">Start Month</label>
                        <Select 
                          value={hireStartMonth} 
                          onValueChange={(val) => setHireStartMonth(val)}
                        >
                          <SelectTrigger className="w-full h-9 text-xs uppercase font-bold tracking-wider">
                            <SelectValue placeholder="MONTH" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Month 1</SelectItem>
                            <SelectItem value="2">Month 2</SelectItem>
                            <SelectItem value="3">Month 3</SelectItem>
                            <SelectItem value="4">Month 4</SelectItem>
                            <SelectItem value="6">Month 6</SelectItem>
                            <SelectItem value="9">Month 9</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button 
                        type="submit"
                        className="h-9 text-xs font-bold px-4 shrink-0"
                      >
                        Add
                      </Button>
                    </div>
                  </form>
                </Card>
              )}

              {/* Hires list */}
              {scenario.inputs.newHires.length === 0 ? (
                <div className="py-6 border border-dashed border-border rounded-xl text-center text-xs text-muted-foreground/60 font-semibold bg-black/10">
                  No simulated new hires. Add hires to visualize their custom cash impact over 12 months.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                  {scenario.inputs.newHires.map((hire) => (
                    <div key={hire.id} className="flex justify-between items-center p-3 rounded-xl border border-border bg-black/10 hover:bg-accent/20 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-secondary/15 border border-secondary/20 text-secondary flex items-center justify-center shrink-0 shadow-inner">
                          <Users size={14} />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-foreground leading-tight">{hire.name}</div>
                          <div className="text-[10px] text-muted-foreground font-bold mt-0.5">{hire.role}</div>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${deptColors[hire.department] || 'bg-white/5 border-white/10'}`}>
                              {hire.department}
                            </span>
                            <span className="text-[9px] text-muted-foreground font-bold flex items-center gap-0.5">
                              <Calendar size={8} className="text-muted-foreground/60" /> Month {hire.startMonth}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <div className="text-xs font-black text-foreground">${Math.round(hire.salary).toLocaleString()}/yr</div>
                          <div className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider mt-0.5">${Math.round(hire.salary / 12).toLocaleString()}/mo</div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => scenario.removeHire(hire.id)}
                          className="text-muted-foreground hover:text-destructive p-0 w-7 h-7 rounded-lg hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
