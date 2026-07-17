import { describe, expect, test } from 'vitest';
import {
  PRESETS,
  calculateRunway,
  calculateNewCustomers,
  generateInvestorUpdateText,
  evaluateResponse
} from '../components/AIBoardroom';

describe('AIBoardroom Metric Calculation Core', () => {
  test('calculateRunway returns correct runway months and handles zero burn rate', () => {
    // Standard calculation
    expect(calculateRunway(450000, 45000)).toBe(10);
    expect(calculateRunway(90000, 65000)).toBe(1.4);
    
    // Profitability/Zero burn boundary condition
    expect(calculateRunway(100000, 0)).toBe(999);
  });

  test('calculateNewCustomers computes correct acquired leads based on conversion rates', () => {
    expect(calculateNewCustomers(1200, 2.5)).toBe(30);
    expect(calculateNewCustomers(3500, 4.8)).toBe(168);
    expect(calculateNewCustomers(600, 1.1)).toBe(7);
  });
});

describe('AIBoardroom Markdown Formatting Routines', () => {
  const mockMetrics = PRESETS.steady;

  test('generateInvestorUpdateText creates structured Markdown containing critical sections', () => {
    const markdown = generateInvestorUpdateText(mockMetrics, 'institutional');
    
    expect(markdown).toContain('# CONFIDENTIAL CORPORATE EXECUTIVE BRIEFING');
    expect(markdown).toContain('## 1. EXECUTIVE SUMMARY');
    expect(markdown).toContain('## 2. CFO INTEL: CAPITAL RESERVES & RUNWAY STABILITY');
    expect(markdown).toContain('## 3. CMO INTEL: INBOUND FUNNEL & UNIT ECONOMICS');
    expect(markdown).toContain('## 4. CHRO INTEL: HEADCOUNT OPS & TEAM VITALITY');
    expect(markdown).toContain('## 5. COO INTEL: OPERATIONAL STREAM & SPRINT DELIVERIES');
    expect(markdown).toContain('## 6. STRATEGIC RECRUITS & CAPITAL ASKS');
  });

  test('generateInvestorUpdateText applies tone adjustments correctly', () => {
    const institutionalReport = generateInvestorUpdateText(mockMetrics, 'institutional');
    const bullishReport = generateInvestorUpdateText(mockMetrics, 'bullish');
    const pragmaticReport = generateInvestorUpdateText(mockMetrics, 'pragmatic');
    const casualReport = generateInvestorUpdateText(mockMetrics, 'casual');

    // Tone keyword checks
    expect(institutionalReport).toContain('overview of current corporate operations');
    expect(bullishReport).toContain('rapid market expansion and high product engineering');
    expect(pragmaticReport).toContain('Our operational strategy continues to balance disciplined');
    expect(casualReport).toContain('latest scoop from the command cockpit');
  });

  test('generateInvestorUpdateText formats metrics values dynamically', () => {
    const markdown = generateInvestorUpdateText({
      ...mockMetrics,
      cashBalance: 1250000,
      monthlyBurn: 50000,
      headcount: 88,
      cac: 75
    }, 'institutional');

    expect(markdown).toContain('$1,250,000 USD');
    expect(markdown).toContain('$50,000 / month');
    expect(markdown).toContain('25 Months'); // 1250000 / 50000 = 25
    expect(markdown).toContain('88 FTEs');
    expect(markdown).toContain('$75 USD');
  });
});

describe('AIBoardroom QA Simulator Evaluation Heuristics', () => {
  const mockMetrics = PRESETS.steady; // Cash: 450,000, Burn: 45,000, CAC: 120, Leads: 1,200, conversion: 2.5%, eNPS: 78

  test('penalizes excessively short or low-substance responses', () => {
    const shortResponse = "I don't know, we will cut some costs.";
    const result = evaluateResponse(shortResponse, 'skeptical_vc', 0, mockMetrics);
    
    expect(result.score).toBeLessThan(50);
    expect(result.verdict).toBe('Vulnerable');
    expect(result.gaps).toContain('Response is extremely brief');
  });

  test('awards higher score when relevant quantitative metrics are cited', () => {
    const vagueResponse = "We have quite a lot of cash in the bank, so our runway is fine and we don't need to cut any headcount. We will raise money later.";
    const quantitativeResponse = "We are secure because we have exactly $450,000 in cash reserves with a monthly burn of $45,000, giving us 10 months of runway. We are not doing headcount cuts because our CAC is $120, which is highly efficient.";

    const vagueResult = evaluateResponse(vagueResponse, 'skeptical_vc', 0, mockMetrics);
    const quantitativeResult = evaluateResponse(quantitativeResponse, 'skeptical_vc', 0, mockMetrics);

    expect(quantitativeResult.score).toBeGreaterThan(vagueResult.score);
    expect(quantitativeResult.critique).toContain('Referenced exact current cash reserves');
    expect(quantitativeResult.critique).toContain('Cited exact monthly cash burn rate');
  });

  test('matches keyword constraints for specific investor personas', () => {
    // Vanessa Vance (Skeptical VC) demands focus on burn, runway, and profitability
    const vcResponse = "Our main focus is managing our net burn rate and preserving our 10 months of cash runway. We are driving towards gross margin profitability by optimizing our conversion rates and reducing variable costs.";
    const vcResult = evaluateResponse(vcResponse, 'skeptical_vc', 0, mockMetrics);
    
    expect(vcResult.score).toBeGreaterThanOrEqual(75);
    expect(vcResult.critique).toContain('Addressed runway length or cash conservation');

    // Elara Thorne (ESG) demands focus on burnout, team well-being, and retention
    const esgResponse = "We care deeply about developer well-being and are monitoring workloads to prevent employee burnout. Our high eNPS is 78 because we maintain a sustainable culture with strong retention.";
    const esgResult = evaluateResponse(esgResponse, 'esg_impact', 0, mockMetrics);
    
    expect(esgResult.score).toBeGreaterThanOrEqual(75);
    expect(esgResult.critique).toContain('Highlighted team mental health, sustainable pace, or organizational culture');
  });
});
