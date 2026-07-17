import React, { useState, useMemo } from 'react';
import { 
  Users, Plus, Trash2, TrendingDown, DollarSign, Calendar, Sparkles, 
  ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, Award, Percent, RefreshCw
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  AreaChart, Area, XAxis, YAxis, CartesianGrid
} from 'recharts';

// --- TYPE DEFINITIONS ---

export interface PlannedHire {
  id: string;
  name: string;
  role: string;
  salary: number; // annual salary in dollars, e.g. 120000
  startMonth: number; // 1-indexed, e.g. 1 to 24
  equityGrant: number; // percentage, e.g. 0.5 for 0.5%
}

export interface CapTable {
  totalShares: number;
  founderShares: number;
  investorShares: number;
  optionPoolShares: number; // existing option pool
}

export interface RunwayResult {
  monthlyCashBalance: number[]; // month-by-month cash balances [0..horizon]
  monthlyBurnRates: number[];   // month-by-month burn rates [1..horizon]
  adjustedRunwayMonths: number; // months until cash <= 0
  baseRunwayMonths: number;     // base runway without planned hires
  totalNewPayrollAdded: number;  // total cash spent on new hires within horizon
  peakBurnRate: number;         // maximum monthly burn rate reached
}

export interface DilutionResult {
  allocatedSharesToHires: number;
  remainingOptionPoolShares: number;
  remainingOptionPoolPercent: number;
  isPoolExpanded: boolean;
  poolDeficitShares: number;
  newTotalShares: number;
  founderPercent: number;
  investorPercent: number;
  allocatedHiresPercent: number;
  remainingPoolPercentOfNewTotal: number;
}

// --- MATHEMATICAL MATH UTILITIES (Exported for Unit Testing) ---

/**
 * Recalculates month-by-month cash runway and burn-rate impacts.
 * Projecting forward to find the point where cash balance runs out.
 */
export function calculateRunway(
  startingCash: number,
  baseMonthlyBurn: number,
  horizonMonths: number,
  plannedHires: PlannedHire[]
): RunwayResult {
  const monthlyCashBalance: number[] = [startingCash];
  const monthlyBurnRates: number[] = [];
  let totalNewPayrollAdded = 0;
  let peakBurnRate = baseMonthlyBurn;

  // Track month-by-month cash for the horizon
  let currentCash = startingCash;

  for (let m = 1; m <= horizonMonths; m++) {
    let monthlyPayrollHires = 0;
    for (const hire of plannedHires) {
      if (hire.startMonth <= m) {
        const monthlySalary = hire.salary / 12;
        monthlyPayrollHires += monthlySalary;
        totalNewPayrollAdded += monthlySalary;
      }
    }

    const currentMonthBurn = baseMonthlyBurn + monthlyPayrollHires;
    if (currentMonthBurn > peakBurnRate) {
      peakBurnRate = currentMonthBurn;
    }

    monthlyBurnRates.push(currentMonthBurn);
    currentCash -= currentMonthBurn;
    monthlyCashBalance.push(Math.max(0, currentCash));
  }

  // Calculate base runway (months until startingCash runs out at baseMonthlyBurn)
  const baseRunwayMonths = baseMonthlyBurn > 0 ? startingCash / baseMonthlyBurn : Infinity;

  // Track adjusted runway projection with fine granularity (up to 120 months)
  let projectionCash = startingCash;
  let adjustedRunwayMonths = 0;
  const maxProjectionMonths = 120;

  for (let m = 1; m <= maxProjectionMonths; m++) {
    let monthlyPayrollHires = 0;
    for (const hire of plannedHires) {
      if (hire.startMonth <= m) {
        monthlyPayrollHires += hire.salary / 12;
      }
    }
    const currentMonthBurn = baseMonthlyBurn + monthlyPayrollHires;

    if (projectionCash <= 0) {
      break;
    }

    if (currentMonthBurn <= 0) {
      adjustedRunwayMonths = Infinity;
      break;
    }

    if (projectionCash < currentMonthBurn) {
      // Fractional runway month remaining
      adjustedRunwayMonths += projectionCash / currentMonthBurn;
      projectionCash = 0;
      break;
    } else {
      projectionCash -= currentMonthBurn;
      adjustedRunwayMonths += 1;
    }
  }

  return {
    monthlyCashBalance,
    monthlyBurnRates,
    adjustedRunwayMonths: adjustedRunwayMonths === Infinity ? Infinity : Number(adjustedRunwayMonths.toFixed(1)),
    baseRunwayMonths: baseRunwayMonths === Infinity ? Infinity : Number(baseRunwayMonths.toFixed(1)),
    totalNewPayrollAdded: Number(totalNewPayrollAdded.toFixed(2)),
    peakBurnRate: Number(peakBurnRate.toFixed(2)),
  };
}

