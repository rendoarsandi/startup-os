import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { PresetSelector, PRESETS } from './boardroom/PresetSelector';
import { MetricsGrid } from './boardroom/MetricsGrid';
import { InvestorBriefing } from './boardroom/InvestorBriefing';
import { QASimulator } from './boardroom/QASimulator';
import { FileText, Sparkles } from 'lucide-react';

export { PRESETS } from './boardroom/PresetSelector';

export interface InvestorPersona {
  id: string;
  name: string;
  title: string;
  avatar: string;
  bio: string;
  focus: string;
  questions: string[];
}

export const INVESTOR_PERSONAS: InvestorPersona[] = [
  {
    id: 'skeptical_vc',
    name: 'Vanessa Vance',
    title: 'Managing Partner, Sovereign Capital',
    avatar: 'VV',
    bio: 'Vanessa focuses aggressively on path to profitability, unit economics (LTV/CAC), margin protection, and capital efficiency.',
    focus: 'Capital Efficiency, Burn Rate, and Profitability Margins',
    questions: [
      'With your current cash reserves and burn, your runway is tight. Why should we invest a bridge round rather than forcing deep headcount cuts?',
      'Your CAC seems elevated relative to conversion rate. In a crowded market, how do you expect to scale efficiently without eroding margins?',
      'If conversion rate lags behind lead volume, scaling marketing is just wasting capital. Why shouldn\'t we freeze growth spend to prioritize core product-market fit?'
    ]
  },
  {
    id: 'growth_angel',
    name: 'Arthur Sterling',
    title: 'Super Angel & Growth Tech Syndicate',
    avatar: 'AS',
    bio: 'Arthur is an aggressive growth enthusiast. He prioritizes lead pipeline growth, high-velocity features, and scaling headcount.',
    focus: 'Hyper-Growth, Pipeline Expansion, and Shipping Velocity',
    questions: [
      'You have massive pipeline leads potential. Why aren\'t you doubling your hiring velocity and engineering headcount to capture this demand today?',
      'Your project velocity is lagging behind. What key product blockages can we smash through to get features shipped and drive conversions?',
      'Your team has incredible culture and eNPS scores. How can we leverage this culture to launch a highly viral engineering recruitment loop?'
    ]
  },
  {
    id: 'conservative_banker',
    name: 'Charles Vance',
    title: 'Director of Credit Ops, Pacific Trust',
    avatar: 'CV',
    bio: 'Charles evaluates risk, debt coverage, operational stability, and risk mitigation.',
    focus: 'Debt Coverage, Financial Reserve Contingency, and Operational Risk',
    questions: [
      'If your next venture round experiences a 6-month macro delay, what is your exact operational plan to reduce burn to zero immediately?',
      'With annualized team attrition at this level, how is key-man risk being managed so projects do not collapse if a lead designer or engineer exits?'
    ]
  },
  {
    id: 'esg_impact',
    name: 'Elara Thorne',
    title: 'Founding Partner, Nebula Impact Fund',
    avatar: 'ET',
    bio: 'Elara evaluates the human element: high employee eNPS, low attrition, mental health, and diverse team management.',
    focus: 'Employee Well-being, Sustainable Velocity, and Retention Ethics',
    questions: [
      'Your current employee Net Promoter Score (eNPS) stands out. What concrete initiatives are you executing to maintain this culture as headcount scales?',
      'If attrition spikes or eNPS dips under pressure, how does that impact project velocity? We want to see how you mitigate developer burnout.'
    ]
  }
];

export interface BoardroomMetrics {
  cashBalance: number;
  monthlyBurn: number;
  cac: number;
  leads: number;
  conversionRate: number;
  headcount: number;
  attritionRate: number;
  avgSalary: number;
  eNps: number;
  projectVelocity: number;
  milestoneCompletion: number;
  activeProjects: number;
  ticketsClosed: number;
}

export interface EvaluationResult {
  score: number;
  verdict: 'Excellent' | 'Strong' | 'Needs Refinement' | 'Vulnerable';
  critique: string;
  gaps: string;
  suggestedProAnswer: string;
}

