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
}

const DEFAULT_INPUTS: ScenarioInputs = {
  revenueGrowthRate: 0,
  marketingSpendDelta: 0,
  marketingRoas: 1.5,
  overheadMultiplier: 100,
  newHires: []
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
}

export function calculateCustomProjections(
  baseline: {
    cashBalance: number;
    fixedCosts: { payroll: number; subscriptions: number; total: number };
    variableExpenses: number;
    monthlyRevenue: number;
  },
  revGrowth: number,
  expGrowth: number,
  seasonalityProfile: string
): BaselineRunwayData {
  const baseCash = baseline.cashBalance;
  const baseRevenue = baseline.monthlyRevenue;
  const basePayroll = baseline.fixedCosts.payroll;
  const baseSubs = baseline.fixedCosts.subscriptions;
  const baseVariable = baseline.variableExpenses;

  const projections: { month: string; balance: number }[] = [];
  const currentMonthIdx = new Date().getMonth();

  let currentProjBalance = baseCash;

  // Month 0
  projections.push({
    month: MONTH_NAMES[currentMonthIdx],
    balance: Math.round(currentProjBalance)
  });

  for (let i = 1; i <= 12; i++) {
    const monthIdx = (currentMonthIdx + i) % 12;
    const monthLabel = MONTH_NAMES[monthIdx];
    const profile = SEASONALITY_PROFILES[seasonalityProfile] || SEASONALITY_PROFILES.steady;
    const weights = profile[monthLabel] || { rev: 1.0, exp: 1.0 };

    const monthlyRevenue = Math.round(
      baseRevenue * Math.pow(1 + revGrowth / 100, i) * weights.rev
    );

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
  // Calculate average net burn across month 1 to 12
  for (let i = 1; i <= 12; i++) {
    const monthLabel = MONTH_NAMES[(currentMonthIdx + i) % 12];
    const profile = SEASONALITY_PROFILES[seasonalityProfile] || SEASONALITY_PROFILES.steady;
    const weights = profile[monthLabel] || { rev: 1.0, exp: 1.0 };

    const monthlyRevenue = Math.round(
      baseRevenue * Math.pow(1 + revGrowth / 100, i) * weights.rev
    );

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
    fixedCosts: baseline.fixedCosts,
    variableExpenses: baseVariable,
    monthlyRevenue: baseRevenue,
    netBurn: avgNetBurn,
    runwayMonths,
    projections,
    baselineRevenueGrowth: revGrowth,
    baselineExpenseGrowth: expGrowth,
    baselineSeasonalityProfile: seasonalityProfile
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
  const baseCash = baseline.cashBalance;
  const baseRevenue = baseline.monthlyRevenue;
  const basePayroll = baseline.fixedCosts.payroll;
  const baseSubs = baseline.fixedCosts.subscriptions;
  const baseVariable = baseline.variableExpenses;

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

    // 3. Simulated Revenue
    // Apply baseline + scenario revenue growth compounding monthly, plus marketing contribution, then seasonality
    const marketingRevenueContribution = Math.round(marketingSpendCents * inputs.marketingRoas);
    const baseRevenuePlusMarketing = baseRevenue + marketingRevenueContribution;
    
    const totalRevGrowthRate = baselineRevGrowth + inputs.revenueGrowthRate;
    const monthlyRevenue = Math.round(
      baseRevenuePlusMarketing * Math.pow(1 + totalRevGrowthRate / 100, i) * weights.rev
    );

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

  // Calculate simulated runway in months based on first-month simulated net burn or average simulated burn
  // Let's use average simulated net burn to be more robust, or simple netBurn if positive.
  // We'll compute average simulated net burn over the 12 projection months
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
      runwayDelta = parseFloat((runwayMonths - baseline.runwayMonths).toFixed(1));
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
