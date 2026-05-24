import React, { useState } from 'react';
import { 
  Plus, Loader2, ShoppingBag, Ticket, Clock, AlertTriangle
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

interface Employee {
  id: string;
  name: string;
  role: string;
}

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  qty: number;
  rate: number; // in cents
  warehouse: string;
  reorderLevel: number;
  createdAt: string;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: 'active' | 'completed' | 'onhold';
  dueDate: string | null;
}

interface ProjectTask {
  id: string;
  projectId: string;
  title: string;
  assignedEmployeeId: string | null;
  status: 'todo' | 'inprogress' | 'completed';
  hoursLogged: number;
}

interface SupportTicket {
  id: string;
  customerName: string;
  subject: string;
  description: string;
  status: 'open' | 'replied' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
}

export const COOOperations: React.FC<{
  activeTab?: 'inventory' | 'projects' | 'tickets';
  onTabChange?: (tab: 'inventory' | 'projects' | 'tickets') => void;
}> = ({ activeTab: propActiveTab, onTabChange }) => {
  const queryClient = useQueryClient();
  const [localActiveTab, setLocalActiveTab] = useState<'inventory' | 'projects' | 'tickets'>('inventory');
  
  const activeTab = propActiveTab || localActiveTab;
  const setActiveTab = onTabChange || setLocalActiveTab;
  
  // Selection
  const [selectedProjId, setSelectedProjId] = useState('');

  // Form states
  const [itemSku, setItemSku] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemQty, setItemQty] = useState('');
  const [itemRate, setItemRate] = useState('');
  const [itemWarehouse, setItemWarehouse] = useState('Main Warehouse');
  
  const [isProjOpen, setIsProjOpen] = useState(false);
  const [projName, setProjName] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projDue, setProjDue] = useState('');

  const [isTaskOpen, setIsTaskOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');

  const [isLogOpen, setIsLogOpen] = useState(false);
  const [logTaskId, setLogTaskId] = useState('');
  const [logHours, setLogHours] = useState('');

  const [tCustomer, setTCustomer] = useState('');
  const [tSubject, setTSubject] = useState('');
  const [tDesc, setTDesc] = useState('');
  const [tPriority, setTPriority] = useState<'low' | 'medium' | 'high'>('medium');

  const [isSaving, setIsSaving] = useState(false);

  // Queries
  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ['employees']
  });

  const { data: inventory = [], isLoading: invLoading } = useQuery<InventoryItem[]>({
    queryKey: ['inventory'],
    queryFn: async () => {
      const res = await fetch('/api/operations/inventory');
      if (!res.ok) throw new Error('Failed to fetch inventory');
      return res.json();
    }
  });

  const { data: projects = [], isLoading: projLoading } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await fetch('/api/operations/projects');
      if (!res.ok) throw new Error('Failed to fetch projects');
      const data = await res.json();
      if (data.length > 0 && !selectedProjId) {
        setSelectedProjId(data[0].id);
      }
      return data;
    }
  });

  const { data: tasks = [] } = useQuery<ProjectTask[]>({
    queryKey: ['tasks'],
    queryFn: async () => {
      const res = await fetch('/api/operations/tasks');
      if (!res.ok) throw new Error('Failed to fetch tasks');
      return res.json();
    }
  });

  const { data: tickets = [], isLoading: ticketsLoading } = useQuery<SupportTicket[]>({
    queryKey: ['tickets'],
    queryFn: async () => {
      const res = await fetch('/api/operations/tickets');
      if (!res.ok) throw new Error('Failed to fetch tickets');
      return res.json();
    }
  });

  // Mutations
  const adjustStockMutation = useMutation({
    mutationFn: async (stockData: any) => {
      const res = await fetch('/api/operations/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stockData)
      });
      if (!res.ok) throw new Error('Failed to adjust stock');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      resetItemForm();
    }
  });

  const createProjMutation = useMutation({
    mutationFn: async (projData: any) => {
      const res = await fetch('/api/operations/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projData)
      });
      if (!res.ok) throw new Error('Failed to create project');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setSelectedProjId(data.id);
      setIsProjOpen(false);
      setProjName('');
      setProjDesc('');
      setProjDue('');
    }
  });

  const createTaskMutation = useMutation({
    mutationFn: async (taskData: any) => {
      const res = await fetch('/api/operations/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      });
      if (!res.ok) throw new Error('Failed to create task');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setIsTaskOpen(false);
      setTaskTitle('');
    }
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const res = await fetch(`/api/operations/tasks/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error('Failed to update task status');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });

  const logHoursMutation = useMutation({
    mutationFn: async ({ id, hours }: { id: string, hours: number }) => {
      const res = await fetch(`/api/operations/tasks/${id}/log-hours`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hours })
      });
      if (!res.ok) throw new Error('Failed to log hours');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setIsLogOpen(false);
      setLogHours('');
    }
  });

  const createTicketMutation = useMutation({
    mutationFn: async (ticketData: any) => {
      const res = await fetch('/api/operations/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticketData)
      });
      if (!res.ok) throw new Error('Failed to create ticket');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      setTCustomer('');
      setTSubject('');
      setTDesc('');
    }
  });

  const ticketStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const res = await fetch(`/api/operations/tickets/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error('Failed to update ticket');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    }
  });

  // Helpers
  const resetItemForm = () => {
    setItemSku('');
    setItemName('');
    setItemQty('');
    setItemRate('');
  };

  const getEmpName = (id: string | null) => {
    if (!id) return "Unassigned";
    return employees.find(e => e.id === id)?.name || "Unassigned";
  };

  // Submissions
  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemSku.trim() || !itemQty) return;

    setIsSaving(true);
    const rateCents = Math.round(parseFloat(itemRate) * 100) || 0;
    try {
      await adjustStockMutation.mutateAsync({
        sku: itemSku.toUpperCase(),
        name: itemName || "Stock Adjustment Item",
        qty: Number(itemQty),
        rate: rateCents,
        warehouse: itemWarehouse
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleProjSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projName.trim()) return;

    setIsSaving(true);
    try {
      await createProjMutation.mutateAsync({
        name: projName,
        description: projDesc,
        dueDate: projDue ? new Date(projDue).toISOString() : undefined
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !selectedProjId) return;

    setIsSaving(true);
    try {
      await createTaskMutation.mutateAsync({
        projectId: selectedProjId,
        title: taskTitle,
        assignedEmployeeId: taskAssignee || null
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logTaskId || !logHours) return;

    setIsSaving(true);
    try {
      await logHoursMutation.mutateAsync({
        id: logTaskId,
        hours: Number(logHours)
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tCustomer.trim() || !tSubject.trim()) return;

    setIsSaving(true);
    try {
      await createTicketMutation.mutateAsync({
        customerName: tCustomer,
        subject: tSubject,
        description: tDesc,
        priority: tPriority
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // Math
  const totalStockValuation = inventory.reduce((sum, item) => sum + (item.qty * item.rate), 0) / 100;
  const lowStockItems = inventory.filter(item => item.qty <= item.reorderLevel).length;

  const currentProj = projects.find(p => p.id === selectedProjId);
  const projectTasksList = tasks.filter(t => t.projectId === selectedProjId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">COO Operations Command</h2>
          <p className="text-muted-foreground text-xs mt-1">Direct corporate operations: oversee stock inventory counts, monitor nested project timelines, and manage customer support logs.</p>
        </div>
      </header>

      {/* Tab Selector */}
      <Tabs 
        value={activeTab} 
        onValueChange={(val) => setActiveTab(val as any)} 
        className="w-full space-y-6"
      >
        <TabsList className="grid grid-cols-3 w-full sm:w-[480px] h-10 bg-black/10">
          <TabsTrigger value="inventory" className="py-2 text-[10px]">Inventory & Stock</TabsTrigger>
          <TabsTrigger value="projects" className="py-2 text-[10px]">Projects & Tasks</TabsTrigger>
          <TabsTrigger value="tickets" className="py-2 text-[10px]">Support Helpdesk</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="focus-visible:outline-none space-y-6 animate-in fade-in duration-200">
          {/* Inventory Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 border border-border rounded-xl bg-card divide-y md:divide-y-0 md:divide-x divide-border overflow-hidden shadow-md">
            <div className="p-5 space-y-1 bg-black/10">
              <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Total Stock Value</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-foreground">${totalStockValuation.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                <span className="text-[10px] text-amber-500 font-bold flex items-center gap-0.5"><ShoppingBag size={10} /> Valuation</span>
              </div>
            </div>
            <div className="p-5 space-y-1 bg-black/10">
              <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Low Stock Warnings</p>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-black ${lowStockItems > 0 ? 'text-amber-500 animate-pulse' : 'text-foreground'}`}>{lowStockItems} Items</span>
                {lowStockItems > 0 && <span className="text-[10px] text-amber-500 font-bold flex items-center gap-0.5"><AlertTriangle size={10} /> Reorder</span>}
              </div>
            </div>
            <div className="p-5 space-y-1 bg-black/10">
              <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Storage Warehouses</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-foreground">2 Locations</span>
                <span className="text-[10px] text-muted-foreground font-bold">Fulfillment online</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Inventory adjustments Form */}
            <Card className="lg:col-span-4 border-border bg-card/60 space-y-4 p-5">
              <h3 className="font-bold text-sm text-foreground border-b border-border pb-2.5">Adjust Roster Stock</h3>

              <form onSubmit={handleAdjustSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-bold text-muted-foreground uppercase tracking-widest pl-0.5">Item SKU ID</label>
                  <Input
                    type="text"
                    required
                    value={itemSku}
                    onChange={(e) => setItemSku(e.target.value)}
                    placeholder="e.g. HW-MBP-16"
                    className="uppercase"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[9px] font-bold text-muted-foreground uppercase tracking-widest pl-0.5">Item Name (New Entry only)</label>
                  <Input
                    type="text"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder="e.g. Apple MacBook Pro 16\"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-bold text-muted-foreground uppercase tracking-widest pl-0.5">Target Quantity</label>
                    <Input
                      type="number"
                      required
                      min="0"
                      value={itemQty}
                      onChange={(e) => setItemQty(e.target.value)}
                      placeholder="e.g. 15"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-bold text-muted-foreground uppercase tracking-widest pl-0.5">Unit Rate ($)</label>
                    <Input
                      type="number"
                      required
                      min="0"
                      value={itemRate}
                      onChange={(e) => setItemRate(e.target.value)}
                      placeholder="e.g. 120"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[9px] font-bold text-muted-foreground uppercase tracking-widest pl-0.5">Warehouse Location</label>
                  <Input
                    type="text"
                    required
                    value={itemWarehouse}
                    onChange={(e) => setItemWarehouse(e.target.value)}
                    placeholder="e.g. Main Warehouse"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSaving}
                  className="w-full text-xs font-bold gap-1.5 h-10"
                >
                  {isSaving ? <Loader2 size={13} className="animate-spin" /> : <ShoppingBag size={13} />}
                  Commit Stock Count
                </Button>
              </form>
            </Card>

            {/* Inventory Stock list table */}
            <div className="lg:col-span-8 space-y-4">
              <h4 className="font-bold text-sm text-foreground border-b border-border pb-2.5">Roster Stock Levels</h4>

              {invLoading ? (
                <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={24} /></div>
              ) : inventory.length === 0 ? (
                <div className="h-48 border border-dashed border-border rounded-xl flex items-center justify-center text-center p-6 text-muted-foreground text-xs font-medium">
                  No stock records listed. Create stock adjust above.
                </div>
              ) : (
                <div className="border border-border rounded-xl bg-card/40 overflow-hidden shadow-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="pl-4">SKU</TableHead>
                        <TableHead>Item Name</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead className="text-right w-24">In Stock</TableHead>
                        <TableHead className="text-right w-24">Unit Rate</TableHead>
                        <TableHead className="text-right w-32 pr-4">Total Valuation</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inventory.map((item) => {
                        const lowStock = item.qty <= item.reorderLevel;
                        return (
                          <TableRow key={item.id} className={lowStock ? 'bg-amber-500/[0.02] hover:bg-amber-500/[0.04]' : ''}>
                            <TableCell className="font-bold text-foreground pl-4">{item.sku}</TableCell>
                            <TableCell>
                              <div className="font-bold text-foreground/80">{item.name}</div>
                              {lowStock && <Badge variant="warning" className="text-[7px] font-black uppercase px-1 py-0.2 tracking-wide inline-block mt-1">⚠️ LOW STOCK (Reorder: {item.reorderLevel})</Badge>}
                            </TableCell>
                            <TableCell className="text-muted-foreground">{item.warehouse}</TableCell>
                            <TableCell className={`text-right font-bold ${lowStock ? 'text-amber-400' : 'text-foreground'}`}>{item.qty} units</TableCell>
                            <TableCell className="text-right text-muted-foreground font-mono">${(item.rate / 100).toLocaleString()}</TableCell>
                            <TableCell className="text-right font-bold text-foreground font-mono pr-4">${((item.qty * item.rate) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="projects" className="focus-visible:outline-none animate-in fade-in duration-200">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Projects Switcher list sidebar */}
            <div className="lg:col-span-4 space-y-4">
              <div className="flex justify-between items-center border-b border-border pb-2">
                <h4 className="font-bold text-sm text-foreground">Active Projects</h4>
                <button 
                  onClick={() => setIsProjOpen(true)}
                  className="flex items-center gap-1 text-[9px] font-black uppercase text-primary hover:text-primary/80 transition-colors cursor-pointer"
                >
                  <Plus size={10} /> New Project
                </button>
              </div>

              {projLoading ? (
                <div className="h-48 flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={24} /></div>
              ) : projects.length === 0 ? (
                <div className="h-32 border border-dashed border-border rounded-xl flex items-center justify-center text-center p-4 text-muted-foreground text-xs font-medium">
                  No active projects listed.
                </div>
              ) : (
                <div className="space-y-2">
                  {projects.map((proj) => {
                    const projTasks = tasks.filter(t => t.projectId === proj.id);
                    const compl = projTasks.filter(t => t.status === 'completed').length;
                    const progress = projTasks.length > 0 ? Math.round((compl / projTasks.length) * 100) : 0;
                    
                    return (
                      <div
                        key={proj.id}
                        onClick={() => setSelectedProjId(proj.id)}
                        className={`border p-4 rounded-xl cursor-pointer hover:bg-accent/30 hover:border-primary/20 transition-all space-y-2.5 ${selectedProjId === proj.id ? 'border-primary/30 bg-primary/5' : 'border-border bg-card/60 shadow-sm'}`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <h5 className="font-bold text-xs text-foreground leading-tight">{proj.name}</h5>
                          <Badge variant="outline" className="text-[8px] font-black uppercase text-primary border-primary/20 bg-primary/5 py-0.5 tracking-wide shrink-0">{proj.status}</Badge>
                        </div>
                        
                        {proj.description && <p className="text-[10px] text-muted-foreground font-medium line-clamp-1">{proj.description}</p>}

                        {/* Progress bar */}
                        <div className="space-y-1 pt-1">
                          <div className="flex justify-between text-[8px] font-bold text-muted-foreground uppercase tracking-widest">
                            <span>Progress: {progress}%</span>
                            <span>{compl} / {projTasks.length} Completed</span>
                          </div>
                          <div className="h-1.5 w-full bg-black/20 rounded-full overflow-hidden border border-border/40">
                            <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Nested Tasks Kanban */}
            <div className="lg:col-span-8 space-y-4">
              {currentProj ? (
                <>
                  {/* Project Header details */}
                  <div className="border border-border p-4 rounded-xl bg-card/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                    <div>
                      <h3 className="font-bold text-sm text-foreground uppercase tracking-wider">{currentProj.name}</h3>
                      <p className="text-muted-foreground text-[10px] mt-0.5 font-semibold">
                        {currentProj.description || "Active corporate project log."}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        onClick={() => setIsTaskOpen(true)}
                        className="h-9 text-[10px] font-bold uppercase tracking-wider px-3.5 flex items-center gap-1.5"
                      >
                        <Plus size={11} /> Add Task
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          const openTask = projectTasksList.find(t => t.status !== 'completed');
                          if (openTask) {
                            setLogTaskId(openTask.id);
                            setIsLogOpen(true);
                          } else if (projectTasksList.length > 0) {
                            setLogTaskId(projectTasksList[0].id);
                            setIsLogOpen(true);
                          } else {
                            alert("Add a task to this project first to log hours.");
                          }
                        }}
                        className="h-9 text-[10px] font-bold uppercase tracking-wider px-3.5 flex items-center gap-1.5"
                      >
                        <Clock size={11} /> Log Hours
                      </Button>
                    </div>
                  </div>

                  {/* Sub Kanban columns */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Todo */}
                    <div className="border border-border rounded-xl bg-card/40 backdrop-blur-md p-3 space-y-3 min-h-[300px]">
                      <h5 className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border/40 pb-1.5 pl-0.5">To Do</h5>
                      <div className="space-y-2">
                        {projectTasksList.filter(t => t.status === 'todo').map(task => (
                          <div key={task.id} className="border border-border p-3 rounded-lg bg-card/80 hover:border-primary/20 transition-all space-y-2 shadow-sm">
                            <h6 className="font-bold text-xs text-foreground/90 leading-tight">{task.title}</h6>
                            <div className="flex justify-between items-center text-[9px] pt-1">
                              <span className="text-muted-foreground font-semibold">{getEmpName(task.assignedEmployeeId)}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateTaskMutation.mutate({ id: task.id, status: 'inprogress' })}
                                className="h-6 px-2 text-[9px] rounded font-bold"
                              >
                                Start
                              </Button>
                            </div>
                          </div>
                        ))}
                        {projectTasksList.filter(t => t.status === 'todo').length === 0 && (
                          <div className="py-8 text-center text-[10px] text-muted-foreground/30 italic">Empty</div>
                        )}
                      </div>
                    </div>

                    {/* In Progress */}
                    <div className="border border-border rounded-xl bg-card/40 backdrop-blur-md p-3 space-y-3 min-h-[300px]">
                      <h5 className="font-bold text-[10px] uppercase tracking-wider text-primary border-b border-border/40 pb-1.5 pl-0.5 animate-pulse">In Progress</h5>
                      <div className="space-y-2">
                        {projectTasksList.filter(t => t.status === 'inprogress').map(task => (
                          <div key={task.id} className="border border-border p-3 rounded-lg bg-card/80 hover:border-primary/20 transition-all space-y-2 shadow-sm">
                            <h6 className="font-bold text-xs text-foreground/90 leading-tight">{task.title}</h6>
                            <div className="text-[8px] text-muted-foreground uppercase tracking-widest font-black">Logged: {task.hoursLogged} Hours</div>
                            <div className="flex justify-between items-center text-[9px] pt-1 border-t border-border/40">
                              <span className="text-muted-foreground font-semibold">{getEmpName(task.assignedEmployeeId)}</span>
                              <Button
                                size="sm"
                                onClick={() => updateTaskMutation.mutate({ id: task.id, status: 'completed' })}
                                className="h-6 px-2 text-[9px] rounded font-bold"
                              >
                                Finish
                              </Button>
                            </div>
                          </div>
                        ))}
                        {projectTasksList.filter(t => t.status === 'inprogress').length === 0 && (
                          <div className="py-8 text-center text-[10px] text-muted-foreground/30 italic">Empty</div>
                        )}
                      </div>
                    </div>

                    {/* Completed */}
                    <div className="border border-border rounded-xl bg-card/40 backdrop-blur-md p-3 space-y-3 min-h-[300px]">
                      <h5 className="font-bold text-[10px] uppercase tracking-wider text-emerald-400 border-b border-border/40 pb-1.5 pl-0.5">Completed</h5>
                      <div className="space-y-2">
                        {projectTasksList.filter(t => t.status === 'completed').map(task => (
                          <div key={task.id} className="border border-border p-3 rounded-lg bg-card/40 opacity-70 space-y-2">
                            <h6 className="font-bold text-xs text-muted-foreground leading-tight line-through">{task.title}</h6>
                            <div className="flex justify-between items-center text-[9px] pt-1">
                              <span className="text-muted-foreground/80">{getEmpName(task.assignedEmployeeId)}</span>
                              <Badge variant="success" className="text-[8px] font-black py-0.5 tracking-wide uppercase">✓ Done</Badge>
                            </div>
                          </div>
                        ))}
                        {projectTasksList.filter(t => t.status === 'completed').length === 0 && (
                          <div className="py-8 text-center text-[10px] text-muted-foreground/30 italic">Empty</div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-64 border border-dashed border-border rounded-xl flex items-center justify-center text-center p-6 text-muted-foreground text-xs font-medium shadow-inner">
                  Select a project on the sidebar to view tasks.
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tickets" className="focus-visible:outline-none animate-in fade-in duration-200">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Ticket creator form */}
            <Card className="lg:col-span-4 border-border bg-card/60 space-y-4 p-5">
              <h3 className="font-bold text-sm text-foreground border-b border-border pb-2.5">Log Support Issue</h3>

              <form onSubmit={handleTicketSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-bold text-muted-foreground uppercase tracking-widest pl-0.5">Customer / Party Name</label>
                  <Input
                    type="text"
                    required
                    value={tCustomer}
                    onChange={(e) => setTCustomer(e.target.value)}
                    placeholder="e.g. Acme Corporation"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[9px] font-bold text-muted-foreground uppercase tracking-widest pl-0.5">Issue Subject</label>
                  <Input
                    type="text"
                    required
                    value={tSubject}
                    onChange={(e) => setTSubject(e.target.value)}
                    placeholder="e.g. 504 Webhook timeouts"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[9px] font-bold text-muted-foreground uppercase tracking-widest pl-0.5">Full Description</label>
                  <textarea
                    rows={3}
                    required
                    value={tDesc}
                    onChange={(e) => setTDesc(e.target.value)}
                    placeholder="Provide precise technical logs or context..."
                    className="glass-input text-xs h-20 resize-none bg-black/10"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[9px] font-bold text-muted-foreground uppercase tracking-widest pl-0.5">Priority Rating</label>
                  <Select 
                    value={tPriority} 
                    onValueChange={(val) => setTPriority(val as any)}
                  >
                    <SelectTrigger className="w-full text-xs font-bold uppercase tracking-wider h-10">
                      <SelectValue placeholder="PRIORITY" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">LOW PRIORITY</SelectItem>
                      <SelectItem value="medium">MEDIUM PRIORITY</SelectItem>
                      <SelectItem value="high">HIGH PRIORITY</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="submit"
                  disabled={isSaving}
                  className="w-full text-xs font-bold gap-1.5 h-10"
                >
                  {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Ticket size={13} />}
                  File Helpdesk Ticket
                </Button>
              </form>
            </Card>

            {/* Tickets Log List */}
            <div className="lg:col-span-8 space-y-4">
              <h4 className="font-bold text-sm text-foreground border-b border-border pb-2.5">Support Helpdesk Ledger</h4>

              {ticketsLoading ? (
                <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={24} /></div>
              ) : tickets.length === 0 ? (
                <div className="h-48 border border-dashed border-border rounded-xl flex items-center justify-center text-center p-6 text-muted-foreground text-xs font-medium">
                  No active helpdesk tickets logged.
                </div>
              ) : (
                <div className="border border-border rounded-xl bg-card/40 overflow-hidden shadow-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="pl-4">Client</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead className="text-center w-28">Priority</TableHead>
                        <TableHead className="text-center w-28">Status</TableHead>
                        <TableHead className="text-center w-24 pr-4">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tickets.map((t) => {
                        const badgeVariant = t.priority === 'high' ? 'destructive' : t.priority === 'medium' ? 'warning' : 'outline';
                        return (
                          <TableRow key={t.id}>
                            <TableCell className="font-bold text-foreground pl-4">{t.customerName}</TableCell>
                            <TableCell>
                              <div className="text-foreground/80 font-bold text-xs">{t.subject}</div>
                              <div className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1 max-w-[250px]">{t.description}</div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant={badgeVariant} className="text-[8px] font-black uppercase py-0.5">{t.priority}</Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant={t.status === 'resolved' ? 'success' : 'warning'} className="text-[9px] font-black uppercase py-0.5">
                                {t.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center pr-4">
                              {t.status !== 'resolved' ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => ticketStatusMutation.mutate({ id: t.id, status: 'resolved' })}
                                  className="h-7 text-[9px] rounded font-bold bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                >
                                  Resolve
                                </Button>
                              ) : (
                                <span className="text-[10px] text-muted-foreground/60">—</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* New Project Creator Drawer Overlay */}
      <Dialog open={isProjOpen} onOpenChange={(open) => { if (!open) setIsProjOpen(false); }}>
        <DialogContent className="max-w-md w-full border-border bg-card p-6 shadow-2xl relative overflow-hidden">
          <DialogHeader className="border-b border-border pb-4 mb-2">
            <DialogTitle className="text-base font-extrabold text-foreground">Create Project</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleProjSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-[9px] font-bold text-muted-foreground uppercase tracking-widest pl-0.5">Project Name</label>
              <Input type="text" required value={projName} onChange={(e) => setProjName(e.target.value)} placeholder="e.g. Website Rebranding" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[9px] font-bold text-muted-foreground uppercase tracking-widest pl-0.5">Description</label>
              <textarea rows={3} value={projDesc} onChange={(e) => setProjDesc(e.target.value)} placeholder="Enter details..." className="glass-input resize-none h-16 bg-black/10" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[9px] font-bold text-muted-foreground uppercase tracking-widest pl-0.5">Due Date</label>
              <Input type="date" value={projDue} onChange={(e) => setProjDue(e.target.value)} className="cursor-pointer" />
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={isSaving} className="flex-1 h-10 text-xs font-bold">Submit</Button>
              <Button type="button" variant="outline" onClick={() => setIsProjOpen(false)} className="h-10 px-4 text-xs font-bold">Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* New Task Creator Drawer Overlay */}
      <Dialog open={isTaskOpen} onOpenChange={(open) => { if (!open) setIsTaskOpen(false); }}>
        <DialogContent className="max-w-md w-full border-border bg-card p-6 shadow-2xl relative overflow-hidden">
          <DialogHeader className="border-b border-border pb-4 mb-2">
            <DialogTitle className="text-base font-extrabold text-foreground">Add Project Task</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleTaskSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-[9px] font-bold text-muted-foreground uppercase tracking-widest pl-0.5">Task Title</label>
              <Input type="text" required value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="e.g. Design Figma assets" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[9px] font-bold text-muted-foreground uppercase tracking-widest pl-0.5">Assignee</label>
              <Select 
                value={taskAssignee} 
                onValueChange={(val) => setTaskAssignee(val)}
              >
                <SelectTrigger className="w-full text-xs font-bold uppercase tracking-wider h-10">
                  <SelectValue placeholder="ASSIGNEE" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned_placeholder">UNASSIGNED</SelectItem>
                  {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name.toUpperCase()}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={isSaving} className="flex-1 h-10 text-xs font-bold">Submit</Button>
              <Button type="button" variant="outline" onClick={() => setIsTaskOpen(false)} className="h-10 px-4 text-xs font-bold">Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Log Hours Timesheet Drawer Overlay */}
      <Dialog open={isLogOpen} onOpenChange={(open) => { if (!open) setIsLogOpen(false); }}>
        <DialogContent className="max-w-md w-full border-border bg-card p-6 shadow-2xl relative overflow-hidden">
          <DialogHeader className="border-b border-border pb-4 mb-2">
            <DialogTitle className="text-base font-extrabold text-foreground">Log Timesheet Hours</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleLogSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-[9px] font-bold text-muted-foreground uppercase tracking-widest pl-0.5">Target Task</label>
              <Select 
                value={logTaskId} 
                onValueChange={(val) => setLogTaskId(val)}
              >
                <SelectTrigger className="w-full text-xs font-bold uppercase tracking-wider h-10">
                  <SelectValue placeholder="TASK" />
                </SelectTrigger>
                <SelectContent>
                  {projectTasksList.map(t => <SelectItem key={t.id} value={t.id}>{t.title.toUpperCase()}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-[9px] font-bold text-muted-foreground uppercase tracking-widest pl-0.5">Hours Logged</label>
              <Input type="number" required min="1" value={logHours} onChange={(e) => setLogHours(e.target.value)} placeholder="e.g. 8" />
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={isSaving} className="flex-1 h-10 text-xs font-bold">Commit Hours</Button>
              <Button type="button" variant="outline" onClick={() => setIsLogOpen(false)} className="h-10 px-4 text-xs font-bold">Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
};