/**
 * Calculates remaining available option pool size and dilution on founders based on allocations.
 */
export function calculateDilution(
  capTable: CapTable,
  plannedHires: PlannedHire[]
): DilutionResult {
  const { totalShares, founderShares, investorShares, optionPoolShares } = capTable;

  // Convert each planned hire's equity Grant % to shares based on original total shares
  let allocatedSharesToHires = 0;
  for (const hire of plannedHires) {
    allocatedSharesToHires += (hire.equityGrant / 100) * totalShares;
  }

  let remainingOptionPoolShares = optionPoolShares - allocatedSharesToHires;
  let poolDeficitShares = 0;
  let newTotalShares = totalShares;
  let isPoolExpanded = false;

  if (remainingOptionPoolShares < 0) {
    poolDeficitShares = Math.abs(remainingOptionPoolShares);
    newTotalShares = totalShares + poolDeficitShares;
    remainingOptionPoolShares = 0;
    isPoolExpanded = true;
  }

  const founderPercent = (founderShares / newTotalShares) * 100;
  const investorPercent = (investorShares / newTotalShares) * 100;
  const allocatedHiresPercent = (allocatedSharesToHires / newTotalShares) * 100;
  const remainingPoolPercentOfNewTotal = (remainingOptionPoolShares / newTotalShares) * 100;

  return {
    allocatedSharesToHires: Math.round(allocatedSharesToHires),
    remainingOptionPoolShares: Math.round(remainingOptionPoolShares),
    remainingOptionPoolPercent: Number(((remainingOptionPoolShares / newTotalShares) * 100).toFixed(2)),
    isPoolExpanded,
    poolDeficitShares: Math.round(poolDeficitShares),
    newTotalShares: Math.round(newTotalShares),
    founderPercent: Number(founderPercent.toFixed(2)),
    investorPercent: Number(investorPercent.toFixed(2)),
    allocatedHiresPercent: Number(allocatedHiresPercent.toFixed(2)),
    remainingPoolPercentOfNewTotal: Number(remainingPoolPercentOfNewTotal.toFixed(2)),
  };
}

// --- REACT INTERFACE COMPONENT ---

