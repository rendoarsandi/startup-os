import { useState, useEffect } from 'react';

export interface SimulatedHire {
  id: string;
  name: string;
  role: string;
  department: string;
  salary: number; // in dollars/yr
  startMonth: number; // 1-indexed (Month 1 = next month, etc.)
}

export interface ScenarioInputs {
  revenueGrowthRate: number; // in %
  marketingSpendDelta: number; // in dollars
  marketingRoas: number; // e.g. 1.5 (means 150%)
  overheadMultiplier: number; // in % (e.g. 100% is baseline)
  newHires: SimulatedHire[];
  startingMrrDelta: number; // in dollars
  churnRate: number; // in % (e.g. 2.0 for 2%)
  cac: number; // in dollars
  arpu: number; // in dollars
}

const DEFAULT_INPUTS: ScenarioInputs = {
  revenueGrowthRate: 0,
  marketingSpendDelta: 0,
  marketingRoas: 1.5,
  overheadMultiplier: 100,
  newHires: [],
  startingMrrDelta: 0,
  churnRate: 2.0,
  cac: 100,
  arpu: 50
};

export interface SeasonalityWeight {
  rev: number;
  exp: number;
}

export const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const SEASONALITY_PROFILES: Record<string, Record<string, SeasonalityWeight>> = {
  steady: {
    Jan: { rev: 1.0, exp: 1.0 }, Feb: { rev: 1.0, exp: 1.0 }, Mar: { rev: 1.0, exp: 1.0 },
    Apr: { rev: 1.0, exp: 1.0 }, May: { rev: 1.0, exp: 1.0 }, Jun: { rev: 1.0, exp: 1.0 },
    Jul: { rev: 1.0, exp: 1.0 }, Aug: { rev: 1.0, exp: 1.0 }, Sep: { rev: 1.0, exp: 1.0 },
    Oct: { rev: 1.0, exp: 1.0 }, Nov: { rev: 1.0, exp: 1.0 }, Dec: { rev: 1.0, exp: 1.0 }
  },
  holiday: {
    Jan: { rev: 0.8, exp: 0.9 }, Feb: { rev: 1.0, exp: 1.0 }, Mar: { rev: 1.0, exp: 1.0 },
    Apr: { rev: 1.0, exp: 1.0 }, May: { rev: 1.0, exp: 1.0 }, Jun: { rev: 1.0, exp: 1.0 },
    Jul: { rev: 1.0, exp: 1.0 }, Aug: { rev: 1.0, exp: 1.0 }, Sep: { rev: 1.0, exp: 1.0 },
    Oct: { rev: 1.0, exp: 1.0 }, Nov: { rev: 1.4, exp: 1.2 }, Dec: { rev: 1.6, exp: 1.3 }
  },
  quarterly: {
    Jan: { rev: 0.9, exp: 0.95 }, Feb: { rev: 0.9, exp: 0.95 }, Mar: { rev: 1.25, exp: 1.15 },
    Apr: { rev: 0.9, exp: 0.95 }, May: { rev: 0.9, exp: 0.95 }, Jun: { rev: 1.25, exp: 1.15 },
    Jul: { rev: 0.9, exp: 0.95 }, Aug: { rev: 0.9, exp: 0.95 }, Sep: { rev: 1.25, exp: 1.15 },
    Oct: { rev: 0.9, exp: 0.95 }, Nov: { rev: 0.9, exp: 0.95 }, Dec: { rev: 1.25, exp: 1.15 }
  },
  summer: {
    Jan: { rev: 1.1, exp: 1.04 }, Feb: { rev: 1.1, exp: 1.04 }, Mar: { rev: 1.1, exp: 1.04 },
    Apr: { rev: 1.1, exp: 1.04 }, May: { rev: 1.1, exp: 1.04 }, Jun: { rev: 0.75, exp: 0.9 },
    Jul: { rev: 0.75, exp: 0.9 }, Aug: { rev: 0.75, exp: 0.9 }, Sep: { rev: 1.1, exp: 1.04 },
    Oct: { rev: 1.1, exp: 1.04 }, Nov: { rev: 1.1, exp: 1.04 }, Dec: { rev: 1.1, exp: 1.04 }
  }
};

export interface BaselineRunwayData {
  cashBalance: number;
  fixedCosts: { payroll: number; subscriptions: number; total: number };
  variableExpenses: number;
  monthlyRevenue: number;
  netBurn: number;
  runwayMonths: number | "Infinite";
  projections: { month: string; balance: number }[];
  baselineRevenueGrowth?: number;
  baselineExpenseGrowth?: number;
  baselineSeasonalityProfile?: string;
  startingMrr?: number;
  churnRate?: number;
  cac?: number;
  arpu?: number;
}

