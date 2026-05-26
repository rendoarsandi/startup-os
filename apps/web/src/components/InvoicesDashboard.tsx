import React, { useState } from 'react';
import { 
  FileText, Plus, Search, Loader2, AlertCircle, CheckCircle2, Clock, Trash2, Printer, Eye, X, ArrowUpRight, ArrowDownLeft, Sparkles
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAiScanning, setIsAiScanning] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [mathError, setMathError] = useState<string | null>(null);

  const handleAiScan = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiScanning(true);
    setAiError(null);
    setMathError(null);
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

  const handleFileUploadScan = async () => {
    if (!selectedFile) return;
    setIsAiScanning(true);
    setAiError(null);
    setMathError(null);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64String = reader.result as string;
        const commaIndex = base64String.indexOf(',');
        const cleanBase64 = base64String.slice(commaIndex + 1);
        const mimeType = selectedFile.type;

        try {
          const res = await fetch('/api/cfo/parse-invoice-secure', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileBase64: cleanBase64, mimeType })
          });
          if (!res.ok) throw new Error('Failed to scan document with AI');
          const data = await res.json();

          if (data.clientName) setClientName(data.clientName);
          if (data.type) setInvoiceType(data.type);
          if (data.invoiceNumber) setInvoiceNumber(data.invoiceNumber);
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

          if (data.isMathAccurate === false) {
            setMathError(`Alert: The scanned invoice total ($${data.grandTotal}) does not mathematically match the sum of extracted line items ($${data.calculatedGrandTotal}). Please manually review details before compiling.`);
          } else {
            setMathError(null);
          }
          setSelectedFile(null);
        } catch (e: any) {
          setAiError(e.message || 'Verification scan failed.');
        }
      };
      reader.readAsDataURL(selectedFile);
    } catch (err: any) {
      setAiError(err.message || 'Error occurred while uploading.');
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
    setMathError(null);
    setAiError(null);
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
        return <Badge variant="success" className="gap-1.5"><CheckCircle2 size={12} /> Paid</Badge>;
      case 'unpaid':
        return <Badge variant="warning" className="gap-1.5"><Clock size={12} /> Unpaid</Badge>;
      case 'overdue':
        return <Badge variant="destructive" className="gap-1.5"><AlertCircle size={12} /> Overdue</Badge>;
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
      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5 pl-0.5">
        <span>Home</span>
        <span>/</span>
        <span>Accounts</span>
        <span>/</span>
        <span className="text-foreground/80">Sales & Purchase Invoices</span>
      </div>

      {/* Title & Actions */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">Sales & Purchase Invoices</h2>
          <p className="text-muted-foreground text-xs mt-1">Manage corporate accounts receivable/payable, track client collections, and register vendor bills.</p>
        </div>
        <Button 
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus size={14} />
          Create Invoice
        </Button>
      </header>

      {/* Accounting Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 border border-border rounded-xl bg-card divide-y md:divide-y-0 md:divide-x divide-border overflow-hidden shadow-md">
        <div className="p-5 space-y-1 bg-black/10">
          <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Total Sales Invoiced</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-foreground">${totalSalesInvoiced.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            <span className="text-[10px] text-primary font-bold flex items-center gap-0.5"><ArrowUpRight size={10} /> Billing</span>
          </div>
        </div>
        <div className="p-5 space-y-1 bg-black/10">
          <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Total Collected (Cash In)</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-400">${totalSalesCollected.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            <span className="text-[10px] text-emerald-400/70 font-bold flex items-center gap-0.5"><CheckCircle2 size={10} /> Paid</span>
          </div>
        </div>
        <div className="p-5 space-y-1 bg-black/10">
          <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Total Outstanding (Receivables)</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-400">${totalSalesOutstanding.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            <span className="text-[10px] text-amber-400/70 font-bold flex items-center gap-0.5"><Clock size={10} /> Pending</span>
          </div>
        </div>
      </div>

      {/* Operations Grid: Lists + Side Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Invoices List */}
        <div className={`${selectedInvoice ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-4 transition-all duration-300`}>
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between border border-border p-3 rounded-xl bg-card/60 backdrop-blur-md">
            
            <Tabs 
              value={filterType} 
              onValueChange={(val) => setFilterType(val as any)} 
              className="w-full sm:w-auto"
            >
              <TabsList className="grid grid-cols-3 w-full sm:w-60 h-9">
                <TabsTrigger value="all" className="py-1 text-[10px]">All</TabsTrigger>
                <TabsTrigger value="sales" className="py-1 text-[10px]">Sales</TabsTrigger>
                <TabsTrigger value="purchase" className="py-1 text-[10px]">Bills</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Status & Search Selector */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Select 
                value={filterStatus} 
                onValueChange={(val) => setFilterStatus(val as any)}
              >
                <SelectTrigger className="w-full sm:w-36 h-9 text-[10px] uppercase font-bold tracking-wider">
                  <SelectValue placeholder="STATUS" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ALL STATUSES</SelectItem>
                  <SelectItem value="paid">PAID</SelectItem>
                  <SelectItem value="unpaid">UNPAID</SelectItem>
                  <SelectItem value="overdue">OVERDUE</SelectItem>
                </SelectContent>
              </Select>

              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={13} />
                <Input 
                  type="text"
                  placeholder="Search invoice..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8.5 h-9 text-xs w-full sm:w-44 bg-black/10 focus:bg-black/25"
                />
              </div>
            </div>
          </div>

          {/* List Table */}
          {isLoading ? (
            <div className="h-64 border border-border rounded-xl bg-card/40 flex items-center justify-center">
              <Loader2 className="animate-spin text-primary" size={24} />
            </div>
          ) : error ? (
            <div className="p-4 border border-destructive/20 bg-destructive/10 text-destructive rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle size={16} />
              <span>Failed to fetch invoice register.</span>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="h-64 border border-border rounded-xl bg-card/40 flex flex-col items-center justify-center text-center p-6 shadow-sm">
              <FileText className="text-muted-foreground/30 mb-3" size={32} />
              <p className="text-sm font-bold text-foreground/60">No invoices match selected criteria.</p>
              <p className="text-xs text-muted-foreground mt-1">Create a new invoice or adjust filters to view items.</p>
            </div>
          ) : (
            <div className="border border-border rounded-xl bg-card/40 backdrop-blur-md overflow-hidden shadow-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24 pl-5">Invoice #</TableHead>
                    <TableHead>Party / Client</TableHead>
                    <TableHead className="text-center w-20">Type</TableHead>
                    <TableHead className="text-right w-32">Amount</TableHead>
                    <TableHead className="text-center w-28">Status</TableHead>
                    <TableHead className="text-center w-16 pr-5">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((inv) => (
                    <TableRow 
                      key={inv.id} 
                      onClick={() => setSelectedInvoice(inv)}
                      className={`cursor-pointer ${selectedInvoice?.id === inv.id ? 'bg-primary/5 hover:bg-primary/10 border-primary/20' : ''}`}
                    >
                      <TableCell className="font-bold text-foreground pl-5">{inv.invoiceNumber}</TableCell>
                      <TableCell>
                        <div className="font-bold text-foreground/80">{inv.clientName}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5 font-semibold">Due: {new Date(inv.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                      </TableCell>
                      <TableCell className="text-center">
                        {inv.type === 'sales' ? (
                          <Badge variant="outline" className="text-[9px] font-black uppercase text-primary border-primary/20 bg-primary/5 gap-0.5"><ArrowUpRight size={8} /> Sales</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[9px] font-black uppercase text-amber-500 border-amber-500/20 bg-amber-500/5 gap-0.5"><ArrowDownLeft size={8} /> Bill</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-bold text-foreground">
                        ${(inv.amount / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(inv.status)}
                      </TableCell>
                      <TableCell className="text-center pr-5" onClick={(e) => e.stopPropagation()}>
                        <Button 
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedInvoice(inv)}
                          className="w-7 h-7 hover:bg-accent/40 text-muted-foreground hover:text-foreground"
                          title="Printable Preview"
                        >
                          <Eye size={12} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Invoice Interactive Print View / Details */}
        {selectedInvoice && (
          <div className="lg:col-span-5 border border-border rounded-xl bg-card/60 p-5 space-y-5 shadow-2xl animate-in slide-in-from-right-4 duration-300">
            {/* Header Control panel */}
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h4 className="font-bold text-sm text-foreground">{selectedInvoice.invoiceNumber}</h4>
                <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-black mt-0.5">Official Document Record</p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => statusMutation.mutate({ id: selectedInvoice.id, status: selectedInvoice.status === 'paid' ? 'unpaid' : 'paid' })}
                  className={`h-7 px-2.5 rounded-lg text-[9px] font-bold uppercase tracking-wider ${selectedInvoice.status === 'paid' ? 'text-amber-400 hover:text-amber-300 bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10' : 'text-emerald-400 hover:text-emerald-300 bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10'}`}
                >
                  {selectedInvoice.status === 'paid' ? 'Mark Unpaid' : 'Mark Paid'}
                </Button>
                <Button 
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedInvoice(null)}
                  className="w-7 h-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent/40"
                >
                  <X size={12} />
                </Button>
              </div>
            </div>

            {/* Document PDF Template Simulation */}
            <div className="bg-white text-slate-800 p-6 rounded-lg shadow-xl border border-slate-200 font-serif leading-relaxed text-[10px] select-text">
              <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                <div>
                  <h3 className="font-sans font-black text-base tracking-wider text-slate-900 leading-none">STARTUP OS</h3>
                  <p className="font-sans font-semibold text-[8px] tracking-widest uppercase text-slate-400 mt-1">C-Suite Enterprise Suite</p>
                  <p className="text-slate-500 mt-2 font-sans font-medium text-[8px]">100 Pine Street, Floor 18<br />San Francisco, CA 94111</p>
                </div>
                <div className="text-right">
                  <h2 className="font-sans font-black text-sm text-slate-900 leading-none tracking-tight">INVOICE</h2>
                  <p className="font-sans text-[9px] text-slate-500 mt-1.5 font-bold">Doc #: {selectedInvoice.invoiceNumber}</p>
                  <p className="font-sans text-[8px] text-slate-400 mt-1 font-semibold uppercase">Status: {selectedInvoice.status}</p>
                </div>
              </div>

              {/* Bill To */}
              <div className="grid grid-cols-2 gap-4 my-4 font-sans text-[8.5px] font-medium">
                <div>
                  <h5 className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none">Bill To:</h5>
                  <p className="font-bold text-slate-800 mt-1 text-[9.5px]">{selectedInvoice.clientName}</p>
                  <p className="text-slate-500 mt-0.5">Corporate Accounting Hub</p>
                </div>
                <div className="text-right space-y-1">
                  <p><span className="text-slate-400 font-semibold uppercase text-[7px] tracking-wider pr-1">Issue Date:</span> <strong className="text-slate-700">{new Date(selectedInvoice.issueDate).toLocaleDateString('en-US')}</strong></p>
                  <p><span className="text-slate-400 font-semibold uppercase text-[7px] tracking-wider pr-1">Due Date:</span> <strong className="text-slate-700">{new Date(selectedInvoice.dueDate).toLocaleDateString('en-US')}</strong></p>
                  <p><span className="text-slate-400 font-semibold uppercase text-[7px] tracking-wider pr-1">Terms:</span> <strong className="text-slate-700">Due On Receipt</strong></p>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-left my-4 border-collapse font-sans text-[8.5px]">
                <thead>
                  <tr className="border-b-2 border-slate-200 text-slate-400 uppercase text-[7px] font-black tracking-wider pb-1">
                    <th className="py-1">Item Description</th>
                    <th className="py-1 text-center w-10">Qty</th>
                    <th className="py-1 text-right w-14">Unit Rate</th>
                    <th className="py-1 text-right w-16">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {getInvoiceItems(selectedInvoice.items).map((item, i) => (
                    <tr key={i} className="border-b border-slate-100 text-slate-700">
                      <td className="py-2 font-semibold text-slate-800">{item.description}</td>
                      <td className="py-2 text-center font-semibold text-slate-500">{item.qty}</td>
                      <td className="py-2 text-right font-semibold text-slate-500">${(item.rate / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td className="py-2 text-right font-bold text-slate-900">${((item.qty * item.rate) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="flex justify-between items-start mt-5 pt-3 border-t border-slate-100 font-sans">
                <div className="text-[7.5px] text-slate-400 italic">
                  Thank you for your business.
                </div>
                <div className="w-40 text-right space-y-1 text-[8.5px] font-medium">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal:</span>
                    <span>${(selectedInvoice.amount / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-1 text-slate-900 font-black text-[10px]">
                    <span>Total Due:</span>
                    <span>${(selectedInvoice.amount / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </div>

            <Button 
              variant="outline"
              onClick={() => window.print()}
              className="w-full flex items-center justify-center gap-2 text-xs font-bold bg-black/10 border-border"
            >
              <Printer size={13} />
              <span>Print Official Invoice</span>
            </Button>
          </div>
        )}
      </div>

      {/* Invoice Creator Drawer Overlay */}
      <Dialog open={isCreateOpen} onOpenChange={(open) => { if (!open) { setIsCreateOpen(false); resetForm(); } }}>
        <DialogContent className="max-w-2xl w-full border-border bg-card p-6 shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar">
          <DialogHeader className="border-b border-border pb-4 mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <FileText size={15} />
              </div>
              <div>
                <DialogTitle className="text-base font-extrabold text-foreground">Compile New Invoice</DialogTitle>
                <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-black mt-0.5">Register financial record log</p>
              </div>
            </div>
          </DialogHeader>

          {/* AI Invoice Scan / Paste Assistant */}
          <div className="border border-primary/20 rounded-lg p-4 bg-primary/5 space-y-3 shadow-inner">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-primary" />
                <span className="text-xs font-bold text-foreground">AI Invoice Draft Assistant</span>
              </div>
              <span className="text-[8px] font-black tracking-widest uppercase text-muted-foreground/80 bg-black/20 px-2 py-0.5 rounded border border-border/50">Gemini 3.5 Flash (Flex)</span>
            </div>

            <Tabs defaultValue="upload" className="w-full space-y-3">
              <TabsList className="grid grid-cols-2 w-full max-w-[240px] h-8 bg-black/10">
                <TabsTrigger value="upload" className="py-1 text-[9px]">File Scan (OCR)</TabsTrigger>
                <TabsTrigger value="text" className="py-1 text-[9px]">Text Draft</TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="space-y-3 focus-visible:outline-none">
                <p className="text-[10px] text-muted-foreground">Upload any scanned receipt, quotation, or invoice (PDF, PNG, JPEG) for zero-hallucination structured visual processing.</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 relative">
                    <input 
                      type="file" 
                      accept="application/pdf,image/png,image/jpeg"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setSelectedFile(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                      id="invoice-file-upload"
                    />
                    <label 
                      htmlFor="invoice-file-upload"
                      className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-dashed border-border bg-black/10 hover:bg-black/20 text-xs font-bold cursor-pointer transition-all w-full text-center"
                    >
                      📁 {selectedFile ? selectedFile.name.toUpperCase() : "CHOOSE RECEIPT OR INVOICE FILE"}
                    </label>
                  </div>
                  <Button
                    type="button"
                    onClick={handleFileUploadScan}
                    disabled={isAiScanning || !selectedFile}
                    className="h-10 text-xs font-bold gap-2 px-5"
                  >
                    {isAiScanning ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                    <span>Secure Scan</span>
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="text" className="space-y-3 focus-visible:outline-none">
                <p className="text-[10px] text-muted-foreground">Paste plain text receipt details or email transcript notes to draft a pre-filled invoice outline.</p>
                <div className="flex gap-2.5">
                  <textarea 
                    placeholder="e.g. 'Wayne Enterprises billed us $500 for legal review on Q2 contracts, due in 30 days'"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="glass-input text-xs h-16 py-2 bg-black/20 resize-none font-medium text-foreground"
                  />
                  <Button
                    type="button"
                    onClick={handleAiScan}
                    disabled={isAiScanning || !aiPrompt.trim()}
                    className="h-auto flex flex-col justify-center items-center gap-1.5 px-4 text-[9px] shrink-0"
                  >
                    {isAiScanning ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                    <span>Draft</span>
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            {aiError && (
              <p className="text-[10px] text-destructive font-semibold">{aiError}</p>
            )}

            {mathError && (
              <div className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/5 text-[9.5px] text-amber-400 font-medium flex gap-2 items-start shadow-sm animate-in fade-in duration-200">
                <span className="text-xs">⚠️</span>
                <span>{mathError}</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-0.5">Client / Vendor Name</label>
                <Input 
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. Wayne Enterprises"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-0.5">Document Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={invoiceType === 'sales' ? 'default' : 'outline'}
                    onClick={() => setInvoiceType('sales')}
                    className="h-10 text-xs font-bold"
                  >
                    Sales Invoice
                  </Button>
                  <Button
                    type="button"
                    variant={invoiceType === 'purchase' ? 'default' : 'outline'}
                    onClick={() => setInvoiceType('purchase')}
                    className="h-10 text-xs font-bold"
                  >
                    Purchase Bill
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-0.5">Invoice Number (Optional)</label>
                <Input 
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="e.g. INV-2026-004 (Auto)"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-0.5">Payment Due Date</label>
                <Input 
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="cursor-pointer"
                />
              </div>

            </div>

            {/* Line Items */}
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center border-b border-border pb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Invoice Billing Line Items</span>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="flex items-center gap-1 text-[10px] font-black uppercase text-primary hover:text-primary/80 transition-colors cursor-pointer"
                >
                  <Plus size={10} /> Add Line Item
                </button>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                {lineItems.map((item, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <div className="flex-1">
                      <Input 
                        type="text"
                        required
                        value={item.description}
                        onChange={(e) => handleItemChange(i, 'description', e.target.value)}
                        placeholder="Line item description..."
                        className="text-xs h-9 bg-black/10"
                      />
                    </div>
                    <div className="w-16">
                      <Input 
                        type="number"
                        required
                        min="1"
                        value={item.qty}
                        onChange={(e) => handleItemChange(i, 'qty', e.target.value)}
                        className="text-xs text-center h-9 bg-black/10"
                        title="Quantity"
                      />
                    </div>
                    <div className="w-24">
                      <Input 
                        type="number"
                        required
                        min="0"
                        value={item.rate === 0 ? '' : item.rate}
                        onChange={(e) => handleItemChange(i, 'rate', e.target.value)}
                        placeholder="Rate ($)"
                        className="text-xs text-right h-9 bg-black/10"
                        title="Rate ($)"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={lineItems.length === 1}
                      onClick={() => handleRemoveItem(i)}
                      className="w-9 h-9 border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 text-muted-foreground p-0 flex items-center justify-center shrink-0"
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Subtotal */}
            <div className="border-t border-border pt-4 flex justify-between items-center text-xs font-bold text-muted-foreground">
              <span>ESTIMATED GRAND TOTAL:</span>
              <span className="text-sm font-black text-foreground">
                ${lineItems.reduce((sum, item) => sum + (item.qty * (item.rate || 0)), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
              </span>
            </div>

            <div className="flex gap-2 pt-2">
              <Button 
                type="submit" 
                disabled={isSaving}
                className="flex-1 h-10 text-xs font-bold gap-1.5"
              >
                {isSaving ? <Loader2 size={13} className="animate-spin" /> : <FileText size={13} />}
                <span>Generate Official Record</span>
              </Button>
              <Button 
                type="button"
                variant="outline"
                onClick={() => { setIsCreateOpen(false); resetForm(); }}
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