export const HiringEquityPlanner: React.FC = () => {
  // Cash Runway Setup
  const [startingCash, setStartingCash] = useState<number>(1200000);
  const [baseMonthlyBurn, setBaseMonthlyBurn] = useState<number>(75000);
  const [horizonMonths, setHorizonMonths] = useState<number>(12);

  // Cap Table Setup
  const [totalShares, setTotalShares] = useState<number>(10000000);
  const [founderShares, setFounderShares] = useState<number>(8000000);
  const [investorShares, setInvestorShares] = useState<number>(1000000);
  const [optionPoolShares, setOptionPoolShares] = useState<number>(1000000);

  // Advanced Cap Table Section Expand State
  const [showAdvancedCap, setShowAdvancedCap] = useState<boolean>(false);

  // Default Planned Hires
  const [plannedHires, setPlannedHires] = useState<PlannedHire[]>([
    {
      id: 'hire-1',
      name: 'Sarah Chen',
      role: 'Senior Frontend Architect',
      salary: 150000,
      startMonth: 2,
      equityGrant: 0.40
    },
    {
      id: 'hire-2',
      name: 'Marcus Brody',
      role: 'Lead Product Manager',
      salary: 130000,
      startMonth: 4,
      equityGrant: 0.25
    },
    {
      id: 'hire-3',
      name: 'Elena Rostova',
      role: 'VP of Growth',
      salary: 180000,
      startMonth: 6,
      equityGrant: 0.60
    }
  ]);

  // Form State for Adding Planned Hires
  const [newHireName, setNewHireName] = useState<string>('');
  const [newHireRole, setNewHireRole] = useState<string>('');
  const [newHireSalary, setNewHireSalary] = useState<string>('120000');
  const [newHireStartMonth, setNewHireStartMonth] = useState<string>('1');
  const [newHireEquity, setNewHireEquity] = useState<string>('0.25');

  // Interactive Calculations Memo
  const runwayResult = useMemo(() => {
    return calculateRunway(startingCash, baseMonthlyBurn, horizonMonths, plannedHires);
  }, [startingCash, baseMonthlyBurn, horizonMonths, plannedHires]);

  const capTable: CapTable = useMemo(() => {
    return {
      totalShares,
      founderShares,
      investorShares,
      optionPoolShares
    };
  }, [totalShares, founderShares, investorShares, optionPoolShares]);

  const dilutionResult = useMemo(() => {
    return calculateDilution(capTable, plannedHires);
  }, [capTable, plannedHires]);

  // Form Add Hire Handler
  const handleAddHire = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHireName.trim() || !newHireRole.trim()) return;

    const newHire: PlannedHire = {
      id: `hire-${Date.now()}`,
      name: newHireName.trim(),
      role: newHireRole.trim(),
      salary: Math.max(0, parseFloat(newHireSalary) || 0),
      startMonth: Math.max(1, parseInt(newHireStartMonth) || 1),
      equityGrant: Math.max(0, parseFloat(newHireEquity) || 0)
    };

    setPlannedHires([...plannedHires, newHire]);
    setNewHireName('');
    setNewHireRole('');
  };

  // Delete Planned Hire Handler
  const handleDeleteHire = (id: string) => {
    setPlannedHires(plannedHires.filter(h => h.id !== id));
  };

  // Recharts Cap Table Donut Chart Data
  const capTableChartData = useMemo(() => {
    const { founderPercent, investorPercent, allocatedHiresPercent, remainingPoolPercentOfNewTotal } = dilutionResult;
    return [
      { name: 'Founders', value: founderPercent, color: '#00E5FF', shares: founderShares },
      { name: 'Investors', value: investorPercent, color: '#9D4EDD', shares: investorShares },
      { name: 'Planned Hires', value: allocatedHiresPercent, color: '#00FF87', shares: dilutionResult.allocatedSharesToHires },
      { name: 'Available Pool', value: remainingPoolPercentOfNewTotal, color: '#FFB800', shares: dilutionResult.remainingOptionPoolShares }
    ].filter(item => item.value > 0);
  }, [dilutionResult, founderShares, investorShares]);

  // Recharts Cash Balance Trend Data
  const cashTrendChartData = useMemo(() => {
    const trend = [];
    const baseBurn = baseMonthlyBurn;
    let baseCash = startingCash;

    for (let m = 0; m <= horizonMonths; m++) {
      const projectedCashPlanned = runwayResult.monthlyCashBalance[m];
      
      // Calculate cash if NO hires were added
      const projectedCashBase = Math.max(0, baseCash - (m * baseBurn));

      trend.push({
        name: m === 0 ? 'Start' : `M${m}`,
        'Adjusted Cash (Hires)': Math.round(projectedCashPlanned),
        'Base Cash (No Hires)': Math.round(projectedCashBase)
      });
    }
    return trend;
  }, [startingCash, baseMonthlyBurn, horizonMonths, runwayResult]);

  return (
    <div className="space-y-8 pb-12 text-white">
      {/* HEADER SECTION */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-[#00FF87] animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#00FF87]">CFO & CHRO Strategic Workspace</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-[#00FF87] via-[#00E5FF] to-[#9D4EDD] bg-clip-text text-transparent italic">
            Hiring Runway & Option Pool Planner
          </h1>
          <p className="text-white/40 text-sm font-medium mt-1">
            Model hyper-precise compensation impact, map option pool allocations, and predict cash runway deterioration instantly.
          </p>
        </div>
      </header>

      {/* CORE STATS PANELS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Adjusted Runway Card */}
        <div className="p-5 glass-card relative overflow-hidden group">
          <div className="absolute -right-3 -top-3 w-14 h-14 rounded-full bg-white/5 group-hover:scale-105 transition-transform flex items-center justify-center border border-white/10">
            <TrendingDown size={18} className="text-[#00E5FF]" />
          </div>
          <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-2">Adjusted Cash Runway</p>
          <h4 className="text-3xl font-black tracking-tight text-white font-mono">
            {runwayResult.adjustedRunwayMonths === Infinity ? '∞' : `${runwayResult.adjustedRunwayMonths} Mo`}
          </h4>
          <div className="mt-3.5 flex items-center gap-2">
            {runwayResult.adjustedRunwayMonths < runwayResult.baseRunwayMonths ? (
              <Badge variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-400 text-[10px] font-bold">
                -{Number((runwayResult.baseRunwayMonths - runwayResult.adjustedRunwayMonths).toFixed(1))} Mo Reduction
              </Badge>
            ) : (
              <Badge variant="success" className="bg-emerald-500/10 border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                Runway Unchanged
              </Badge>
            )}
          </div>
          <p className="text-[9px] text-white/40 mt-2.5 font-bold uppercase tracking-wider">Base runway: {runwayResult.baseRunwayMonths} Months</p>
        </div>

        {/* Peak Monthly Burn */}
        <div className="p-5 glass-card relative overflow-hidden group">
          <div className="absolute -right-3 -top-3 w-14 h-14 rounded-full bg-white/5 group-hover:scale-105 transition-transform flex items-center justify-center border border-white/10">
            <DollarSign size={18} className="text-[#00FF87]" />
          </div>
          <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-2">Peak Monthly Burn</p>
          <h4 className="text-3xl font-black tracking-tight text-white font-mono">
            ${runwayResult.peakBurnRate.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </h4>
          <div className="mt-3.5">
            <Badge className="bg-[#00FF87]/10 border-[#00FF87]/20 text-[#00FF87] text-[10px] font-bold">
              +${(runwayResult.peakBurnRate - baseMonthlyBurn).toLocaleString('en-US', { maximumFractionDigits: 0 })}/mo Added
            </Badge>
          </div>
          <p className="text-[9px] text-white/40 mt-2.5 font-bold uppercase tracking-wider">Initial burn: ${baseMonthlyBurn.toLocaleString()}/mo</p>
        </div>

        {/* Option Pool Remaining */}
        <div className="p-5 glass-card relative overflow-hidden group">
          <div className="absolute -right-3 -top-3 w-14 h-14 rounded-full bg-white/5 group-hover:scale-105 transition-transform flex items-center justify-center border border-white/10">
            <Percent size={18} className="text-[#9D4EDD]" />
          </div>
          <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-2">Available Option Pool</p>
          <h4 className="text-3xl font-black tracking-tight text-white font-mono">
            {dilutionResult.remainingOptionPoolPercent}%
          </h4>
          <div className="mt-3.5">
            {dilutionResult.isPoolExpanded ? (
              <Badge className="bg-amber-500/10 border-amber-500/20 text-amber-400 text-[10px] font-bold flex items-center gap-1">
                <AlertTriangle size={10} />
                <span>Pool Overallocated</span>
              </Badge>
            ) : (
              <Badge className="bg-purple-500/10 border-purple-500/20 text-purple-400 text-[10px] font-bold">
                Pool Healthy
              </Badge>
            )}
          </div>
          <p className="text-[9px] text-white/40 mt-2.5 font-bold uppercase tracking-wider">
            {dilutionResult.remainingOptionPoolShares.toLocaleString()} / {optionPoolShares.toLocaleString()} shares
          </p>
        </div>

        {/* Founder Dilution State */}
        <div className="p-5 glass-card relative overflow-hidden group">
          <div className="absolute -right-3 -top-3 w-14 h-14 rounded-full bg-white/5 group-hover:scale-105 transition-transform flex items-center justify-center border border-white/10">
            <Users size={18} className="text-amber-400" />
          </div>
          <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-2">Founder Ownership</p>
          <h4 className="text-3xl font-black tracking-tight text-white font-mono">
            {dilutionResult.founderPercent}%
          </h4>
          <div className="mt-3.5">
            {dilutionResult.isPoolExpanded ? (
              <Badge className="bg-red-500/10 border-red-500/20 text-red-400 text-[10px] font-bold">
                Diluted by {Number(((founderShares / totalShares * 100) - dilutionResult.founderPercent).toFixed(2))}%
              </Badge>
            ) : (
              <Badge className="bg-emerald-500/10 border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                No Deficit Dilution
              </Badge>
            )}
          </div>
          <p className="text-[9px] text-white/40 mt-2.5 font-bold uppercase tracking-wider">Initial ownership: {((founderShares / totalShares) * 100).toFixed(1)}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: SIMULATOR CONTROLS */}
        <div className="space-y-6">
          {/* RUNWAY CONTROLS CARD */}
          <Card className="glass-card shadow-md">
            <CardHeader className="border-b border-white/5 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20">
                  <DollarSign size={14} />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-white">Cash Runway Settings</CardTitle>
                  <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest mt-0.5">Define cash starting profile</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              {/* Starting Cash */}
              <div className="space-y-2">
                <div className="flex justify-between items-center pl-0.5">
                  <label htmlFor="startingCash" className="text-[10px] font-bold text-white/80 uppercase tracking-widest">Starting Cash ($)</label>
                  <span className="text-xs font-mono font-bold text-[#00E5FF]">${startingCash.toLocaleString()}</span>
                </div>
                <Input 
                  id="startingCash"
                  type="number"
                  value={startingCash}
                  onChange={(e) => setStartingCash(Math.max(0, parseInt(e.target.value) || 0))}
                  className="bg-black/25 border-white/5 text-white placeholder-white/20 font-mono text-sm h-10"
                />
              </div>

              {/* Base Monthly Burn */}
              <div className="space-y-2">
                <div className="flex justify-between items-center pl-0.5">
                  <label htmlFor="baseMonthlyBurn" className="text-[10px] font-bold text-white/80 uppercase tracking-widest">Base Monthly Burn ($)</label>
                  <span className="text-xs font-mono font-bold text-[#00FF87]">${baseMonthlyBurn.toLocaleString()}/mo</span>
                </div>
                <Input 
                  id="baseMonthlyBurn"
                  type="number"
                  value={baseMonthlyBurn}
                  onChange={(e) => setBaseMonthlyBurn(Math.max(0, parseInt(e.target.value) || 0))}
                  className="bg-black/25 border-white/5 text-white placeholder-white/20 font-mono text-sm h-10"
                />
              </div>

              {/* Planning Horizon */}
              <div className="space-y-2">
                <label id="planningHorizonLabel" className="block text-[10px] font-bold text-white/80 uppercase tracking-widest pl-0.5">Planning Horizon</label>
                <Select 
                  value={horizonMonths.toString()} 
                  onValueChange={(val) => setHorizonMonths(parseInt(val))}
                >
                  <SelectTrigger aria-labelledby="planningHorizonLabel" className="w-full text-xs font-bold uppercase tracking-wider h-10 bg-black/25 border-white/5 text-white">
                    <SelectValue placeholder="Horizon" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#080710] border-white/10 text-white">
                    <SelectItem value="6" className="text-xs font-bold uppercase">6 Months</SelectItem>
                    <SelectItem value="12" className="text-xs font-bold uppercase">12 Months (1 Year)</SelectItem>
                    <SelectItem value="18" className="text-xs font-bold uppercase">18 Months</SelectItem>
                    <SelectItem value="24" className="text-xs font-bold uppercase">24 Months (2 Years)</SelectItem>
                    <SelectItem value="36" className="text-xs font-bold uppercase">36 Months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* CAP TABLE CONTROLS CARD */}
          <Card className="glass-card shadow-md">
            <CardHeader className="border-b border-white/5 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-[#9D4EDD]/10 text-[#9D4EDD] border border-[#9D4EDD]/20">
                    <Users size={14} />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold text-white">Cap Table Settings</CardTitle>
                    <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest mt-0.5">Configure equity shares</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="w-8 h-8 rounded-full border border-white/5 text-white/60 hover:text-white hover:bg-white/5"
                  onClick={() => setShowAdvancedCap(!showAdvancedCap)}
                  aria-label={showAdvancedCap ? "Collapse advanced cap table settings" : "Expand advanced cap table settings"}
                  aria-expanded={showAdvancedCap}
                >
                  {showAdvancedCap ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              {/* Condensed visual of ownership */}
              <div className="grid grid-cols-2 gap-3 pb-2 border-b border-white/5">
                <div className="p-2 rounded-lg bg-white/3 border border-white/5">
                  <p className="text-[8px] text-white/40 uppercase tracking-wider font-bold">Total Shares</p>
                  <p className="text-xs font-mono font-bold">{totalShares.toLocaleString()}</p>
                </div>
                <div className="p-2 rounded-lg bg-white/3 border border-white/5">
                  <p className="text-[8px] text-[#FFB800] uppercase tracking-wider font-bold font-mono">Original Pool</p>
                  <p className="text-xs font-mono font-bold text-[#FFB800]">
                    {((optionPoolShares / totalShares) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>

              {showAdvancedCap && (
                <div className="space-y-4 pt-1 animate-in slide-in-from-top-2 duration-300">
                  {/* Total Shares */}
                  <div className="space-y-1.5">
                    <label htmlFor="totalOutstandingShares" className="block text-[10px] font-bold text-white/80 uppercase tracking-widest pl-0.5">Total Outstanding Shares</label>
                    <Input 
                      id="totalOutstandingShares"
                      type="number"
                      value={totalShares}
                      onChange={(e) => {
                        const nextTotal = Math.max(1, parseInt(e.target.value) || 0);
                        setTotalShares(nextTotal);
                      }}
                      className="bg-black/25 border-white/5 text-white font-mono text-xs h-9"
                    />
                  </div>

                   {/* Founder Shares */}
                  <div className="space-y-1.5">
                    <label htmlFor="founderShares" className="block text-[10px] font-bold text-white/80 uppercase tracking-widest pl-0.5">Founder Shares</label>
                    <Input 
                      id="founderShares"
                      type="number"
                      value={founderShares}
                      onChange={(e) => setFounderShares(Math.max(0, parseInt(e.target.value) || 0))}
                      className="bg-black/25 border-white/5 text-white font-mono text-xs h-9"
                    />
                  </div>

                   {/* Investor Shares */}
                  <div className="space-y-1.5">
                    <label htmlFor="investorShares" className="block text-[10px] font-bold text-white/80 uppercase tracking-widest pl-0.5">Investor Shares</label>
                    <Input 
                      id="investorShares"
                      type="number"
                      value={investorShares}
                      onChange={(e) => setInvestorShares(Math.max(0, parseInt(e.target.value) || 0))}
                      className="bg-black/25 border-white/5 text-white font-mono text-xs h-9"
                    />
                  </div>

                   {/* Existing Option Pool Shares */}
                  <div className="space-y-1.5">
                    <label htmlFor="optionPoolShares" className="block text-[10px] font-bold text-white/80 uppercase tracking-widest pl-0.5">Option Pool Shares</label>
                    <Input 
                      id="optionPoolShares"
                      type="number"
                      value={optionPoolShares}
                      onChange={(e) => setOptionPoolShares(Math.max(0, parseInt(e.target.value) || 0))}
                      className="bg-black/25 border-white/5 text-white font-mono text-xs h-9"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* CENTER / RIGHT COLUMNS: PLANNED HIRES & DILUTION DETAILED VIEW */}
        <div className="lg:col-span-2 space-y-6">
          {/* TAB & DATA WRAPPER */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* TIMELINE LIST & PLANNER CARD */}
            <Card className="glass-card shadow-md flex flex-col justify-between h-full">
              <CardHeader className="border-b border-white/5 pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-[#00FF87]/10 text-[#00FF87] border border-[#00FF87]/20">
                    <Users size={14} />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold text-white">Hiring Timeline Planner</CardTitle>
                    <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest mt-0.5">Plan hiring ramp-up schedule</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-5 flex-1 flex flex-col justify-between space-y-5">
                {/* Scrollable list of hires */}
                <div className="max-h-[280px] overflow-y-auto pr-1 space-y-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                  {plannedHires.length === 0 ? (
                    <div className="h-44 border border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center p-4 text-center">
                      <Users className="text-white/20 mb-2" size={24} />
                      <p className="text-xs font-bold text-white/50">No Planned Headcount</p>
                      <p className="text-[10px] text-white/30 mt-1 max-w-[200px]">Add hires using the form below to simulate runway and dilution impacts.</p>
                    </div>
                  ) : (
                    plannedHires.map((hire) => (
                      <div key={hire.id} className="flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/5 hover:border-white/10 transition-colors">
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-1.5">
                            <h5 className="text-xs font-bold text-white truncate">{hire.name}</h5>
                            <span className="text-[9px] font-semibold text-white/40 truncate font-mono">({hire.role})</span>
                          </div>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-[9px] text-[#00FF87] font-bold font-mono">
                              ${hire.salary.toLocaleString()}/yr
                            </span>
                            <span className="text-[9px] text-[#00E5FF] font-bold font-mono">
                              Start: Month {hire.startMonth}
                            </span>
                            <span className="text-[9px] text-[#9D4EDD] font-bold font-mono">
                              {hire.equityGrant}% Equity
                            </span>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 flex-shrink-0"
                          onClick={() => handleDeleteHire(hire.id)}
                          aria-label={`Delete headcount ${hire.name}`}
                        >
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    ))
                  )}
                </div>

                {/* Adding planned hire form drawer/embedded */}
                <form onSubmit={handleAddHire} className="border-t border-white/5 pt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label htmlFor="newHireName" className="text-[10px] font-bold text-white/80 uppercase tracking-wider">Candidate Name</label>
                      <Input 
                        id="newHireName"
                        type="text"
                        required
                        value={newHireName}
                        onChange={(e) => setNewHireName(e.target.value)}
                        placeholder="e.g. Sandra Bullock"
                        className="bg-black/20 border-white/5 text-xs h-8 text-white px-2.5"
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="newHireRole" className="text-[10px] font-bold text-white/80 uppercase tracking-wider">Role Title</label>
                      <Input 
                        id="newHireRole"
                        type="text"
                        required
                        value={newHireRole}
                        onChange={(e) => setNewHireRole(e.target.value)}
                        placeholder="e.g. Lead HR Specialist"
                        className="bg-black/20 border-white/5 text-xs h-8 text-white px-2.5"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label htmlFor="newHireSalary" className="text-[10px] font-bold text-white/80 uppercase tracking-wider">Salary ($/yr)</label>
                      <Input 
                        id="newHireSalary"
                        type="number"
                        required
                        value={newHireSalary}
                        onChange={(e) => setNewHireSalary(e.target.value)}
                        placeholder="e.g. 120000"
                        className="bg-black/20 border-white/5 text-xs h-8 text-white font-mono px-2"
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="newHireStartMonth" className="text-[10px] font-bold text-white/80 uppercase tracking-wider">Start Month</label>
                      <Input 
                        id="newHireStartMonth"
                        type="number"
                        required
                        min="1"
                        max="36"
                        value={newHireStartMonth}
                        onChange={(e) => setNewHireStartMonth(e.target.value)}
                        placeholder="Month No."
                        className="bg-black/20 border-white/5 text-xs h-8 text-white font-mono px-2"
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="newHireEquity" className="text-[10px] font-bold text-white/80 uppercase tracking-wider">Equity Grant (%)</label>
                      <Input 
                        id="newHireEquity"
                        type="number"
                        step="0.01"
                        required
                        value={newHireEquity}
                        onChange={(e) => setNewHireEquity(e.target.value)}
                        placeholder="e.g. 0.25"
                        className="bg-black/20 border-white/5 text-xs h-8 text-white font-mono px-2"
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-8 text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-[#00FF87] to-[#00E5FF] text-black hover:scale-[1.01] hover:brightness-110 active:scale-[0.99] transition-all duration-300 flex items-center justify-center gap-1"
                  >
                    <Plus size={11} className="stroke-[3px]" />
                    <span>Add Candidate to Model</span>
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* DILUTION GRAPHIC & CAP TABLE DONUT */}
            <Card className="glass-card shadow-md flex flex-col justify-between h-full">
              <CardHeader className="border-b border-white/5 pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-[#9D4EDD]/10 text-[#9D4EDD] border border-[#9D4EDD]/20">
                    <Award size={14} />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold text-white">Dilution & Cap Table Map</CardTitle>
                    <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest mt-0.5">Track equity allocation</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-5 flex-1 flex flex-col justify-center items-center">
                {/* Donut Chart Container */}
                <div className="w-full h-48 relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={capTableChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {capTableChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
                        ))}
                      </Pie>
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-[#080710]/95 border border-white/10 rounded-xl p-3 shadow-xl backdrop-blur-md">
                                <p className="text-xs font-extrabold text-white uppercase tracking-wider">{data.name}</p>
                                <p className="text-[11px] text-[#00E5FF] font-bold font-mono mt-1">Ownership: {data.value}%</p>
                                <p className="text-[9px] text-white/40 font-mono mt-0.5">Shares: {data.shares.toLocaleString()}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Absolute Center Content of Donut */}
                  <div className="absolute flex flex-col items-center justify-center text-center">
                    <span className="text-[8px] uppercase tracking-widest text-white/40 font-black">Total Shares</span>
                    <span className="text-sm font-black tracking-tighter text-white font-mono">
                      {dilutionResult.newTotalShares.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Mini Legends with beautiful pill outlines */}
                <div className="grid grid-cols-2 gap-2 w-full mt-3">
                  {capTableChartData.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 p-1.5 px-2 rounded-lg bg-white/2 border border-white/3">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[9px] text-white/60 font-bold truncate leading-none uppercase">{item.name}</p>
                        <p className="text-[10px] text-white font-black font-mono leading-none mt-1">{item.value}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* PROJECTED CASH FLOW RUNWAY TREND LINE */}
          <Card className="glass-card shadow-md">
            <CardHeader className="border-b border-white/5 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20">
                    <TrendingDown size={14} />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold text-white">Cash Runway Projection Chart</CardTitle>
                    <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest mt-0.5">Simulated cash profile vs baseline over horizon</p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="w-full h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={cashTrendChartData}
                    margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorAdjusted" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#00E5FF" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorBase" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00FF87" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#00FF87" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      stroke="rgba(255,255,255,0.3)" 
                      fontSize={9}
                      tickLine={false}
                    />
                    <YAxis 
                      stroke="rgba(255,255,255,0.3)" 
                      fontSize={9}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-[#080710]/95 border border-white/10 rounded-xl p-3 shadow-xl backdrop-blur-md space-y-1">
                              <p className="text-[10px] font-extrabold text-white/50 uppercase tracking-wider">{payload[0].payload.name}</p>
                              {payload.map((p, idx) => (
                                <p key={idx} className="text-xs font-bold font-mono" style={{ color: p.color }}>
                                  {p.name}: ${Number(p.value).toLocaleString()}
                                </p>
                              ))}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="Adjusted Cash (Hires)" 
                      stroke="#00E5FF" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorAdjusted)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="Base Cash (No Hires)" 
                      stroke="#00FF87" 
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      fillOpacity={1} 
                      fill="url(#colorBase)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Real-time details of cash spent */}
              <div className="mt-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/3 border border-white/5 rounded-xl p-3.5">
                <div className="space-y-0.5">
                  <p className="text-[9px] text-white/40 uppercase font-bold tracking-wider">Cumulative New Payroll Outflow</p>
                  <p className="text-lg font-black font-mono text-[#00E5FF]">
                    ${runwayResult.totalNewPayrollAdded.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="text-[10px] text-white/50 max-w-[400px]">
                  This simulation projects total compensation cash flow. Any hire's start month dictates the month in which their payroll commences. Outflows accumulate dynamically over your selected planning horizon of <span className="text-white font-bold">{horizonMonths} Months</span>.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* DILUTION CRITICAL NOTIFICATIONS */}
      {dilutionResult.isPoolExpanded && (
        <div className="flex items-center gap-3 p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 text-amber-300 animate-pulse">
          <AlertTriangle size={18} className="flex-shrink-0 text-amber-400" />
          <div className="text-xs font-medium">
            <span className="font-extrabold text-white uppercase tracking-wider block mb-0.5">Caution: Option Pool Overallocated</span>
            Your planned headcount's equity grants (totaling <span className="font-bold text-white font-mono">{(dilutionResult.allocatedSharesToHires / totalShares * 100).toFixed(2)}%</span>) exceed the available option pool of <span className="font-bold text-white font-mono">{((optionPoolShares / totalShares) * 100).toFixed(1)}%</span>. To absorb this, the pool was auto-expanded by <span className="font-bold text-white font-mono">{dilutionResult.poolDeficitShares.toLocaleString()} shares</span>, causing active founder ownership to dilute from <span className="font-bold text-white font-mono">{((founderShares / totalShares) * 100).toFixed(2)}%</span> to <span className="font-bold text-[#00E5FF] font-mono">{dilutionResult.founderPercent}%</span>.
          </div>
        </div>
      )}
    </div>
  );
};
