import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import {
  DollarSign,
  Clock,
  Users,
  Target,
  FileText,
  Sparkles,
  Send,
  CheckCircle2,
  AlertCircle,
  Zap,
  Activity,
  Download,
  Copy,
  Check,
  ChevronRight,
  TrendingUp,
  Award
} from 'lucide-react';

// Preset configurations for the board-room simulator
export const PRESETS = {
  steady: {
    name: 'Steady State (Stable Ops)',
    cashBalance: 450000,
    monthlyBurn: 45000,
    cac: 120,
    leads: 1200,
    conversionRate: 2.5,
    headcount: 24,
    attritionRate: 4.2,
    avgSalary: 115000,
    eNps: 78,
    projectVelocity: 85,
    milestoneCompletion: 92,
    activeProjects: 5,
    ticketsClosed: 142
  },
  growth: {
    name: 'Hyper-Growth (Surge Operations)',
    cashBalance: 950000,
    monthlyBurn: 110000,
    cac: 85,
    leads: 3500,
    conversionRate: 4.8,
    headcount: 45,
    attritionRate: 2.5,
    avgSalary: 130000,
    eNps: 92,
    projectVelocity: 96,
    milestoneCompletion: 98,
    activeProjects: 9,
    ticketsClosed: 412
  },
  crisis: {
    name: 'Runway Crisis (High-Stress)',
    cashBalance: 90000,
    monthlyBurn: 65000,
    cac: 280,
    leads: 600,
    conversionRate: 1.1,
    headcount: 18,
    attritionRate: 18.5,
    avgSalary: 105000,
    eNps: 34,
    projectVelocity: 58,
    milestoneCompletion: 64,
    activeProjects: 3,
    ticketsClosed: 78
  },
  efficient: {
    name: 'Capital Efficient Scale-up',
    cashBalance: 380000,
    monthlyBurn: 15000,
    cac: 45,
    leads: 1500,
    conversionRate: 3.2,
    headcount: 12,
    attritionRate: 0.0,
    avgSalary: 125000,
    eNps: 85,
    projectVelocity: 90,
    milestoneCompletion: 95,
    activeProjects: 4,
    ticketsClosed: 210
  }
};

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
    bio: 'Vanessa focuses aggressively on path to profitability, unit economics (LTV/CAC), margin protection, and capital efficiency. She hates hand-waving and loves exact numbers.',
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
    bio: 'Arthur is an aggressive growth enthusiast. He prioritizes lead pipeline growth, high-velocity features, scaling headcount, and capture of market share over early profit-taking.',
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
    bio: 'Charles evaluates risk, debt coverage, operational stability, and risk mitigation. He wants to know if the company will default and what asset reserves back their obligations.',
    focus: 'Debt Coverage, Financial Reserve Contingency, and Operational Risk',
    questions: [
      'If your next venture round experiences a 6-month macro delay, what is your exact operational plan to reduce burn to zero immediately?',
      'With annualized team attrition at this level, how is key-man risk being managed so projects do not collapse if a lead designer or engineer exits?',
      'How do your active projects and milestones align directly to incoming cash flows? We need clarity on working capital security.'
    ]
  },
  {
    id: 'esg_impact',
    name: 'Elara Thorne',
    title: 'Founding Partner, Nebula Impact Fund',
    avatar: 'ET',
    bio: 'Elara evaluates the human element: high employee eNPS, low attrition, mental health, ethical project delivery, diverse team management, and long-term sustainable growth.',
    focus: 'Employee Well-being, Sustainable Velocity, and Retention Ethics',
    questions: [
      'Your current employee Net Promoter Score (eNPS) stands out. What concrete initiatives are you executing to maintain this culture as headcount scales?',
      'If attrition spikes or eNPS dips under pressure, how does that impact project velocity? We want to see how you mitigate developer burnout.',
      'How does your project milestone velocity factor in sustainable work practices to ensure team retention over shipping speeds?'
    ]
  }
];

export interface EvaluationResult {
  score: number;
  verdict: 'Excellent' | 'Strong' | 'Needs Refinement' | 'Vulnerable';
  critique: string;
  gaps: string;
  suggestedProAnswer: string;
}

// --- PURE CORE LOGIC FUNCTIONS FOR UNIT TESTING ---

export const calculateRunway = (cashBalance: number, monthlyBurn: number): number => {
  return monthlyBurn > 0 ? parseFloat((cashBalance / monthlyBurn).toFixed(1)) : 999;
};

export const calculateNewCustomers = (leads: number, conversionRate: number): number => {
  return Math.round(leads * (conversionRate / 100));
};

