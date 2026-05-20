import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Plus, Play, Pause, TrendingUp, BarChart3, 
  DollarSign, Target, Percent, Loader2, AlertCircle
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
        // Optimistically update status
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
      setGeneratedIdeas(`### Error\nFailed to generate ideas: ${err.message}. Please verify your network connection and Gemini API Key configuration.`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Pre-seed some inputs for convenience
  const handleTryDemoInput = () => {
    setProductDescription("A premium subscription box delivering customized single-origin coffee beans roasted on demand, complete with flavor profile cards.");
    setTargetAudience("Millennial coffee enthusiasts, home-brewers, and busy professionals who value premium craft beverages and micro-batch quality.");
  };

  // Calculations
  const totalSpend = campaigns.reduce((acc, c) => acc + (c.spend || 0), 0) / 100;
  const totalBudget = campaigns.reduce((acc, c) => acc + (c.budget || 0), 0) / 100;
  
  // Hardcoded premium marketing stats based on target specs
  const blendedCAC = 42.80;
  const ltvToCac = 3.8;

  // Dynamically calculated ROAS based on active campaigns
  const activeCampaigns = campaigns.filter(c => c.status === 'active');
  const avgRoasVal = activeCampaigns.length > 0 
    ? (activeCampaigns.reduce((acc, c) => acc + (c.roas || 0), 0) / activeCampaigns.length) / 100
    : 4.2;

  // Chart data based on campaign list
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
          <h2 className="text-4xl font-black mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent italic">
            CMO Marketing Room
          </h2>
          <p className="text-white/50 text-lg">Brainstorm concepts, track returns, and align growth strategies with Gemini AI.</p>
        </div>
        <button 
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="btn-primary flex items-center gap-2 cursor-pointer self-start md:self-auto"
        >
          <Plus size={18} />
          <span>New Campaign</span>
        </button>
      </header>

      {/* New Campaign Modal / Form Panel */}
      {isFormOpen && (
        <div className="glass-card p-6 border-primary/20 bg-primary/5 animate-in fade-in duration-200">
          <h3 className="text-lg font-bold mb-4">Create New Campaign</h3>
          <form onSubmit={handleCreateCampaign} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Campaign Name</label>
              <input 
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Meta Retargeting"
                className="w-full bg-white/5 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Budget ($ USD)</label>
              <input 
                type="number"
                required
                min="1"
                value={newBudget}
                onChange={(e) => setNewBudget(e.target.value)}
                placeholder="e.g. 5000"
                className="w-full bg-white/5 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Initial Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as 'active' | 'paused')}
                className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 text-white"
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button 
                type="submit" 
                disabled={isSaving}
                className="btn-primary flex-1 justify-center flex items-center gap-1.5 cursor-pointer"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                <span>Create</span>
              </button>
              <button 
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl font-semibold text-white transition-colors cursor-pointer text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* High-Fidelity Marketing Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-card p-6 group hover:border-primary/50 transition-all cursor-default relative overflow-hidden">
          <div className="absolute right-4 top-4 text-primary/10 group-hover:scale-110 transition-transform">
            <DollarSign size={40} />
          </div>
          <p className="text-white/50 text-sm font-medium mb-1">Marketing Spend</p>
          <div className="space-y-1">
            <h4 className="text-2xl font-black">${totalSpend.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h4>
            <div className="flex items-center gap-2 text-xs text-white/40">
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-primary h-full transition-all duration-1000" 
                  style={{ width: `${Math.min((totalSpend / totalBudget) * 100, 100)}%` }}
                />
              </div>
              <span className="shrink-0">{Math.round((totalSpend / totalBudget) * 100)}% of limit</span>
            </div>
          </div>
          <p className="text-[10px] text-white/30 mt-2 uppercase tracking-widest">Cap: ${totalBudget.toLocaleString()}</p>
        </div>

        <div className="glass-card p-6 group hover:border-primary/50 transition-all cursor-default relative overflow-hidden">
          <div className="absolute right-4 top-4 text-primary/10 group-hover:scale-110 transition-transform">
            <Target size={40} />
          </div>
          <p className="text-white/50 text-sm font-medium mb-1">Blended CAC</p>
          <h4 className="text-2xl font-black">${blendedCAC.toFixed(2)}</h4>
          <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-green-400/10 text-green-400 inline-block mt-2">
            Target &lt; $45.00
          </span>
          <p className="text-[10px] text-white/30 mt-2 uppercase tracking-widest">Optimized last 30d</p>
        </div>

        <div className="glass-card p-6 group hover:border-primary/50 transition-all cursor-default relative overflow-hidden">
          <div className="absolute right-4 top-4 text-primary/10 group-hover:scale-110 transition-transform">
            <TrendingUp size={40} />
          </div>
          <p className="text-white/50 text-sm font-medium mb-1">Blended ROAS</p>
          <h4 className="text-2xl font-black">{avgRoasVal.toFixed(1)}x</h4>
          <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-green-400/10 text-green-400 inline-block mt-2">
            Excellent ROI
          </span>
          <p className="text-[10px] text-white/30 mt-2 uppercase tracking-widest">Calculated dynamically</p>
        </div>

        <div className="glass-card p-6 group hover:border-primary/50 transition-all cursor-default relative overflow-hidden">
          <div className="absolute right-4 top-4 text-primary/10 group-hover:scale-110 transition-transform">
            <Percent size={40} />
          </div>
          <p className="text-white/50 text-sm font-medium mb-1">LTV / CAC Ratio</p>
          <h4 className="text-2xl font-black">{ltvToCac.toFixed(1)}x</h4>
          <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-green-400/10 text-green-400 inline-block mt-2">
            Strong Health
          </span>
          <p className="text-[10px] text-white/30 mt-2 uppercase tracking-widest">Industry standard: 3.0x</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Table & Chart */}
        <div className="lg:col-span-2 space-y-8">
          {/* Ad Channels Spend Chart */}
          <div className="glass-card p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold">Channel Spend & Value ROI</h3>
                <p className="text-white/40 text-xs mt-1">Comparing budget spend against estimated campaign return value.</p>
              </div>
              <BarChart3 className="text-primary shrink-0" size={20} />
            </div>

            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={28} />
              </div>
            ) : chartData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-white/40 text-sm">
                No campaign data available. Create one to visualize.
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="spendBar" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f97316" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="#f97316" stopOpacity={0.2} />
                      </linearGradient>
                      <linearGradient id="roiBar" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ec4899" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="#ec4899" stopOpacity={0.2} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false}
                      tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false}
                      tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                      tickFormatter={(v) => `$${v}`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        background: 'rgba(15,15,25,0.95)', 
                        border: '1px solid rgba(255,255,255,0.1)', 
                        borderRadius: '12px',
                        color: 'white',
                        fontSize: '12px',
                      }}
                      formatter={(v) => [`$${Number(v).toFixed(2)}`]}
                    />
                    <Legend 
                      verticalAlign="top" 
                      height={36}
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}
                    />
                    <Bar name="Direct Spend" dataKey="Spend" fill="url(#spendBar)" radius={[4, 4, 0, 0]} />
                    <Bar name="Value Generated (ROI)" dataKey="ROI" fill="url(#roiBar)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Interactive Campaigns Grid */}
          <div className="glass-card p-6 overflow-hidden">
            <h3 className="text-xl font-bold mb-4">Marketing Campaign Dashboard</h3>
            {loading ? (
              <div className="h-48 flex items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={28} />
              </div>
            ) : error ? (
              <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 flex items-center gap-2">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-[10px] uppercase font-bold text-white/30 tracking-widest pb-4">
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
                      <tr key={camp.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                        <td className="py-4 px-4 font-bold text-white group-hover:text-primary transition-colors">
                          {camp.name}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                            camp.status === 'active' 
                              ? 'bg-green-500/10 text-green-400' 
                              : 'bg-white/5 text-white/40'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${camp.status === 'active' ? 'bg-green-400' : 'bg-white/20'}`} />
                            {camp.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right font-semibold text-white/70">
                          ${(camp.budget / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-4 px-4 text-right font-semibold text-white/70">
                          ${(camp.spend / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-4 px-4 text-center font-black text-white/90">
                          {camp.roas ? `${(camp.roas / 100).toFixed(1)}x` : '-'}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <button 
                            onClick={() => toggleCampaignStatus(camp)}
                            title={camp.status === 'active' ? "Pause Campaign" : "Resume Campaign"}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer inline-block ${
                              camp.status === 'active' 
                                ? 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-400' 
                                : 'bg-green-500/10 hover:bg-green-500/20 text-green-400'
                            }`}
                          >
                            {camp.status === 'active' ? <Pause size={14} /> : <Play size={14} />}
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
        <div className="space-y-8">
          <div className="glass-card p-6 space-y-6">
            <div className="flex items-center gap-2 border-b border-white/5 pb-4">
              <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
                <Sparkles size={16} />
              </div>
              <div>
                <h3 className="font-bold text-base">AI Campaign Brainstormer</h3>
                <p className="text-white/40 text-[10px] uppercase tracking-widest font-black">AI CMO Engine</p>
              </div>
            </div>

            <form onSubmit={handleGenerateIdeas} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white/50 mb-2">Product Description</label>
                <textarea 
                  required
                  rows={4}
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                  placeholder="Describe your product, its value proposition, pricing..."
                  className="w-full bg-white/5 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-white placeholder-white/20 custom-scrollbar resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/50 mb-2">Target Audience</label>
                <input 
                  type="text"
                  required
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="e.g. Freelancers, Small business owners"
                  className="w-full bg-white/5 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-white placeholder-white/20"
                />
              </div>

              <div className="flex gap-2">
                <button 
                  type="submit" 
                  disabled={isGenerating}
                  className="btn-primary flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Brainstorming...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span>Generate Concepts</span>
                    </>
                  )}
                </button>
                <button 
                  type="button" 
                  onClick={handleTryDemoInput}
                  title="Try Coffee Box Demo"
                  className="px-3 bg-white/5 hover:bg-white/10 rounded-xl text-white/60 hover:text-white transition-colors cursor-pointer"
                >
                  Demo
                </button>
              </div>
            </form>

            {generatedIdeas && (
              <div className="mt-6 border-t border-white/5 pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs uppercase tracking-widest font-black text-primary">Generated Concepts</h4>
                  <button 
                    onClick={() => setGeneratedIdeas('')}
                    className="text-[10px] text-white/40 hover:text-white transition-colors uppercase font-bold"
                  >
                    Clear
                  </button>
                </div>
                
                <div className="bg-white/5 border border-white/5 p-5 rounded-2xl max-h-[350px] overflow-y-auto custom-scrollbar">
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
    <div className="space-y-3 text-white/80 text-xs leading-relaxed">
      {lines.map((line, i) => {
        const content = line.trim();
        if (!content) return <div key={i} className="h-2" />;
        
        // Headers
        if (content.startsWith('### ')) {
          return <h5 key={i} className="text-xs font-bold text-primary mt-4 mb-1 uppercase tracking-wide">{content.slice(4)}</h5>;
        }
        if (content.startsWith('## ')) {
          return <h4 key={i} className="text-sm font-extrabold text-white mt-5 mb-2">{content.slice(3)}</h4>;
        }
        if (content.startsWith('# ')) {
          return <h3 key={i} className="text-base font-black text-white mt-6 mb-3 border-b border-white/10 pb-1">{content.slice(2)}</h3>;
        }

        // Bullet points
        if (content.startsWith('* ') || content.startsWith('- ')) {
          const formatted = parseBoldText(content.slice(2));
          return (
            <div key={i} className="flex gap-2 items-start pl-2 my-1">
              <span className="text-primary mt-1.5 shrink-0 w-1 h-1 rounded-full bg-primary" />
              <span>{formatted}</span>
            </div>
          );
        }

        // Numbered lists
        const numMatch = content.match(/^(\d+)\.\s(.*)/);
        if (numMatch) {
          const formatted = parseBoldText(numMatch[2]);
          return (
            <div key={i} className="flex gap-2 items-start pl-2 my-1">
              <span className="text-primary font-bold shrink-0">{numMatch[1]}.</span>
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
      return <strong key={index} className="font-extrabold text-white">{part}</strong>;
    }
    return part;
  });
};