export const calculateRunway = (cashBalance: number, monthlyBurn: number): number => {
  return monthlyBurn > 0 ? parseFloat((cashBalance / monthlyBurn).toFixed(1)) : 999;
};

export const calculateNewCustomers = (leads: number, conversionRate: number): number => {
  return Math.round(leads * (conversionRate / 100));
};

export const generateInvestorUpdateText = (
  metrics: BoardroomMetrics,
  reportTone: 'bullish' | 'institutional' | 'pragmatic' | 'casual'
): string => {
  const runwayMonths = calculateRunway(metrics.cashBalance, metrics.monthlyBurn);
  const newCustomersPerMonth = calculateNewCustomers(metrics.leads, metrics.conversionRate);
  const ltvEst = Math.round((metrics.avgSalary * 0.1) || 2500);
  const ltvToCacRatio = metrics.cac > 0 ? parseFloat((ltvEst / metrics.cac).toFixed(1)) : 0;
  
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const formattedCash = metrics.cashBalance.toLocaleString();
  const formattedBurn = metrics.monthlyBurn.toLocaleString();
  const runwayStatus = runwayMonths < 6 ? 'CRITICAL RISK ALERT' : runwayMonths < 12 ? 'WATCH LIST - SECURE CAPITAL' : 'OPTIMALLY FUNDED';

  let summaryPara = '';
  let outlookPara = '';

  if (reportTone === 'bullish') {
    summaryPara = `We are excited to deliver a strong corporate update indicating rapid market expansion and high product engineering momentum. With a robust customer acquisition pipeline pulling in ${metrics.leads.toLocaleString()} monthly opportunities at an optimized $${metrics.cac} CAC, our business is scaling efficiently.`;
    outlookPara = runwayMonths < 6 
      ? `Given our rapid growth trajectory and aggressive shipping speed, we are actively raising a $2M Growth Round to accelerate marketing and double engineering resources.`
      : `With ${runwayMonths} months of robust capital reserves, we are moving full steam ahead on commercial expansion.`;
  } else if (reportTone === 'pragmatic') {
    summaryPara = `Our operational strategy continues to balance disciplined capital allocation with steady commercial progress. We are tightly monitoring unit economics with an LTV-to-CAC of ${ltvToCacRatio}x.`;
    outlookPara = `Our strategic buffer of ${runwayMonths} months of runway provides significant security.`;
  } else if (reportTone === 'casual') {
    summaryPara = `Hey team! Here is the latest scoop from the command cockpit. We are hitting amazing strides—our project velocity is hovering at a fantastic ${metrics.projectVelocity}%.`;
    outlookPara = `We are set up beautifully with over ${runwayMonths} months of runway to keep building.`;
  } else {
    summaryPara = `This document provides a highly structured consolidated overview of current corporate operations across all primary divisions. Key metrics include a solid cash reserve of $${formattedCash}.`;
    outlookPara = `With ${runwayMonths} months of sovereign runway, cash reserves will remain allocated to high-yield engineering sprints.`;
  }

  return `# CONFIDENTIAL CORPORATE EXECUTIVE BRIEFING
**Date:** ${dateStr} | **Security:** RESTRICTED / BOARD ONLY | **Tone:** ${reportTone.toUpperCase()}

## 1. EXECUTIVE SUMMARY
${summaryPara}

## 2. CFO INTEL: CAPITAL RESERVES & RUNWAY STABILITY
- **Cash Capital Reserves:** $${formattedCash} USD
- **Net Monthly Burn Rate:** $${formattedBurn} / month
- **Sovereign Cash Runway:** **${runwayMonths} Months**
- **Runway Risk Assessment:** [${runwayStatus}]

## 3. CMO INTEL: INBOUND FUNNEL & UNIT ECONOMICS
- **Customer Acquisition Cost (CAC):** $${metrics.cac} USD
- **Inbound Lead Generation:** ${metrics.leads.toLocaleString()} / month
- **Funnel Conversion Velocity:** ${metrics.conversionRate}%
- **Monthly New Customer Additions:** +${newCustomersPerMonth} Customers / month
- **Marketing ROI Multiplier (Est LTV/CAC):** ${ltvToCacRatio}x (LTV: $${ltvEst.toLocaleString()})

## 4. CHRO INTEL: HEADCOUNT OPS & TEAM VITALITY
- **Active Corporate Headcount:** ${metrics.headcount} FTEs
- **Average Base Pay Bandwidth:** $${metrics.avgSalary.toLocaleString()} USD / year
- **Annualized Employee Attrition:** ${metrics.attritionRate}%
- **Employee Net Promoter Score (eNPS):** ${metrics.eNps} / 100

## 5. COO INTEL: OPERATIONAL STREAM & SPRINT DELIVERIES
- **Core Product Sprint Velocity:** ${metrics.projectVelocity}%
- **Milestone Completion Execution:** ${metrics.milestoneCompletion}%
- **Active Structural Initiatives:** ${metrics.activeProjects} Projects
- **Customer Support Tickets Resolved:** ${metrics.ticketsClosed} / month

## 6. STRATEGIC RECRUITS & CAPITAL ASKS
${outlookPara}
`;
};

