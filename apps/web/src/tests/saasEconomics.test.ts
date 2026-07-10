import { describe, expect, it } from 'vitest';
import { 
  calculateLtv, 
  calculateLtvToCacRatio, 
  calculateCacPaybackPeriod, 
  calculateSaaSMagicNumber,
  runRunwaySimulation 
} from '../components/SaaSEconomics';

describe('SaaS Unit Economics Engine Models', () => {
  describe('calculateLtv', () => {
    it('calculates LTV correctly under standard parameters', () => {
      // LTV = (ARPU * GrossMargin%) / ChurnRate%
      // (100 * 0.8) / 0.02 = 80 / 0.02 = 4000
      const ltv = calculateLtv({ arpu: 100, churnRate: 2, grossMargin: 80 });
      expect(ltv).toBe(4000);
    });

    it('returns Infinity when Churn Rate is zero', () => {
      const ltv = calculateLtv({ arpu: 150, churnRate: 0, grossMargin: 85 });
      expect(ltv).toBe(Infinity);
    });

    it('returns zero or handles negative inputs gracefully', () => {
      expect(calculateLtv({ arpu: -100, churnRate: 2, grossMargin: 80 })).toBe(0);
      expect(calculateLtv({ arpu: 100, churnRate: 2, grossMargin: -10 })).toBe(0);
      expect(calculateLtv({ arpu: 100, churnRate: -2, grossMargin: 80 })).toBe(0);
    });

    it('handles high/boundary Gross Margin values', () => {
      // 100 * 1.0 / 0.05 = 2000
      const ltv = calculateLtv({ arpu: 100, churnRate: 5, grossMargin: 100 });
      expect(ltv).toBe(2000);
    });
  });

  describe('calculateLtvToCacRatio', () => {
    it('calculates LTV:CAC correctly under standard parameters', () => {
      // LTV = (150 * 0.8) / 0.025 = 120 / 0.025 = 4800
      // LTV:CAC = 4800 / 600 = 8.0
      const ratio = calculateLtvToCacRatio({ arpu: 150, cac: 600, churnRate: 2.5, grossMargin: 80 });
      expect(ratio).toBe(8.0);
    });

    it('returns Infinity when CAC is zero and LTV is greater than zero', () => {
      const ratio = calculateLtvToCacRatio({ arpu: 100, cac: 0, churnRate: 2, grossMargin: 80 });
      expect(ratio).toBe(Infinity);
    });

    it('returns 0 when LTV is 0 and CAC is zero', () => {
      const ratio = calculateLtvToCacRatio({ arpu: 0, cac: 0, churnRate: 2, grossMargin: 80 });
      expect(ratio).toBe(0);
    });

    it('returns Infinity when LTV is Infinity', () => {
      const ratio = calculateLtvToCacRatio({ arpu: 100, cac: 500, churnRate: 0, grossMargin: 80 });
      expect(ratio).toBe(Infinity);
    });

    it('returns zero for negative CAC', () => {
      const ratio = calculateLtvToCacRatio({ arpu: 100, cac: -200, churnRate: 2, grossMargin: 80 });
      expect(ratio).toBe(0);
    });
  });

  describe('calculateCacPaybackPeriod', () => {
    it('calculates CAC payback period correctly under standard parameters', () => {
      // Payback = CAC / (ARPU * GrossMargin%)
      // 600 / (150 * 0.8) = 600 / 120 = 5.0 months
      const period = calculateCacPaybackPeriod({ arpu: 150, cac: 600, grossMargin: 80 });
      expect(period).toBe(5.0);
    });

    it('returns Infinity when adjusted ARPU is zero', () => {
      const period = calculateCacPaybackPeriod({ arpu: 0, cac: 500, grossMargin: 80 });
      expect(period).toBe(Infinity);

      const period2 = calculateCacPaybackPeriod({ arpu: 150, cac: 500, grossMargin: 0 });
      expect(period2).toBe(Infinity);
    });

    it('returns zero or handles negative inputs gracefully', () => {
      expect(calculateCacPaybackPeriod({ arpu: -100, cac: 500, grossMargin: 80 })).toBe(0);
      expect(calculateCacPaybackPeriod({ arpu: 100, cac: -500, grossMargin: 80 })).toBe(0);
      expect(calculateCacPaybackPeriod({ arpu: 100, cac: 500, grossMargin: -10 })).toBe(0);
    });
  });

  describe('calculateSaaSMagicNumber', () => {
    it('calculates SaaS Magic Number correctly under standard parameters', () => {
      // Magic Number = ((CurrentMRR - PreviousMRR) * 12) / PreviousS&M
      // ((50000 - 45000) * 12) / 15000 = (5000 * 12) / 15000 = 60000 / 15000 = 4.0
      const magicNum = calculateSaaSMagicNumber(50000, 45000, 15000);
      expect(magicNum).toBe(4.0);
    });

    it('returns Infinity when S&M spend is 0 and MRR increased', () => {
      const magicNum = calculateSaaSMagicNumber(50000, 45000, 0);
      expect(magicNum).toBe(Infinity);
    });

    it('returns 0 when S&M spend is 0 and MRR did not increase', () => {
      const magicNum = calculateSaaSMagicNumber(40000, 45000, 0);
      expect(magicNum).toBe(0);
    });

    it('handles negative inputs gracefully by returning 0', () => {
      expect(calculateSaaSMagicNumber(-50000, 45000, 15000)).toBe(0);
      expect(calculateSaaSMagicNumber(50000, -45000, 15000)).toBe(0);
      expect(calculateSaaSMagicNumber(50000, 45000, -15000)).toBe(0);
    });
  });

  describe('runRunwaySimulation', () => {
    it('projects monthly metrics correctly over time', () => {
      const simulation = runRunwaySimulation({
        startingCash: 500000,
        monthlyOpEx: 40000,
        marketingSpend: 10000,
        impressions: 50000,
        conversionRate: 1.0, // 1% converts -> 500 new customers/mo
        arpu: 100,
        churnRate: 2.0,      // 2% churn/mo
        months: 3,
        startingCustomers: 100,
      });

      expect(simulation).toHaveLength(3);

      // Month 1:
      // Starting Customers = 100
      // New Customers = 50000 * 0.01 = 500
      // Churned = 100 * 0.02 = 2
      // Active Customers at end of Month 1 = 100 + 500 - 2 = 598
      // Revenue = 598 * 100 = 59800
      // Expenses = 40000 + 10000 = 50000
      // Net Cashflow = 59800 - 50000 = 9800
      // Cash = 500000 + 9800 = 509800
      expect(simulation[0].activeCustomers).toBe(598);
      expect(simulation[0].revenue).toBe(59800);
      expect(simulation[0].cashBalance).toBe(509800);
      expect(simulation[0].netBurn).toBe(-9800);

      // Month 2:
      // Starting Customers = 598
      // New = 500
      // Churned = 598 * 0.02 = 11.96 (Math.max or rounding inside the simulation uses the raw state/rounded values)
      // Active Customers = 598 + 500 - 11.96 = 1086.04 (Rounded value is shown in return)
      expect(simulation[1].activeCustomers).toBe(1086);
    });
  });
});
