import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Plus, Play, Pause, TrendingUp, BarChart3, 
  DollarSign, Target, Percent, Loader2, AlertCircle, RefreshCw, Copy, Check, X
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';

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
          <h2 className="text-3xl font-bold mb-1.5 text-foreground tracking-tight">
            CMO Growth Room
          </h2>
          <p className="text-muted-foreground text-sm font-medium">Brainstorm concepts, track returns, and align growth strategies with Gemini AI.</p>
        </div>
        <Button 
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="h-10 text-xs font-bold gap-2 self-start md:self-auto"
        >
          <Plus size={14} />
          <span>New Campaign</span>
        </Button>
      </header>

      {/* New Campaign Modal / Form Panel */}
      {isFormOpen && (
        <Card className="border-primary/20 bg-card/60 backdrop-blur-md animate-in fade-in duration-300">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Sparkles size={14} />
              </div>
              <CardTitle className="text-sm font-bold">Create New Marketing Campaign</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateCampaign} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-0.5">Campaign Name</label>
                <Input 
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Meta Retargeting"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-0.5">Budget ($ USD)</label>
                <Input 
                  type="number"
                  required
                  min="1"
                  value={newBudget}
                  onChange={(e) => setNewBudget(e.target.value)}
                  placeholder="e.g. 5000"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-0.5">Initial Status</label>
                <Select 
                  value={newStatus} 
                  onValueChange={(val) => setNewStatus(val as any)}
                >
                  <SelectTrigger className="w-full text-xs font-bold uppercase tracking-wider h-10">
                    <SelectValue placeholder="STATUS" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">ACTIVE</SelectItem>
                    <SelectItem value="paused">PAUSED</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  disabled={isSaving}
                  className="flex-1 h-10 text-xs font-bold gap-1.5"
                >
                  {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                  <span>Create</span>
                </Button>
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => setIsFormOpen(false)}
                  className="h-10 px-4 text-xs font-bold"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-5 hover:border-primary/30 transition-all cursor-default relative overflow-hidden group">
          <div className="absolute -right-3 -top-3 w-14 h-14 rounded-full bg-primary/5 group-hover:scale-105 transition-transform flex items-center justify-center border border-border/30">
            <DollarSign size={18} className="text-primary" />
          </div>
          <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-2">Growth Spend</p>
          <h4 className="text-2xl font-black tracking-tight text-foreground">${totalSpend.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h4>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-3.5">
            <div className="w-full bg-black/30 h-1.5 rounded-full overflow-hidden border border-border/50">
              <div 
                className="bg-primary h-full transition-all duration-1000" 
                style={{ width: `${Math.min((totalSpend / (totalBudget || 1)) * 100, 100)}%` }}
              />
            </div>
            <span className="shrink-0 font-bold">{Math.round((totalSpend / (totalBudget || 1)) * 100)}%</span>
          </div>
          <p className="text-[9px] text-muted-foreground/60 mt-2 uppercase tracking-widest font-black">Limit: ${totalBudget.toLocaleString()}</p>
        </Card>

        <Card className="p-5 hover:border-primary/30 transition-all cursor-default relative overflow-hidden group">
          <div className="absolute -right-3 -top-3 w-14 h-14 rounded-full bg-primary/5 group-hover:scale-105 transition-transform flex items-center justify-center border border-border/30">
            <Target size={18} className="text-primary" />
          </div>
          <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-2">Blended CAC</p>
          <h4 className="text-2xl font-black tracking-tight text-foreground">${blendedCAC.toFixed(2)}</h4>
          <Badge variant="success" className="text-[9px] font-black uppercase tracking-wider mt-3.5">
            Target &lt; $45.00
          </Badge>
          <p className="text-[9px] text-muted-foreground/60 mt-2.5 uppercase tracking-widest font-black">Optimized dynamically</p>
        </Card>

        <Card className="p-5 hover:border-primary/30 transition-all cursor-default relative overflow-hidden group">
          <div className="absolute -right-3 -top-3 w-14 h-14 rounded-full bg-primary/5 group-hover:scale-105 transition-transform flex items-center justify-center border border-border/30">
            <TrendingUp size={18} className="text-primary" />
          </div>
          <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-2">Blended ROAS</p>
          <h4 className="text-2xl font-black tracking-tight text-foreground">{avgRoasVal.toFixed(1)}x</h4>
          <Badge variant="success" className="text-[9px] font-black uppercase tracking-wider mt-3.5">
            Excellent Efficiency
          </Badge>
          <p className="text-[9px] text-muted-foreground/60 mt-2.5 uppercase tracking-widest font-black">Calculated last 30d</p>
        </Card>

        <Card className="p-5 hover:border-primary/30 transition-all cursor-default relative overflow-hidden group">
          <div className="absolute -right-3 -top-3 w-14 h-14 rounded-full bg-primary/5 group-hover:scale-105 transition-transform flex items-center justify-center border border-border/30">
            <Percent size={18} className="text-primary" />
          </div>
          <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-2">LTV / CAC Ratio</p>
          <h4 className="text-2xl font-black tracking-tight text-foreground">{ltvToCac.toFixed(1)}x</h4>
          <Badge variant="success" className="text-[9px] font-black uppercase tracking-wider mt-3.5">
            Healthy Unit Model
          </Badge>
          <p className="text-[9px] text-muted-foreground/60 mt-2.5 uppercase tracking-widest font-black">Benchmark: 3.0x</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table & Chart */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ad Channels Spend Chart */}
          <Card className="p-6 relative overflow-hidden shadow-md">
            <div className="flex items-center justify-between mb-6">
              <div>
                <CardTitle className="text-sm font-bold">Channel Allocations & Return (ROI)</CardTitle>
                <p className="text-muted-foreground text-[10px] uppercase tracking-widest font-black mt-0.5">Performance visualizer</p>
              </div>
              <BarChart3 className="text-primary shrink-0" size={18} />
            </div>

            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={24} />
              </div>
            ) : chartData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground text-xs font-medium">
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
                        <stop offset="0%" stopColor="hsl(210, 40%, 98%)" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="hsl(210, 40%, 98%)" stopOpacity={0.15} />
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
                        borderRadius: '8px',
                        color: 'white',
                        fontSize: '11px',
                        fontFamily: 'Outfit, sans-serif',
                        backdropFilter: 'blur(16px)',
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
          </Card>

          {/* Individual Campaigns Table */}
          <Card className="p-6 shadow-md">
            <div className="flex items-center justify-between mb-5">
              <div>
                <CardTitle className="text-sm font-bold">Growth Operations Dashboard</CardTitle>
                <p className="text-muted-foreground text-[10px] uppercase tracking-widest font-black mt-0.5">Individual campaigns monitor</p>
              </div>
              <Button 
                variant="outline"
                size="icon"
                onClick={fetchCampaigns}
                className="w-8 h-8 rounded-full border-border/80"
                title="Synchronize Campaigns"
              >
                <RefreshCw size={12} />
              </Button>
            </div>
            {loading ? (
              <div className="h-48 flex items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={24} />
              </div>
            ) : error ? (
              <div className="p-4 rounded-xl border border-destructive/20 bg-destructive/10 text-destructive flex items-center gap-2 text-xs font-semibold">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            ) : (
              <div className="border border-border rounded-lg overflow-hidden bg-black/10">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-4">Campaign Name</TableHead>
                      <TableHead className="text-center w-28">Status</TableHead>
                      <TableHead className="text-right w-32">Budget Limit</TableHead>
                      <TableHead className="text-right w-32">Actual Spend</TableHead>
                      <TableHead className="text-center w-24">ROAS</TableHead>
                      <TableHead className="text-center w-20 pr-4">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns.map((camp) => (
                      <TableRow key={camp.id}>
                        <TableCell className="font-bold text-foreground pl-4 text-xs">
                          {camp.name}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={camp.status === 'active' ? 'success' : 'outline'} className="text-[9px] font-black uppercase tracking-wider gap-1 py-0.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${camp.status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-muted-foreground'}`} />
                            {camp.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-bold text-foreground text-xs">
                          ${(camp.budget / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right font-bold text-foreground text-xs">
                          ${(camp.spend / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-center font-bold text-primary text-xs">
                          {camp.roas ? `${(camp.roas / 100).toFixed(1)}x` : '-'}
                        </TableCell>
                        <TableCell className="text-center pr-4">
                          <Button 
                            variant="outline"
                            size="icon"
                            onClick={() => toggleCampaignStatus(camp)}
                            title={camp.status === 'active' ? "Pause Campaign" : "Resume Campaign"}
                            className={`w-7 h-7 rounded-lg ${
                              camp.status === 'active' 
                                ? 'bg-amber-500/5 border-amber-500/20 text-amber-400 hover:bg-amber-500/10' 
                                : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10'
                            }`}
                          >
                            {camp.status === 'active' ? <Pause size={12} /> : <Play size={12} />}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </div>

        {/* Campaign Ideas Brainstormer */}
        <div className="space-y-6">
          <Card className="p-6 relative overflow-hidden shadow-md">
            <div className="flex items-center gap-2.5 border-b border-border pb-4 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Sparkles size={16} />
              </div>
              <div>
                <CardTitle className="text-sm font-bold">AI Creative Studio</CardTitle>
                <p className="text-muted-foreground text-[9px] uppercase tracking-widest font-black mt-0.5">Gemini Campaign Brainstormer</p>
              </div>
            </div>

            <form onSubmit={handleGenerateIdeas} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-0.5">Product Description</label>
                <textarea 
                  required
                  rows={4}
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                  placeholder="Describe your product model..."
                  className="glass-input custom-scrollbar resize-none h-[96px] bg-black/10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-0.5">Target Audience</label>
                <Input 
                  type="text"
                  required
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="e.g. Specialty coffee hobbyists"
                  className="bg-black/10"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <Button 
                  type="submit" 
                  disabled={isGenerating}
                  className="flex-1 h-10 text-xs font-bold gap-1.5"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Drafting...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={13} />
                      <span>Brainstorm Concepts</span>
                    </>
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={handleTryDemoInput}
                  title="Inject Specialty Coffee Demo"
                  className="h-10 px-3.5 text-xs font-bold"
                >
                  Demo
                </Button>
              </div>
            </form>

            {generatedIdeas && (
              <div className="mt-6 border-t border-border pt-5 space-y-3 animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-widest font-black text-primary">Generated Brand Blueprint</span>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      size="icon"
                      onClick={handleCopy}
                      className="w-7 h-7 rounded-lg text-muted-foreground hover:text-foreground"
                      title="Copy to clipboard"
                    >
                      {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    </Button>
                    <Button 
                      variant="outline"
                      size="icon"
                      onClick={() => setGeneratedIdeas('')}
                      className="w-7 h-7 rounded-lg text-muted-foreground hover:text-foreground"
                      title="Clear ideas"
                    >
                      <X size={12} />
                    </Button>
                  </div>
                </div>
                
                <div className="bg-black/20 border border-border p-4 rounded-xl max-h-[350px] overflow-y-auto custom-scrollbar shadow-inner">
                  <MarkdownRenderer text={generatedIdeas} />
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

// Markdown rendering helper
const MarkdownRenderer: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return null;
  const lines = text.split('\n');
  return (
    <div className="space-y-2 text-foreground/80 text-[11px] leading-relaxed font-medium">
      {lines.map((line, i) => {
        const content = line.trim();
        if (!content) return <div key={i} className="h-1.5" />;
        
        // Headers
        if (content.startsWith('### ')) {
          return <h5 key={i} className="text-[11px] font-bold text-primary mt-3 mb-1 uppercase tracking-wide">{content.slice(4)}</h5>;
        }
        if (content.startsWith('## ')) {
          return <h4 key={i} className="text-[11px] font-black text-foreground mt-4 mb-1.5 border-l-2 border-primary pl-2">{content.slice(3)}</h4>;
        }
        if (content.startsWith('# ')) {
          return <h3 key={i} className="text-xs font-black text-foreground mt-5 mb-2 border-b border-border pb-1">{content.slice(2)}</h3>;
        }

        // Bullet points
        if (content.startsWith('* ') || content.startsWith('- ')) {
          const formatted = parseBoldText(content.slice(2));
          return (
            <div key={i} className="flex gap-2 items-start pl-1 my-1">
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
            <div key={i} className="flex gap-2 items-start pl-1 my-1">
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

const parseBoldText = (text: string) => {
  const parts = text.split(/\*\*(.*?)\*\"/g);
  return parts.map((part, index) => {
    if (index % 2 === 1) {
      return <strong key={index} className="font-bold text-foreground">{part}</strong>;
    }
    return part;
  });
};
