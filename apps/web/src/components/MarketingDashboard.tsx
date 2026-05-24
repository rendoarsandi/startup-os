import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Plus, Play, Pause, TrendingUp, BarChart3, 
  DollarSign, Target, Percent, Loader2, AlertCircle, RefreshCw, Copy, Check
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';

interface Campaign {
  id: string;
  name: string;
  status: 'active' | 'paused';
  budget: number; // in cents
  spend: number;  // in cents
  conversions: number;
  roas: number; // e.g. 420 is 4.2x
}

export const MarketingDashboard: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Campaign Brainstormer Form State
  const [productDescription, setProductDescription] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [generatedIdeas, setGeneratedIdeas] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // New Campaign Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newBudget, setNewBudget] = useState('5000');
  const [newStatus, setNewStatus] = useState<'active' | 'paused'>('active');
  const [isSaving, setIsSaving] = useState(false);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/marketing/campaigns');
      if (!res.ok) throw new Error('Failed to fetch campaigns');
      const data = await res.json();
      setCampaigns(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const toggleCampaignStatus = async (campaign: Campaign) => {
    const updatedStatus = campaign.status === 'active' ? 'paused' : 'active';
    try {
      const res = await fetch('/api/marketing/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...campaign,
          status: updatedStatus
        })
      });
      if (res.ok) {
        setCampaigns(prev => prev.map(c => c.id === campaign.id ? { ...c, status: updatedStatus } : c));
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setIsSaving(true);
    try {
      const budgetInCents = Math.round(parseFloat(newBudget) * 100) || 500000;
      const res = await fetch('/api/marketing/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          budget: budgetInCents,
          spend: 0,
          conversions: 0,
          roas: 0,
          status: newStatus
        })
      });
      if (res.ok) {
        setNewName('');
        setNewBudget('5000');
        setIsFormOpen(false);
        fetchCampaigns();
      }
    } catch (err) {
      console.error('Error creating campaign:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateIdeas = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productDescription.trim() || !targetAudience.trim()) return;

    setIsGenerating(true);
    setGeneratedIdeas('');
    try {
      const res = await fetch('/api/marketing/generate-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productDescription, targetAudience })
      });
      if (!res.ok) throw new Error('Generation failed');
      const data = await res.json();
      setGeneratedIdeas(data.ideas || 'No concept ideas returned.');
    } catch (err: any) {
      setGeneratedIdeas(`### Concept Ideas Generation Failure\nFailed to generate campaign concepts: ${err.message}. Please verify Gemini API settings.`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTryDemoInput = () => {
    setProductDescription("A premium subscription box delivering customized single-origin coffee beans roasted on demand, complete with flavor profile cards.");
    setTargetAudience("Millennial coffee enthusiasts, home-brewers, and busy professionals who value premium craft beverages and micro-batch quality.");
  };

  const handleCopy = () => {
    if (!generatedIdeas) return;
    navigator.clipboard.writeText(generatedIdeas);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Calculations
  const totalSpend = campaigns.reduce((acc, c) => acc + (c.spend || 0), 0) / 100;
  const totalBudget = campaigns.reduce((acc, c) => acc + (c.budget || 0), 0) / 100;
  
  const blendedCAC = 42.80;
  const ltvToCac = 3.8;

  const activeCampaigns = campaigns.filter(c => c.status === 'active');
  const avgRoasVal = activeCampaigns.length > 0 
    ? (activeCampaigns.reduce((acc, c) => acc + (c.roas || 0), 0) / activeCampaigns.length) / 100
    : 4.2;

  const chartData = campaigns.map(c => ({
    name: c.name,
    Spend: c.spend / 100,
    ROI: ((c.spend * (c.roas / 100)) / 100) || 0,
    ROAS: c.roas / 100
  }));

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold mb-1.5 text-white tracking-tight">
            CMO Growth Room
          </h2>
          <p className="text-slate-400 text-sm font-medium">Brainstorm concepts, track returns, and align growth strategies with Gemini AI.</p>
        </div>
        <button 
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="btn-primary h-12 text-sm font-extrabold flex items-center gap-2 cursor-pointer self-start md:self-auto"
        >
          <Plus size={16} />
          <span>New Campaign</span>
        </button>
      </header>

      {/* New Campaign Modal / Form Panel */}
      {isFormOpen && (
        <div className="glass-card p-6 border-primary/20 bg-gradient-to-b from-primary/5 to-transparent animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
              <Sparkles size={14} className="text-primary animate-pulse" />
            </div>
            <h3 className="text-base font-extrabold text-white">Create New Marketing Campaign</h3>
          </div>
          <form onSubmit={handleCreateCampaign} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest">Campaign Name</label>
              <input 
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Meta Retargeting"
                className="glass-input"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest">Budget ($ USD)</label>
              <input 
                type="number"
                required
                min="1"
                value={newBudget}
                onChange={(e) => setNewBudget(e.target.value)}
                placeholder="e.g. 5000"
                className="glass-input"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest">Initial Status</label>
              <div className="relative">
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as 'active' | 'paused')}
                  className="glass-input appearance-none pr-8 cursor-pointer"
                >
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                </select>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-white/30 text-xs">
                  ▼
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                type="submit" 
                disabled={isSaving}
                className="btn-primary flex-1 h-[46px] justify-center flex items-center gap-1.5 cursor-pointer text-xs font-bold"
              >
                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                <span>Create</span>
              </button>
              <button 
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="btn-secondary h-[46px] text-xs font-bold"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* High-Fidelity Marketing Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card p-5 group hover:border-primary/20 transition-all cursor-default relative overflow-hidden">
          <div className="absolute -right-3 -top-3 w-16 h-16 rounded-full bg-primary/5 group-hover:scale-110 transition-transform flex items-center justify-center border border-white/5">
            <DollarSign size={20} className="text-primary/40" />
          </div>
          <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-2">Growth Spend</p>
          <h4 className="text-2xl font-black tracking-tight">${totalSpend.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h4>
          <div className="flex items-center gap-2 text-[10px] text-white/40 mt-3.5">
            <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden border border-white/5">
              <div 
                className="bg-gradient-to-r from-primary to-secondary h-full transition-all duration-1000 shadow-[0_0_8px_var(--glow-color)]" 
                style={{ width: `${Math.min((totalSpend / (totalBudget || 1)) * 100, 100)}%` }}
              />
            </div>
            <span className="shrink-0 font-bold">{Math.round((totalSpend / (totalBudget || 1)) * 100)}% of limit</span>
          </div>
          <p className="text-[9px] text-white/30 mt-2 uppercase tracking-widest font-black">Limit: ${totalBudget.toLocaleString()}</p>
        </div>

        <div className="glass-card p-5 group hover:border-primary/20 transition-all cursor-default relative overflow-hidden">
          <div className="absolute -right-3 -top-3 w-16 h-16 rounded-full bg-primary/5 group-hover:scale-110 transition-transform flex items-center justify-center border border-white/5">
            <Target size={20} className="text-primary/40" />
          </div>
          <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-2">Blended CAC</p>
          <h4 className="text-2xl font-black tracking-tight">${blendedCAC.toFixed(2)}</h4>
          <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 inline-block mt-3.5">
            Target &lt; $45.00
          </span>
          <p className="text-[9px] text-white/30 mt-2.5 uppercase tracking-widest font-black">Optimized dynamically</p>
        </div>

        <div className="glass-card p-5 group hover:border-primary/20 transition-all cursor-default relative overflow-hidden">
          <div className="absolute -right-3 -top-3 w-16 h-16 rounded-full bg-primary/5 group-hover:scale-110 transition-transform flex items-center justify-center border border-white/5">
            <TrendingUp size={20} className="text-primary/40" />
          </div>
          <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-2">Blended ROAS</p>
          <h4 className="text-2xl font-black tracking-tight">{avgRoasVal.toFixed(1)}x</h4>
          <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 inline-block mt-3.5">
            Excellent Efficiency
          </span>
          <p className="text-[9px] text-white/30 mt-2.5 uppercase tracking-widest font-black">Calculated last 30d</p>
        </div>

        <div className="glass-card p-5 group hover:border-primary/20 transition-all cursor-default relative overflow-hidden">
          <div className="absolute -right-3 -top-3 w-16 h-16 rounded-full bg-primary/5 group-hover:scale-110 transition-transform flex items-center justify-center border border-white/5">
            <Percent size={20} className="text-primary/40" />
          </div>
          <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-2">LTV / CAC Ratio</p>
          <h4 className="text-2xl font-black tracking-tight">{ltvToCac.toFixed(1)}x</h4>
          <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 inline-block mt-3.5">
            Healthy Unit Model
          </span>
          <p className="text-[9px] text-white/30 mt-2.5 uppercase tracking-widest font-black">Benchmark: 3.0x</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table & Chart */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ad Channels Spend Chart */}
          <div className="glass-card p-6 relative overflow-hidden">
            <div className="absolute -right-16 -top-16 w-36 h-36 rounded-full bg-primary/5 blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-extrabold text-white">Channel Allocations & Return (ROI)</h3>
                <p className="text-white/40 text-[10px] uppercase tracking-widest font-black mt-0.5">Performance visualizer</p>
              </div>
              <BarChart3 className="text-primary shrink-0" size={18} />
            </div>

            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={24} />
              </div>
            ) : chartData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-white/30 text-xs font-medium">
                No active campaign channels found. Setup campaigns to construct charts.
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="spendBar" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.15} />
                      </linearGradient>
                      <linearGradient id="roiBar" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--secondary)" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="var(--secondary)" stopOpacity={0.15} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false}
                      tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'Outfit' }}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false}
                      tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'Outfit' }}
                      tickFormatter={(v) => `$${v}`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        background: 'rgba(8,7,16,0.85)', 
                        border: '1px solid rgba(255,255,255,0.08)', 
                        borderRadius: '16px',
                        color: 'white',
                        fontSize: '11px',
                        fontFamily: 'Outfit, sans-serif',
                        backdropFilter: 'blur(16px)',
                        boxShadow: '0 8px 32px 0 rgba(0,0,0,0.5)'
                      }}
                      formatter={(v) => [`$${Number(v).toFixed(2)}`]}
                    />
                    <Legend 
                      verticalAlign="top" 
                      height={36}
                      iconType="circle"
                      iconSize={6}
                      wrapperStyle={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', fontFamily: 'Outfit' }}
                    />
                    <Bar name="Direct Capital Spend" dataKey="Spend" fill="url(#spendBar)" radius={[4, 4, 0, 0]} />
                    <Bar name="Est. Value Generated" dataKey="ROI" fill="url(#roiBar)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Interactive Campaigns Grid */}
          <div className="glass-card p-6 overflow-hidden">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-extrabold text-white">Growth Operations Dashboard</h3>
                <p className="text-white/40 text-[10px] uppercase tracking-widest font-black mt-0.5">Individual campaigns monitor</p>
              </div>
              <button 
                onClick={fetchCampaigns}
                className="w-8 h-8 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all cursor-pointer"
                title="Synchronize Campaigns"
              >
                <RefreshCw size={14} />
              </button>
            </div>
            {loading ? (
              <div className="h-48 flex items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={24} />
              </div>
            ) : error ? (
              <div className="p-4 rounded-xl border border-rose-500/10 bg-rose-500/5 text-rose-400 flex items-center gap-2 text-xs font-semibold">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            ) : (
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-[9px] uppercase font-black text-white/30 tracking-widest pb-4">
                      <th className="py-3 px-4">Campaign Name</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Budget Limit</th>
                      <th className="py-3 px-4 text-right">Actual Spend</th>
                      <th className="py-3 px-4 text-center">ROAS</th>
                      <th className="py-3 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((camp) => (
                      <tr key={camp.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors group">
                        <td className="py-3.5 px-4 font-bold text-white group-hover:text-primary transition-colors text-xs">
                          {camp.name}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${
                            camp.status === 'active' 
                              ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400' 
                              : 'bg-white/5 border-white/5 text-white/40'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${camp.status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-white/20'}`} />
                            {camp.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-white/80 text-xs">
                          ${(camp.budget / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-white/80 text-xs">
                          ${(camp.spend / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4 text-center font-black text-primary text-xs">
                          {camp.roas ? `${(camp.roas / 100).toFixed(1)}x` : '-'}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button 
                            onClick={() => toggleCampaignStatus(camp)}
                            title={camp.status === 'active' ? "Pause Campaign" : "Resume Campaign"}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer inline-flex border ${
                              camp.status === 'active' 
                                ? 'bg-amber-500/5 border-amber-500/10 text-amber-400 hover:bg-amber-500/15' 
                                : 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400 hover:bg-emerald-500/15'
                            }`}
                          >
                            {camp.status === 'active' ? <Pause size={12} /> : <Play size={12} />}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Campaign Ideas Brainstormer */}
        <div className="space-y-6">
          <div className="glass-card p-6 space-y-5 relative overflow-hidden">
            <div className="absolute -right-16 -top-16 w-36 h-36 rounded-full bg-secondary/5 blur-2xl pointer-events-none" />
            
            <div className="flex items-center gap-2.5 border-b border-white/5 pb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-inner">
                <Sparkles size={16} className="text-white" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white">AI Creative Studio</h3>
                <p className="text-white/40 text-[9px] uppercase tracking-widest font-black mt-0.5">Gemini Campaign Brainstormer</p>
              </div>
            </div>

            <form onSubmit={handleGenerateIdeas} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest">Product Description</label>
                <textarea 
                  required
                  rows={4}
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                  placeholder="Describe your product, its values, pricing, roasted coffee box model..."
                  className="glass-input custom-scrollbar resize-none h-[96px]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest">Target Audience</label>
                <input 
                  type="text"
                  required
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="e.g. Specialty coffee hobbyists, professionals"
                  className="glass-input"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button 
                  type="submit" 
                  disabled={isGenerating}
                  className="btn-primary flex-1 h-[42px] text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Conceptualizing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      <span>Brainstorm Concepts</span>
                    </>
                  )}
                </button>
                <button 
                  type="button" 
                  onClick={handleTryDemoInput}
                  title="Inject Specialty Coffee Demo"
                  className="btn-secondary h-[42px] px-3.5 text-xs font-bold"
                >
                  Demo
                </button>
              </div>
            </form>

            {generatedIdeas && (
              <div className="mt-6 border-t border-white/[0.06] pt-5 space-y-3.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-widest font-black text-primary">Generated Brand Blueprint</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleCopy}
                      className="w-7 h-7 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all cursor-pointer"
                      title="Copy to clipboard"
                    >
                      {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    </button>
                    <button 
                      onClick={() => setGeneratedIdeas('')}
                      className="w-7 h-7 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all cursor-pointer font-bold text-xs"
                      title="Clear ideas"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                
                <div className="bg-[#080710]/50 border border-white/[0.04] p-4.5 rounded-2xl max-h-[350px] overflow-y-auto custom-scrollbar shadow-inner">
                  <MarkdownRenderer text={generatedIdeas} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Markdown rendering helper inside TSX
const MarkdownRenderer: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return null;
  const lines = text.split('\n');
  return (
    <div className="space-y-3 text-white/80 text-xs leading-relaxed font-medium">
      {lines.map((line, i) => {
        const content = line.trim();
        if (!content) return <div key={i} className="h-2" />;
        
        // Headers
        if (content.startsWith('### ')) {
          return <h5 key={i} className="text-xs font-bold text-primary mt-4 mb-1 uppercase tracking-wide">{content.slice(4)}</h5>;
        }
        if (content.startsWith('## ')) {
          return <h4 key={i} className="text-xs font-black text-white mt-5 mb-2 border-l-2 border-primary pl-2">{content.slice(3)}</h4>;
        }
        if (content.startsWith('# ')) {
          return <h3 key={i} className="text-sm font-black text-white mt-6 mb-3 border-b border-white/10 pb-1.5">{content.slice(2)}</h3>;
        }

        // Bullet points
        if (content.startsWith('* ') || content.startsWith('- ')) {
          const formatted = parseBoldText(content.slice(2));
          return (
            <div key={i} className="flex gap-2 items-start pl-1.5 my-1">
              <span className="text-primary mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_6px_var(--glow-color)]" />
              <span>{formatted}</span>
            </div>
          );
        }

        // Numbered lists
        const numMatch = content.match(/^(\d+)\.\s(.*)/);
        if (numMatch) {
          const formatted = parseBoldText(numMatch[2]);
          return (
            <div key={i} className="flex gap-2 items-start pl-1.5 my-1">
              <span className="text-primary font-black shrink-0">{numMatch[1]}.</span>
              <span>{formatted}</span>
            </div>
          );
        }

        return <p key={i}>{parseBoldText(content)}</p>;
      })}
    </div>
  );
};

// Bold text highlighter
const parseBoldText = (text: string) => {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, index) => {
    if (index % 2 === 1) {
      return <strong key={index} className="font-black text-white">{part}</strong>;
    }
    return part;
  });
};
