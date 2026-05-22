import React, { useState } from 'react';
import { 
  Sliders, Plus, Trash2, Calendar, 
  Sparkles, TrendingUp, RefreshCw, MessageSquare, Users, Percent, ShieldAlert
} from 'lucide-react';
import { useScenario } from '../hooks/useScenario';
import type { BaselineRunwayData } from '../hooks/useScenario';
import { ComparativeRunwayChart } from './Charts';

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
      <div className="glass-card p-8 flex items-center justify-center min-h-[300px]">
        <div className="flex flex-col items-center gap-3 opacity-55">
          <RefreshCw className="animate-spin text-primary" size={24} />
          <span className="text-xs font-semibold text-white/50 tracking-wider">LOADING BASELINE PROJECTIONS...</span>
        </div>
      </div>
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
      
      {/* Visual Comparative Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Baseline Card */}
        <div className="glass-card p-5 relative overflow-hidden bg-white/[0.005]">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] uppercase tracking-widest font-black text-white/40">Baseline Runway</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          </div>
          <div className="text-2xl font-black italic text-white mb-1.5">
            {baseline.runwayMonths === "Infinite" ? "Infinite" : `${baseline.runwayMonths} Months`}
          </div>
          <div className="text-[10px] text-white/40 font-bold uppercase tracking-wider flex items-center gap-1">
            <span className="text-white font-extrabold">{formatMoney(baseline.netBurn)}/mo</span> net burn rate
          </div>
        </div>

        {/* Simulated Scenario Card */}
        <div className="glass-card p-5 border-emerald-500/10 relative overflow-hidden bg-emerald-950/[0.02]">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] uppercase tracking-widest font-black text-emerald-400">Simulated Runway</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="text-2xl font-black italic text-emerald-400 mb-1.5">
            {scenario.runwayMonths === "Infinite" ? "Infinite" : `${scenario.runwayMonths} Months`}
          </div>
          <div className="text-[10px] text-white/40 font-bold uppercase tracking-wider flex items-center gap-1">
            <span className="text-emerald-400 font-extrabold">{formatMoney(scenario.netBurn)}/mo</span> simulated burn
          </div>
        </div>

        {/* Runway Delta / Benefit Card */}
        <div className="glass-card p-5 relative overflow-hidden bg-white/[0.005] flex flex-col justify-between">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] uppercase tracking-widest font-black text-white/40">Scenario Runway Delta</span>
            <span className="text-white/20"><TrendingUp size={14} /></span>
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
              <span className="text-2xl font-black italic text-white/30">
                No Delta
              </span>
            )}
          </div>
          <div className="text-[9px] text-white/30 font-bold mt-2 uppercase tracking-wide">
            {scenario.runwayDelta > 0 
              ? "Extends business survival runway" 
              : scenario.runwayDelta < 0 
                ? "Simulated outflows outpace revenue growth" 
                : "Aligns exactly with baseline setups"}
          </div>
        </div>

      </div>

      {/* Dual Panel Layout: Interactive Sliders & Visual Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Interactive Control Panel */}
        <div className="lg:col-span-1 space-y-5 glass-card p-5 bg-white/[0.005] relative overflow-hidden">
          <div className="absolute -left-16 -top-16 w-36 h-36 rounded-full bg-primary/5 blur-2xl pointer-events-none" />
          
          <div className="flex justify-between items-center border-b border-white/5 pb-3">
            <h3 className="font-extrabold flex items-center gap-2 text-white text-sm">
              <Sliders size={16} className="text-primary" />
              <span>Simulated Parameters</span>
            </h3>
            {scenario.active && (
              <button 
                onClick={scenario.reset}
                className="text-[9px] bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded-md uppercase tracking-widest font-black transition-all flex items-center gap-1 text-white/60 hover:text-white border border-white/5 cursor-pointer"
              >
                <RefreshCw size={8} /> Reset
              </button>
            )}
          </div>

          {/* Revenue Growth Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-white/60">MoM Revenue Growth</span>
              <span className="text-emerald-400 flex items-center gap-0.5 font-bold">
                <Percent size={12} /> {scenario.inputs.revenueGrowthRate}%
              </span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="25" 
              step="0.5"
              value={scenario.inputs.revenueGrowthRate}
              onChange={(e) => scenario.updateInput('revenueGrowthRate', parseFloat(e.target.value))}
              className="glass-slider"
            />
            <span className="text-[9px] text-white/30 block font-medium">Compounding monthly growth added to baseline revenues.</span>
          </div>

          {/* Marketing Budget Adjustment */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-white/60">Marketing Spend Delta</span>
              <span className="text-primary font-bold">
                +${scenario.inputs.marketingSpendDelta.toLocaleString()}/mo
              </span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="20000" 
              step="500"
              value={scenario.inputs.marketingSpendDelta}
              onChange={(e) => scenario.updateInput('marketingSpendDelta', parseInt(e.target.value))}
              className="glass-slider"
            />
            <div className="flex justify-between text-[9px] text-white/30 font-bold uppercase tracking-wider">
              <span>Adds to expenses</span>
              <span>Acquires at ${scenario.inputs.cac} CAC</span>
            </div>
          </div>

          {/* SaaS Unit Economics & Churn section */}
          <div className="border-t border-white/5 pt-4 space-y-4">
            <h4 className="text-[9px] uppercase tracking-widest font-black text-indigo-400 flex items-center gap-1.5">
              <Sparkles size={11} /> Unit Metrics Modulation
            </h4>

            {/* Starting MRR Delta */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-white/60">Starting MRR Shift</span>
                <span className="text-indigo-400 font-bold">
                  {scenario.inputs.startingMrrDelta >= 0 ? '+' : ''}${scenario.inputs.startingMrrDelta.toLocaleString()}
                </span>
              </div>
              <input 
                type="range" 
                min="-20000" 
                max="20000" 
                step="500"
                value={scenario.inputs.startingMrrDelta}
                onChange={(e) => scenario.updateInput('startingMrrDelta', parseInt(e.target.value))}
                className="glass-slider"
              />
            </div>

            {/* Simulated Churn Rate */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-white/60">Simulated Churn</span>
                <span className="text-rose-400 font-bold">
                  {scenario.inputs.churnRate}% MoM
                </span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="15" 
                step="0.1"
                value={scenario.inputs.churnRate}
                onChange={(e) => scenario.updateInput('churnRate', parseFloat(e.target.value))}
                className="glass-slider"
              />
            </div>

            {/* Simulated CAC */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-white/60">Simulated CAC</span>
                <span className="text-amber-400 font-bold">
                  ${scenario.inputs.cac}
                </span>
              </div>
              <input 
                type="range" 
                min="10" 
                max="500" 
                step="5"
                value={scenario.inputs.cac}
                onChange={(e) => scenario.updateInput('cac', parseInt(e.target.value))}
                className="glass-slider"
              />
            </div>

            {/* Simulated ARPU */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-white/60">Simulated ARPU</span>
                <span className="text-cyan-400 font-bold">
                  ${scenario.inputs.arpu}
                </span>
              </div>
              <input 
                type="range" 
                min="5" 
                max="250" 
                step="5"
                value={scenario.inputs.arpu}
                onChange={(e) => scenario.updateInput('arpu', parseInt(e.target.value))}
                className="glass-slider"
              />
            </div>
          </div>

          {/* Variable Overhead Multiplier */}
          <div className="space-y-2 border-t border-white/5 pt-4">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-white/60">Variable Overhead Scaler</span>
              <span className="text-white font-bold">
                {scenario.inputs.overheadMultiplier}%
              </span>
            </div>
            <input 
              type="range" 
              min="50" 
              max="200" 
              step="5"
              value={scenario.inputs.overheadMultiplier}
              onChange={(e) => scenario.updateInput('overheadMultiplier', parseInt(e.target.value))}
              className="glass-slider"
            />
            <span className="text-[9px] text-white/30 block font-medium">Scales non-payroll variable expenses.</span>
          </div>

          {/* Discuss with AI CFO Button */}
          <button
            onClick={handleDiscussWithAI}
            className="btn-primary w-full h-11 text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer shadow-xl shadow-primary/10 mt-3"
          >
            <MessageSquare size={14} />
            <span>Audit Scenario with AI CFO</span>
          </button>

        </div>

        {/* Right Comparative Forecast Projections Chart */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-5 bg-white/[0.005] min-h-[380px] flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -right-16 -top-16 w-36 h-36 rounded-full bg-secondary/5 blur-2xl pointer-events-none" />
            
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-base font-extrabold text-white">What-If Runway Comparison</h3>
                  <p className="text-white/40 text-[10px] uppercase tracking-widest font-black mt-0.5">12-Month Projected cash trajectories</p>
                </div>
                <div className="flex gap-2">
                  <span className="text-[9px] px-2.5 py-1 rounded-md bg-white/5 border border-white/5 font-black uppercase tracking-wider text-white/50">
                    Dual Line Forecast
                  </span>
                </div>
              </div>
              <ComparativeRunwayChart 
                baselineProjections={baseline.projections} 
                scenarioProjections={scenario.projections} 
              />
            </div>
            
            {/* New Hires Tracker Container inside dual panel */}
            <div className="border-t border-white/5 pt-5 mt-6 relative z-10">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-secondary" />
                  <h4 className="font-extrabold text-xs text-white">Simulated New Hires ({scenario.inputs.newHires.length})</h4>
                </div>
                <button
                  onClick={() => setShowAddHire(!showAddHire)}
                  className="text-[9px] bg-white/5 hover:bg-white/10 hover:border-white/20 border border-white/10 px-2.5 py-1.5 rounded-lg uppercase tracking-wider font-black transition-all cursor-pointer text-white flex items-center gap-1.5"
                >
                  <Plus size={12} /> Add Hire
                </button>
              </div>

              {/* Add Hire Form Drawer inline */}
              {showAddHire && (
                <form onSubmit={handleAddHireSubmit} className="glass-card p-4 border-secondary/20 bg-secondary/5 mb-4 animate-in slide-in-from-top-4 duration-200 grid grid-cols-1 md:grid-cols-5 gap-3.5 items-end">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-white/40 uppercase tracking-widest">Name</label>
                    <input 
                      type="text" 
                      required
                      value={hireName}
                      onChange={(e) => setHireName(e.target.value)}
                      placeholder="e.g. Sandra B." 
                      className="glass-input !py-2 !px-3 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-white/40 uppercase tracking-widest">Role</label>
                    <input 
                      type="text" 
                      required
                      value={hireRole}
                      onChange={(e) => setHireRole(e.target.value)}
                      placeholder="e.g. Staff Backend" 
                      className="glass-input !py-2 !px-3 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-white/40 uppercase tracking-widest">Department</label>
                    <div className="relative">
                      <select
                        value={hireDept}
                        onChange={(e) => setHireDept(e.target.value)}
                        className="glass-input !py-2 !px-3 text-xs appearance-none pr-8 cursor-pointer"
                      >
                        <option>Engineering</option>
                        <option>Product</option>
                        <option>Marketing</option>
                        <option>Sales</option>
                        <option>Operations</option>
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/30 text-[10px]">
                        ▼
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-white/40 uppercase tracking-widest">Salary ($/yr)</label>
                    <input 
                      type="number" 
                      required
                      value={hireSalary}
                      onChange={(e) => setHireSalary(e.target.value)}
                      className="glass-input !py-2 !px-3 text-xs"
                    />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 space-y-1">
                      <label className="block text-[9px] font-bold text-white/40 uppercase tracking-widest">Start Month</label>
                      <div className="relative">
                        <select
                          value={hireStartMonth}
                          onChange={(e) => setHireStartMonth(e.target.value)}
                          className="glass-input !py-2 !px-3 text-xs appearance-none pr-8 cursor-pointer"
                        >
                          <option value="1">Month 1</option>
                          <option value="2">Month 2</option>
                          <option value="3">Month 3</option>
                          <option value="4">Month 4</option>
                          <option value="6">Month 6</option>
                          <option value="9">Month 9</option>
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/30 text-[10px]">
                          ▼
                        </div>
                      </div>
                    </div>
                    <button 
                      type="submit"
                      className="btn-primary h-[34px] text-xs font-bold px-4 cursor-pointer self-end shrink-0"
                    >
                      Add
                    </button>
                  </div>
                </form>
              )}

              {/* Hires list */}
              {scenario.inputs.newHires.length === 0 ? (
                <div className="py-6 border border-dashed border-white/5 rounded-xl text-center text-xs text-white/30 font-medium">
                  No simulated new hires. Add hires to visualize their custom cash impact over 12 months.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                  {scenario.inputs.newHires.map((hire) => (
                    <div key={hire.id} className="flex justify-between items-center p-3 rounded-xl border border-white/5 bg-white/[0.005] hover:bg-white/[0.02] transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-secondary/5 border border-secondary/15 text-secondary flex items-center justify-center shrink-0 shadow-inner">
                          <Users size={14} />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white leading-tight">{hire.name}</div>
                          <div className="text-[10px] text-white/40 font-semibold mt-0.5">{hire.role}</div>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${deptColors[hire.department] || 'bg-white/5 border-white/10'}`}>
                              {hire.department}
                            </span>
                            <span className="text-[9px] text-white/30 font-bold flex items-center gap-0.5">
                              <Calendar size={8} className="text-white/20" /> Month {hire.startMonth}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <div className="text-xs font-black text-white">${Math.round(hire.salary).toLocaleString()}/yr</div>
                          <div className="text-[9px] text-white/30 font-semibold uppercase tracking-wider mt-0.5">${Math.round(hire.salary / 12).toLocaleString()}/mo</div>
                        </div>
                        <button
                          onClick={() => scenario.removeHire(hire.id)}
                          className="text-white/20 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
