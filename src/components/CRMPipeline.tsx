import React, { useState } from 'react';
import { 
  Users, Plus, Search, Loader2, AlertCircle, DollarSign, Calendar, ArrowRight, CheckCircle2, XCircle, Edit2
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

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
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">Sales CRM & Pipeline</h2>
          <p className="text-muted-foreground text-xs mt-1">Track pipeline deals, manage customer opportunities, and monitor conversion velocity.</p>
        </div>
        <Button 
          onClick={() => { resetForm(); setIsCreateOpen(true); }}
          className="flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus size={14} />
          New Opportunity
        </Button>
      </header>

      {/* CRM Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 border border-border rounded-xl bg-card divide-y md:divide-y-0 md:divide-x divide-border overflow-hidden shadow-md">
        <div className="p-5 space-y-1 bg-black/10">
          <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Combined Pipeline Value</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-foreground">${pipelineValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            <span className="text-[10px] text-sky-400 font-bold flex items-center gap-0.5"><DollarSign size={10} /> Active Deals</span>
          </div>
        </div>
        <div className="p-5 space-y-1 bg-black/10">
          <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Closed Won Revenue</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-400">${wonValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            <span className="text-[10px] text-emerald-400/70 font-bold flex items-center gap-0.5"><CheckCircle2 size={10} /> Revenue Booked</span>
          </div>
        </div>
        <div className="p-5 space-y-1 bg-black/10">
          <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Win Rate Conversion</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-indigo-400">
              {leads.length > 0 ? Math.round((leads.filter(l => l.status === 'won').length / leads.length) * 100) : 0}%
            </span>
            <span className="text-[10px] text-indigo-400/70 font-bold">Of combined leads</span>
          </div>
        </div>
      </div>

      {/* Pipeline Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between border border-border p-3 rounded-xl bg-card/60 backdrop-blur-md">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={13} />
            <Input 
              type="text"
              placeholder="Search client/company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8.5 h-9 text-xs w-full sm:w-56 bg-black/10"
            />
          </div>

          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
            <Input 
              type="number"
              placeholder="Min value ($)"
              value={minValue}
              onChange={(e) => setMinValue(e.target.value)}
              className="pl-6 h-9 text-xs w-full sm:w-32 bg-black/10"
            />
          </div>
        </div>
        <div className="text-right text-[10px] font-bold text-muted-foreground uppercase tracking-widest hidden sm:block">
          CRM Opportunity Board
        </div>
      </div>

      {/* Kanban Board columns */}
      {isLoading ? (
        <div className="h-96 border border-border rounded-xl bg-card/40 flex items-center justify-center">
          <Loader2 className="animate-spin text-primary" size={24} />
        </div>
      ) : error ? (
        <div className="p-4 border border-destructive/20 bg-destructive/10 text-destructive rounded-xl text-xs font-semibold flex items-center gap-2">
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
                <div className="flex justify-between items-center border-b border-border/40 pb-2">
                  <div>
                    <h4 className={`font-black text-xs ${stage.color}`}>{stage.label}</h4>
                    <p className="text-[9px] font-bold text-muted-foreground tracking-wider uppercase mt-0.5">{stageLeads.length} Deals</p>
                  </div>
                  <span className="text-[10px] font-bold text-foreground/80">${Math.round(totalStageValue).toLocaleString()}</span>
                </div>

                {/* Cards List */}
                <div className="space-y-2 flex-1">
                  {stageLeads.map((lead) => (
                    <div 
                      key={lead.id}
                      onClick={() => handleOpenEdit(lead)}
                      className="border border-border/60 p-3 rounded-lg bg-card hover:bg-accent/40 hover:border-primary/20 transition-all cursor-pointer group space-y-2.5 relative shadow-sm"
                    >
                      <div className="flex justify-between items-start gap-1">
                        <h5 className="font-extrabold text-xs text-foreground group-hover:text-primary transition-colors leading-tight line-clamp-1">{lead.company}</h5>
                        <Button 
                          variant="ghost"
                          size="icon"
                          onClick={(e) => { e.stopPropagation(); handleOpenEdit(lead); }}
                          className="w-5 h-5 rounded text-muted-foreground hover:text-foreground hover:bg-accent/60"
                        >
                          <Edit2 size={10} />
                        </Button>
                      </div>

                      <p className="text-[10px] font-medium text-muted-foreground">{lead.name}</p>

                      <div className="border-t border-border/40 pt-2 flex justify-between items-center text-[10px]">
                        <span className="font-bold text-foreground">${(lead.value / 100).toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                        
                        <div className="flex items-center gap-1.5 text-muted-foreground text-[9px] font-bold uppercase tracking-tight">
                          <Calendar size={9} />
                          <span>{new Date(lead.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </div>
                      </div>

                      {/* Quick stage controls inside card */}
                      <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity justify-end border-t border-border/40 pt-2" onClick={(e) => e.stopPropagation()}>
                        {stage.key !== 'won' && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => updateLeadMutation.mutate({ id: lead.id, status: 'won' })}
                            className="p-0 w-6 h-6 rounded bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            title="Mark Closed Won"
                          >
                            <CheckCircle2 size={10} />
                          </Button>
                        )}
                        {stage.key !== 'lost' && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => updateLeadMutation.mutate({ id: lead.id, status: 'lost' })}
                            className="p-0 w-6 h-6 rounded bg-rose-500/5 hover:bg-rose-500/10 text-rose-400 border-rose-500/20"
                            title="Mark Closed Lost"
                          >
                            <XCircle size={10} />
                          </Button>
                        )}
                        {stage.key !== 'proposal' && stage.key !== 'won' && stage.key !== 'lost' && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => updateLeadMutation.mutate({ id: lead.id, status: 'proposal' })}
                            className="p-0 w-6 h-6 rounded bg-amber-500/5 hover:bg-amber-500/10 text-amber-400 border-amber-500/20"
                            title="Send Proposal"
                          >
                            <ArrowRight size={10} />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  {stageLeads.length === 0 && (
                    <div className="h-28 border border-dashed border-border/60 rounded-lg flex items-center justify-center text-center text-[10px] text-muted-foreground/40 font-medium">
                      No active leads
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CRM Opportunity Creator & Editor Drawers */}
      <Dialog 
        open={isCreateOpen || isEditOpen} 
        onOpenChange={(open) => { 
          if (!open) { 
            setIsCreateOpen(false); 
            setIsEditOpen(false); 
            setSelectedLead(null); 
            resetForm();
          } 
        }}
      >
        <DialogContent className="max-w-md w-full border-border bg-card p-6 shadow-2xl relative overflow-hidden">
          <DialogHeader className="border-b border-border pb-4 mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Users size={15} />
              </div>
              <div>
                <DialogTitle className="text-base font-extrabold text-foreground">
                  {isCreateOpen ? "Create Opportunity" : "Modify Opportunity"}
                </DialogTitle>
                <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-black mt-0.5">Register customer pipeline lead</p>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={isCreateOpen ? handleCreateSubmit : handleEditSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-0.5">Company Name</label>
              <Input 
                type="text"
                required
                value={leadCompany}
                onChange={(e) => setLeadCompany(e.target.value)}
                placeholder="e.g. Stark Industries"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-0.5">Contact Name</label>
              <Input 
                type="text"
                required
                value={leadName}
                onChange={(e) => setLeadName(e.target.value)}
                placeholder="e.g. Tony Stark"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-0.5">Email (Optional)</label>
                <Input 
                  type="email"
                  value={leadEmail}
                  onChange={(e) => setLeadEmail(e.target.value)}
                  placeholder="e.g. tony@stark.io"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-0.5">Phone (Optional)</label>
                <Input 
                  type="text"
                  value={leadPhone}
                  onChange={(e) => setLeadPhone(e.target.value)}
                  placeholder="e.g. +1-555-1234"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-0.5">Deal Value ($)</label>
                <Input 
                  type="number"
                  required
                  min="0"
                  value={leadValue}
                  onChange={(e) => setLeadValue(e.target.value)}
                  placeholder="e.g. 50000"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-0.5">Pipeline Stage</label>
                <Select 
                  value={leadStage} 
                  onValueChange={(val) => setLeadStage(val as any)}
                >
                  <SelectTrigger className="w-full text-xs uppercase font-bold tracking-wider">
                    <SelectValue placeholder="STAGE" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lead">NEW LEAD</SelectItem>
                    <SelectItem value="contacted">CONTACTED</SelectItem>
                    <SelectItem value="proposal">PROPOSAL SENT</SelectItem>
                    <SelectItem value="won">CLOSED WON</SelectItem>
                    <SelectItem value="lost">CLOSED LOST</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button 
                type="submit" 
                disabled={isSaving}
                className="flex-1 h-10 text-xs font-bold gap-1.5"
              >
                {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Users size={13} />}
                <span>{isCreateOpen ? "Create Opportunity" : "Save Changes"}</span>
              </Button>
              <Button 
                type="button"
                variant="outline"
                onClick={() => { setIsCreateOpen(false); setIsEditOpen(false); setSelectedLead(null); resetForm(); }}
                className="h-10 px-4 text-xs font-bold"
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