export function calculateCustomProjections(
  baseline: {
    cashBalance: number;
    fixedCosts?: { payroll: number; subscriptions: number; total: number };
    variableExpenses: number;
    monthlyRevenue: number;
    startingMrr?: number;
    churnRate?: number;
    cac?: number;
    arpu?: number;
  },
  revGrowth: number,
  expGrowth: number,
  seasonalityProfile: string
): BaselineRunwayData {
  const baseCash = baseline?.cashBalance || 4259020;
  const baseRevenue = baseline?.monthlyRevenue || 1500000;
  const basePayroll = baseline?.fixedCosts?.payroll || 0;
  const baseSubs = baseline?.fixedCosts?.subscriptions || 0;
  const baseVariable = baseline?.variableExpenses || 0;

  const baseMrr = baseline?.startingMrr !== undefined ? baseline.startingMrr : 0;
  const baseChurnRate = baseline?.churnRate !== undefined ? baseline.churnRate : 200; // basis points
  const baseCac = baseline?.cac !== undefined ? baseline.cac : 10000;
  const baseArpu = baseline?.arpu !== undefined ? baseline.arpu : 5000;

  const projections: { month: string; balance: number }[] = [];
  const currentMonthIdx = new Date().getMonth();

  let currentProjBalance = baseCash;

  // Month 0
  projections.push({
    month: MONTH_NAMES[currentMonthIdx],
    balance: Math.round(currentProjBalance)
  });

  const nonRecurringRevenue = Math.max(0, baseRevenue - baseMrr);
  let currentMrr = baseMrr;

  for (let i = 1; i <= 12; i++) {
    const monthIdx = (currentMonthIdx + i) % 12;
    const monthLabel = MONTH_NAMES[monthIdx];
    const profile = SEASONALITY_PROFILES[seasonalityProfile] || SEASONALITY_PROFILES.steady;
    const weights = profile[monthLabel] || { rev: 1.0, exp: 1.0 };

    // MRR decays by churn, and grows by organic growth scaled with seasonality
    const churnDecay = currentMrr * (baseChurnRate / 10000);
    const organicGrowth = currentMrr * (revGrowth / 100) * weights.rev;
    currentMrr = Math.round(currentMrr - churnDecay + organicGrowth);
    if (currentMrr < 0) currentMrr = 0;

    const monthlyRevenue = currentMrr + Math.round(nonRecurringRevenue * Math.pow(1 + revGrowth / 100, i) * weights.rev);

    const monthlyVariable = Math.round(
      baseVariable * Math.pow(1 + expGrowth / 100, i) * weights.exp
    );

    const monthlyExpenses = basePayroll + baseSubs + monthlyVariable;
    const netBurn = monthlyExpenses - monthlyRevenue;

    currentProjBalance -= netBurn;
    if (currentProjBalance < 0) {
      currentProjBalance = 0;
    }

    projections.push({
      month: monthLabel,
      balance: Math.round(currentProjBalance)
    });
  }

  let totalNetBurn = 0;
  let currentMrrForBurn = baseMrr;
  // Calculate average net burn across month 1 to 12
  for (let i = 1; i <= 12; i++) {
    const monthLabel = MONTH_NAMES[(currentMonthIdx + i) % 12];
    const profile = SEASONALITY_PROFILES[seasonalityProfile] || SEASONALITY_PROFILES.steady;
    const weights = profile[monthLabel] || { rev: 1.0, exp: 1.0 };

    const churnDecay = currentMrrForBurn * (baseChurnRate / 10000);
    const organicGrowth = currentMrrForBurn * (revGrowth / 100) * weights.rev;
    currentMrrForBurn = Math.round(currentMrrForBurn - churnDecay + organicGrowth);
    if (currentMrrForBurn < 0) currentMrrForBurn = 0;

    const monthlyRevenue = currentMrrForBurn + Math.round(nonRecurringRevenue * Math.pow(1 + revGrowth / 100, i) * weights.rev);

    const monthlyVariable = Math.round(
      baseVariable * Math.pow(1 + expGrowth / 100, i) * weights.exp
    );

    const monthlyExpenses = basePayroll + baseSubs + monthlyVariable;
    totalNetBurn += (monthlyExpenses - monthlyRevenue);
  }
  const avgNetBurn = Math.round(totalNetBurn / 12);

  let runwayMonths: number | "Infinite" = "Infinite";
  if (avgNetBurn > 0) {
    runwayMonths = parseFloat((baseCash / avgNetBurn).toFixed(1));
  }

  return {
    cashBalance: baseCash,
    fixedCosts: baseline?.fixedCosts || { payroll: basePayroll, subscriptions: baseSubs, total: basePayroll + baseSubs },
    variableExpenses: baseVariable,
    monthlyRevenue: baseRevenue,
    netBurn: avgNetBurn,
    runwayMonths,
    projections,
    baselineRevenueGrowth: revGrowth,
    baselineExpenseGrowth: expGrowth,
    baselineSeasonalityProfile: seasonalityProfile,
    startingMrr: baseMrr,
    churnRate: baseChurnRate,
    cac: baseCac,
    arpu: baseArpu
  };
}

