import React, { useState } from 'react';
import { 
  Users, Plus, Search, Loader2, AlertCircle, DollarSign, Calendar, ArrowRight, CheckCircle2, XCircle, Edit2
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface CRMLead {
  id: string;
  name: string;
  company: string;
  email: string | null;
  phone: string | null;
  value: number; // in cents
  status: 'lead' | 'contacted' | 'proposal' | 'won' | 'lost';
  createdAt: string;
  updatedAt: string;
}

const STAGES: { key: CRMLead['status']; label: string; color: string; border: string; bg: string }[] = [
  { key: 'lead', label: 'New Lead', color: 'text-sky-400', border: 'border-sky-500/20', bg: 'bg-sky-500/5' },
  { key: 'contacted', label: 'Contacted', color: 'text-indigo-400', border: 'border-indigo-500/20', bg: 'bg-indigo-500/5' },
  { key: 'proposal', label: 'Proposal Sent', color: 'text-amber-400', border: 'border-amber-500/20', bg: 'bg-amber-500/5' },
  { key: 'won', label: 'Closed Won', color: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'bg-emerald-500/5' },
  { key: 'lost', label: 'Closed Lost', color: 'text-rose-400', border: 'border-rose-500/20', bg: 'bg-rose-500/5' }
];

export const CRMPipeline: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [minValue, setMinValue] = useState('');
  
  // Modals / Editor State
  const [selectedLead, setSelectedLead] = useState<CRMLead | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Form State
  const [leadName, setLeadName] = useState('');
  const [leadCompany, setLeadCompany] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadValue, setLeadValue] = useState('');
  const [leadStage, setLeadStage] = useState<CRMLead['status']>('lead');
  const [isSaving, setIsSaving] = useState(false);

  // Fetch Leads
  const { data: leads = [], isLoading, error } = useQuery<CRMLead[]>({
    queryKey: ['crmLeads'],
    queryFn: async () => {
      const res = await fetch('/api/marketing/crm');
      if (!res.ok) throw new Error('Failed to fetch CRM leads');
      return res.json();
    }
  });

  // Mutate Lead
  const saveLeadMutation = useMutation({
    mutationFn: async (leadData: any) => {
      const res = await fetch('/api/marketing/crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadData)
      });
      if (!res.ok) throw new Error('Failed to save CRM lead');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crmLeads'] });
      setIsCreateOpen(false);
      resetForm();
    }
  });

  const updateLeadMutation = useMutation({
    mutationFn: async ({ id, ...leadData }: { id: string } & Partial<CRMLead>) => {
      const res = await fetch(`/api/marketing/crm/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadData)
      });
      if (!res.ok) throw new Error('Failed to update CRM lead');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crmLeads'] });
      setIsEditOpen(false);
      setSelectedLead(null);
    }
  });

  const resetForm = () => {
    setLeadName('');
    setLeadCompany('');
    setLeadEmail('');
    setLeadPhone('');
    setLeadValue('');
    setLeadStage('lead');
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName.trim() || !leadCompany.trim()) return;

    setIsSaving(true);
    const valueCents = Math.round(parseFloat(leadValue) * 100) || 0;
    try {
      await saveLeadMutation.mutateAsync({
        name: leadName,
        company: leadCompany,
        email: leadEmail || null,
        phone: leadPhone || null,
        value: valueCents,
        status: leadStage
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;

    setIsSaving(true);
    const valueCents = Math.round(parseFloat(leadValue) * 100) || 0;
    try {
      await updateLeadMutation.mutateAsync({
        id: selectedLead.id,
        name: leadName,
        company: leadCompany,
        email: leadEmail || null,
        phone: leadPhone || null,
        value: valueCents,
        status: leadStage
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenEdit = (lead: CRMLead) => {
    setSelectedLead(lead);
    setLeadName(lead.name);
    setLeadCompany(lead.company);
    setLeadEmail(lead.email || '');
    setLeadPhone(lead.phone || '');
    setLeadValue((lead.value / 100).toString());
    setLeadStage(lead.status);
    setIsEditOpen(true);
  };

  // Pipeline math
  const activeLeads = leads.filter(l => l.status !== 'lost');
  const pipelineValue = activeLeads.reduce((sum, l) => sum + l.value, 0) / 100;
  const wonValue = leads.filter(l => l.status === 'won').reduce((sum, l) => sum + l.value, 0) / 100;

  // Filtered leads
  const filteredLeads = leads.filter(l => {
    const matchesSearch = l.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          l.company.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMinVal = !minValue || (l.value / 100) >= parseFloat(minValue);
    return matchesSearch && matchesMinVal;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Sales CRM & Pipeline</h2>
          <p className="text-white/40 text-xs mt-1">Track pipeline deals, manage customer opportunities, and monitor conversion velocity.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsCreateOpen(true); }}
          className="btn-primary flex items-center gap-2 text-xs font-extrabold h-10 px-4 cursor-pointer self-start sm:self-auto"
        >
          <Plus size={14} />
          New Opportunity
        </button>
      </header>

      {/* CRM Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 border border-white/5 rounded-xl bg-white/[0.01] divide-y md:divide-y-0 md:divide-x divide-white/5 overflow-hidden">
        <div className="p-5 space-y-1">
          <p className="text-white/40 text-[10px] font-black uppercase tracking-wider">Combined Pipeline Value</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">${pipelineValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            <span className="text-[10px] text-sky-400 font-bold flex items-center gap-0.5"><DollarSign size={10} /> Active Deals</span>
          </div>
        </div>
        <div className="p-5 space-y-1">
          <p className="text-white/40 text-[10px] font-black uppercase tracking-wider">Closed Won Revenue</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-400">${wonValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            <span className="text-[10px] text-emerald-400/70 font-bold flex items-center gap-0.5"><CheckCircle2 size={10} /> Revenue Booked</span>
          </div>
        </div>
        <div className="p-5 space-y-1">
          <p className="text-white/40 text-[10px] font-black uppercase tracking-wider">Win Rate Conversion</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-indigo-400">
              {leads.length > 0 ? Math.round((leads.filter(l => l.status === 'won').length / leads.length) * 100) : 0}%
            </span>
            <span className="text-[10px] text-indigo-400/70 font-bold">Of combined leads</span>
          </div>
        </div>
      </div>

      {/* Pipeline Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between border border-white/5 p-3 rounded-xl bg-[#080710]/40 backdrop-blur-md">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={13} />
            <input 
              type="text"
              placeholder="Search client/company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass-input pl-9 h-9 text-xs w-full sm:w-56 focus:border-primary/40 bg-white/[0.02]"
            />
          </div>

          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-xs">$</span>
            <input 
              type="number"
              placeholder="Min value ($)"
              value={minValue}
              onChange={(e) => setMinValue(e.target.value)}
              className="glass-input pl-6 h-9 text-xs w-full sm:w-32 focus:border-primary/40 bg-white/[0.02]"
            />
          </div>
        </div>
        <div className="text-right text-[10px] font-bold text-white/40 uppercase tracking-widest hidden sm:block">
          CRM Opportunity Board
        </div>
      </div>

      {/* Kanban Board columns */}
      {isLoading ? (
        <div className="h-96 border border-white/5 rounded-xl bg-white/[0.01] flex items-center justify-center">
          <Loader2 className="animate-spin text-primary" size={24} />
        </div>
      ) : error ? (
        <div className="p-4 border border-rose-500/10 bg-rose-500/5 text-rose-400 rounded-xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle size={16} />
          <span>Failed to fetch CRM pipelines records.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start select-none">
          {STAGES.map((stage) => {
            const stageLeads = filteredLeads.filter(l => l.status === stage.key);
            const totalStageValue = stageLeads.reduce((sum, l) => sum + l.value, 0) / 100;
            return (
              <div 
                key={stage.key} 
                className={`border ${stage.border} rounded-xl ${stage.bg} flex flex-col p-3 space-y-3 min-h-[450px] max-h-[600px] overflow-y-auto custom-scrollbar`}
              >
                {/* Stage Header */}
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <div>
                    <h4 className={`font-black text-xs ${stage.color}`}>{stage.label}</h4>
                    <p className="text-[9px] font-bold text-white/30 tracking-wider uppercase mt-0.5">{stageLeads.length} Opportunities</p>
                  </div>
                  <span className="text-[10px] font-black text-white/70">${Math.round(totalStageValue).toLocaleString()}</span>
                </div>

                {/* Cards List */}
                <div className="space-y-2 flex-1">
                  {stageLeads.map((lead) => (
                    <div 
                      key={lead.id}
                      onClick={() => handleOpenEdit(lead)}
                      className="border border-white/5 p-3 rounded-lg bg-black/40 hover:bg-white/[0.03] hover:border-white/10 transition-all cursor-pointer group space-y-2.5 relative"
                    >
                      <div className="flex justify-between items-start gap-1">
                        <h5 className="font-extrabold text-xs text-white/90 group-hover:text-primary transition-colors leading-tight line-clamp-1">{lead.company}</h5>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleOpenEdit(lead); }}
                          className="w-5 h-5 rounded hover:bg-white/5 flex items-center justify-center text-white/20 hover:text-white transition-colors shrink-0"
                        >
                          <Edit2 size={10} />
                        </button>
                      </div>

                      <p className="text-[10px] font-medium text-white/50">{lead.name}</p>

                      <div className="border-t border-white/[0.04] pt-2 flex justify-between items-center text-[10px]">
                        <span className="font-black text-white">${(lead.value / 100).toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                        
                        <div className="flex items-center gap-1.5 text-white/30 text-[9px] font-bold uppercase tracking-tight">
                          <Calendar size={9} />
                          <span>{new Date(lead.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </div>
                      </div>

                      {/* Quick stage controls inside card */}
                      <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity justify-end border-t border-white/[0.04] pt-2">
                        {stage.key !== 'won' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateLeadMutation.mutate({ id: lead.id, status: 'won' });
                            }}
                            className="p-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/10 cursor-pointer"
                            title="Mark Closed Won"
                          >
                            <CheckCircle2 size={10} />
                          </button>
                        )}
                        {stage.key !== 'lost' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateLeadMutation.mutate({ id: lead.id, status: 'lost' });
                            }}
                            className="p-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/10 cursor-pointer"
                            title="Mark Closed Lost"
                          >
                            <XCircle size={10} />
                          </button>
                        )}
                        {stage.key !== 'proposal' && stage.key !== 'won' && stage.key !== 'lost' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateLeadMutation.mutate({ id: lead.id, status: 'proposal' });
                            }}
                            className="p-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/10 cursor-pointer"
                            title="Send Proposal"
                          >
                            <ArrowRight size={10} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {stageLeads.length === 0 && (
                    <div className="h-32 border border-dashed border-white/5 rounded-lg flex items-center justify-center text-center text-[10px] text-white/20">
                      Drag or move leads here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CRM Opportunity Creator & Editor Drawers */}
      {(isCreateOpen || isEditOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="glass-card max-w-md w-full border-primary/20 bg-gradient-to-b from-[#0e0c1b] to-[#080710] p-6 space-y-5 animate-in zoom-in-95 duration-200 shadow-2xl relative overflow-hidden">
            
            <header className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Users size={15} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base">{isCreateOpen ? "Create Opportunity" : "Modify Opportunity"}</h3>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest font-black mt-0.5">Register customer pipeline lead</p>
                </div>
              </div>
              <button 
                onClick={() => { setIsCreateOpen(false); setIsEditOpen(false); setSelectedLead(null); }}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors cursor-pointer font-bold"
              >
                ✕
              </button>
            </header>

            <form onSubmit={isCreateOpen ? handleCreateSubmit : handleEditSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest">Company Name</label>
                <input 
                  type="text"
                  required
                  value={leadCompany}
                  onChange={(e) => setLeadCompany(e.target.value)}
                  placeholder="e.g. Stark Industries"
                  className="glass-input bg-white/[0.01]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest">Contact Name</label>
                <input 
                  type="text"
                  required
                  value={leadName}
                  onChange={(e) => setLeadName(e.target.value)}
                  placeholder="e.g. Tony Stark"
                  className="glass-input bg-white/[0.01]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest">Email (Optional)</label>
                  <input 
                    type="email"
                    value={leadEmail}
                    onChange={(e) => setLeadEmail(e.target.value)}
                    placeholder="e.g. tony@stark.io"
                    className="glass-input bg-white/[0.01] text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest">Phone (Optional)</label>
                  <input 
                    type="text"
                    value={leadPhone}
                    onChange={(e) => setLeadPhone(e.target.value)}
                    placeholder="e.g. +1-555-1234"
                    className="glass-input bg-white/[0.01] text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest">Deal Value ($)</label>
                  <input 
                    type="number"
                    required
                    min="0"
                    value={leadValue}
                    onChange={(e) => setLeadValue(e.target.value)}
                    placeholder="e.g. 50000"
                    className="glass-input bg-white/[0.01]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest">Pipeline Stage</label>
                  <select
                    value={leadStage}
                    onChange={(e) => setLeadStage(e.target.value as any)}
                    className="glass-input bg-[#080710] pr-8 cursor-pointer uppercase font-bold text-xs"
                  >
                    <option value="lead">NEW LEAD</option>
                    <option value="contacted">CONTACTED</option>
                    <option value="proposal">PROPOSAL SENT</option>
                    <option value="won">CLOSED WON</option>
                    <option value="lost">CLOSED LOST</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="btn-primary flex-1 h-11 text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Users size={14} />}
                  <span>{isCreateOpen ? "Create opportunity" : "Save changes"}</span>
                </button>
                <button 
                  type="button"
                  onClick={() => { setIsCreateOpen(false); setIsEditOpen(false); setSelectedLead(null); }}
                  className="btn-secondary h-11 px-4 text-xs font-bold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
