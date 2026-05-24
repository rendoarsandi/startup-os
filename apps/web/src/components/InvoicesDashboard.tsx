import React, { useState } from 'react';
import { 
  FileText, Plus, Search, Loader2, AlertCircle, CheckCircle2, Clock, Trash2, Printer, Eye, X, ArrowUpRight, ArrowDownLeft, Sparkles
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface InvoiceItem {
  description: string;
  qty: number;
  rate: number; // in cents
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  type: 'sales' | 'purchase';
  amount: number; // in cents
  status: 'paid' | 'unpaid' | 'overdue';
  issueDate: string;
  dueDate: string;
  items: string; // JSON string of InvoiceItem[]
}

export const InvoicesDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const [filterType, setFilterType] = useState<'all' | 'sales' | 'purchase'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'unpaid' | 'overdue'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  
  // Invoice Creator State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [clientName, setClientName] = useState('');
  const [invoiceType, setInvoiceType] = useState<'sales' | 'purchase'>('sales');
  const [dueDate, setDueDate] = useState('');
  const [lineItems, setLineItems] = useState<InvoiceItem[]>([{ description: '', qty: 1, rate: 0 }]);
  const [isSaving, setIsSaving] = useState(false);

  // AI Invoice Scanner State
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiScanning, setIsAiScanning] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleAiScan = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiScanning(true);
    setAiError(null);
    try {
      const res = await fetch('/api/cfo/parse-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: aiPrompt })
      });
      if (!res.ok) throw new Error('Failed to parse invoice with AI');
      const data = await res.json();
      if (data.clientName) setClientName(data.clientName);
      if (data.type) setInvoiceType(data.type);
      if (data.dueDateOffsetDays) {
        const d = new Date();
        d.setDate(d.getDate() + data.dueDateOffsetDays);
        setDueDate(d.toISOString().split('T')[0]);
      }
      if (data.items && data.items.length > 0) {
        setLineItems(data.items.map((item: any) => ({
          description: item.description || '',
          qty: item.qty || 1,
          rate: item.rate || 0
        })));
      }
      setAiPrompt('');
    } catch (err: any) {
      setAiError(err.message || 'Error occurred during AI scan.');
    } finally {
      setIsAiScanning(false);
    }
  };

  // Fetch Invoices
  const { data: invoices = [], isLoading, error } = useQuery<Invoice[]>({
    queryKey: ['invoices'],
    queryFn: async () => {
      const res = await fetch('/api/cfo/invoices');
      if (!res.ok) throw new Error('Failed to fetch invoices');
      return res.json();
    }
  });

  // Mutate Invoice Status
  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const res = await fetch(`/api/cfo/invoices/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error('Failed to update invoice status');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      // Update currently selected invoice details
      if (selectedInvoice) {
        setSelectedInvoice(prev => prev ? { ...prev, status: prev.status === 'paid' ? 'unpaid' : 'paid' } as Invoice : null);
      }
    }
  });

  // Save Invoice
  const saveMutation = useMutation({
    mutationFn: async (newInvoice: any) => {
      const res = await fetch('/api/cfo/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newInvoice)
      });
      if (!res.ok) throw new Error('Failed to save invoice');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setIsCreateOpen(false);
      resetForm();
    }
  });

  const resetForm = () => {
    setInvoiceNumber('');
    setClientName('');
    setInvoiceType('sales');
    setDueDate('');
    setLineItems([{ description: '', qty: 1, rate: 0 }]);
  };

  const handleAddItem = () => {
    setLineItems([...lineItems, { description: '', qty: 1, rate: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, val: string | number) => {
    const updated = [...lineItems];
    if (field === 'qty') {
      updated[index].qty = Math.max(1, Number(val));
    } else if (field === 'rate') {
      updated[index].rate = Math.max(0, Number(val)); // rate input as regular dollars
    } else {
      updated[index].description = String(val);
    }
    setLineItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) return;

    setIsSaving(true);
    // Calculate total amount in cents
    const totalAmountCents = lineItems.reduce((sum, item) => sum + (item.qty * (item.rate * 100)), 0);
    
    // Format items
    const itemsFormatted = lineItems.map(item => ({
      description: item.description || "General Services",
      qty: item.qty,
      rate: item.rate * 100 // convert dollars to cents
    }));

    try {
      await saveMutation.mutateAsync({
        invoiceNumber: invoiceNumber.trim() || `INV-${Date.now().toString().slice(-6)}`,
        clientName,
        type: invoiceType,
        amount: totalAmountCents,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        items: itemsFormatted
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // Calculations
  const salesInvoices = invoices.filter(inv => inv.type === 'sales');

  const totalSalesInvoiced = salesInvoices.reduce((sum, inv) => sum + inv.amount, 0) / 100;
  const totalSalesCollected = salesInvoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0) / 100;
  const totalSalesOutstanding = salesInvoices.filter(inv => inv.status !== 'paid').reduce((sum, inv) => sum + inv.amount, 0) / 100;

  // Filtered list
  const filteredInvoices = invoices.filter(inv => {
    const matchesType = filterType === 'all' || inv.type === filterType;
    const matchesStatus = filterStatus === 'all' || inv.status === filterStatus;
    const matchesSearch = inv.clientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: 'paid' | 'unpaid' | 'overdue') => {
    switch (status) {
      case 'paid':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"><CheckCircle2 size={12} /> Paid</span>;
      case 'unpaid':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400"><Clock size={12} /> Unpaid</span>;
      case 'overdue':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 border border-rose-500/20 text-rose-400"><AlertCircle size={12} /> Overdue</span>;
    }
  };

  const getInvoiceItems = (itemsStr: string): InvoiceItem[] => {
    try {
      return JSON.parse(itemsStr);
    } catch {
      return [];
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
        <span>Home</span>
        <span>/</span>
        <span>Accounts</span>
        <span>/</span>
        <span className="text-slate-300">Sales & Purchase Invoices</span>
      </div>

      {/* Title & Actions */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Sales & Purchase Invoices</h2>
          <p className="text-slate-400 text-xs mt-1">Manage corporate accounts receivable/payable, track client collections, and register vendor bills.</p>
        </div>
        <button 
          onClick={() => setIsCreateOpen(true)}
          className="btn-primary flex items-center gap-2 text-xs font-bold h-10 px-4 cursor-pointer self-start sm:self-auto"
        >
          <Plus size={14} />
          Create Invoice
        </button>
      </header>

      {/* Accounting Stats Bar - Structured ERP Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 border border-border rounded-lg bg-surface divide-y md:divide-y-0 md:divide-x divide-border overflow-hidden">
        <div className="p-5 space-y-1">
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Total Sales Invoiced</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">${totalSalesInvoiced.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            <span className="text-[10px] text-primary font-bold flex items-center gap-0.5"><ArrowUpRight size={10} /> Billing</span>
          </div>
        </div>
        <div className="p-5 space-y-1">
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Total Collected (Cash In)</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-400">${totalSalesCollected.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            <span className="text-[10px] text-emerald-400/70 font-bold flex items-center gap-0.5"><CheckCircle2 size={10} /> Paid</span>
          </div>
        </div>
        <div className="p-5 space-y-1">
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Total Outstanding (Receivables)</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-400">${totalSalesOutstanding.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            <span className="text-[10px] text-amber-400/70 font-bold flex items-center gap-0.5"><Clock size={10} /> Pending</span>
          </div>
        </div>
      </div>

      {/* Operations Grid: Lists + Side Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Invoices List - 7 Columns */}
        <div className={`${selectedInvoice ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-4 transition-all duration-300`}>
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between border border-white/5 p-3 rounded-xl bg-[#080710]/40 backdrop-blur-md">
            {/* Filter Tabs */}
            <div className="flex border border-white/5 rounded-lg overflow-hidden bg-white/[0.02] p-[2px] w-full sm:w-auto">
              <button 
                onClick={() => setFilterType('all')}
                className={`flex-1 sm:flex-none px-3 py-1.5 text-[10px] font-bold uppercase rounded-md tracking-wider transition-all cursor-pointer ${filterType === 'all' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'}`}
              >
                All
              </button>
              <button 
                onClick={() => setFilterType('sales')}
                className={`flex-1 sm:flex-none px-3 py-1.5 text-[10px] font-bold uppercase rounded-md tracking-wider transition-all cursor-pointer ${filterType === 'sales' ? 'bg-primary/20 text-white border border-primary/10' : 'text-white/40 hover:text-white/70'}`}
              >
                Sales
              </button>
              <button 
                onClick={() => setFilterType('purchase')}
                className={`flex-1 sm:flex-none px-3 py-1.5 text-[10px] font-bold uppercase rounded-md tracking-wider transition-all cursor-pointer ${filterType === 'purchase' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'}`}
              >
                Bills
              </button>
            </div>

            {/* Status Selector */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="glass-input text-[11px] h-9 px-3 py-1 bg-white/[0.02] border-white/5 text-white/70 cursor-pointer rounded-lg uppercase font-bold tracking-wider"
              >
                <option value="all">ALL STATUSES</option>
                <option value="paid">PAID</option>
                <option value="unpaid">UNPAID</option>
                <option value="overdue">OVERDUE</option>
              </select>

              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={13} />
                <input 
                  type="text"
                  placeholder="Search invoice..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="glass-input pl-9 h-9 text-xs w-full sm:w-44 focus:border-primary/40 bg-white/[0.02]"
                />
              </div>
            </div>
          </div>

          {/* List Table */}
          {isLoading ? (
            <div className="h-64 border border-white/5 rounded-xl bg-white/[0.01] flex items-center justify-center">
              <Loader2 className="animate-spin text-primary" size={24} />
            </div>
          ) : error ? (
            <div className="p-4 border border-rose-500/10 bg-rose-500/5 text-rose-400 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle size={16} />
              <span>Failed to fetch invoice register.</span>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="h-64 border border-white/5 rounded-xl bg-white/[0.01] flex flex-col items-center justify-center text-center p-6">
              <FileText className="text-white/20 mb-3" size={32} />
              <p className="text-sm font-bold text-white/60">No invoices match selected criteria.</p>
              <p className="text-xs text-white/30 mt-1">Create a new invoice or adjust filters to view items.</p>
            </div>
          ) : (
            <div className="border border-white/5 rounded-xl bg-[#080710]/40 backdrop-blur-md overflow-hidden">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-[9px] uppercase font-black text-white/30 tracking-widest pb-3 bg-white/[0.01]">
                      <th className="py-3 px-4">Invoice #</th>
                      <th className="py-3 px-4">Party / Client</th>
                      <th className="py-3 px-4 text-center">Type</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.map((inv) => (
                      <tr 
                        key={inv.id} 
                        onClick={() => setSelectedInvoice(inv)}
                        className={`border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors cursor-pointer group ${selectedInvoice?.id === inv.id ? 'bg-primary/5 border-primary/20' : ''}`}
                      >
                        <td className="py-3.5 px-4 font-black text-white/90 group-hover:text-primary transition-colors">{inv.invoiceNumber}</td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white/80">{inv.clientName}</div>
                          <div className="text-[10px] text-white/30 mt-0.5 font-semibold">Due: {new Date(inv.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {inv.type === 'sales' ? (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-black uppercase text-primary tracking-wider px-1.5 py-0.5 rounded bg-primary/5"><ArrowUpRight size={8} /> Sales</span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-black uppercase text-amber-500 tracking-wider px-1.5 py-0.5 rounded bg-amber-500/5"><ArrowDownLeft size={8} /> Bill</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-white">
                          ${(inv.amount / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {getStatusBadge(inv.status)}
                        </td>
                        <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <button 
                            onClick={() => setSelectedInvoice(inv)}
                            className="w-7 h-7 rounded-lg hover:bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all cursor-pointer inline-block"
                            title="Printable Preview"
                          >
                            <Eye size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Invoice Interactive Print View / Details - 5 Columns */}
        {selectedInvoice && (
          <div className="lg:col-span-5 border border-white/10 rounded-xl bg-white/[0.02] p-5 space-y-5 animate-in slide-in-from-right-4 duration-300">
            {/* Header Control panel */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div>
                <h4 className="font-extrabold text-sm text-white">{selectedInvoice.invoiceNumber}</h4>
                <p className="text-[10px] text-white/40 uppercase tracking-widest font-black mt-0.5">Official Document Record</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => statusMutation.mutate({ id: selectedInvoice.id, status: selectedInvoice.status === 'paid' ? 'unpaid' : 'paid' })}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider cursor-pointer border ${selectedInvoice.status === 'paid' ? 'bg-amber-500/10 text-amber-400 border-amber-500/10 hover:bg-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/10 hover:bg-emerald-500/20'}`}
                >
                  {selectedInvoice.status === 'paid' ? 'Mark Unpaid' : 'Mark Paid'}
                </button>
                <button 
                  onClick={() => setSelectedInvoice(null)}
                  className="w-7 h-7 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all cursor-pointer font-bold text-xs"
                >
                  <X size={12} />
                </button>
              </div>
            </div>

            {/* Document PDF Template Simulation */}
            <div className="bg-white text-slate-800 p-6 rounded-lg shadow-2xl border border-slate-300 font-serif leading-relaxed text-[11px] select-text">
              {/* Invoice Stamp Header */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                <div>
                  <h3 className="font-sans font-black text-lg tracking-wider text-slate-900 leading-none">STARTUP OS</h3>
                  <p className="font-sans font-semibold text-[8px] tracking-widest uppercase text-slate-400 mt-1">C-Suite Enterprise Suite</p>
                  <p className="text-slate-500 mt-2 font-sans font-medium text-[9px]">100 Pine Street, Floor 18<br />San Francisco, CA 94111</p>
                </div>
                <div className="text-right">
                  <h2 className="font-sans font-black text-base text-slate-900 leading-none tracking-tight">INVOICE</h2>
                  <p className="font-sans text-[10px] text-slate-500 mt-1.5 font-bold">Doc #: {selectedInvoice.invoiceNumber}</p>
                  <p className="font-sans text-[8px] text-slate-400 mt-1 font-semibold uppercase">Status: {selectedInvoice.status}</p>
                </div>
              </div>

              {/* Bill To / Details */}
              <div className="grid grid-cols-2 gap-4 my-4 font-sans text-[9px] font-medium">
                <div>
                  <h5 className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none">Bill To:</h5>
                  <p className="font-bold text-slate-800 mt-1 text-[10px]">{selectedInvoice.clientName}</p>
                  <p className="text-slate-500 mt-0.5">Corporate Accounting Hub</p>
                </div>
                <div className="text-right space-y-1">
                  <p><span className="text-slate-400 font-semibold uppercase text-[7px] tracking-wider pr-1">Issue Date:</span> <strong className="text-slate-700">{new Date(selectedInvoice.issueDate).toLocaleDateString('en-US')}</strong></p>
                  <p><span className="text-slate-400 font-semibold uppercase text-[7px] tracking-wider pr-1">Due Date:</span> <strong className="text-slate-700">{new Date(selectedInvoice.dueDate).toLocaleDateString('en-US')}</strong></p>
                  <p><span className="text-slate-400 font-semibold uppercase text-[7px] tracking-wider pr-1">Terms:</span> <strong className="text-slate-700">Due On Receipt</strong></p>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-left my-4 border-collapse font-sans text-[9px]">
                <thead>
                  <tr className="border-b-2 border-slate-200 text-slate-400 uppercase text-[7px] font-black tracking-wider pb-1.5">
                    <th className="py-1">Item Description</th>
                    <th className="py-1 text-center w-12">Qty</th>
                    <th className="py-1 text-right w-16">Unit Rate</th>
                    <th className="py-1 text-right w-20">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {getInvoiceItems(selectedInvoice.items).map((item, i) => (
                    <tr key={i} className="border-b border-slate-100 text-slate-700">
                      <td className="py-2.5 font-semibold text-slate-800">{item.description}</td>
                      <td className="py-2.5 text-center font-semibold text-slate-500">{item.qty}</td>
                      <td className="py-2.5 text-right font-semibold text-slate-500">${(item.rate / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td className="py-2.5 text-right font-bold text-slate-900">${((item.qty * item.rate) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals Summary */}
              <div className="flex justify-between items-start mt-6 pt-4 border-t border-slate-100 font-sans">
                <div className="text-[8px] text-slate-400 italic">
                  Thank you for your business.
                </div>
                <div className="w-48 text-right space-y-1.5 text-[9px] font-medium">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal:</span>
                    <span>${(selectedInvoice.amount / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Tax (0%):</span>
                    <span>$0.00</span>
                  </div>
                  <div className="flex justify-between border-t-2 border-slate-200 pt-1.5 text-slate-900 font-black text-[11px]">
                    <span>Total Due:</span>
                    <span>${(selectedInvoice.amount / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </div>

            <button 
              onClick={() => window.print()}
              className="btn-secondary h-10 w-full flex items-center justify-center gap-2 text-xs font-bold bg-white/5 hover:bg-white/10 text-white tracking-wider uppercase border border-white/5"
            >
              <Printer size={13} />
              <span>Print Official Invoice</span>
            </button>
          </div>
        )}
      </div>

      {/* Invoice Creator Drawer Overlay */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="glass-card max-w-2xl w-full border-primary/20 bg-gradient-to-b from-[#0e0c1b] to-[#080710] p-6 space-y-5 animate-in zoom-in-95 duration-200 shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar">
            
            <header className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <FileText size={15} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base">Compile New Invoice</h3>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest font-black mt-0.5">Register financial record log</p>
                </div>
              </div>
              <button 
                onClick={() => setIsCreateOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors cursor-pointer font-bold"
              >
                ✕
              </button>
            </header>

            {/* AI Invoice Scan / Paste Assistant */}
            <div className="border border-primary/20 rounded-lg p-4 bg-primary/5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-primary animate-pulse" />
                  <span className="text-xs font-bold text-white">AI Invoice Draft Assistant</span>
                </div>
                <span className="text-[9px] font-bold text-slate-400 bg-white/5 px-2 py-0.5 rounded">Powered by Gemini</span>
              </div>
              <p className="text-[10px] text-slate-400">Paste your raw receipt text, invoice logs, or email contents below and click draft to auto-populate the form items instantly.</p>
              <div className="flex gap-2">
                <textarea 
                  placeholder="Paste invoice text here... e.g., 'Acme Corp bought 5 Macbook Pro units at $3000 each, payment due next week'"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className="glass-input text-xs h-16 py-2 bg-white/[0.01] resize-none"
                />
                <button
                  type="button"
                  onClick={handleAiScan}
                  disabled={isAiScanning || !aiPrompt.trim()}
                  className="btn-primary h-auto px-4 flex flex-col justify-center items-center gap-1.5 cursor-pointer disabled:opacity-50 text-[10px]"
                >
                  {isAiScanning ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  <span>Draft</span>
                </button>
              </div>
              {aiError && (
                <p className="text-[10px] text-red-400 font-bold">{aiError}</p>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest">Client / Vendor Name</label>
                  <input 
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g. Wayne Enterprises"
                    className="glass-input bg-white/[0.01]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest">Document Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setInvoiceType('sales')}
                      className={`h-[42px] px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer ${invoiceType === 'sales' ? 'bg-primary/20 text-white border-primary/30' : 'bg-white/5 text-white/40 border-transparent hover:bg-white/10 hover:text-white/60'}`}
                    >
                      Sales Invoice
                    </button>
                    <button
                      type="button"
                      onClick={() => setInvoiceType('purchase')}
                      className={`h-[42px] px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer ${invoiceType === 'purchase' ? 'bg-primary/20 text-white border-primary/30' : 'bg-white/5 text-white/40 border-transparent hover:bg-white/10 hover:text-white/60'}`}
                    >
                      Purchase Bill
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest">Invoice Number (Optional)</label>
                  <input 
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="e.g. INV-2026-004 (Auto)"
                    className="glass-input bg-white/[0.01]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest">Payment Due Date</label>
                  <input 
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="glass-input bg-white/[0.01]"
                  />
                </div>

              </div>

              {/* Interactive Line Items Grid */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-white/50">Invoice Billing Line Items</span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="flex items-center gap-1 text-[10px] font-black uppercase text-primary hover:text-primary/80 transition-colors cursor-pointer"
                  >
                    <Plus size={10} /> Add Line Item
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                  {lineItems.map((item, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <div className="flex-1">
                        <input 
                          type="text"
                          required
                          value={item.description}
                          onChange={(e) => handleItemChange(i, 'description', e.target.value)}
                          placeholder="Line item description..."
                          className="glass-input bg-white/[0.01] text-xs h-9"
                        />
                      </div>
                      <div className="w-16">
                        <input 
                          type="number"
                          required
                          min="1"
                          value={item.qty}
                          onChange={(e) => handleItemChange(i, 'qty', e.target.value)}
                          className="glass-input bg-white/[0.01] text-xs text-center h-9"
                          title="Quantity"
                        />
                      </div>
                      <div className="w-24">
                        <input 
                          type="number"
                          required
                          min="0"
                          value={item.rate === 0 ? '' : item.rate}
                          onChange={(e) => handleItemChange(i, 'rate', e.target.value)}
                          placeholder="Rate ($)"
                          className="glass-input bg-white/[0.01] text-xs text-right h-9"
                          title="Rate ($)"
                        />
                      </div>
                      <button
                        type="button"
                        disabled={lineItems.length === 1}
                        onClick={() => handleRemoveItem(i)}
                        className="w-9 h-9 border border-white/5 hover:border-red-500/20 bg-white/5 hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-all rounded-lg flex items-center justify-center cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subtotal calculation */}
              <div className="border-t border-white/5 pt-4 flex justify-between items-center text-xs font-bold text-white/70">
                <span>ESTIMATED GRAND TOTAL:</span>
                <span className="text-sm font-black text-white">
                  ${lineItems.reduce((sum, item) => sum + (item.qty * (item.rate || 0)), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="btn-primary flex-1 h-11 text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                  <span>Generate Official Record</span>
                </button>
                <button 
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
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
