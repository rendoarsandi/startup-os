import React, { useState } from 'react';
import { 
  Sliders, Plus, Trash2, Calendar, 
  Sparkles, TrendingUp, RefreshCw, MessageSquare, Users, Percent
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
        <div className="flex flex-col items-center gap-3 opacity-50">
          <RefreshCw className="animate-spin text-primary" size={32} />
          <span className="text-sm font-medium">Loading baseline runway projections...</span>
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

    // Reset Form
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
- Marketing Budget Adjustment: $${scenario.inputs.marketingSpendDelta.toLocaleString()}/mo with simulated ROAS ${scenario.inputs.marketingRoas}x
- Variable Overhead Multiplier: ${scenario.inputs.overheadMultiplier}%
- Simulated New Hires: ${hireSummary}

Under this simulation:
- Baseline Runway was: ${baseline.runwayMonths === "Infinite" ? "Infinite/Profitable" : `${baseline.runwayMonths} months`}
- Scenario Runway is: ${scenario.runwayMonths === "Infinite" ? "Infinite/Profitable" : `${scenario.runwayMonths} months`}
- Runway Delta is: ${scenario.runwayDelta === 999 ? "Achieved Profitability!" : scenario.runwayDelta === -999 ? "Dropped from Profitable to Deficit" : `${scenario.runwayDelta} months`}

Please analyze my active scenario. What are the key financial risks, and how can I optimize my cash runway while funding these choices?`;

    onOpenChat(seedPrompt);
  };

  // Helper formatting values
  const formatMoney = (cents: number) => {
    return `$${Math.round(cents / 100).toLocaleString('en-US')}`;
  };

  const deptColors: Record<string, string> = {
    Engineering: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    Product: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    Marketing: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    Sales: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    Operations: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Visual Comparative Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Baseline Card */}
        <div className="glass-card p-6 border-white/5 relative overflow-hidden bg-white/[0.01]">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs uppercase tracking-widest font-black text-white/40">Baseline Runway</span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          </div>
          <div className="text-3xl font-black italic text-white mb-2">
            {baseline.runwayMonths === "Infinite" ? "Infinite" : `${baseline.runwayMonths} Months`}
          </div>
          <div className="text-xs text-white/50 flex items-center gap-1">
            <span className="font-bold">{formatMoney(baseline.netBurn)}/mo</span> average burn rate
          </div>
        </div>

        {/* Simulated Scenario Card */}
        <div className="glass-card p-6 border-emerald-500/20 relative overflow-hidden bg-emerald-950/[0.05]">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs uppercase tracking-widest font-black text-emerald-400">Simulated Runway</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="text-3xl font-black italic text-emerald-400 mb-2">
            {scenario.runwayMonths === "Infinite" ? "Infinite" : `${scenario.runwayMonths} Months`}
          </div>
          <div className="text-xs text-white/50 flex items-center gap-1">
            <span className="font-bold text-emerald-400">{formatMoney(scenario.netBurn)}/mo</span> simulated average burn
          </div>
        </div>

        {/* Runway Delta / Benefit Card */}
        <div className="glass-card p-6 border-white/5 relative overflow-hidden bg-white/[0.01] flex flex-col justify-between">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs uppercase tracking-widest font-black text-white/40">Runway Runway Delta</span>
            <span className="text-white/20"><TrendingUp size={16} /></span>
          </div>
          <div>
            {scenario.runwayDelta === 999 ? (
              <span className="text-2xl font-black italic text-emerald-400 flex items-center gap-1.5 animate-pulse">
                <Sparkles size={20} /> Profitability!
              </span>
            ) : scenario.runwayDelta === -999 ? (
              <span className="text-2xl font-black italic text-rose-400">
                Loss of Profitability
              </span>
            ) : scenario.runwayDelta > 0 ? (
              <span className="text-3xl font-black italic text-emerald-400">
                +{scenario.runwayDelta} Months
              </span>
            ) : scenario.runwayDelta < 0 ? (
              <span className="text-3xl font-black italic text-rose-400">
                {scenario.runwayDelta} Months
              </span>
            ) : (
              <span className="text-3xl font-black italic text-white/30">
                No Delta
              </span>
            )}
          </div>
          <div className="text-xs text-white/40 mt-2">
            {scenario.runwayDelta > 0 ? "Simulation extends your business survival length." : scenario.runwayDelta < 0 ? "Hiring or overhead scales exceed your current revenue trajectories." : "Simulation aligns exactly with standard baseline parameters."}
          </div>
        </div>

      </div>

      {/* Dual Panel Layout: Interactive Sliders & Visual Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Interactive Control Panel */}
        <div className="lg:col-span-1 space-y-6 glass-card p-6 bg-white/[0.01]">
          <div className="flex justify-between items-center border-b border-white/5 pb-3">
            <h3 className="font-bold flex items-center gap-2 text-white">
              <Sliders size={18} className="text-primary" />
              <span>Scenario Adjustments</span>
            </h3>
            {scenario.active && (
              <button 
                onClick={scenario.reset}
                className="text-[10px] bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-md uppercase tracking-widest font-black transition-all flex items-center gap-1 text-white/60 hover:text-white cursor-pointer"
              >
                <RefreshCw size={10} /> Reset
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
              className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <span className="text-[10px] text-white/30 block">Compounding monthly growth added to baseline revenues.</span>
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
              className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-[10px] text-white/30">
              <span>Adds to variable expenses</span>
              <span>Yields {scenario.inputs.marketingRoas}x simulated ROAS</span>
            </div>
          </div>

          {/* Marketing ROAS Adjuster */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-white/60">Simulated Marketing ROAS</span>
              <span className="text-amber-400 font-bold">
                {scenario.inputs.marketingRoas}x Return
              </span>
            </div>
            <input 
              type="range" 
              min="0.5" 
              max="4.0" 
              step="0.1"
              value={scenario.inputs.marketingRoas}
              onChange={(e) => scenario.updateInput('marketingRoas', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <span className="text-[10px] text-white/30 block">Multiplied by marketing spend to boost baseline revenue growth.</span>
          </div>

          {/* Variable Overhead Multiplier */}
          <div className="space-y-2">
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
              className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <span className="text-[10px] text-white/30 block">Scales non-payroll variable expenses (e.g. server costs, sublicenses).</span>
          </div>

          {/* Discuss with AI CFO Button */}
          <button
            onClick={handleDiscussWithAI}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-primary to-secondary hover:brightness-110 active:scale-98 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer text-sm shadow-xl shadow-primary/10 transition-all text-white mt-4"
          >
            <MessageSquare size={16} />
            <span>Audit Scenario with AI CFO</span>
          </button>

        </div>

        {/* Right Comparative Forecast Projections Chart */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6 bg-white/[0.01] min-h-[400px] flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-bold">What-If Runway Comparison</h3>
                  <p className="text-xs text-white/40">Visualizing 12-month projections: Baseline (dashed orange) vs. Scenario (solid green).</p>
                </div>
                <div className="flex gap-2">
                  <span className="text-[10px] px-2.5 py-1 rounded-md bg-white/5 font-bold uppercase tracking-wider text-white/60">Compounding Projection</span>
                </div>
              </div>
              <ComparativeRunwayChart 
                baselineProjections={baseline.projections} 
                scenarioProjections={scenario.projections} 
              />
            </div>
            
            {/* New Hires Tracker Container inside dual panel */}
            <div className="border-t border-white/5 pt-6 mt-6">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-secondary" />
                  <h4 className="font-bold text-sm text-white">Simulated New Hires ({scenario.inputs.newHires.length})</h4>
                </div>
                <button
                  onClick={() => setShowAddHire(!showAddHire)}
                  className="text-[10px] bg-white/5 hover:bg-white/10 hover:border-white/20 border border-white/10 px-3 py-1.5 rounded-lg uppercase tracking-wider font-black transition-colors cursor-pointer text-white flex items-center gap-1"
                >
                  <Plus size={12} /> Add Hire
                </button>
              </div>

              {/* Add Hire Form Drawer inline */}
              {showAddHire && (
                <form onSubmit={handleAddHireSubmit} className="glass-card p-5 border-secondary/20 bg-secondary/5 mb-4 animate-in slide-in-from-top-4 duration-200 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                  <div className="md:col-span-1">
                    <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Name</label>
                    <input 
                      type="text" 
                      required
                      value={hireName}
                      onChange={(e) => setHireName(e.target.value)}
                      placeholder="e.g. Alice V." 
                      className="w-full bg-white/5 border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-secondary/50 text-white"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Role</label>
                    <input 
                      type="text" 
                      required
                      value={hireRole}
                      onChange={(e) => setHireRole(e.target.value)}
                      placeholder="e.g. Senior Frontend" 
                      className="w-full bg-white/5 border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-secondary/50 text-white"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Department</label>
                    <select
                      value={hireDept}
                      onChange={(e) => setHireDept(e.target.value)}
                      className="w-full bg-black/40 border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-secondary/50 text-white"
                    >
                      <option>Engineering</option>
                      <option>Product</option>
                      <option>Marketing</option>
                      <option>Sales</option>
                      <option>Operations</option>
                    </select>
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Salary ($/yr)</label>
                    <input 
                      type="number" 
                      required
                      value={hireSalary}
                      onChange={(e) => setHireSalary(e.target.value)}
                      className="w-full bg-white/5 border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-secondary/50 text-white"
                    />
                  </div>
                  <div className="md:col-span-1 flex gap-2">
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Start Month</label>
                      <select
                        value={hireStartMonth}
                        onChange={(e) => setHireStartMonth(e.target.value)}
                        className="w-full bg-black/40 border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-secondary/50 text-white"
                      >
                        <option value="1">Month 1 (Next)</option>
                        <option value="2">Month 2</option>
                        <option value="3">Month 3</option>
                        <option value="4">Month 4</option>
                        <option value="6">Month 6</option>
                        <option value="9">Month 9</option>
                      </select>
                    </div>
                    <button 
                      type="submit"
                      className="bg-secondary text-white hover:brightness-110 px-3 py-2.5 rounded-xl font-bold text-xs shrink-0 cursor-pointer h-[34px] flex items-center justify-center"
                    >
                      Add
                    </button>
                  </div>
                </form>
              )}

              {/* Hires list */}
              {scenario.inputs.newHires.length === 0 ? (
                <div className="py-6 border border-dashed border-white/5 rounded-xl text-center text-xs text-white/30">
                  No simulated new hires. Add new hires to test the monthly payroll cash impact.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                  {scenario.inputs.newHires.map((hire) => (
                    <div key={hire.id} className="flex justify-between items-center p-3 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                          <Users size={14} />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white leading-tight">{hire.name}</div>
                          <div className="text-[10px] text-white/50">{hire.role}</div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className={`text-[8px] px-1.5 py-0.5 rounded border font-semibold ${deptColors[hire.department] || 'bg-white/5 border-white/10'}`}>
                              {hire.department}
                            </span>
                            <span className="text-[9px] text-white/30 flex items-center gap-0.5">
                              <Calendar size={8} /> Start Month {hire.startMonth}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <div className="text-xs font-black text-white">${Math.round(hire.salary).toLocaleString()}/yr</div>
                          <div className="text-[9px] text-white/30">${Math.round(hire.salary / 12).toLocaleString()}/mo</div>
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
