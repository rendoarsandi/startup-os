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

export interface BaselineRunwayData {
  cashBalance: number;
  fixedCosts: { payroll: number; subscriptions: number; total: number };
  variableExpenses: number;
  monthlyRevenue: number;
  netBurn: number;
  runwayMonths: number | "Infinite";
  projections: { month: string; balance: number }[];
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

  // Compiling simulated values over 12 months
  const projections: { month: string; balance: number; revenue: number; expenses: number }[] = [];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const currentMonthIdx = new Date().getMonth();
  
  let currentProjBalance = baseCash;

  // Let's compute month by month
  // Month 0 is the current starting point
  projections.push({
    month: monthNames[currentMonthIdx],
    balance: Math.round(currentProjBalance),
    revenue: baseRevenue,
    expenses: basePayroll + baseSubs + baseVariable
  });

  for (let i = 1; i <= 12; i++) {
    const monthIdx = (currentMonthIdx + i) % 12;
    const monthLabel = monthNames[monthIdx];

    // 1. Calculate Simulated New Hire Payroll for this month (i)
    // newHires startMonth is 1-indexed (1 means starts in month 1)
    const simulatedHiresPayrollCents = inputs.newHires
      .filter(hire => hire.startMonth <= i)
      .reduce((sum, hire) => sum + Math.round((hire.salary * 100) / 12), 0);

    const monthlyPayroll = basePayroll + simulatedHiresPayrollCents;

    // 2. Variable Overhead (base variable scaled + marketing spend delta)
    const scaledVariable = Math.round(baseVariable * (inputs.overheadMultiplier / 100));
    const marketingSpendCents = Math.round(inputs.marketingSpendDelta * 100);
    const monthlyExpenses = monthlyPayroll + baseSubs + scaledVariable + marketingSpendCents;

    // 3. Simulated Revenue (base + marketing contribution) grew compounding at revenueGrowthRate MoM
    const marketingRevenueContribution = Math.round(marketingSpendCents * inputs.marketingRoas);
    const baseRevenuePlusMarketing = baseRevenue + marketingRevenueContribution;
    
    // Growth compounding monthly
    const monthlyRevenue = Math.round(
      baseRevenuePlusMarketing * Math.pow(1 + inputs.revenueGrowthRate / 100, i)
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
