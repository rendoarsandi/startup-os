import { BoomerangVideoBg } from './BoomerangVideoBg';
import { Sparkles, ShieldCheck, Cpu } from 'lucide-react';

const BG_VIDEO = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260511_131941_d136af49-e243-493a-be14-6ff3f24e09e6.mp4';

export function LandingPage() {

  const roadmapItems = [
    {
      phase: "Phase 1: CFO Module",
      status: "Active Beta",
      description: "Real-time runway analytics, live SaaS valuation modelers, Plaid integration, and scenario calculators. Replaces standard $5k/mo fractional CFOs with continuous ledger tracking.",
      points: ["Burn Rate Projections", "SaaS Economics Model", "Scenario Planner"]
    },
    {
      phase: "Phase 2: CMO & Growth Agent",
      status: "Q3 2026",
      description: "Autonomous funnel analysis, marketing brainstorm models, programmatic display buying, and ad creative optimization engines. Synchronizes advertising spend directly with runway data.",
      points: ["Funnel Analysis", "Creative Strategist", "Programmatic Ad Buyer"]
    },
    {
      phase: "Phase 3: CHRO & Sourcing Orchestrator",
      status: "Q4 2026",
      description: "Hiring equity planner, contract workflow checks, sovereign health system mandates, and candidate profiling. Handles legal compliance and talent pipeline automations.",
      points: ["Hiring Equity Planner", "Compliance Checker", "Workflow Steward"]
    },
    {
      phase: "Phase 4: COO Multi-Agent Mesh",
      status: "Q1 2027",
      description: "Comprehensive multi-agent boardroom simulation, real-time verifiable investor reporting, and automated cap table governance. Absolute automation of cross-department operations.",
      points: ["AIBoardroom Simulation", "Verifiable Investor Ledger", "Lean Capacity Planner"]
    }
  ];

  return (
    <div className="relative min-h-screen bg-black text-[#E1E0CC] font-body selection:bg-[#DEDBC8] selection:text-black overflow-x-hidden">
      {/* Decorative Noise Background */}
      <div className="absolute inset-0 bg-noise opacity-[0.02] pointer-events-none z-50" />
      
      {/* Hero Section Container */}
      <header className="relative w-full flex flex-col overflow-hidden">
        {/* Background Video */}
        <div className="absolute inset-0 z-0">
          <BoomerangVideoBg src={BG_VIDEO} className="absolute inset-0 w-full h-full" />
          {/* Subtle Dark Radial Vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/70" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-black/20 to-black" />
        </div>

        {/* Centered Hero Body */}
        <div className="relative z-10 flex flex-col justify-center items-center text-center px-4 max-w-5xl mx-auto pt-24 pb-20">
          {/* Centered Brand Logo */}
          <div className="flex items-center gap-2.5 mb-8 animate-fade-in">
            <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center p-1 border border-white/15">
              <img src="/logo.png" alt="Startup OS Logo" className="w-full h-full object-contain filter invert opacity-90" />
            </div>
            <span className="text-xl font-serif tracking-widest text-[#DEDBC8] font-bold">
              STARTUP OS<sup className="text-[9px] font-sans font-medium tracking-normal ml-0.5 opacity-60">TM</sup>
            </span>
          </div>

          {/* Tagline Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-6 animate-fade-in">
            <Sparkles className="w-3.5 h-3.5 text-[#DEDBC8] animate-pulse" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[#DEDBC8]/90">
              Autonomous C-Suite Command Engine
            </span>
          </div>

          {/* Hero Main Header */}
          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl tracking-tight leading-[0.9] text-[#E1E0CC] mb-8 font-normal max-w-4xl animate-fade-up">
            Re-engineering the <br />
            <span className="text-[#DEDBC8] italic font-serif">Executive Layer</span> of Startups
          </h1>

          {/* Hero Subtitle */}
          <p className="text-[#E1E0CC]/70 text-sm md:text-base lg:text-lg max-w-xl leading-relaxed mb-10 font-normal tracking-wide animate-fade-up delay-200">
            Startup OS displaces disjointed agency services and fractional executives with a unified, autonomous network of AI C-suite agents running on real-time transaction ledgers.
          </p>

          {/* Coming Soon Call to Action */}
          <div className="w-full max-w-md animate-fade-up delay-300">
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#DEDBC8]/10 border border-[#DEDBC8]/20 backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-[#DEDBC8] animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest text-[#DEDBC8]">
                Coming Soon
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="relative z-10 bg-black pt-12 pb-24 space-y-24">
        
        {/* Distribution Vision Section */}
        <section id="distribution" className="max-w-7xl mx-auto px-6 md:px-12 space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#DEDBC8] flex items-center justify-center gap-2">
              <span className="h-0.5 w-6 bg-[#DEDBC8]" />
              The Distribution Vision
              <span className="h-0.5 w-6 bg-[#DEDBC8]" />
            </div>
            <h2 className="font-serif text-4xl md:text-6xl text-[#E1E0CC] font-normal leading-tight">
              A Unified C-Suite, <span className="italic text-[#DEDBC8]">Autonomous By Design</span>
            </h2>
            <p className="text-[#E1E0CC]/70 text-sm leading-relaxed max-w-xl mx-auto">
              Startups spend billions on fragmented agency contracts and fractional executives. Startup OS replaces high latency and overhead with continuous, cross-agent execution running on real-time transaction ledgers.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch">
            {/* Left Card: Traditional Model */}
            <div className="liquid-glass-strong rounded-2xl p-8 border border-red-500/10 bg-red-950/5 flex flex-col justify-between space-y-8">
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-red-500/10 pb-4">
                  <span className="text-xs font-bold uppercase tracking-widest text-red-400">Traditional Fractional C-Suite</span>
                  <span className="text-[9px] bg-red-500/10 text-red-400 border border-red-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-semibold">High Latency</span>
                </div>
                <p className="text-xs text-[#E1E0CC]/60 leading-relaxed font-normal">
                  Decisions are bottlenecked by manual spreadsheet modeling, monthly reports, and disjointed communication across isolated department silos.
                </p>
                <ul className="space-y-3.5 text-xs text-[#E1E0CC]/75 pt-2">
                  <li className="flex items-start gap-2.5">
                    <span className="text-red-400 font-bold mt-0.5">✕</span>
                    <span><strong>High Retainer Fees:</strong> Standard agencies cost $5,000–$15,000/mo per role with no guarantee of alignment.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-red-400 font-bold mt-0.5">✕</span>
                    <span><strong>Manual Hand-Offs:</strong> CFO projections don't dynamically adjust CMO ad-spend budgets or CHRO hiring targets.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-red-400 font-bold mt-0.5">✕</span>
                    <span><strong>Outdated Metrics:</strong> Runway calculations are retroactive, compiled weeks after transactions occur.</span>
                  </li>
                </ul>
              </div>
              <div className="pt-6 border-t border-red-500/10 flex justify-between items-center text-[10px] text-[#E1E0CC]/55 font-bold uppercase tracking-widest">
                <span>Avg. Retainer Overhead</span>
                <span className="text-red-400">$25,000 / mo</span>
              </div>
            </div>

            {/* Right Card: Startup OS Model */}
            <div className="liquid-glass-strong rounded-2xl p-8 border border-[#DEDBC8]/30 bg-[#DEDBC8]/5 flex flex-col justify-between space-y-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 h-32 w-32 bg-[#DEDBC8]/5 blur-xl rounded-full pointer-events-none" />
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-[#DEDBC8]/20 pb-4">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#DEDBC8]">Startup OS Autonomous ERP</span>
                  <span className="text-[9px] bg-[#DEDBC8]/10 text-[#DEDBC8] border border-[#DEDBC8]/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-semibold flex items-center gap-1.5">
                    Continuous <Cpu className="w-3 h-3 animate-spin" />
                  </span>
                </div>
                <p className="text-xs text-[#E1E0CC]/80 leading-relaxed font-normal">
                  A unified event-driven system connecting bank transactions directly to growth channels and recruiting pipelines. Projections update automatically in milliseconds.
                </p>
                <ul className="space-y-3.5 text-xs text-[#E1E0CC] pt-2">
                  <li className="flex items-start gap-2.5">
                    <span className="text-[#DEDBC8] font-bold mt-0.5">✓</span>
                    <span><strong>Zero-Latency Sync:</strong> If the CFO Agent detects a drop in runway, it instantly tells the CMO to scale back ad-spend and pauses CHRO job listings.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-[#DEDBC8] font-bold mt-0.5">✓</span>
                    <span><strong>Ledger-First Grounding:</strong> No hallucinated financials. All projections are derived mathematically from raw ledger logs.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-[#DEDBC8] font-bold mt-0.5">✓</span>
                    <span><strong>Sovereign Sandboxing:</strong> Sensitive payroll details and compliance guidelines are kept secure in isolated agent execution nodes.</span>
                  </li>
                </ul>
              </div>
              <div className="pt-6 border-t border-[#DEDBC8]/20 flex justify-between items-center text-[10px] text-[#E1E0CC]/75 font-bold uppercase tracking-widest">
                <span>Direct Overhead Impact</span>
                <span className="text-emerald-400 font-extrabold">&gt; 98% Cost Reduction</span>
              </div>
            </div>
          </div>

          {/* Three Pillars breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
            <div className="p-6 rounded-xl border border-white/5 bg-[#101010]/20 backdrop-blur-md space-y-3">
              <div className="h-9 w-9 rounded-lg bg-[#DEDBC8]/10 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-[#DEDBC8]" />
              </div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-[#DEDBC8]">1. Capital (CFO)</h4>
              <p className="text-[#E1E0CC]/60 text-xs leading-relaxed">
                Connects to Plaid for real-time burn projections, SaaS valuation metrics, runway tracking, and automated scenario budgeting.
              </p>
            </div>
            <div className="p-6 rounded-xl border border-white/5 bg-[#101010]/20 backdrop-blur-md space-y-3">
              <div className="h-9 w-9 rounded-lg bg-[#DEDBC8]/10 flex items-center justify-center">
                <Cpu className="w-5 h-5 text-[#DEDBC8]" />
              </div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-[#DEDBC8]">2. Growth (CMO)</h4>
              <p className="text-[#E1E0CC]/60 text-xs leading-relaxed">
                Monitors ad conversion performance, tests creative copy variants, and optimizes programmatic display budgets in line with cash flow.
              </p>
            </div>
            <div className="p-6 rounded-xl border border-white/5 bg-[#101010]/20 backdrop-blur-md space-y-3">
              <div className="h-9 w-9 rounded-lg bg-[#DEDBC8]/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[#DEDBC8]" />
              </div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-[#DEDBC8]">3. People (CHRO)</h4>
              <p className="text-[#E1E0CC]/60 text-xs leading-relaxed">
                Coordinates recruitment pipelines, models hiring equity splits, and audits regulatory tax/health mandates automatically.
              </p>
            </div>
          </div>
        </section>

        {/* Product Roadmap Section */}
        <section id="roadmap" className="max-w-7xl mx-auto px-6 md:px-12 space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#DEDBC8] flex items-center justify-center gap-2">
              <span className="h-0.5 w-6 bg-[#DEDBC8]" />
              The Development Lifecycle
              <span className="h-0.5 w-6 bg-[#DEDBC8]" />
            </div>
            <h2 className="font-serif text-4xl md:text-6xl text-[#E1E0CC] font-normal leading-tight">
              Product Roadmap
            </h2>
            <p className="text-[#E1E0CC]/70 text-sm leading-relaxed max-w-xl mx-auto">
              Our phased releases establish deep integrations for each functional pillar, culminating in a fully federated, autonomous C-suite courtroom simulation.
            </p>
          </div>

          {/* Elaborated Roadmap Timeline */}
          <div className="relative max-w-4xl mx-auto px-4 md:px-0">
            {/* Vertical timeline center line */}
            <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px bg-white/10 -translate-x-1/2" />

            <div className="space-y-12">
              {roadmapItems.map((item, index) => {
                const isEven = index % 2 === 0;
                return (
                  <div key={index} className="relative flex flex-col md:flex-row items-stretch w-full animate-fade-in">
                    {/* Circle Pin */}
                    <div className="absolute left-2 md:left-1/2 top-6 md:top-1/2 -translate-x-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full bg-black border-2 border-[#DEDBC8] z-20 flex items-center justify-center shadow-lg shadow-black">
                      <div className="h-1.5 w-1.5 rounded-full bg-[#DEDBC8]" />
                    </div>

                    {/* Left Column (Desktop Only alignment) */}
                    <div className={`w-full md:w-1/2 pl-8 md:pl-0 md:pr-12 flex flex-col justify-center ${isEven ? 'md:items-end md:text-right' : 'md:order-last md:items-start md:text-left md:pl-12'}`}>
                      <div className="liquid-glass rounded-2xl p-6 border border-white/5 hover:border-white/10 bg-[#101010]/30 hover:bg-[#101010]/50 transition-all space-y-3.5 w-full">
                        <div className={`flex justify-between items-center gap-4 ${isEven ? 'md:flex-row-reverse' : ''}`}>
                          <span className="text-[10px] uppercase font-bold tracking-widest text-[#DEDBC8]">{item.phase}</span>
                          <span className={`text-[9px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full border ${
                            item.status === 'Active Beta' 
                              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' 
                              : 'border-white/10 bg-white/5 text-[#E1E0CC]/60'
                          }`}>
                            {item.status}
                          </span>
                        </div>
                        <h3 className="text-lg font-serif text-[#E1E0CC] font-normal">{item.phase.split(': ')[1]}</h3>
                        <p className="text-xs text-[#E1E0CC]/60 leading-relaxed font-normal">
                          {item.description}
                        </p>
                        <div className={`flex flex-wrap gap-1.5 pt-2 border-t border-white/5 ${isEven ? 'md:justify-end' : 'md:justify-start'}`}>
                          {item.points.map((pt, pIdx) => (
                            <span key={pIdx} className="text-[9px] font-bold uppercase tracking-wider text-[#E1E0CC]/40 bg-white/5 px-2 py-0.5 rounded">
                              {pt}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Spacing spacer column for desktop layout balance */}
                    <div className="hidden md:block w-1/2" />
                  </div>
                );
              })}
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="relative z-10 bg-black border-t border-white/5 py-12 text-center text-[10px] text-[#E1E0CC]/40 uppercase tracking-widest font-bold">
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2.5">
            <span className="text-[#DEDBC8]">STARTUP OS</span> &bull; <span>Autonomous C-Suite</span>
          </div>
          <div>
            &copy; {new Date().getFullYear()} Startup OS Inc. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <a href="#distribution" className="hover:text-[#DEDBC8] transition-colors">Privacy</a>
            <span>&bull;</span>
            <a href="#roadmap" className="hover:text-[#DEDBC8] transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