export const evaluateResponse = (
  userResponse: string,
  selectedPersonaId: string,
  selectedQuestionIdx: number,
  metrics: BoardroomMetrics
): EvaluationResult => {
  const responseText = userResponse.toLowerCase();
  const runwayMonths = calculateRunway(metrics.cashBalance, metrics.monthlyBurn);
  
  let score = 50;
  let critiquePoints: string[] = [];
  let gapPoints: string[] = [];

  if (responseText.length > 250) {
    score += 15;
    critiquePoints.push("Provided a comprehensive, detailed reply.");
  } else if (responseText.length > 100) {
    score += 8;
    critiquePoints.push("Response has reasonable depth.");
  } else {
    score -= 15;
    gapPoints.push("Response is extremely brief.");
  }

  if (selectedPersonaId === 'skeptical_vc') {
    if (/\b\d+/.test(responseText)) { 
      score += 12; 
      critiquePoints.push("Referenced exact current cash reserves."); 
    } else { 
      score -= 10; 
      gapPoints.push("Failed to state exact metric values."); 
    }

    if (responseText.includes("burn") || responseText.includes("monthly burn")) {
      score += 8;
      critiquePoints.push("Cited exact monthly cash burn rate.");
    }

    if (responseText.includes("runway") || responseText.includes("cash conservation") || responseText.includes("gross margin")) { 
      score += 8; 
      critiquePoints.push("Addressed runway length or cash conservation strategies directly."); 
    }
  } else if (selectedPersonaId === 'growth_angel') {
    if (responseText.includes("growth") || responseText.includes("scale")) {
      score += 15;
      critiquePoints.push("Focused on scaling growth velocity.");
    }
  } else if (selectedPersonaId === 'conservative_banker') {
    if (responseText.includes("plan") || responseText.includes("cut")) {
      score += 15;
      critiquePoints.push("Outlined risk mitigation and debt coverage contingency.");
    }
  } else if (selectedPersonaId === 'esg_impact') {
    if (responseText.includes("culture") || responseText.includes("enps") || responseText.includes("burnout") || responseText.includes("well-being")) {
      score += 25;
      critiquePoints.push("Highlighted team mental health, sustainable pace, or organizational culture.");
    }
  }

  score = Math.min(100, Math.max(0, score));
  let verdict: 'Excellent' | 'Strong' | 'Needs Refinement' | 'Vulnerable' = 'Needs Refinement';
  if (score >= 90) verdict = 'Excellent';
  else if (score >= 75) verdict = 'Strong';
  else if (score >= 50) verdict = 'Needs Refinement';
  else verdict = 'Vulnerable';

  return {
    score,
    verdict,
    critique: critiquePoints.join(" ") || "Addressed runway length or cash conservation strategies directly.",
    gaps: gapPoints.join(" ") || "No major logical gaps identified.",
    suggestedProAnswer: `Vanessa, our current reserves of $${metrics.cashBalance.toLocaleString()} provide us with ${runwayMonths} months of runway.`
  };
};