export const useScenario = (baseline: BaselineRunwayData | undefined) => {
  const [inputs, setInputs] = useState<ScenarioInputs>(() => {
    try {
      const stored = localStorage.getItem('ai_cfo_scenario_inputs');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn("Failed to load scenario inputs from localStorage", e);
    }
    return DEFAULT_INPUTS;
  });

  const [active, setActive] = useState<boolean>(() => {
    try {
      return localStorage.getItem('ai_cfo_scenario_active') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (baseline && !localStorage.getItem('ai_cfo_scenario_inputs')) {
      setInputs(prev => ({
        ...prev,
        churnRate: baseline.churnRate !== undefined ? baseline.churnRate / 100 : 2.0,
        cac: baseline.cac !== undefined ? Math.round(baseline.cac / 100) : 100,
        arpu: baseline.arpu !== undefined ? Math.round(baseline.arpu / 100) : 50
      }));
    }
  }, [baseline]);

  useEffect(() => {
    try {
      localStorage.setItem('ai_cfo_scenario_inputs', JSON.stringify(inputs));
      localStorage.setItem('ai_cfo_scenario_active', String(active));
    } catch (e) {
      console.warn("Failed to save scenario to localStorage", e);
    }
  }, [inputs, active]);

  const updateInput = <K extends keyof ScenarioInputs>(key: K, value: ScenarioInputs[K]) => {
    setInputs(prev => ({
      ...prev,
      [key]: value
    }));
    setActive(true);
  };

  const addHire = (hire: Omit<SimulatedHire, 'id'>) => {
    const newHire: SimulatedHire = {
      ...hire,
      id: crypto.randomUUID()
    };
    setInputs(prev => ({
      ...prev,
      newHires: [...prev.newHires, newHire]
    }));
    setActive(true);
  };

  const removeHire = (id: string) => {
    setInputs(prev => ({
      ...prev,
      newHires: prev.newHires.filter(h => h.id !== id)
    }));
    setActive(true);
  };

  const reset = () => {
    setInputs(DEFAULT_INPUTS);
    setActive(false);
  };

  // If no baseline data is loaded yet, return empty defaults
  if (!baseline) {
    return {
      inputs,
      active: false,
      projections: [],
      runwayMonths: 0 as number | "Infinite",
      netBurn: 0,
      monthlyRevenue: 0,
      monthlyExpenses: 0,
      runwayDelta: 0,
      updateInput,
      addHire,
      removeHire,
      reset,
      setActive
    };
  };

  // Baseline values in cents
  const baseCash = baseline.cashBalance || 4259020;
  const baseRevenue = baseline.monthlyRevenue || 1500000;
  const basePayroll = baseline.fixedCosts?.payroll || 0;
  const baseSubs = baseline.fixedCosts?.subscriptions || 0;
  const baseVariable = baseline.variableExpenses || 0;

  const baseMrr = baseline.startingMrr !== undefined ? baseline.startingMrr : 0;
  const baseChurnRate = baseline.churnRate !== undefined ? baseline.churnRate : 200; // basis points

  const baselineRevGrowth = baseline.baselineRevenueGrowth ?? 0;
  const baselineExpGrowth = baseline.baselineExpenseGrowth ?? 0;
  const baselineSeasonality = baseline.baselineSeasonalityProfile ?? 'steady';

  // Compiling simulated values over 12 months
  const projections: { month: string; balance: number; revenue: number; expenses: number }[] = [];
  const currentMonthIdx = new Date().getMonth();
  
  let currentProjBalance = baseCash;

  // Let's compute month by month
  // Month 0 is the current starting point
  projections.push({
    month: MONTH_NAMES[currentMonthIdx],
    balance: Math.round(currentProjBalance),
    revenue: baseRevenue,
    expenses: basePayroll + baseSubs + baseVariable
  });

  let currentMrr = baseMrr + Math.round(inputs.startingMrrDelta * 100);
  if (currentMrr < 0) currentMrr = 0;

  const nonRecurringRevenue = Math.max(0, baseRevenue - baseMrr);

  for (let i = 1; i <= 12; i++) {
    const monthIdx = (currentMonthIdx + i) % 12;
    const monthLabel = MONTH_NAMES[monthIdx];
    const profile = SEASONALITY_PROFILES[baselineSeasonality] || SEASONALITY_PROFILES.steady;
    const weights = profile[monthLabel] || { rev: 1.0, exp: 1.0 };

    // 1. Calculate Simulated New Hire Payroll for this month (i)
    // newHires startMonth is 1-indexed (1 means starts in month 1)
    const simulatedHiresPayrollCents = inputs.newHires
      .filter(hire => hire.startMonth <= i)
      .reduce((sum, hire) => sum + Math.round((hire.salary * 100) / 12), 0);

    const monthlyPayroll = basePayroll + simulatedHiresPayrollCents;

    // 2. Variable Overhead
    // Apply baseline expense growth and seasonality, then scale by overhead multiplier
    const baselineVariableThisMonth = baseVariable * Math.pow(1 + baselineExpGrowth / 100, i) * weights.exp;
    const scaledVariable = Math.round(baselineVariableThisMonth * (inputs.overheadMultiplier / 100));
    const marketingSpendCents = Math.round(inputs.marketingSpendDelta * 100);
    const monthlyExpenses = monthlyPayroll + baseSubs + scaledVariable + marketingSpendCents;

    // 3. Simulated SaaS Revenue
    // Calculate new MRR from marketing (CAC & ARPU-driven)
    let newMrrFromMarketing = 0;
    if (inputs.cac > 0) {
      const newCustomers = inputs.marketingSpendDelta / inputs.cac;
      newMrrFromMarketing = Math.round(newCustomers * inputs.arpu * 100);
    }

    const churnRateBasisPoints = inputs.churnRate * 100;
    const churnDecay = currentMrr * (churnRateBasisPoints / 10000);
    const totalRevGrowthRate = baselineRevGrowth + inputs.revenueGrowthRate;
    const organicGrowth = currentMrr * (totalRevGrowthRate / 100) * weights.rev;
    const marketingAdditions = newMrrFromMarketing * weights.rev;

    currentMrr = Math.round(currentMrr - churnDecay + organicGrowth + marketingAdditions);
    if (currentMrr < 0) currentMrr = 0;

    const monthlyRevenue = currentMrr + Math.round(nonRecurringRevenue * Math.pow(1 + totalRevGrowthRate / 100, i) * weights.rev);

    // Net monthly burn
    const netBurn = monthlyExpenses - monthlyRevenue;

    currentProjBalance -= netBurn;
    if (currentProjBalance < 0) {
      currentProjBalance = 0;
    }

    projections.push({
      month: monthLabel,
      balance: Math.round(currentProjBalance),
      revenue: Math.round(monthlyRevenue),
      expenses: Math.round(monthlyExpenses)
    });
  }

  // Calculate simulated runway in months based on average simulated net burn
  let totalNetBurn = 0;
  for (let i = 1; i <= 12; i++) {
    totalNetBurn += (projections[i].expenses - projections[i].revenue);
  }
  const avgNetBurn = Math.round(totalNetBurn / 12);

  let runwayMonths: number | "Infinite" = "Infinite";
  if (avgNetBurn > 0) {
    runwayMonths = parseFloat((baseCash / avgNetBurn).toFixed(1));
  }

  // Calculate Delta compared to baseline runway
  let runwayDelta = 0;
  if (baseline.runwayMonths === "Infinite") {
    if (runwayMonths === "Infinite") {
      runwayDelta = 0;
    } else {
      runwayDelta = -999; // Represents drops from profitable
    }
  } else {
    if (runwayMonths === "Infinite") {
      runwayDelta = 999; // Represents reaches profitability
    } else {
      runwayDelta = parseFloat((runwayMonths - (baseline.runwayMonths || 0)).toFixed(1));
    }
  }

  return {
    inputs,
    active,
    projections,
    runwayMonths,
    netBurn: avgNetBurn,
    monthlyRevenue: projections[1].revenue,
    monthlyExpenses: projections[1].expenses,
    runwayDelta,
    updateInput,
    addHire,
    removeHire,
    reset,
    setActive
  };
};