export const generateInvestorUpdateText = (
  metrics: {
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
  },
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
  const growthAcquired = newCustomersPerMonth;
  const teamOutflowAnnual = (metrics.headcount * metrics.avgSalary).toLocaleString();

  let summaryPara = '';
  let outlookPara = '';

  if (reportTone === 'bullish') {
    summaryPara = `We are excited to deliver a strong corporate update indicating rapid market expansion and high product engineering momentum. With a robust customer acquisition pipeline pulling in ${metrics.leads.toLocaleString()} monthly opportunities at an optimized $${metrics.cac} CAC, our business is scaling efficiently. Operational pipelines are running at an elite ${metrics.projectVelocity}% delivery velocity, positioning us to capture significant market share.`;
    outlookPara = runwayMonths < 6 
      ? `Given our rapid growth trajectory and aggressive shipping speed, we are actively raising a $2M Growth Round to accelerate marketing and double engineering resources. We welcome immediate strategic investor introductions.`
      : `With ${runwayMonths} months of robust capital reserves, we are moving full steam ahead on commercial expansion, expanding our product lines, and securing strategic market dominance.`;
  } else if (reportTone === 'pragmatic') {
    summaryPara = `Our operational strategy continues to balance disciplined capital allocation with steady commercial progress. We are tightly monitoring unit economics with an LTV-to-CAC of ${ltvToCacRatio}x and maintaining high organizational alignment. Backed by a strong employee Net Promoter Score of ${metrics.eNps}, we are scaling carefully while guarding stability.`;
    outlookPara = runwayMonths < 6 
      ? `We are implementing strict expense controls to extend our existing cash position, alongside targeted discussions for a flat/bridge capital injection of $1M. Maintaining capital efficiency is our absolute priority.`
      : `Our strategic buffer of ${runwayMonths} months of runway provides significant security. We will continue to scale our sales engine efficiently while maintaining capital-preservation protocols.`;
  } else if (reportTone === 'casual') {
    summaryPara = `Hey team! Here is the latest scoop from the command cockpit. We are hitting amazing strides—our project velocity is hovering at a fantastic ${metrics.projectVelocity}%, and our team morale is absolutely off the charts with a solid ${metrics.eNps} eNPS. On the growth front, we are bringing in ${growthAcquired} new customers every month. Let\'s check out the details!`;
    outlookPara = runwayMonths < 6 
      ? `With ${runwayMonths} months of cash left in the tank, we are looking to partner with high-alignment investors for a friendly bridge round. If you know anyone who loves awesome team-focused products, drop us a line!`
      : `We are set up beautifully with over ${runwayMonths} months of runway to keep building, learning, and crushing our milestones. Thanks for your continued support!`;
  } else {
    // Default: Institutional
    summaryPara = `This document provides a highly structured consolidated overview of current corporate operations across all primary divisions: Finance, Marketing, Human Resources, and Operations. Key metrics include a solid cash reserve of $${formattedCash} and stable project delivery velocities of ${metrics.projectVelocity}%.`;
    outlookPara = runwayMonths < 6 
      ? `Fundraising Directive: The management team is formalizing materials to initiate a capital bridge campaign of $1.5M. This will offset immediate liquidity compression and bridge the enterprise to mid-term cash-flow positivity.`
      : `Capital Allocation Strategy: With ${runwayMonths} months of sovereign runway, cash reserves will remain allocated to high-yield engineering sprints and scalable customer acquisition channels. No capital shortages are forecasted.`;
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
- **Estimated Annual Burn Commitment:** $${(metrics.monthlyBurn * 12).toLocaleString()} / year

## 3. CMO INTEL: INBOUND FUNNEL & UNIT ECONOMICS
- **Customer Acquisition Cost (CAC):** $${metrics.cac} USD
- **Inbound Lead Generation:** ${metrics.leads.toLocaleString()} / month
- **Funnel Conversion Velocity:** ${metrics.conversionRate}%
- **Monthly New Customer Additions:** +${growthAcquired} Customers / month
- **Marketing ROI Multiplier (Est LTV/CAC):** ${ltvToCacRatio}x (LTV: $${ltvEst.toLocaleString()})

## 4. CHRO INTEL: HEADCOUNT OPS & TEAM VITALITY
- **Active Corporate Headcount:** ${metrics.headcount} FTEs
- **Average Base Pay Bandwidth:** $${metrics.avgSalary.toLocaleString()} USD / year
- **Annualized Employee Attrition:** ${metrics.attritionRate}%
- **Employee Net Promoter Score (eNPS):** ${metrics.eNps} / 100
- **Total Talent Pay Liabilities:** $${(metrics.headcount * metrics.avgSalary).toLocaleString()} / year

## 5. COO INTEL: OPERATIONAL STREAM & SPRINT DELIVERIES
- **Core Product Sprint Velocity:** ${metrics.projectVelocity}%
- **Milestone Completion Execution:** ${metrics.milestoneCompletion}%
- **Active Structural Initiatives:** ${metrics.activeProjects} Projects
- **Customer Support Tickets Resolved:** ${metrics.ticketsClosed} / month
- **Execution Index:** ${metrics.projectVelocity >= 85 ? 'ELITE PRODUCTIVITY' : 'STABILIZING WORKFLOW'}

## 6. STRATEGIC RECRUITS & CAPITAL ASKS
${outlookPara}
`;
};

export const evaluateResponse = (
  userResponse: string,
  selectedPersonaId: string,
  selectedQuestionIdx: number,
  metrics: {
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
): EvaluationResult => {
  const responseText = userResponse.toLowerCase();
  const runwayMonths = calculateRunway(metrics.cashBalance, metrics.monthlyBurn);
  const newCustomersPerMonth = calculateNewCustomers(metrics.leads, metrics.conversionRate);
  const ltvEst = Math.round((metrics.avgSalary * 0.1) || 2500);
  const ltvToCacRatio = metrics.cac > 0 ? parseFloat((ltvEst / metrics.cac).toFixed(1)) : 0;
  
  let score = 50; // base score
  let critiquePoints: string[] = [];
  let gapPoints: string[] = [];

  // Evaluation rules
  // 1. Length analysis
  if (responseText.length > 250) {
    score += 15;
    critiquePoints.push("Provided a comprehensive, detailed reply which prevents follow-up skepticism.");
  } else if (responseText.length > 100) {
    score += 8;
    critiquePoints.push("Response has reasonable depth, covering primary details.");
  } else {
    score -= 15;
    gapPoints.push("Response is extremely brief. Investors hate vague, one-sentence answers that avoid details.");
  }

  // 2. Persona specific checks
  if (selectedPersonaId === 'skeptical_vc') {
    const hasNumbers = /\b\d+/.test(responseText);
    const hasBurn = responseText.includes("burn") || responseText.includes("cost") || responseText.includes("spend");
    const hasRunway = responseText.includes("runway") || responseText.includes("months") || responseText.includes("cash");
    const hasUnitEconomics = responseText.includes("cac") || responseText.includes("conversion") || responseText.includes("margin") || responseText.includes("efficiency") || responseText.includes("profit");

    if (hasNumbers) { score += 12; critiquePoints.push("Successfully injected quantitative data to back up assertions."); }
    else { score -= 10; gapPoints.push("Failed to state exact metric values. Vanessa Vance demands concrete data."); }

    if (hasBurn || hasRunway) { score += 8; critiquePoints.push("Addressed runway length or cash conservation strategies directly."); }
    else { score -= 8; gapPoints.push("Ignored runway/burn rate metrics in the context of the question."); }

    if (hasUnitEconomics) { score += 10; critiquePoints.push("Linked scaling efficiency back to unit economics (CAC, conversion, or margins)."); }
    else { gapPoints.push("Did not defend marketing channels or LTV/CAC dynamics."); }

  } else if (selectedPersonaId === 'growth_angel') {
    const hasGrowth = responseText.includes("scale") || responseText.includes("growth") || responseText.includes("double") || responseText.includes("capture") || responseText.includes("market");
    const hasShipping = responseText.includes("velocity") || responseText.includes("ship") || responseText.includes("release") || responseText.includes("feature") || responseText.includes("milestone");
    const hasCulture = responseText.includes("culture") || responseText.includes("hire") || responseText.includes("recruit") || responseText.includes("enps") || responseText.includes("team");

    if (hasGrowth) { score += 10; critiquePoints.push("Aligned reply with aggressive market capture and pipeline scaling opportunities."); }
    else { gapPoints.push("Missed emphasizing expansion, pipeline volume, and scale opportunities."); }

    if (hasShipping) { score += 10; critiquePoints.push("Highlighted shipping velocity, features releases, or engineering roadmaps."); }
    else { gapPoints.push("Failed to outline how engineering is smashing operational bottlenecks."); }

    if (hasCulture) { score += 8; critiquePoints.push("Leveraged strong employee morale or culture metrics to justify high-quality talent acquisition."); }

  } else if (selectedPersonaId === 'conservative_banker') {
    const hasPlan = responseText.includes("plan") || responseText.includes("contingency") || responseText.includes("reserve") || responseText.includes("emergency");
    const hasCuts = responseText.includes("cut") || responseText.includes("reduce") || responseText.includes("salary") || responseText.includes("expense") || responseText.includes("payroll");
    const hasStability = responseText.includes("asset") || responseText.includes("steady") || responseText.includes("collateral") || responseText.includes("cash flow") || responseText.includes("security");

    if (hasPlan || hasCuts) { score += 15; critiquePoints.push("Clearly outlined a risk contingency plan and identified specific burn containment levers."); }
    else { score -= 15; gapPoints.push("Lacks a clear downside scenario. Charles demands an absolute crisis plan with specific cuts."); }

    if (hasStability) { score += 10; critiquePoints.push("Mentioned stable cash flows, assets, or capital reserves."); }

  } else if (selectedPersonaId === 'esg_impact') {
    const hasWellBeing = responseText.includes("burnout") || responseText.includes("mental health") || responseText.includes("well-being") || responseText.includes("culture") || responseText.includes("enps");
    const hasRetention = responseText.includes("retention") || responseText.includes("attrition") || responseText.includes("satisfaction") || responseText.includes("sustainable");

    if (hasWellBeing) { score += 15; critiquePoints.push("Highlighted team mental health, sustainable pace, or organizational culture."); }
    else { score -= 10; gapPoints.push("Focused too much on raw numbers without addressing the human sustainability element."); }

    if (hasRetention) { score += 10; critiquePoints.push("Directly linked attrition trends and employee satisfaction scores back to core workflows."); }
    else { gapPoints.push("Failed to address team retention or attrition risks under heavy project loads."); }
  }

  // Check if user referenced actual cockpit metrics (clever matching!)
  const cashStr = metrics.cashBalance.toString();
  const burnStr = metrics.monthlyBurn.toString();
  const leadsStr = metrics.leads.toString();
  const cacStr = metrics.cac.toString();
  const eNpsStr = metrics.eNps.toString();

  if (responseText.includes(cashStr) || responseText.includes(cashStr.slice(0, -3) + "k") || responseText.includes(cashStr.slice(0, -3) + ",000")) {
    score += 8;
    critiquePoints.push(`Referenced exact current cash reserves ($${metrics.cashBalance.toLocaleString()}) seamlessly.`);
  }
  if (responseText.includes(burnStr) || responseText.includes(burnStr.slice(0, -3) + "k") || responseText.includes(burnStr.slice(0, -3) + ",000")) {
    score += 8;
    critiquePoints.push(`Cited exact monthly cash burn rate ($${metrics.monthlyBurn.toLocaleString()}/mo).`);
  }
  if (responseText.includes(cacStr)) {
    score += 5;
    critiquePoints.push(`Integrated accurate CAC metric ($${metrics.cac}) in the valuation defense.`);
  }
  if (responseText.includes(eNpsStr)) {
    score += 5;
    critiquePoints.push(`Stated actual employee Net Promoter Score (${metrics.eNps}) to backup stability statements.`);
  }

  // Caps
  score = Math.min(100, Math.max(0, score));

  // Verdict definition
  let verdict: 'Excellent' | 'Strong' | 'Needs Refinement' | 'Vulnerable' = 'Needs Refinement';
  if (score >= 90) verdict = 'Excellent';
  else if (score >= 75) verdict = 'Strong';
  else if (score >= 50) verdict = 'Needs Refinement';
  else verdict = 'Vulnerable';

  // Generate suggested pro answer dynamically based on current metrics
  let suggestedProAnswer = "";
  if (selectedPersonaId === 'skeptical_vc') {
    if (selectedQuestionIdx === 0) {
      suggestedProAnswer = `Vanessa, our current reserves of $${metrics.cashBalance.toLocaleString()} provide us with a solid ${runwayMonths} months of runway, which does not necessitate drastic, business-crippling headcount cuts. Rather than risking project velocity (which sits at a high ${metrics.projectVelocity}%), we are optimizing our CAC ($${metrics.cac}) and conversion (${metrics.conversionRate}%) to increase cash inflows. If runway falls under 5 months, our contingency plan trims auxiliary non-payroll growth spend by 40% first, extending runway by another 4.5 months without harming core engineering capabilities. This bridges us safely to profitability.`;
    } else if (selectedQuestionIdx === 1) {
      suggestedProAnswer = `Our CAC is $${metrics.cac}, but it's supported by a robust pipeline of ${metrics.leads.toLocaleString()} leads per month. With an LTV-to-CAC ratio of ${ltvToCacRatio}x, our core unit economics are sound. We are focused on boosting our funnel conversion rate from ${metrics.conversionRate}% to 4.0% via automated checkout revisions, which will acquire ${Math.round(metrics.leads * 0.04)} customers monthly. This expands gross margins and lowers payback periods, proving we are scaling with high capital efficiency.`;
    } else {
      suggestedProAnswer = `Prioritizing product-market fit and funnel efficiency is exactly what our metrics suggest. While we are pulling in ${metrics.leads.toLocaleString()} leads, our focus is conversion rate engineering. Rather than boosting marketing spend, we are holding advertising steady, which protects our burn rate at $${metrics.monthlyBurn.toLocaleString()}/mo. Sprints are focused on checkout conversions, and our high project velocity (${metrics.projectVelocity}%) ensures these UX features deploy inside 14 days, reducing leakage directly.`;
    }
  } else if (selectedPersonaId === 'growth_angel') {
    if (selectedQuestionIdx === 0) {
      suggestedProAnswer = `Arthur, we are sitting on an massive inbound pipeline of ${metrics.leads.toLocaleString()} monthly leads. Morale is fantastic, with an eNPS of ${metrics.eNps}, making recruitment highly efficient. To capitalize on this, we plan to leverage our $${metrics.cashBalance.toLocaleString()} reserves to expand the product engineering headcount from ${metrics.headcount} to 35 FTEs over the next quarter. This will directly lift project velocity beyond ${metrics.projectVelocity}% to deliver critical enterprise features ahead of schedule.`;
    } else {
      suggestedProAnswer = `To accelerate feature delivery, we are streamlining active streams down from ${metrics.activeProjects} projects to focus resources. With a current project velocity of ${metrics.projectVelocity}%, we are deploying automated CI/CD checks to clear technical debt. Smashing these code bottlenecks will immediately push milestone completion from ${metrics.milestoneCompletion}% to 98%, enabling us to double customer conversion rates from ${metrics.conversionRate}% and maximize our funnel return.`;
    }
  } else if (selectedPersonaId === 'conservative_banker') {
    suggestedProAnswer = `Charles, in a delay scenario, our emergency contingency plan activates immediately. First, we pause auxiliary lead-generation programs, saving $${Math.round(metrics.monthlyBurn * 0.25).toLocaleString()} monthly. Second, we transition contractors to deferred equity, extending our runway of ${runwayMonths} months by another 6 months. Our core team size of ${metrics.headcount} remains intact, protecting our current ${metrics.milestoneCompletion}% milestone completion rate and guaranteeing operational stability without default risks.`;
  } else {
    suggestedProAnswer = `Elara, our outstanding eNPS of ${metrics.eNps} is our primary asset. We track employee satisfaction as closely as cash burn ($${metrics.monthlyBurn.toLocaleString()}/mo). To maintain this cultural strength as we scale headcount past ${metrics.headcount} FTEs, we operate on a strict no-burnout policy, capping work hours and logging developer wellness. This keeps our annualized attrition at an ultra-low ${metrics.attritionRate}%, saving us significant rehiring costs and guaranteeing a stable, sustainable project velocity of ${metrics.projectVelocity}%.`;
  }

  return {
    score,
    verdict,
    critique: critiquePoints.join(" ") || "Your response was received. Focus on weaving in exact metric values to defend your arguments.",
    gaps: gapPoints.join(" ") || "No major logical gaps identified. The answer was sound and structurally logical.",
    suggestedProAnswer
  };
};

