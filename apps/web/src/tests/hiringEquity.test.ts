import { expect, test, describe } from 'vitest';
import { 
  calculateRunway, 
  calculateDilution, 
  PlannedHire, 
  CapTable 
} from '../components/HiringEquityPlanner';

describe('Hiring Runway Impact & Option Pool Dilution Math', () => {
  // 1. Dilution Calculations
  describe('Cap Table Dilution Math', () => {
    test('Zero planned hires results in baseline ownership', () => {
      const capTable: CapTable = {
        totalShares: 10000000,
        founderShares: 8000000,
        investorShares: 1000000,
        optionPoolShares: 1000000
      };
      const result = calculateDilution(capTable, []);

      expect(result.allocatedSharesToHires).toBe(0);
      expect(result.remainingOptionPoolShares).toBe(1000000);
      expect(result.remainingOptionPoolPercent).toBe(10);
      expect(result.isPoolExpanded).toBe(false);
      expect(result.poolDeficitShares).toBe(0);
      expect(result.newTotalShares).toBe(10000000);
      expect(result.founderPercent).toBe(80);
      expect(result.investorPercent).toBe(10);
      expect(result.allocatedHiresPercent).toBe(0);
    });

    test('Planned hires fitting in option pool reduces remaining pool, no founder dilution', () => {
      const capTable: CapTable = {
        totalShares: 10000000,
        founderShares: 8000000,
        investorShares: 1000000,
        optionPoolShares: 1000000
      };
      const plannedHires: PlannedHire[] = [
        { id: '1', name: 'A', role: 'Dev', salary: 100, startMonth: 1, equityGrant: 0.5 }, // 50,000 shares
        { id: '2', name: 'B', role: 'PM', salary: 100, startMonth: 2, equityGrant: 2.0 }  // 200,000 shares
      ];
      const result = calculateDilution(capTable, plannedHires);

      expect(result.allocatedSharesToHires).toBe(250000);
      expect(result.remainingOptionPoolShares).toBe(750000);
      expect(result.isPoolExpanded).toBe(false);
      expect(result.founderPercent).toBe(80); // Founders not diluted!
      expect(result.investorPercent).toBe(10);
      expect(result.allocatedHiresPercent).toBe(2.5);
      expect(result.remainingOptionPoolPercent).toBe(7.5);
    });

    test('Planned hires exceeding option pool expands the pool, diluting founders and investors', () => {
      const capTable: CapTable = {
        totalShares: 10000000,
        founderShares: 8000000,
        investorShares: 1000000,
        optionPoolShares: 1000000 // 10%
      };
      const plannedHires: PlannedHire[] = [
        { id: '1', name: 'A', role: 'VP', salary: 100, startMonth: 1, equityGrant: 12.0 } // 12% = 1.2M shares (exceeds 1M pool)
      ];
      const result = calculateDilution(capTable, plannedHires);

      // Allocated: 1.2M shares.
      // Pool deficit: 200k shares.
      // New total shares: 10.2M shares.
      expect(result.allocatedSharesToHires).toBe(1200000);
      expect(result.remainingOptionPoolShares).toBe(0);
      expect(result.isPoolExpanded).toBe(true);
      expect(result.poolDeficitShares).toBe(200000);
      expect(result.newTotalShares).toBe(10200000);
      // Founder Percent: 8.0M / 10.2M = 78.43%
      expect(result.founderPercent).toBe(78.43);
      // Investor Percent: 1.0M / 10.2M = 9.80%
      expect(result.investorPercent).toBe(9.80);
      // Hires Percent: 1.2M / 10.2M = 11.76%
      expect(result.allocatedHiresPercent).toBe(11.76);
    });
  });

  // 2. Payroll Runway Calculations
  describe('Payroll Runway Adjustment Formulas', () => {
    test('Zero planned hires leaves runway and burn at baseline', () => {
      const startingCash = 1000000;
      const baseMonthlyBurn = 50000;
      const horizonMonths = 12;

      const result = calculateRunway(startingCash, baseMonthlyBurn, horizonMonths, []);

      expect(result.baseRunwayMonths).toBe(20);
      expect(result.adjustedRunwayMonths).toBe(20);
      expect(result.totalNewPayrollAdded).toBe(0);
      expect(result.peakBurnRate).toBe(50000);
      // Cash balances decrease by 50k each month
      expect(result.monthlyCashBalance[0]).toBe(1000000);
      expect(result.monthlyCashBalance[1]).toBe(950000);
      expect(result.monthlyCashBalance[12]).toBe(400000);
    });

    test('Planned hires with start months correctly phase into monthly burn rates', () => {
      const startingCash = 1000000;
      const baseMonthlyBurn = 50000;
      const horizonMonths = 6;
      const plannedHires: PlannedHire[] = [
        { id: '1', name: 'A', role: 'Dev', salary: 120000, startMonth: 3, equityGrant: 0 }, // $10,000/mo starting month 3
        { id: '2', name: 'B', role: 'PM', salary: 180000, startMonth: 5, equityGrant: 0 }  // $15,000/mo starting month 5
      ];

      const result = calculateRunway(startingCash, baseMonthlyBurn, horizonMonths, plannedHires);

      // Month-by-month burn:
      // Month 1: 50,000
      // Month 2: 50,000
      // Month 3: 50,000 + 10,000 = 60,000
      // Month 4: 50,000 + 10,000 = 60,000
      // Month 5: 50,000 + 10,000 + 15,000 = 75,000
      // Month 6: 50,000 + 10,000 + 15,000 = 75,000
      expect(result.monthlyBurnRates).toEqual([50000, 50000, 60000, 60000, 75000, 75000]);
      expect(result.peakBurnRate).toBe(75000);

      // Total new payroll added in horizon (months 1-6):
      // Month 3: 10k, Month 4: 10k, Month 5: 25k, Month 6: 25k. Total = 70,000.
      expect(result.totalNewPayrollAdded).toBe(70000);

      // Monthly cash balance check:
      expect(result.monthlyCashBalance).toEqual([1000000, 950000, 900000, 840000, 780000, 705000, 630000]);
    });
  });

  // 3. Boundary & Edge Conditions
  describe('Boundary & Edge Conditions', () => {
    test('Zero starting cash results in 0 months runway', () => {
      const result = calculateRunway(0, 50000, 12, []);
      expect(result.adjustedRunwayMonths).toBe(0);
      expect(result.baseRunwayMonths).toBe(0);
    });

    test('Zero monthly burn results in Infinite runway', () => {
      const result = calculateRunway(1000000, 0, 12, []);
      expect(result.adjustedRunwayMonths).toBe(Infinity);
      expect(result.baseRunwayMonths).toBe(Infinity);
    });

    test('Extremely high hire salary crashes runway rapidly', () => {
      // 100k starting cash, 10k base burn, but a hire with 12M annual salary starting month 1
      const plannedHires: PlannedHire[] = [
        { id: '1', name: 'Expensive VP', role: 'Exec', salary: 12000000, startMonth: 1, equityGrant: 0 } // $1M/month
      ];
      const result = calculateRunway(100000, 10000, 12, plannedHires);

      // Month 1 burn = 10k + 1M = 1.01M. Starting cash is 100k.
      // 100k / 1.01M = 0.099 months (~0.1 months)
      expect(result.adjustedRunwayMonths).toBe(0.1);
    });
  });
});
