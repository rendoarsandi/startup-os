import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, Sparkles, DollarSign, Users, Percent, ShieldAlert, 
  ArrowUpRight, ArrowDownRight, RefreshCw, BarChart2, Info, HelpCircle
} from 'lucide-react';
import { Card, CardTitle } from './ui/card';
import { Slider } from './ui/slider';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid 
} from 'recharts';

// --- TYPES & INTERFACES ---

export interface SaasMetricsInput {
  arpu: number;            // Average Revenue Per User (monthly)
  cac: number;             // Customer Acquisition Cost
  churnRate: number;       // Monthly Churn Rate (percentage, e.g. 2.5 for 2.5%)
  grossMargin: number;     // Gross Margin (percentage, e.g. 80 for 80%)
}

export interface SaasMetricsOutput {
  ltv: number;                 // Lifetime Value
  ltvToCacRatio: number;       // LTV:CAC Ratio
  cacPaybackPeriod: number;    // CAC Payback Period (months)
  magicNumber: number;         // SaaS Magic Number
}

export interface RunwaySimulationInput {
  startingCash: number;
  monthlyOpEx: number;      // Monthly operational expenses excluding marketing
  marketingSpend: number;   // Monthly S&M budget
  impressions: number;      // Monthly unique visits / traffic
  conversionRate: number;   // Conversion rate from impressions to customers (e.g. 1.0 for 1%)
  arpu: number;
  churnRate: number;        // Monthly Churn Rate (percentage)
  months: number;
  startingCustomers?: number;
}

export interface SimulationMonthResult {
  month: string;
  cashBalance: number;
  activeCustomers: number;
  revenue: number;
  netBurn: number;
}

// --- MATHEMATICAL MODELS (EXPORTED FOR TESTING) ---

export function calculateLtv({ arpu, churnRate, grossMargin }: Omit<SaasMetricsInput, 'cac'>): number {
  if (churnRate === 0) return Infinity;
  if (churnRate < 0 || arpu < 0 || grossMargin < 0) return 0;
  const marginFraction = Math.min(100, grossMargin) / 100;
  const churnFraction = churnRate / 100;
  return (arpu * marginFraction) / churnFraction;
}

export function calculateLtvToCacRatio({ arpu, cac, churnRate, grossMargin }: SaasMetricsInput): number {
  if (cac < 0) return 0;
  if (cac === 0) {
    const ltv = calculateLtv({ arpu, churnRate, grossMargin });
    return ltv > 0 ? Infinity : 0;
  }
  const ltv = calculateLtv({ arpu, churnRate, grossMargin });
  if (ltv === Infinity) return Infinity;
  return ltv / cac;
}

export function calculateCacPaybackPeriod({ arpu, cac, grossMargin }: Omit<SaasMetricsInput, 'churnRate'>): number {
  if (cac < 0 || arpu < 0 || grossMargin < 0) return 0;
  const adjustedArpu = arpu * (Math.min(100, grossMargin) / 100);
  if (adjustedArpu <= 0) return Infinity;
  return cac / adjustedArpu;
}

export function calculateSaaSMagicNumber(
  currentMrr: number,
  previousMrr: number,
  previousSmSpend: number
): number {
  if (previousSmSpend < 0 || currentMrr < 0 || previousMrr < 0) return 0;
  if (previousSmSpend === 0) {
    return currentMrr > previousMrr ? Infinity : 0;
  }
  return ((currentMrr - previousMrr) * 12) / previousSmSpend;
}

export function runRunwaySimulation({
  startingCash,
  monthlyOpEx,
  marketingSpend,
  impressions,
  conversionRate,
  arpu,
  churnRate,
  months = 12,
  startingCustomers = 100,
}: RunwaySimulationInput): SimulationMonthResult[] {
  const results: SimulationMonthResult[] = [];
  let currentCash = startingCash;
  let currentCustomers = Math.max(0, startingCustomers);
  const churnFraction = Math.max(0, churnRate) / 100;
  const convFraction = Math.max(0, conversionRate) / 100;

  for (let m = 1; m <= months; m++) {
    const newCustomers = Math.max(0, impressions) * convFraction;
    const churnedCustomers = currentCustomers * churnFraction;
    currentCustomers = Math.max(0, currentCustomers + newCustomers - churnedCustomers);
    
    const monthlyRevenue = currentCustomers * arpu;
    const totalOpEx = Math.max(0, monthlyOpEx) + Math.max(0, marketingSpend);
    const netCashflow = monthlyRevenue - totalOpEx;
    currentCash += netCashflow;

    results.push({
      month: `M${m}`,
      cashBalance: Math.round(currentCash),
      activeCustomers: Math.round(currentCustomers),
      revenue: Math.round(monthlyRevenue),
      netBurn: Math.round(-netCashflow),
    });
  }

  return results;
}

