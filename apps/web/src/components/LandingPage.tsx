import { useState } from 'react';
import { BoomerangVideoBg } from './BoomerangVideoBg';
import { Sparkles, ArrowRight, ShieldCheck, Cpu, ArrowUpRight, Check, Send } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog';

const BG_VIDEO = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260511_131941_d136af49-e243-493a-be14-6ff3f24e09e6.mp4';

export function LandingPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isDemoOpen, setIsDemoOpen] = useState(false);

  const handleWaitlistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
    setTimeout(() => {
      setEmail('');
      setSubmitted(false);
    }, 4000);
  };

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
      <header className="relative w-full min-h-screen flex flex-col justify-between overflow-hidden">
        {/* Background Video */}
        <div className="absolute inset-0 z-0">
          <BoomerangVideoBg src={BG_VIDEO} className="absolute inset-0 w-full h-full" />
          {/* Subtle Dark Radial Vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/70" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-black/20 to-black" />
        </div>

        {/* Top Navbar */}
        <nav className="relative z-30 flex items-center justify-between px-6 md:px-12 py-6 border-b border-white/5 backdrop-blur-[2px]">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center p-1 border border-white/15">
              <img src="/logo.png" alt="Startup OS Logo" className="w-full h-full object-contain filter invert opacity-90" />
            </div>
            <span className="text-xl font-serif tracking-widest text-[#DEDBC8] font-bold">
              STARTUP OS<sup className="text-[9px] font-sans font-medium tracking-normal ml-0.5 opacity-60">TM</sup>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-xs font-semibold uppercase tracking-widest">
            <a href="#disruption" className="text-[#E1E0CC]/70 hover:text-[#DEDBC8] transition-colors">Disruption Vision</a>
            <a href="#roadmap" className="text-[#E1E0CC]/70 hover:text-[#DEDBC8] transition-colors">Roadmap</a>
            <a href="#architecture" className="text-[#E1E0CC]/70 hover:text-[#DEDBC8] transition-colors">Architecture</a>
          </div>

          <div className="flex items-center gap-4">
            <a 
              href="#waitlist" 
              className="text-xs uppercase font-bold tracking-widest px-5 py-2.5 rounded-full border border-white/20 hover:border-white/40 hover:bg-white/5 transition-all text-[#DEDBC8]"
            >
              Request Access
            </a>
          </div>
        </nav>

        {/* Hero Body */}
        <div className="relative z-10 flex-grow flex flex-col justify-center items-center text-center px-4 max-w-5xl mx-auto pt-16 pb-12">
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
            <form onSubmit={handleWaitlistSubmit} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="Enter corporate email..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-grow rounded-full bg-black/40 border border-white/10 px-5 py-3 text-sm placeholder:text-[#E1E0CC]/40 focus:border-[#DEDBC8]/50 focus:ring-1 focus:ring-[#DEDBC8]/30 outline-none transition-all backdrop-blur-md text-[#E1E0CC]"
                required
              />
              <button
                type="submit"
                className="bg-[#DEDBC8] text-black hover:bg-[#c9c6b3] active:scale-95 text-xs font-bold uppercase tracking-widest px-7 py-3 rounded-full transition-all flex items-center justify-center gap-2 shrink-0 shadow-lg shadow-[#DEDBC8]/5"
              >
                {submitted ? (
                  <>
                    <Check className="w-4 h-4" /> Submitted
                  </>
                ) : (
                  <>
                    Join Beta <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
            <p className="text-[10px] text-[#E1E0CC]/40 mt-3 uppercase tracking-widest font-semibold">
              Coming Soon &bull; Early Beta access slots limited
            </p>
          </div>
        </div>

        {/* Hero Footer Meta */}
        <div className="relative z-10 px-6 md:px-12 py-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex items-center gap-3 text-[#E1E0CC]/55 text-xs font-medium uppercase tracking-wider">
            <span>Market Disruption Vision</span>
            <span className="h-1.5 w-1.5 rounded-full bg-[#DEDBC8]/40" />
            <span>Product Roadmap</span>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 bg-[#DEDBC8]/5 px-3 py-1.5 rounded-md border border-[#DEDBC8]/10">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#DEDBC8]">Cloud Sandbox Ready</span>
            </div>
            <span className="text-[10px] text-[#E1E0CC]/55 uppercase tracking-widest font-bold">V0.9.4 Beta</span>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="relative z-10 bg-black pt-24 pb-32 space-y-36">
        
        {/* Market Disruption Section */}
        <section id="disruption" className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#DEDBC8] flex items-center gap-2">
              <span className="h-1.5 w-8 bg-[#DEDBC8]" />
              The Disruption Vision
            </div>
            <h2 className="font-serif text-4xl md:text-6xl text-[#E1E0CC] leading-tight font-normal">
              Replacing fragmented fractional contracts with <span className="italic text-[#DEDBC8]">continuous AI execution</span>.
            </h2>
            <p className="text-[#E1E0CC]/75 text-sm md:text-base leading-relaxed max-w-2xl font-normal">
              Startups spend billions annually hiring fractional executives (CFOs, CMOs, CHROs) to manage core financial systems, marketing plans, and recruiting operations. These human operators introduce high latency, manual mistakes, and massive cash overhead.
            </p>
            <p className="text-[#E1E0CC]/75 text-sm md:text-base leading-relaxed max-w-2xl font-normal">
              **Startup OS** introduces a fully integrated autonomous ERP command engine. Rather than isolated dashboards, our engine deploys dedicated AI agents that query the database, run projections, buy media, draft compliance guidelines, and negotiate budgets with other agents inside the platform.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
              <div className="p-5 rounded-xl border border-white/5 bg-[#101010]/40 backdrop-blur-md">
                <div className="h-9 w-9 rounded-lg bg-[#DEDBC8]/10 flex items-center justify-center mb-3">
                  <ShieldCheck className="w-5 h-5 text-[#DEDBC8]" />
                </div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-[#DEDBC8] mb-1.5">Zero-Latency Operations</h4>
                <p className="text-[#E1E0CC]/60 text-xs leading-relaxed">
                  Decisions that previously took boards days or weeks (e.g. dynamic cash runway allocation under shifting growth profiles) happen in milliseconds.
                </p>
              </div>

              <div className="p-5 rounded-xl border border-white/5 bg-[#101010]/40 backdrop-blur-md">
                <div className="h-9 w-9 rounded-lg bg-[#DEDBC8]/10 flex items-center justify-center mb-3">
                  <Cpu className="w-5 h-5 text-[#DEDBC8]" />
                </div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-[#DEDBC8] mb-1.5">Intelligent Cross-Agent Sync</h4>
                <p className="text-[#E1E0CC]/60 text-xs leading-relaxed">
                  If the CFO Agent detects a cash crunch, it triggers the CMO Agent to re-optimize marketing ROI and advises the CHRO Agent to pause open job listings.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            {/* Disruption Diagram */}
            <div className="liquid-glass-strong rounded-2xl p-6 border border-white/10 bg-[#101010]/60 space-y-6">
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#DEDBC8]">System Disruption Model</span>
                <span className="text-[9px] text-[#E1E0CC]/40 font-bold uppercase">Simulation active</span>
              </div>

              <div className="space-y-4">
                {/* Fractional Model Card */}
                <div className="p-3.5 rounded-lg border border-red-500/25 bg-red-950/10 flex flex-col gap-1.5">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-red-400">
                    <span>Traditional Fractional Agency Model</span>
                    <span>High Friction</span>
                  </div>
                  <p className="text-[11px] text-[#E1E0CC]/60">
                    Disconnected spreadsheets, manual email reports, monthly recurring meetings, and $15,000/mo cash burn per executive.
                  </p>
                </div>

                <div className="flex justify-center my-1">
                  <div className="h-6 w-0.5 bg-gradient-to-b from-red-500/30 to-emerald-500/30" />
                </div>

                {/* Startup OS Model Card */}
                <div className="p-4 rounded-lg border border-[#DEDBC8]/30 bg-[#DEDBC8]/5 flex flex-col gap-1.5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 h-12 w-12 bg-[#DEDBC8]/5 blur-md rounded-full" />
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-[#DEDBC8]">
                    <span>Startup OS Autonomous ERP</span>
                    <span className="flex items-center gap-1">Continuous <Cpu className="w-2.5 h-2.5 animate-spin" /></span>
                  </div>
                  <p className="text-[11px] text-[#E1E0CC]/80 font-medium">
                    Integrated database schema linking bank transactions directly to CMO spending channels and CHRO hiring capacity models. Synchronized AI decisions at $0/mo overhead.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center text-[10px] text-[#E1E0CC]/55 font-bold uppercase tracking-widest border-t border-white/5">
                <span>Direct ROI Impact:</span>
                <span className="text-emerald-400 font-extrabold">98.5% Cost Reduction</span>
              </div>
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
              Our phased releases focus on constructing deep integration adapters for each core startup vertical, leading to a fully federated autonomous boardroom registry.
            </p>
          </div>

          {/* Roadmap Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {roadmapItems.map((item, index) => (
              <div 
                key={index}
                className="liquid-glass rounded-2xl p-8 border border-white/5 hover:border-white/10 bg-[#101010]/30 hover:bg-[#101010]/50 transition-all flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[#DEDBC8]/65">{item.phase}</span>
                    <span className={`text-[9px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full border ${
                      item.status === 'Active Beta' 
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' 
                        : 'border-white/10 bg-white/5 text-[#E1E0CC]/60'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-serif text-[#E1E0CC] font-normal group-hover:text-[#DEDBC8] transition-colors">{item.phase.split(': ')[1]}</h3>
                  
                  <p className="text-xs text-[#E1E0CC]/60 leading-relaxed font-normal">
                    {item.description}
                  </p>
                </div>

                <div className="pt-6 border-t border-white/5 mt-6 flex flex-wrap gap-2">
                  {item.points.map((pt, pIdx) => (
                    <span key={pIdx} className="text-[9px] font-bold uppercase tracking-wider text-[#E1E0CC]/40 bg-white/5 px-2 py-1 rounded">
                      &bull; {pt}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* System Architecture Section */}
        <section id="architecture" className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 relative order-last lg:order-first">
            <div className="liquid-glass-strong rounded-2xl p-6 border border-white/10 bg-[#101010]/60 space-y-6">
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#DEDBC8]">System Topology</span>
                <span className="text-[9px] text-emerald-400 font-bold uppercase">Active Sandbox</span>
              </div>

              {/* Node diagram representation */}
              <div className="space-y-4 font-mono text-[10px] text-[#E1E0CC]/60">
                <div className="flex items-center gap-3 p-2 rounded bg-black/40 border border-white/5">
                  <div className="h-4 w-4 bg-[#DEDBC8]/15 rounded flex items-center justify-center text-[9px] text-[#DEDBC8]">1</div>
                  <span>Autonomous API Gateway (Micro-orchestrator)</span>
                </div>
                <div className="flex items-center gap-3 p-2 rounded bg-black/40 border border-white/5">
                  <div className="h-4 w-4 bg-[#DEDBC8]/15 rounded flex items-center justify-center text-[9px] text-[#DEDBC8]">2</div>
                  <span>Cognitive Reasoning Engine (Decoupled Core LLMs)</span>
                </div>
                <div className="flex items-center gap-3 p-2 rounded bg-black/40 border border-white/5">
                  <div className="h-4 w-4 bg-[#DEDBC8]/15 rounded flex items-center justify-center text-[9px] text-[#DEDBC8]">3</div>
                  <span>Relational Ledger Database (Transaction Logs)</span>
                </div>
                <div className="flex items-center gap-3 p-2 rounded bg-black/40 border border-white/5">
                  <div className="h-4 w-4 bg-[#DEDBC8]/15 rounded flex items-center justify-center text-[9px] text-[#DEDBC8]">4</div>
                  <span>Event Broker Messaging Bus (Agent Communication)</span>
                </div>
              </div>

              <div className="pt-2 text-center text-[9px] text-[#E1E0CC]/40 uppercase tracking-widest border-t border-white/5">
                Engineered for isolation &amp; low latency
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#DEDBC8] flex items-center gap-2">
              <span className="h-1.5 w-8 bg-[#DEDBC8]" />
              Security Architecture
            </div>
            <h2 className="font-serif text-4xl md:text-6xl text-[#E1E0CC] leading-tight font-normal">
              Secure by default, <span className="italic text-[#DEDBC8]">decentralized</span> by design.
            </h2>
            <p className="text-[#E1E0CC]/75 text-sm md:text-base leading-relaxed max-w-2xl font-normal">
              Startup OS handles highly sensitive corporate transactions, HR payroll projections, and active marketing budgets. Trust and security isolation are integrated directly into our infrastructure core.
            </p>
            <p className="text-[#E1E0CC]/75 text-sm md:text-base leading-relaxed max-w-2xl font-normal">
              By utilizing dedicated sandbox runtimes for agent cognitive reasoning, encrypted ledger databases for all transaction logging, and real-time event messaging for immediate cross-agent updates, we guarantee corporate data isolation and compliance.
            </p>
            
            <div className="flex flex-wrap gap-4 pt-2">
              <span className="px-3.5 py-1.5 rounded-full border border-white/10 bg-white/5 text-[10px] uppercase font-bold tracking-widest text-[#E1E0CC]/80">Decoupled Reasoning Nodes</span>
              <span className="px-3.5 py-1.5 rounded-full border border-white/10 bg-white/5 text-[10px] uppercase font-bold tracking-widest text-[#E1E0CC]/80">Encrypted Ledger Logs</span>
              <span className="px-3.5 py-1.5 rounded-full border border-white/10 bg-white/5 text-[10px] uppercase font-bold tracking-widest text-[#E1E0CC]/80">Isolated Sandboxes</span>
            </div>
          </div>
        </section>

        {/* Waitlist Section */}
        <section id="waitlist" className="max-w-4xl mx-auto px-6 text-center space-y-8">
          <div className="liquid-glass-strong rounded-3xl p-12 md:p-16 border border-white/10 bg-[#101010]/35 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#DEDBC8]/5 via-transparent to-transparent opacity-60 pointer-events-none" />
            
            <div className="relative z-10 max-w-2xl mx-auto space-y-6">
              <h2 className="font-serif text-4xl md:text-5xl text-[#E1E0CC] font-normal leading-tight">
                Secure your startup's <span className="italic text-[#DEDBC8]">next generation ERP</span>
              </h2>
              <p className="text-[#E1E0CC]/70 text-xs md:text-sm leading-relaxed max-w-md mx-auto font-normal">
                Join our beta program. We are actively reviewing requests from high-growth technology ventures to join our developer sandboxes.
              </p>

              <form onSubmit={handleWaitlistSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto pt-4">
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-grow rounded-full bg-black/50 border border-white/10 px-5 py-3 text-sm placeholder:text-[#E1E0CC]/40 focus:border-[#DEDBC8]/50 focus:ring-1 focus:ring-[#DEDBC8]/30 outline-none transition-all text-[#E1E0CC]"
                  required
                />
                <button
                  type="submit"
                  className="bg-[#DEDBC8] text-black hover:bg-[#c9c6b3] active:scale-95 text-xs font-bold uppercase tracking-widest px-7 py-3 rounded-full transition-all flex items-center justify-center gap-2 shrink-0 shadow-lg shadow-[#DEDBC8]/10"
                >
                  {submitted ? (
                    <>
                      <Check className="w-4 h-4" /> Submitted
                    </>
                  ) : (
                    <>
                      Request Invitation <Send className="w-3 h-3" />
                    </>
                  )}
                </button>
              </form>
              <p className="text-[10px] text-[#E1E0CC]/40 uppercase tracking-widest font-semibold">
                By signing up, you agree to our beta sandbox testing agreements.
              </p>
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
            <a href="#disruption" className="hover:text-[#DEDBC8] transition-colors">Privacy</a>
            <span>&bull;</span>
            <a href="#roadmap" className="hover:text-[#DEDBC8] transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