// --- REACT UI COMPONENT ---

export const AIBoardroom: React.FC = () => {
  // --- STATE STREAMS ---
  const [selectedPreset, setSelectedPreset] = useState<keyof typeof PRESETS>('steady');
  
  // CFO Metrics
  const [cashBalance, setCashBalance] = useState<number>(PRESETS.steady.cashBalance);
  const [monthlyBurn, setMonthlyBurn] = useState<number>(PRESETS.steady.monthlyBurn);
  
  // CMO Metrics
  const [cac, setCac] = useState<number>(PRESETS.steady.cac);
  const [leads, setLeads] = useState<number>(PRESETS.steady.leads);
  const [conversionRate, setConversionRate] = useState<number>(PRESETS.steady.conversionRate);
  
  // CHRO Metrics
  const [headcount, setHeadcount] = useState<number>(PRESETS.steady.headcount);
  const [attritionRate, setAttritionRate] = useState<number>(PRESETS.steady.attritionRate);
  const [avgSalary, setAvgSalary] = useState<number>(PRESETS.steady.avgSalary);
  const [eNps, setENps] = useState<number>(PRESETS.steady.eNps);
  
  // COO Metrics
  const [projectVelocity, setProjectVelocity] = useState<number>(PRESETS.steady.projectVelocity);
  const [milestoneCompletion, setMilestoneCompletion] = useState<number>(PRESETS.steady.milestoneCompletion);
  const [activeProjects, setActiveProjects] = useState<number>(PRESETS.steady.activeProjects);
  const [ticketsClosed, setTicketsClosed] = useState<number>(PRESETS.steady.ticketsClosed);

  // General App / UI States
  const [reportTone, setReportTone] = useState<'bullish' | 'institutional' | 'pragmatic' | 'casual'>('institutional');
  const [reportCopied, setReportToneCopied] = useState<boolean>(false);
  const [reportActiveTab, setReportActiveTab] = useState<'preview' | 'markdown'>('preview');
  
  // QA Simulator States
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>('skeptical_vc');
  const [selectedQuestionIdx, setSelectedQuestionIdx] = useState<number>(0);
  const [userResponse, setUserResponse] = useState<string>('');
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);

  // --- REACT QUERY LIVE WORKSPACE INJECTION ---
  const { data: liveRunway } = useQuery<any>({
    queryKey: ['runway'],
    queryFn: async () => {
      const res = await fetch('/api/cfo/runway');
      if (!res.ok) throw new Error();
      return res.json();
    },
    enabled: typeof window !== 'undefined',
    retry: false
  });

  const { data: liveEmployees } = useQuery<any[]>({
    queryKey: ['employees'],
    queryFn: async () => {
      const res = await fetch('/api/hr/employees');
      if (!res.ok) throw new Error();
      return res.json();
    },
    enabled: typeof window !== 'undefined',
    retry: false
  });

  const { data: liveProjects } = useQuery<any[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await fetch('/api/operations/projects');
      if (!res.ok) throw new Error();
      return res.json();
    },
    enabled: typeof window !== 'undefined',
    retry: false
  });

  const { data: liveTasks } = useQuery<any[]>({
    queryKey: ['tasks'],
    queryFn: async () => {
      const res = await fetch('/api/operations/tasks');
      if (!res.ok) throw new Error();
      return res.json();
    },
    enabled: typeof window !== 'undefined',
    retry: false
  });

  const { data: liveTickets } = useQuery<any[]>({
    queryKey: ['tickets'],
    queryFn: async () => {
      const res = await fetch('/api/operations/tickets');
      if (!res.ok) throw new Error();
      return res.json();
    },
    enabled: typeof window !== 'undefined',
    retry: false
  });

  // Effect to load preset values when preset selection changes
  useEffect(() => {
    const config = PRESETS[selectedPreset];
    setCashBalance(config.cashBalance);
    setMonthlyBurn(config.monthlyBurn);
    setCac(config.cac);
    setLeads(config.leads);
    setConversionRate(config.conversionRate);
    setHeadcount(config.headcount);
    setAttritionRate(config.attritionRate);
    setAvgSalary(config.avgSalary);
    setENps(config.eNps);
    setProjectVelocity(config.projectVelocity);
    setMilestoneCompletion(config.milestoneCompletion);
    setActiveProjects(config.activeProjects);
    setTicketsClosed(config.ticketsClosed);
    setEvaluation(null);
    setUserResponse('');
  }, [selectedPreset]);

  // Handle Injecting Live ERP Workspace values
  const handleInjectLiveMetrics = () => {
    let loadedAnything = false;
    
    if (liveRunway) {
      if (liveRunway.cashBalance) setCashBalance(Math.round(liveRunway.cashBalance / 100));
      if (liveRunway.netBurn) setMonthlyBurn(Math.round(liveRunway.netBurn / 100));
      loadedAnything = true;
    }

    if (liveEmployees && liveEmployees.length > 0) {
      setHeadcount(liveEmployees.length);
      const salaries = liveEmployees.map(e => e.salary || 0);
      const totalSal = salaries.reduce((a, b) => a + b, 0);
      if (totalSal > 0) {
        setAvgSalary(Math.round(totalSal / liveEmployees.length / 100));
      }
      loadedAnything = true;
    }

    if (liveProjects) {
      setActiveProjects(liveProjects.length);
      loadedAnything = true;
    }

    if (liveTasks && liveTasks.length > 0) {
      const completed = liveTasks.filter(t => t.status === 'completed').length;
      setMilestoneCompletion(Math.round((completed / liveTasks.length) * 100));
      loadedAnything = true;
    }

    if (liveTickets) {
      const resolved = liveTickets.filter(t => t.status === 'resolved').length;
      setTicketsClosed(resolved || liveTickets.length);
      loadedAnything = true;
    }

    if (loadedAnything) {
      setEvaluation(null);
      setUserResponse('');
    }
  };

  // --- DYNAMIC DERIVED VITAL METRICS ---
  const activeMetrics = {
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

  const runwayMonths = calculateRunway(cashBalance, monthlyBurn);
  const newCustomersPerMonth = calculateNewCustomers(leads, conversionRate);
  const ltvEst = Math.round((avgSalary * 0.1) || 2500);
  const ltvToCacRatio = cac > 0 ? parseFloat((ltvEst / cac).toFixed(1)) : 0;
  
  const selectedPersona = INVESTOR_PERSONAS.find(p => p.id === selectedPersonaId) || INVESTOR_PERSONAS[0];
  const activeQuestion = selectedPersona.questions[selectedQuestionIdx] || selectedPersona.questions[0];

  const handleCopyReport = () => {
    navigator.clipboard.writeText(generateInvestorUpdateText(activeMetrics, reportTone));
    setReportToneCopied(true);
    setTimeout(() => setReportToneCopied(false), 2000);
  };

  const handleDownloadReport = () => {
    const element = document.createElement("a");
    const file = new Blob([generateInvestorUpdateText(activeMetrics, reportTone)], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `executive_investor_update_${reportTone}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleEvaluateResponse = () => {
    if (!userResponse.trim()) return;
    setIsEvaluating(true);
    setEvaluation(null);

    setTimeout(() => {
      const res = evaluateResponse(userResponse, selectedPersonaId, selectedQuestionIdx, activeMetrics);
      setEvaluation(res);
      setIsEvaluating(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#080710] text-white p-6 md:p-8 space-y-8 font-sans relative overflow-hidden">
      {/* Backdrop glowing nebulas */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#00E5FF]/5 blur-[120px] rounded-full -z-10 animate-pulse pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#9D4EDD]/5 blur-[100px] rounded-full -z-10 pointer-events-none" />

      {/* --- HEADER BANNER --- */}
      <header className="glass-card p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden border-white/10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#00FF87] animate-ping" />
            <span className="text-[10px] text-[#00FF87] font-black uppercase tracking-widest">Active Boardroom Control Room</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-white/80 to-white/40 bg-clip-text text-transparent italic">
            CROSS-FUNCTIONAL AI BOARDROOM
          </h1>
          <p className="text-white/40 text-xs md:text-sm max-w-2xl font-medium">
            Merge core corporate accounts, human resources rosters, and operations sprints in real-time. Tune parameters, export premium investor briefings, and rehearse high-stakes partner QA.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto shrink-0">
          <Button
            variant="outline"
            onClick={handleInjectLiveMetrics}
            className="text-[10px] font-bold h-9 uppercase tracking-wider border-white/10 hover:bg-white/5 gap-1.5"
          >
            🔌 INJECT LIVE WORKSPACE DATA
          </Button>

          <Select
            value={selectedPreset}
            onValueChange={(val: any) => setSelectedPreset(val)}
          >
            <SelectTrigger aria-label="Simulation Preset" className="w-[200px] h-9 text-[10px] font-bold uppercase tracking-wider border-white/10 bg-black/20 text-white">
              <SelectValue placeholder="SIMULATION PRESET" />
            </SelectTrigger>
            <SelectContent className="bg-black/90 border-white/10 text-white">
              <SelectItem value="steady">Steady State (Stable Ops)</SelectItem>
              <SelectItem value="growth">Hyper-Growth (Surge)</SelectItem>
              <SelectItem value="crisis">Runway Crisis (High-Stress)</SelectItem>
              <SelectItem value="efficient">Capital Efficient Scale-up</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>

      {/* --- QUAD-KPI COCKPIT DASHBOARD --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* CFO CARD */}
        <Card className="glass-card p-6 relative overflow-hidden border-[#00E5FF]/20 shadow-[0_0_20px_rgba(0,229,255,0.03)] hover:border-[#00E5FF]/40 transition-all group duration-300">
          <div className="absolute -right-4 -top-4 w-16 h-14 rounded-full bg-[#00E5FF]/5 flex items-center justify-center border border-[#00E5FF]/10 group-hover:scale-105 transition-transform">
            <DollarSign size={18} className="text-[#00E5FF]" />
          </div>
          <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">CFO VITAL • CASH & RUNWAY</p>
          <div className="mt-3 space-y-1">
            <h3 className="text-2xl font-black text-white font-mono">${cashBalance.toLocaleString()}</h3>
            <p className="text-xs text-[#00E5FF]/90 font-bold font-mono">
              ${monthlyBurn.toLocaleString()}/mo burn • {runwayMonths} Mo. Runway
            </p>
          </div>
          <Badge variant={runwayMonths < 6 ? 'destructive' : runwayMonths < 12 ? 'warning' : 'success'} className="mt-4 text-[8px] font-black uppercase tracking-wider">
            {runwayMonths < 6 ? 'Critical Runway' : runwayMonths < 12 ? 'Watch Reserve' : 'Secure Runway'}
          </Badge>

          {/* SSliders Drawer */}
          <div className="mt-6 pt-5 border-t border-white/5 space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-bold">
                <span className="text-white/60 uppercase">Cash Reserves</span>
                <span className="text-white font-mono font-bold">${(cashBalance/1000).toFixed(0)}k</span>
              </div>
              <Slider
                min={20000}
                max={2000000}
                step={10000}
                value={[cashBalance]}
                onValueChange={(val) => {
                  setCashBalance(val[0]);
                  setSelectedPreset('steady'); // custom overrides preset
                }}
                aria-label="Cash Reserves"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-bold">
                <span className="text-white/60 uppercase">Monthly Burn</span>
                <span className="text-white font-mono font-bold">${(monthlyBurn/1000).toFixed(1)}k/mo</span>
              </div>
              <Slider
                min={5000}
                max={250000}
                step={5000}
                value={[monthlyBurn]}
                onValueChange={(val) => {
                  setMonthlyBurn(val[0]);
                  setSelectedPreset('steady');
                }}
                aria-label="Monthly Burn"
              />
            </div>
          </div>
        </Card>

        {/* CMO CARD */}
        <Card className="glass-card p-6 relative overflow-hidden border-[#FF5E36]/20 shadow-[0_0_20px_rgba(255,94,54,0.03)] hover:border-[#FF5E36]/40 transition-all group duration-300">
          <div className="absolute -right-4 -top-4 w-16 h-14 rounded-full bg-[#FF5E36]/5 flex items-center justify-center border border-[#FF5E36]/10 group-hover:scale-105 transition-transform">
            <Target size={18} className="text-[#FF5E36]" />
          </div>
          <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">CMO VITAL • ACQUISITION & FUNNEL</p>
          <div className="mt-3 space-y-1">
            <h3 className="text-2xl font-black text-white font-mono">${cac} CAC</h3>
            <p className="text-xs text-[#FF5E36]/90 font-bold font-mono">
              {leads.toLocaleString()} Leads • {conversionRate}% Conv • {ltvToCacRatio}x ROI
            </p>
          </div>
          <Badge variant={ltvToCacRatio >= 3 ? 'success' : ltvToCacRatio >= 1.5 ? 'warning' : 'destructive'} className="mt-4 text-[8px] font-black uppercase tracking-wider">
            +{newCustomersPerMonth} Cust/mo
          </Badge>

          {/* SSliders Drawer */}
          <div className="mt-6 pt-5 border-t border-white/5 space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-bold">
                <span className="text-white/60 uppercase">Customer Acquisition Cost (CAC)</span>
                <span className="text-white font-mono font-bold">${cac} USD</span>
              </div>
              <Slider
                min={10}
                max={500}
                step={5}
                value={[cac]}
                onValueChange={(val) => {
                  setCac(val[0]);
                  setSelectedPreset('steady');
                }}
                aria-label="Customer Acquisition Cost (CAC)"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-bold">
                <span className="text-white/60 uppercase">Monthly Pipeline Leads</span>
                <span className="text-white font-mono font-bold">{leads.toLocaleString()}</span>
              </div>
              <Slider
                min={100}
                max={10000}
                step={100}
                value={[leads]}
                onValueChange={(val) => {
                  setLeads(val[0]);
                  setSelectedPreset('steady');
                }}
                aria-label="Monthly Pipeline Leads"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-bold">
                <span className="text-white/60 uppercase">Lead Conversion Rate</span>
                <span className="text-white font-mono font-bold">{conversionRate}%</span>
              </div>
              <Slider
                min={0.1}
                max={15}
                step={0.1}
                value={[conversionRate]}
                onValueChange={(val) => {
                  setConversionRate(val[0]);
                  setSelectedPreset('steady');
                }}
                aria-label="Lead Conversion Rate"
              />
            </div>
          </div>
        </Card>

        {/* CHRO CARD */}
        <Card className="glass-card p-6 relative overflow-hidden border-[#00FF87]/20 shadow-[0_0_20px_rgba(0,255,135,0.03)] hover:border-[#00FF87]/40 transition-all group duration-300">
          <div className="absolute -right-4 -top-4 w-16 h-14 rounded-full bg-[#00FF87]/5 flex items-center justify-center border border-[#00FF87]/10 group-hover:scale-105 transition-transform">
            <Users size={18} className="text-[#00FF87]" />
          </div>
          <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">CHRO VITAL • TEAM & ATTRITION</p>
          <div className="mt-3 space-y-1">
            <h3 className="text-2xl font-black text-white font-mono">{headcount} FTEs</h3>
            <p className="text-xs text-[#00FF87]/90 font-bold font-mono">
              eNPS: {eNps}/100 • {attritionRate}% Attrition
            </p>
          </div>
          <Badge variant={eNps >= 70 ? 'success' : eNps >= 40 ? 'warning' : 'destructive'} className="mt-4 text-[8px] font-black uppercase tracking-wider">
            Avg Base: ${(avgSalary/1000).toFixed(0)}k/yr
          </Badge>

          {/* SSliders Drawer */}
          <div className="mt-6 pt-5 border-t border-white/5 space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-bold">
                <span className="text-white/60 uppercase">Total Headcount</span>
                <span className="text-white font-mono font-bold">{headcount} Employees</span>
              </div>
              <Slider
                min={1}
                max={100}
                step={1}
                value={[headcount]}
                onValueChange={(val) => {
                  setHeadcount(val[0]);
                  setSelectedPreset('steady');
                }}
                aria-label="Total Headcount"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-bold">
                <span className="text-white/60 uppercase">Annualized Attrition</span>
                <span className="text-white font-mono font-bold">{attritionRate}%</span>
              </div>
              <Slider
                min={0}
                max={30}
                step={0.5}
                value={[attritionRate]}
                onValueChange={(val) => {
                  setAttritionRate(val[0]);
                  setSelectedPreset('steady');
                }}
                aria-label="Annualized Attrition Rate"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-bold">
                <span className="text-white/60 uppercase">Employee Morale (eNPS)</span>
                <span className="text-white font-mono font-bold">{eNps} NPS</span>
              </div>
              <Slider
                min={-100}
                max={100}
                step={1}
                value={[eNps]}
                onValueChange={(val) => {
                  setENps(val[0]);
                  setSelectedPreset('steady');
                }}
                aria-label="Employee Morale (eNPS)"
              />
            </div>
          </div>
        </Card>

        {/* COO CARD */}
        <Card className="glass-card p-6 relative overflow-hidden border-[#9D4EDD]/20 shadow-[0_0_20px_rgba(157,78,221,0.03)] hover:border-[#9D4EDD]/40 transition-all group duration-300">
          <div className="absolute -right-4 -top-4 w-16 h-14 rounded-full bg-[#9D4EDD]/5 flex items-center justify-center border border-[#9D4EDD]/10 group-hover:scale-105 transition-transform">
            <Activity size={18} className="text-[#9D4EDD]" />
          </div>
          <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">COO VITAL • METRICS & OPERATIONS</p>
          <div className="mt-3 space-y-1">
            <h3 className="text-2xl font-black text-white font-mono">{projectVelocity}% Vel</h3>
            <p className="text-xs text-[#9D4EDD]/90 font-bold font-mono">
              {milestoneCompletion}% Sprints • {activeProjects} Streams Active
            </p>
          </div>
          <Badge variant={projectVelocity >= 80 ? 'success' : projectVelocity >= 60 ? 'warning' : 'destructive'} className="mt-4 text-[8px] font-black uppercase tracking-wider">
            {ticketsClosed} resolved helpdesk/mo
          </Badge>

          {/* SSliders Drawer */}
          <div className="mt-6 pt-5 border-t border-white/5 space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-bold">
                <span className="text-white/60 uppercase">Engineering Sprint Velocity</span>
                <span className="text-white font-mono font-bold">{projectVelocity}%</span>
              </div>
              <Slider
                min={30}
                max={100}
                step={1}
                value={[projectVelocity]}
                onValueChange={(val) => {
                  setProjectVelocity(val[0]);
                  setSelectedPreset('steady');
                }}
                aria-label="Engineering Sprint Velocity"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-bold">
                <span className="text-white/60 uppercase">Milestone Completion</span>
                <span className="text-white font-mono font-bold">{milestoneCompletion}%</span>
              </div>
              <Slider
                min={20}
                max={100}
                step={1}
                value={[milestoneCompletion]}
                onValueChange={(val) => {
                  setMilestoneCompletion(val[0]);
                  setSelectedPreset('steady');
                }}
                aria-label="Milestone Completion"
              />
            </div>
          </div>
        </Card>
      </div>

      {/* --- AI INVESTOR REPORT & INTERACTIVE Q&A --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: REPORT GENERATOR */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="glass-card p-6 border-white/10 relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-5">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] text-[#00E5FF] font-black uppercase tracking-widest">
                  <FileText size={12} /> Real-time Report Architect
                </div>
                <CardTitle className="text-base font-bold text-white uppercase tracking-wider">AI Investor Update Generator</CardTitle>
                <CardDescription className="text-xs text-white/40">Compiles the live dashboard parameters into professional, copy-ready investor letters.</CardDescription>
              </div>

              {/* Tone selection */}
              <div className="flex items-center gap-2">
                <label htmlFor="reportToneSelect" className="text-[10px] font-black uppercase text-white/60 shrink-0">Report Tone:</label>
                <select
                  id="reportToneSelect"
                  value={reportTone}
                  onChange={(e: any) => setReportTone(e.target.value)}
                  className="text-[10px] font-bold h-8 rounded border border-white/10 bg-black/40 text-white px-2.5 outline-none uppercase tracking-wider"
                >
                  <option value="institutional">Direct & Institutional</option>
                  <option value="bullish">Bullish & Visionary</option>
                  <option value="pragmatic">Pragmatic & Conservative</option>
                  <option value="casual">Casual & Conversational</option>
                </select>
              </div>
            </div>

            {/* TAB SELECTOR: PREVIEW VS RAW MARKDOWN */}
            <div className="mt-5 space-y-4">
              <div className="flex justify-between items-center">
                <Tabs value={reportActiveTab} onValueChange={(val: any) => setReportActiveTab(val)} className="w-48">
                  <TabsList className="grid grid-cols-2 bg-black/20 h-8">
                    <TabsTrigger value="preview" className="text-[9px] font-bold uppercase tracking-wider py-1.5">Preview</TabsTrigger>
                    <TabsTrigger value="markdown" className="text-[9px] font-bold uppercase tracking-wider py-1.5">Markdown</TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="flex gap-2">
                  <Button
                    onClick={handleCopyReport}
                    variant="outline"
                    className="h-8 text-[9px] font-bold uppercase tracking-wider border-white/10 hover:bg-white/5 px-3.5 gap-1.5"
                  >
                    {reportCopied ? <Check size={11} className="text-[#00FF87]" /> : <Copy size={11} />}
                    {reportCopied ? "Copied!" : "Copy Update"}
                  </Button>
                  <Button
                    onClick={handleDownloadReport}
                    variant="outline"
                    className="h-8 text-[9px] font-bold uppercase tracking-wider border-white/10 hover:bg-white/5 px-3.5 gap-1.5"
                  >
                    <Download size={11} />
                    Download
                  </Button>
                </div>
              </div>

              {/* Display Box */}
              {reportActiveTab === 'markdown' ? (
                <div className="bg-black/30 border border-white/5 rounded-xl p-5 font-mono text-[10px] leading-relaxed overflow-x-auto text-white/80 h-[480px] select-all whitespace-pre">
                  {generateInvestorUpdateText(activeMetrics, reportTone)}
                </div>
              ) : (
                <div className="bg-black/20 border border-white/5 rounded-xl p-6 h-[480px] overflow-y-auto space-y-6 text-xs text-white/80 scrollbar">
                  <div className="border-b border-white/5 pb-4 space-y-1">
                    <h3 className="text-sm font-black text-white tracking-widest uppercase">CONFIDENTIAL CORPORATE BRIEFING</h3>
                    <div className="flex gap-4 text-[9px] text-white/40 uppercase tracking-widest font-black">
                      <span>Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                      <span>Security: Restrict-Board Only</span>
                      <span>Tone: {reportTone}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-white font-extrabold uppercase tracking-wider text-[10px] text-[#00E5FF]">1. Executive Summary</h4>
                    <p className="leading-relaxed text-white/70 italic text-[11px] font-medium">
                      {reportTone === 'bullish' && `We are excited to deliver a strong corporate update indicating rapid market expansion and high product engineering momentum. With a robust customer acquisition pipeline pulling in ${leads.toLocaleString()} monthly opportunities at an optimized $${cac} CAC, our business is scaling efficiently. Operational pipelines are running at an elite ${projectVelocity}% delivery velocity, positioning us to capture significant market share.`}
                      {reportTone === 'pragmatic' && `Our operational strategy continues to balance disciplined capital allocation with steady commercial progress. We are tightly monitoring unit economics with an LTV-to-CAC of ${ltvToCacRatio}x and maintaining high organizational alignment. Backed by a strong employee Net Promoter Score of ${eNps}, we are scaling carefully while guarding stability.`}
                      {reportTone === 'casual' && `Hey team! Here is the latest scoop from the command cockpit. We are hitting amazing strides—our project velocity is hovering at a fantastic ${projectVelocity}%, and our team morale is absolutely off the charts with a solid ${eNps} eNPS. On the growth front, we are bringing in ${newCustomersPerMonth} new customers every month. Let\'s check out the details!`}
                      {reportTone === 'institutional' && `This document provides a highly structured consolidated overview of current corporate operations across all primary divisions: Finance, Marketing, Human Resources, and Operations. Key metrics include a solid cash reserve of $${cashBalance.toLocaleString()} and stable project delivery velocities of ${projectVelocity}%.`}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div className="p-4 bg-white/2 rounded-xl border border-white/5 space-y-2">
                      <div className="text-[9px] font-black text-[#00E5FF] uppercase tracking-wider">CFO FINANCIAL RESERVES</div>
                      <div className="space-y-1 text-[11px] font-semibold">
                        <div className="flex justify-between"><span>Cash Reserves:</span> <span className="text-white font-mono font-bold">${cashBalance.toLocaleString()}</span></div>
                        <div className="flex justify-between"><span>Monthly Burn Rate:</span> <span className="text-white font-mono">${monthlyBurn.toLocaleString()}</span></div>
                        <div className="flex justify-between text-xs pt-1 border-t border-white/5">
                          <span className="font-extrabold text-white">Sovereign Runway:</span> 
                          <span className={`font-mono font-black ${runwayMonths < 6 ? 'text-[#FF5E36]' : 'text-[#00FF87]'}`}>{runwayMonths} Months</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-white/2 rounded-xl border border-white/5 space-y-2">
                      <div className="text-[9px] font-black text-[#FF5E36] uppercase tracking-wider">CMO INBOUND FUNNEL</div>
                      <div className="space-y-1 text-[11px] font-semibold">
                        <div className="flex justify-between"><span>Inbound Leads:</span> <span className="text-white font-mono">{leads.toLocaleString()}/mo</span></div>
                        <div className="flex justify-between"><span>Funnel Conversion:</span> <span className="text-white font-mono">{conversionRate}%</span></div>
                        <div className="flex justify-between"><span>LTV / CAC Ratio:</span> <span className="text-white font-mono">{ltvToCacRatio}x</span></div>
                        <div className="flex justify-between text-xs pt-1 border-t border-white/5">
                          <span className="font-extrabold text-white">New Cust/mo:</span> 
                          <span className="text-[#FF5E36] font-mono font-black">+{newCustomersPerMonth} FTE</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-white/2 rounded-xl border border-white/5 space-y-2">
                      <div className="text-[9px] font-black text-[#00FF87] uppercase tracking-wider">CHRO HR & TALENT OPERATIONS</div>
                      <div className="space-y-1 text-[11px] font-semibold">
                        <div className="flex justify-between"><span>Headcount Size:</span> <span className="text-white font-mono">{headcount} Employees</span></div>
                        <div className="flex justify-between"><span>Annual Attrition Rate:</span> <span className="text-white font-mono">{attritionRate}%</span></div>
                        <div className="flex justify-between"><span>eNPS Score:</span> <span className="text-white font-mono">{eNps} / 100</span></div>
                        <div className="flex justify-between text-xs pt-1 border-t border-white/5">
                          <span className="font-extrabold text-white">Avg Salary Band:</span> 
                          <span className="text-[#00FF87] font-mono font-black">${avgSalary.toLocaleString()}/yr</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-white/2 rounded-xl border border-white/5 space-y-2">
                      <div className="text-[9px] font-black text-[#9D4EDD] uppercase tracking-wider">COO PRODUCT DELIVERIES</div>
                      <div className="space-y-1 text-[11px] font-semibold">
                        <div className="flex justify-between"><span>Sprint Velocity:</span> <span className="text-white font-mono">{projectVelocity}%</span></div>
                        <div className="flex justify-between"><span>Milestone Completion:</span> <span className="text-white font-mono">{milestoneCompletion}%</span></div>
                        <div className="flex justify-between"><span>Active Streams:</span> <span className="text-white font-mono">{activeProjects} Projects</span></div>
                        <div className="flex justify-between text-xs pt-1 border-t border-white/5">
                          <span className="font-extrabold text-white">Tickets Resolved:</span> 
                          <span className="text-[#9D4EDD] font-mono font-black">{ticketsClosed} / month</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-white/5">
                    <h4 className="text-white font-extrabold uppercase tracking-wider text-[10px] text-[#00FF87]">2. Strategic Outlook & Requests</h4>
                    <p className="leading-relaxed text-white/70 text-[11px] font-medium">
                      {runwayMonths < 6 ? (
                        reportTone === 'bullish' ? "FUNDRAISING INITIATIVE: Given our hyper-growth metrics and massive inbound conversions, we are raising a $2M round. Let\'s scale these pipelines and double engineering resources immediately." :
                        reportTone === 'pragmatic' ? "LIQUIDITY PRESERVATION: Management is focusing on strict cash preservation, extending our Runway buffer while securing flat/bridge capital of $1.5M." :
                        reportTone === 'casual' ? "WE ARE RAISING: With under 6 months of runway in our tank, we are actively looking for friendly, strategic investment angels. Send any warm leads our way!" :
                        "FUNDRAISING MANDATE: Consolidating financial pitch structures to launch a $1.5M Bridge round in Q3. Designed to secure cash reserves ahead of immediate liquidity compressions."
                      ) : (
                        reportTone === 'bullish' ? "SCALING INITIATIVE: With plenty of runway months at our back, we are scaling outreach programs, upgrading infrastructure, and locking down market-wide dominance." :
                        reportTone === 'pragmatic' ? "STABILIZATION DIRECTIVE: With a secure buffer in place, we are retaining strict efficiency targets, ensuring LTV-to-CAC values scale steadily." :
                        reportTone === 'casual' ? "STRATEGIC EXPANSION: With heaps of months of cash runway secured, we have a long green field to keep building, shipping cool features, and laughing together!" :
                        "CAPITAL ALLOCATION MANDATE: Operating cash flows are deemed fully secure. Treasury assets will remain focused on structural core developments and engineering milestones."
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN: INVESTOR QA SIMULATOR */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="glass-card p-6 border-white/10 relative">
            <div className="space-y-1 border-b border-white/5 pb-5">
              <div className="flex items-center gap-1.5 text-[10px] text-[#9D4EDD] font-black uppercase tracking-widest">
                <Sparkles size={12} /> Interactive Rehearsals
              </div>
              <CardTitle className="text-base font-bold text-white uppercase tracking-wider">Investor Q&A Simulator</CardTitle>
              <CardDescription className="text-xs text-white/40">Practice pitch defenses against custom partner personas and receive detailed score assessments.</CardDescription>
            </div>

            {/* PERSONA CHIPS */}
            <div className="mt-5 space-y-2">
              <label className="text-[9px] font-black uppercase text-white/40 tracking-wider">Select Partner Persona:</label>
              <div className="grid grid-cols-2 gap-2">
                {INVESTOR_PERSONAS.map((p) => {
                  const active = p.id === selectedPersonaId;
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        setSelectedPersonaId(p.id);
                        setSelectedQuestionIdx(0);
                        setEvaluation(null);
                        setUserResponse('');
                      }}
                      className={`flex items-center gap-2.5 p-2 rounded-xl text-left border text-xs transition-all ${
                        active
                          ? 'border-[#9D4EDD] bg-[#9D4EDD]/10 text-white font-bold'
                          : 'border-white/5 bg-white/2 hover:border-white/20 text-white/60 hover:text-white'
                      }`}
                      aria-pressed={active}
                    >
                      <div className={`h-7 w-7 rounded-lg flex items-center justify-center font-bold text-[10px] font-mono shrink-0 ${
                        active ? 'bg-[#9D4EDD] text-white' : 'bg-white/10 text-white/60'
                      }`}>
                        {p.avatar}
                      </div>
                      <div className="truncate">
                        <p className="leading-none text-[10px]">{p.name}</p>
                        <p className="text-[8px] text-white/40 truncate mt-0.5">{p.title}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* PERSONA BIO DETAILS */}
            <div className="mt-4 p-3.5 bg-white/2 rounded-xl border border-white/5 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[8px] font-black uppercase text-[#9D4EDD] tracking-widest">PARTNER SPECIALTY</span>
                <Badge variant="outline" className="text-[7px] font-black uppercase px-1.5 border-[#9D4EDD]/20 text-[#9D4EDD] bg-[#9D4EDD]/5">
                  {selectedPersona.focus}
                </Badge>
              </div>
              <p className="text-[10px] text-white/70 leading-normal font-medium">{selectedPersona.bio}</p>
            </div>

            {/* QUESTION PICKER */}
            <div className="mt-5 space-y-2">
              <label className="text-[9px] font-black uppercase text-white/40 tracking-wider">Select Investor Question:</label>
              <div className="space-y-1.5">
                {selectedPersona.questions.map((q, idx) => {
                  const active = idx === selectedQuestionIdx;
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedQuestionIdx(idx);
                        setEvaluation(null);
                        setUserResponse('');
                      }}
                      className={`w-full p-2.5 rounded-lg text-left text-[10px] leading-snug font-semibold border flex gap-2 items-start transition-all ${
                        active
                          ? 'border-white/20 bg-white/5 text-white'
                          : 'border-white/5 bg-black/10 text-white/40 hover:text-white/60 hover:border-white/10'
                      }`}
                      aria-pressed={active}
                    >
                      <ChevronRight size={10} className={`shrink-0 mt-0.5 ${active ? 'text-[#9D4EDD]' : 'text-white/20'}`} />
                      <span>{q}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ACTIVE QUESTION BOX */}
            <div className="mt-5 p-4 rounded-xl border border-dashed border-white/10 bg-[#9D4EDD]/3 flex gap-3.5 items-start">
              <div className="h-8 w-8 rounded-full bg-[#9D4EDD]/10 border border-[#9D4EDD]/20 flex items-center justify-center shrink-0">
                <span className="text-[#9D4EDD] text-xs">💬</span>
              </div>
              <div className="space-y-1">
                <p className="text-[8px] font-black uppercase text-[#9D4EDD] tracking-widest">ACTIVE PITCH INQUIRY</p>
                <p className="text-xs font-bold leading-normal text-white">{activeQuestion}</p>
              </div>
            </div>

            {/* INTERACTIVE TEXT FIELD */}
            <div className="mt-5 space-y-2">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-white/60">
                <label htmlFor="user-rehearsal-response">Draft Your Rehearsal Answer:</label>
                <span>{userResponse.length} Chars</span>
              </div>
              <textarea
                id="user-rehearsal-response"
                value={userResponse}
                onChange={(e) => setUserResponse(e.target.value)}
                placeholder="Type your strategic defense here... Tip: Mention your actual metrics (e.g. cash, burn rate, project velocity, or eNPS score) to maximize your score!"
                className="w-full h-32 rounded-xl bg-black/40 border border-white/10 hover:border-white/20 focus:border-[#9D4EDD] focus:ring-1 focus:ring-[#9D4EDD] p-3 text-xs text-white placeholder:text-white/20 outline-none resize-none transition-all leading-relaxed"
              />
              <Button
                onClick={handleEvaluateResponse}
                disabled={isEvaluating || !userResponse.trim()}
                className="w-full h-10 text-xs font-bold gap-1.5 uppercase tracking-wider bg-gradient-to-r from-[#9D4EDD] to-[#00E5FF] hover:opacity-90 border-0"
              >
                {isEvaluating ? (
                  <>
                    <Clock size={12} className="animate-spin" /> Evaluating defense...
                  </>
                ) : (
                  <>
                    <Send size={12} /> Submit Response & Rehearse
                  </>
                )}
              </Button>
            </div>

            {/* EVALUATION RESULTS DRAWBOX */}
            {evaluation && (
              <div className="mt-6 border border-white/10 bg-black/40 rounded-xl p-5 space-y-4 animate-in fade-in slide-in-from-top-3 duration-200">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div className="space-y-0.5">
                    <p className="text-[8px] font-black uppercase text-white/40 tracking-widest">DEFENSE EVALUATION</p>
                    <h5 className="text-sm font-black text-white">VANCE PERFORMANCE SCORE</h5>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black font-mono text-[#00E5FF]">{evaluation.score}</span>
                    <span className="text-white/40 text-[9px] font-bold">/ 100</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-white/40 font-black uppercase tracking-wider">VERDICT STATUS:</span>
                  <Badge variant={
                    evaluation.verdict === 'Excellent' ? 'success' :
                    evaluation.verdict === 'Strong' ? 'success' :
                    evaluation.verdict === 'Needs Refinement' ? 'warning' : 'destructive'
                  } className="text-[8px] font-black uppercase tracking-wider py-0.5">
                    {evaluation.verdict}
                  </Badge>
                </div>

                {/* Strengths & Critique */}
                <div className="space-y-1 text-[11px] font-medium leading-normal">
                  <div className="text-[#00FF87] font-black uppercase text-[8px] tracking-wider flex items-center gap-1">
                    <CheckCircle2 size={10} /> CRITIQUE STRENGTHS
                  </div>
                  <p className="text-white/70 pl-3.5 border-l border-[#00FF87]/20">{evaluation.critique}</p>
                </div>

                {/* Logical Gaps */}
                {evaluation.gaps && (
                  <div className="space-y-1 text-[11px] font-medium leading-normal">
                    <div className="text-[#FF5E36] font-black uppercase text-[8px] tracking-wider flex items-center gap-1">
                      <AlertCircle size={10} /> VULNERABILITY GAPS
                    </div>
                    <p className="text-white/70 pl-3.5 border-l border-[#FF5E36]/20">{evaluation.gaps}</p>
                  </div>
                )}

                {/* Professional Answer Alternative */}
                <div className="space-y-1 text-[11px] font-medium leading-normal pt-2 border-t border-white/5">
                  <div className="text-[#00E5FF] font-black uppercase text-[8px] tracking-wider flex items-center gap-1">
                    <Sparkles size={10} /> DRAFTED PROFESSIONAL OUTLINE
                  </div>
                  <p className="text-white/80 bg-white/2 p-3.5 rounded-xl border border-white/5 text-[10px] leading-relaxed italic font-semibold select-all">
                    "{evaluation.suggestedProAnswer}"
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AIBoardroom;