// --- SUB-COMPONENTS ---

interface RadialGaugeProps {
  value: number;
  max: number;
  title: string;
  subtitle: string;
  unit?: string;
  color: string;
  glowColor: string;
  ratingText?: string;
  ratingVariant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
}

export const RadialGauge: React.FC<RadialGaugeProps> = ({
  value,
  max,
  title,
  subtitle,
  unit = "",
  color,
  glowColor,
  ratingText,
  ratingVariant = 'default'
}) => {
  const percentage = value === Infinity ? 100 : Math.min(100, Math.max(0, (value / max) * 100));
  const radius = 50;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-5 bg-white/[0.02] border border-white/[0.04] rounded-2xl relative overflow-hidden transition-all duration-300 hover:border-white/[0.08] hover:bg-white/[0.04]">
      {/* Background radial glow */}
      <div 
        className="absolute -right-10 -bottom-10 w-24 h-24 blur-[40px] rounded-full opacity-15 pointer-events-none transition-all duration-500"
        style={{ backgroundColor: color }}
      />
      
      <div className="relative w-32 h-32 flex items-center justify-center">
        {/* SVG Circle */}
        <svg className="w-full h-full transform -rotate-90" role="img" aria-hidden="true">
          <circle
            cx="64"
            cy="64"
            r={radius}
            stroke="rgba(255, 255, 255, 0.03)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <circle
            cx="64"
            cy="64"
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
            style={{
              filter: `drop-shadow(0 0 6px ${glowColor})`
            }}
          />
        </svg>
        
        {/* Inside metrics */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xl font-black text-white leading-none">
            {value === Infinity ? "∞" : value.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
            <span className="text-[10px] font-semibold text-white/50 ml-0.5">{unit}</span>
          </span>
          <span className="text-[10px] text-white/60 uppercase tracking-widest font-black mt-1">
            {subtitle}
          </span>
        </div>
      </div>

      <div className="text-xs font-black text-white mt-3 tracking-wide">{title}</div>
      {ratingText && (
        <Badge variant={ratingVariant} className="text-[10px] font-black uppercase tracking-wider mt-1.5 py-0.5 px-2">
          {ratingText}
        </Badge>
      )}
    </div>
  );
};

// --- MAIN ENGINE COMPONENT ---

export const SaaSEconomics: React.FC = () => {
  // --- STATE ---
  // Core metrics controls
  const [arpu, setArpu] = useState<number>(150);
  const [churnRate, setChurnRate] = useState<number>(2.5);
  const [cac, setCac] = useState<number>(400);
  const [grossMargin, setGrossMargin] = useState<number>(85);

  // Magic Number controls
  const [currentMrr, setCurrentMrr] = useState<number>(55000);
  const [previousMrr, setPreviousMrr] = useState<number>(45000);
  const [previousSmSpend, setPreviousSmSpend] = useState<number>(15000);

  // Runway Simulation controls
  const [startingCash, setStartingCash] = useState<number>(600000);
  const [monthlyOpEx, setMonthlyOpEx] = useState<number>(45000);
  const [marketingSpend, setMarketingSpend] = useState<number>(15000);
  const [impressions, setImpressions] = useState<number>(80000);
  const [baseConvRate, setBaseConversionRate] = useState<number>(1.0);
  const [targetConvRate, setTargetConversionRate] = useState<number>(2.2);

  // --- DERIVED CALCULATIONS ---
  const ltv = useMemo(() => {
    return calculateLtv({ arpu, churnRate, grossMargin });
  }, [arpu, churnRate, grossMargin]);

  const ltvToCac = useMemo(() => {
    return calculateLtvToCacRatio({ arpu, cac, churnRate, grossMargin });
  }, [arpu, cac, churnRate, grossMargin]);

  const paybackPeriod = useMemo(() => {
    return calculateCacPaybackPeriod({ arpu, cac, grossMargin });
  }, [arpu, cac, grossMargin]);

  const magicNumber = useMemo(() => {
    return calculateSaaSMagicNumber(currentMrr, previousMrr, previousSmSpend);
  }, [currentMrr, previousMrr, previousSmSpend]);

  // Health Ratings & Styling
  const ltvToCacRating = useMemo(() => {
    if (ltvToCac < 1.5) return { text: "Critical Burn", variant: "destructive" as const };
    if (ltvToCac < 3.0) return { text: "Below Benchmark", variant: "warning" as const };
    if (ltvToCac < 5.0) return { text: "Healthy / Safe", variant: "success" as const };
    return { text: "Hyper Efficient", variant: "success" as const };
  }, [ltvToCac]);

  const paybackRating = useMemo(() => {
    if (paybackPeriod === Infinity) return { text: "Unviable", variant: "destructive" as const };
    if (paybackPeriod > 18) return { text: "High Risk", variant: "destructive" as const };
    if (paybackPeriod > 12) return { text: "Standard Burn", variant: "warning" as const };
    if (paybackPeriod > 5) return { text: "Highly Efficient", variant: "success" as const };
    return { text: "Exceptional", variant: "success" as const };
  }, [paybackPeriod]);

  const magicNumberRating = useMemo(() => {
    if (magicNumber < 0.5) return { text: "S&M Friction", variant: "destructive" as const };
    if (magicNumber < 0.75) return { text: "Inimical Yield", variant: "warning" as const };
    if (magicNumber < 1.0) return { text: "Healthy Efficiency", variant: "success" as const };
    return { text: "Outstanding Growth", variant: "success" as const };
  }, [magicNumber]);

  // Runway Simulation computations
  const startingCustomers = useMemo(() => {
    return Math.round(previousMrr / arpu) || 200;
  }, [previousMrr, arpu]);

  const baselineProjections = useMemo(() => {
    return runRunwaySimulation({
      startingCash,
      monthlyOpEx,
      marketingSpend,
      impressions,
      conversionRate: baseConvRate,
      arpu,
      churnRate,
      months: 12,
      startingCustomers
    });
  }, [startingCash, monthlyOpEx, marketingSpend, impressions, baseConvRate, arpu, churnRate, startingCustomers]);

  const targetProjections = useMemo(() => {
    return runRunwaySimulation({
      startingCash,
      monthlyOpEx,
      marketingSpend,
      impressions,
      conversionRate: targetConvRate,
      arpu,
      churnRate,
      months: 12,
      startingCustomers
    });
  }, [startingCash, monthlyOpEx, marketingSpend, impressions, targetConvRate, arpu, churnRate, startingCustomers]);

  // Calculate comparative cash runway lengths
  const getRunwayLength = (results: SimulationMonthResult[]) => {
    const bankruptMonth = results.findIndex(r => r.cashBalance <= 0);
    return bankruptMonth === -1 ? "Infinite / Profitable" : `${bankruptMonth} Months`;
  };

  const getEndingCash = (results: SimulationMonthResult[]) => {
    return results[results.length - 1].cashBalance;
  };

  const baselineRunwayStr = useMemo(() => getRunwayLength(baselineProjections), [baselineProjections]);
  const targetRunwayStr = useMemo(() => getRunwayLength(targetProjections), [targetProjections]);

  const finalCashDiff = useMemo(() => {
    return getEndingCash(targetProjections) - getEndingCash(baselineProjections);
  }, [baselineProjections, targetProjections]);

  // Combine data for charting
  const chartData = useMemo(() => {
    return baselineProjections.map((bp, i) => {
      const tp = targetProjections[i];
      return {
        month: bp.month,
        baselineCash: bp.cashBalance,
        targetCash: tp.cashBalance,
        baselineCustomers: bp.activeCustomers,
        targetCustomers: tp.activeCustomers,
      };
    });
  }, [baselineProjections, targetProjections]);

  // Reset values
  const handleResetMetrics = () => {
    setArpu(150);
    setChurnRate(2.5);
    setCac(400);
    setGrossMargin(85);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Background Nebula Glows */}
      <div className="absolute top-[5%] left-[20%] w-[40%] h-[35%] bg-cyan-500/5 blur-[120px] rounded-full -z-10 animate-pulse" />
      <div className="absolute top-[40%] right-[10%] w-[35%] h-[30%] bg-purple-500/5 blur-[130px] rounded-full -z-10" />

      {/* HEADER SECTION */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black italic bg-gradient-to-r from-[#00E5FF] to-[#9D4EDD] bg-clip-text text-transparent tracking-tight">
            SaaS Unit Economics Engine
          </h2>
          <p className="text-muted-foreground text-sm font-medium mt-1">
            Simulate and evaluate LTV, payback metrics, sales efficiency, and the runway impact of marketing optimization.
          </p>
        </div>
        <Button 
          variant="secondary"
          onClick={handleResetMetrics}
          className="h-9 text-xs font-bold gap-2 self-start md:self-center bg-white/[0.03] border-white/[0.08]"
        >
          <RefreshCw size={12} /> Reset Parameters
        </Button>
      </header>

      {/* CORE GAUGES ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* LTV */}
        <RadialGauge 
          value={ltv}
          max={10000}
          title="Customer Lifetime Value"
          subtitle="Estimated LTV"
          unit="$"
          color="#9D4EDD" // Amethyst Purple
          glowColor="rgba(157, 78, 221, 0.2)"
          ratingText={`Lifespan: ${(100 / Math.max(0.1, churnRate)).toFixed(1)} Mo.`}
          ratingVariant="outline"
        />

        {/* LTV:CAC Ratio */}
        <RadialGauge 
          value={ltvToCac}
          max={10}
          title="LTV : CAC Ratio"
          subtitle="Capital Yield"
          unit="x"
          color="#00E5FF" // Electric Cyan
          glowColor="rgba(0, 229, 255, 0.2)"
          ratingText={ltvToCacRating.text}
          ratingVariant={ltvToCacRating.variant}
        />

        {/* Payback Period */}
        <RadialGauge 
          value={paybackPeriod}
          max={24}
          title="CAC Payback Period"
          subtitle="Breakeven Time"
          unit=" Mo."
          color="#FF5E36" // Hyper Coral
          glowColor="rgba(255, 94, 54, 0.2)"
          ratingText={paybackRating.text}
          ratingVariant={paybackRating.variant}
        />

        {/* Magic Number */}
        <RadialGauge 
          value={magicNumber}
          max={2.5}
          title="SaaS Magic Number"
          subtitle="S&M Efficiency"
          unit="x"
          color="#00FF87" // Vivid Emerald Mint
          glowColor="rgba(0, 255, 135, 0.2)"
          ratingText={magicNumberRating.text}
          ratingVariant={magicNumberRating.variant}
        />
      </div>

      {/* PARAMETERS CONTROL & CALCULATORS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: UNIT ECONOMICS sliders */}
        <Card className="p-6 bg-white/[0.02] backdrop-blur-2xl border-white/[0.08] shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-6 rounded bg-[#00E5FF]" />
              <CardTitle className="text-sm font-black uppercase tracking-wider">Unit Economics Inputs</CardTitle>
            </div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-black mb-6">Fine-tune foundational revenue variables</p>

            <div className="space-y-5">
              {/* ARPU */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-white/80">Average Revenue Per User (ARPU)</span>
                  <span className="text-[#00E5FF] font-mono font-black">${arpu} /mo</span>
                </div>
                <Slider 
                  min={10}
                  max={2000}
                  step={5}
                  value={[arpu]}
                  onValueChange={(val) => setArpu(val[0])}
                  className="py-1"
                  aria-label="Average Revenue Per User (ARPU)"
                />
              </div>

              {/* Churn Rate */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-white/80">Monthly Customer Churn Rate</span>
                  <span className="text-[#9D4EDD] font-mono font-black">{churnRate}%</span>
                </div>
                <Slider 
                  min={0.1}
                  max={15}
                  step={0.1}
                  value={[churnRate]}
                  onValueChange={(val) => setChurnRate(val[0])}
                  className="py-1"
                  aria-label="Monthly Customer Churn Rate"
                />
              </div>

              {/* CAC */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-white/80">Customer Acquisition Cost (CAC)</span>
                  <span className="text-[#FF5E36] font-mono font-black">${cac}</span>
                </div>
                <Slider 
                  min={10}
                  max={5000}
                  step={10}
                  value={[cac]}
                  onValueChange={(val) => setCac(val[0])}
                  className="py-1"
                  aria-label="Customer Acquisition Cost (CAC)"
                />
              </div>

              {/* Gross Margin */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-white/80">Gross Margin %</span>
                  <span className="text-[#00FF87] font-mono font-black">{grossMargin}%</span>
                </div>
                <Slider 
                  min={10}
                  max={100}
                  step={1}
                  value={[grossMargin]}
                  onValueChange={(val) => setGrossMargin(val[0])}
                  className="py-1"
                  aria-label="Gross Margin Percentage"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-white/[0.06] pt-4 mt-6">
            <div className="flex gap-2.5 items-center p-3 rounded-xl bg-white/[0.01] border border-white/[0.04]">
              <Info className="text-cyan-400 shrink-0" size={16} />
              <p className="text-[10px] text-white/50 leading-relaxed font-semibold">
                An LTV:CAC ratio above <strong className="text-white/80">3.0x</strong> is standard for healthy, venture-scale growth. Your current setup yields <strong className="text-cyan-400">{(ltvToCac === Infinity ? "Infinity" : ltvToCac.toFixed(2))}x</strong>.
              </p>
            </div>
          </div>
        </Card>

        {/* MIDDLE COLUMN: SALES & MARKETING EFFICIENCY (MAGIC NUMBER DETAILS) */}
        <Card className="p-6 bg-white/[0.02] backdrop-blur-2xl border-white/[0.08] shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-6 rounded bg-[#00FF87]" />
              <CardTitle className="text-sm font-black uppercase tracking-wider">Magic Number Audit</CardTitle>
            </div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-black mb-6">Evaluate quarter-level scale efficiency</p>

            <div className="space-y-4">
              <p className="text-xs text-white/80 leading-relaxed font-semibold bg-white/[0.01] border border-white/[0.03] p-3 rounded-xl">
                The <strong className="text-[#00FF87]">SaaS Magic Number</strong> measures MRR growth efficiency relative to previous S&M investments. A number <strong className="text-white/80">&gt; 1.0x</strong> indicates high growth-efficiency.
              </p>

              <div className="space-y-4 pt-2">
                {/* Current MRR */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-white/80">Current Month MRR</span>
                    <span className="text-white/90 font-mono">${currentMrr.toLocaleString()}</span>
                  </div>
                  <Slider 
                    min={1000}
                    max={200000}
                    step={1000}
                    value={[currentMrr]}
                    onValueChange={(val) => setCurrentMrr(val[0])}
                    className="py-1"
                    aria-label="Current Month MRR"
                  />
                </div>

                {/* Previous MRR */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-white/80">Previous Month MRR</span>
                    <span className="text-white/90 font-mono">${previousMrr.toLocaleString()}</span>
                  </div>
                  <Slider 
                    min={1000}
                    max={200000}
                    step={1000}
                    value={[previousMrr]}
                    onValueChange={(val) => setPreviousMrr(val[0])}
                    className="py-1"
                    aria-label="Previous Month MRR"
                  />
                </div>

                {/* Previous S&M Spend */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-white/80">Previous Month S&M Spend</span>
                    <span className="text-white/90 font-mono">${previousSmSpend.toLocaleString()}</span>
                  </div>
                  <Slider 
                    min={1000}
                    max={100000}
                    step={500}
                    value={[previousSmSpend]}
                    onValueChange={(val) => setPreviousSmSpend(val[0])}
                    className="py-1"
                    aria-label="Previous Month S&M Spend"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-white/[0.06] pt-4 mt-6 space-y-2">
            <div className="flex justify-between text-[11px] font-bold">
              <span className="text-white/60">Net MRR Added:</span>
              <span className="text-white font-mono">${(currentMrr - previousMrr).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[11px] font-bold">
              <span className="text-white/60">Annualized Run-Rate:</span>
              <span className="text-white font-mono">${((currentMrr - previousMrr) * 12).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[11px] font-bold border-t border-white/[0.04] pt-2 mt-1">
              <span className="text-white/60 font-black uppercase">Calculated Magic Number:</span>
              <span className="text-[#00FF87] font-black font-mono">{magicNumber === Infinity ? "∞" : magicNumber.toFixed(2)}x</span>
            </div>
          </div>
        </Card>

        {/* RIGHT COLUMN: RUNWAY SIMULATOR SLIDERS */}
        <Card className="p-6 bg-white/[0.02] backdrop-blur-2xl border-white/[0.08] shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-6 rounded bg-[#FF5E36]" />
              <CardTitle className="text-sm font-black uppercase tracking-wider">Runway Sim Variables</CardTitle>
            </div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-black mb-6">Manage marketing funnels & runway assets</p>

            <div className="space-y-4">
              {/* Cash Assets */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-white/80">Starting Cash Bank</span>
                  <span className="text-white/90 font-mono">${startingCash.toLocaleString()}</span>
                </div>
                <Slider 
                  min={10000}
                  max={2000000}
                  step={20000}
                  value={[startingCash]}
                  onValueChange={(val) => setStartingCash(val[0])}
                  className="py-1"
                  aria-label="Starting Cash Bank"
                />
              </div>

              {/* Monthly OpEx */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-white/80">Fixed Monthly OpEx (Excl. S&M)</span>
                  <span className="text-white/90 font-mono">${monthlyOpEx.toLocaleString()}</span>
                </div>
                <Slider 
                  min={5000}
                  max={250000}
                  step={5000}
                  value={[monthlyOpEx]}
                  onValueChange={(val) => setMonthlyOpEx(val[0])}
                  className="py-1"
                  aria-label="Fixed Monthly OpEx (Excluding S&M)"
                />
              </div>

              {/* Marketing Budget */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-white/80">Monthly S&M Ad Spend</span>
                  <span className="text-white/90 font-mono">${marketingSpend.toLocaleString()}</span>
                </div>
                <Slider 
                  min={1000}
                  max={100000}
                  step={1000}
                  value={[marketingSpend]}
                  onValueChange={(val) => setMarketingSpend(val[0])}
                  className="py-1"
                  aria-label="Monthly S&M Ad Spend"
                />
              </div>

              {/* Funnel Impressions */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-white/80">Monthly Web Traffic / Impressions</span>
                  <span className="text-white/90 font-mono">{impressions.toLocaleString()}</span>
                </div>
                <Slider 
                  min={5000}
                  max={500000}
                  step={5000}
                  value={[impressions]}
                  onValueChange={(val) => setImpressions(val[0])}
                  className="py-1"
                  aria-label="Monthly Web Traffic / Impressions"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-white/[0.06] pt-4 mt-6 flex justify-between items-center">
            <span className="text-[10px] text-white/60 uppercase tracking-widest font-black">Starting Customers:</span>
            <span className="text-xs font-black text-white">{startingCustomers} leads</span>
          </div>
        </Card>

      </div>

      {/* RUNWAY ANALYSIS & RECHARTS GRAPH */}
      <Card className="p-6 bg-white/[0.02] backdrop-blur-2xl border-white/[0.08] shadow-2xl">
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-6 rounded bg-gradient-to-b from-[#00E5FF] to-[#9D4EDD]" />
              <CardTitle className="text-base font-black uppercase tracking-wider">Conversion Optimization Runway Impact</CardTitle>
            </div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Compare cash reserve survival based on marketing conversion improvements</p>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <div className="text-right">
              <span className="text-[9px] font-black text-white/40 uppercase block tracking-wider">Cash Difference (12-Mo)</span>
              <span className={`text-sm font-black flex items-center justify-end gap-0.5 ${finalCashDiff >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {finalCashDiff >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                ${Math.abs(finalCashDiff).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* INPUT PANEL FOR FUNNEL CONVERSION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 p-4 rounded-xl border border-white/[0.06] bg-black/20">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-white/80">Baseline Marketing Conversion Rate</span>
              <span className="text-[#FF5E36] font-mono font-black">{baseConvRate.toFixed(2)}%</span>
            </div>
            <Slider 
              min={0.1}
              max={5.0}
              step={0.1}
              value={[baseConvRate]}
              onValueChange={(val) => setBaseConversionRate(val[0])}
              className="py-1"
              aria-label="Baseline Marketing Conversion Rate"
            />
            <p className="text-[9px] text-white/45 font-semibold">Typical cold search & social traffic baseline conversion rate.</p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-white/80">Target Optimized Conversion Rate</span>
              <span className="text-[#00FF87] font-mono font-black">{targetConvRate.toFixed(2)}%</span>
            </div>
            <Slider 
              min={0.1}
              max={10.0}
              step={0.1}
              value={[targetConvRate]}
              onValueChange={(val) => setTargetConversionRate(val[0])}
              className="py-1"
              aria-label="Target Optimized Conversion Rate"
            />
            <p className="text-[9px] text-white/45 font-semibold">Simulated target rate after content, UX and flow optimization.</p>
          </div>
        </div>

        {/* RESULTS METRICS ROW */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-white/[0.01] border border-white/[0.04]">
            <span className="text-[9px] text-white/40 uppercase tracking-widest font-black block mb-1">Baseline Ending Customers</span>
            <div className="text-lg font-black text-white font-mono">
              {baselineProjections[baselineProjections.length - 1].activeCustomers.toLocaleString()}
            </div>
            <span className="text-[9px] text-white/30 font-semibold block mt-0.5">at {baseConvRate}% conversion</span>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.01] border border-white/[0.04]">
            <span className="text-[9px] text-white/40 uppercase tracking-widest font-black block mb-1">Target Ending Customers</span>
            <div className="text-lg font-black text-[#00FF87] font-mono">
              {targetProjections[targetProjections.length - 1].activeCustomers.toLocaleString()}
            </div>
            <span className="text-[9px] text-white/30 font-semibold block mt-0.5">at {targetConvRate}% conversion (+{Math.round((targetProjections[targetProjections.length-1].activeCustomers - baselineProjections[baselineProjections.length-1].activeCustomers))} accounts)</span>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.01] border border-white/[0.04]">
            <span className="text-[9px] text-white/40 uppercase tracking-widest font-black block mb-1">Baseline Cash Runway</span>
            <div className="text-lg font-black text-white italic">
              {baselineRunwayStr}
            </div>
            <span className="text-[9px] text-white/30 font-semibold block mt-0.5">
              Net burn: ${baselineProjections[0].netBurn >= 0 ? `${baselineProjections[0].netBurn.toLocaleString()}/mo` : `-$${Math.abs(baselineProjections[0].netBurn).toLocaleString()}/mo (Profit)`}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-emerald-950/10 border border-emerald-500/10">
            <span className="text-[9px] text-emerald-400 uppercase tracking-widest font-black block mb-1">Target Cash Runway</span>
            <div className="text-lg font-black text-emerald-400 italic">
              {targetRunwayStr}
            </div>
            <span className="text-[9px] text-emerald-400/50 font-semibold block mt-0.5">
              Net burn: ${targetProjections[0].netBurn >= 0 ? `${targetProjections[0].netBurn.toLocaleString()}/mo` : `-$${Math.abs(targetProjections[0].netBurn).toLocaleString()}/mo (Profit)`}
            </span>
          </div>
        </div>

        {/* RECHARTS CHART CONTAINER */}
        <div className="h-80 w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="baselineLineGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF5E36" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#FF5E36" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="targetLineGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00FF87" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#00FF87" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.03)" vertical={false} />
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false}
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontFamily: 'Outfit' }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false}
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontFamily: 'Outfit' }}
                tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                contentStyle={{
                  background: 'rgba(8, 7, 16, 0.85)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  color: 'white',
                  fontSize: '11px',
                  fontFamily: 'Outfit, sans-serif',
                  fontWeight: 600,
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.6)',
                  padding: '12px 16px',
                }}
                formatter={(value: any, name: any) => [
                  `$${Number(value).toLocaleString()}`, 
                  name === 'baselineCash' ? `Baseline (${baseConvRate}% Conv)` : `Target Optimized (${targetConvRate}% Conv)`
                ]}
              />
              <Legend 
                verticalAlign="top" 
                height={36} 
                iconType="circle"
                wrapperStyle={{
                  fontSize: '10px',
                  fontFamily: 'Outfit',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'rgba(255, 255, 255, 0.6)',
                }}
              />
              <Line 
                name="baselineCash"
                type="monotone" 
                dataKey="baselineCash" 
                stroke="#FF5E36" // Hyper Coral
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{ r: 3, stroke: '#FF5E36', strokeWidth: 1, fill: '#080710' }}
                activeDot={{ r: 5 }}
              />
              <Line 
                name="targetCash"
                type="monotone" 
                dataKey="targetCash" 
                stroke="#00FF87" // Vivid Emerald Mint
                strokeWidth={3}
                dot={{ r: 4, stroke: '#00FF87', strokeWidth: 2, fill: '#080710' }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};