export const AIBoardroom: React.FC = () => {
  const [selectedPreset, setSelectedPreset] = useState<keyof typeof PRESETS>('steady');
  
  const [cashBalance, setCashBalance] = useState<number>(PRESETS.steady.cashBalance);
  const [monthlyBurn, setMonthlyBurn] = useState<number>(PRESETS.steady.monthlyBurn);
  const [cac, setCac] = useState<number>(PRESETS.steady.cac);
  const [leads, setLeads] = useState<number>(PRESETS.steady.leads);
  const [conversionRate, setConversionRate] = useState<number>(PRESETS.steady.conversionRate);
  const [headcount, setHeadcount] = useState<number>(PRESETS.steady.headcount);
  const [attritionRate, setAttritionRate] = useState<number>(PRESETS.steady.attritionRate);
  const [avgSalary] = useState<number>(PRESETS.steady.avgSalary);
  const [eNps, setENps] = useState<number>(PRESETS.steady.eNps);
  const [projectVelocity, setProjectVelocity] = useState<number>(PRESETS.steady.projectVelocity);
  const [milestoneCompletion, setMilestoneCompletion] = useState<number>(PRESETS.steady.milestoneCompletion);
  const [activeProjects] = useState<number>(PRESETS.steady.activeProjects);
  const [ticketsClosed] = useState<number>(PRESETS.steady.ticketsClosed);

  const [reportTone, setReportTone] = useState<'bullish' | 'institutional' | 'pragmatic' | 'casual'>('institutional');
  const [activeTab, setActiveTab] = useState<'briefing' | 'qa'>('briefing');

  const handleSelectPreset = (key: keyof typeof PRESETS) => {
    setSelectedPreset(key);
    const p = PRESETS[key];
    setCashBalance(p.cashBalance);
    setMonthlyBurn(p.monthlyBurn);
    setCac(p.cac);
    setLeads(p.leads);
    setConversionRate(p.conversionRate);
    setHeadcount(p.headcount);
    setAttritionRate(p.attritionRate);
    setENps(p.eNps);
    setProjectVelocity(p.projectVelocity);
    setMilestoneCompletion(p.milestoneCompletion);
  };

  const metrics = {
    cashBalance,
    monthlyBurn,
    cac,
    leads,
    conversionRate,
    headcount,
    attritionRate,
    avgSalary,
    eNps,
    projectVelocity,
    milestoneCompletion,
    activeProjects,
    ticketsClosed
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" /> AI Boardroom Briefing &amp; Defense Simulator
          </h2>
          <p className="text-xs text-muted-foreground font-semibold mt-1">
            Simulate executive financial performance across departments, generate board briefing reports, and defend your numbers against AI investor personas.
          </p>
        </div>
      </header>

      <PresetSelector selectedPreset={selectedPreset} onSelectPreset={handleSelectPreset} />

      <MetricsGrid
        cashBalance={cashBalance}
        setCashBalance={setCashBalance}
        monthlyBurn={monthlyBurn}
        setMonthlyBurn={setMonthlyBurn}
        cac={cac}
        setCac={setCac}
        leads={leads}
        setLeads={setLeads}
        conversionRate={conversionRate}
        setConversionRate={setConversionRate}
        headcount={headcount}
        setHeadcount={setHeadcount}
        attritionRate={attritionRate}
        setAttritionRate={setAttritionRate}
        eNps={eNps}
        setENps={setENps}
        projectVelocity={projectVelocity}
        setProjectVelocity={setProjectVelocity}
        milestoneCompletion={milestoneCompletion}
        setMilestoneCompletion={setMilestoneCompletion}
      />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="grid grid-cols-2 w-full max-w-md h-10 bg-black/10">
          <TabsTrigger value="briefing" className="flex items-center gap-2 text-xs font-bold">
            <FileText className="w-4 h-4" /> Board Briefing Report
          </TabsTrigger>
          <TabsTrigger value="qa" className="flex items-center gap-2 text-xs font-bold">
            <Sparkles className="w-4 h-4" /> Investor Q&amp;A Simulator
          </TabsTrigger>
        </TabsList>

        <TabsContent value="briefing" className="mt-4">
          <InvestorBriefing
            metrics={metrics}
            reportTone={reportTone}
            setReportTone={setReportTone}
          />
        </TabsContent>

        <TabsContent value="qa" className="mt-4">
          <QASimulator metrics={metrics} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
