import React, { useState } from 'react';
import { 
  Plus, Loader2, ShoppingBag, Ticket, Clock, AlertTriangle
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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

export const COOOperations: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'inventory' | 'projects' | 'tickets'>('inventory');
  
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
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">COO Operations Command</h2>
          <p className="text-white/40 text-xs mt-1">Direct corporate operations: oversee stock inventory counts, monitor nested project timelines, and manage customer support logs.</p>
        </div>
      </header>

      {/* Tab Selector */}
      <div className="flex border-b border-white/5">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-5 py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-all ${activeTab === 'inventory' ? 'border-amber-500 text-white font-extrabold' : 'border-transparent text-white/40 hover:text-white/70'}`}
        >
          Inventory & Stock
        </button>
        <button
          onClick={() => setActiveTab('projects')}
          className={`px-5 py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-all ${activeTab === 'projects' ? 'border-amber-500 text-white font-extrabold' : 'border-transparent text-white/40 hover:text-white/70'}`}
        >
          Projects & Tasks
        </button>
        <button
          onClick={() => setActiveTab('tickets')}
          className={`px-5 py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-all ${activeTab === 'tickets' ? 'border-amber-500 text-white font-extrabold' : 'border-transparent text-white/40 hover:text-white/70'}`}
        >
          Support Helpdesk
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          {/* Inventory Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 border border-white/5 rounded-xl bg-white/[0.01] divide-y md:divide-y-0 md:divide-x divide-white/5 overflow-hidden">
            <div className="p-5 space-y-1">
              <p className="text-white/40 text-[10px] font-black uppercase tracking-wider">Total Stock Value</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-white">${totalStockValuation.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                <span className="text-[10px] text-amber-500 font-bold flex items-center gap-0.5"><ShoppingBag size={10} /> Valuation</span>
              </div>
            </div>
            <div className="p-5 space-y-1">
              <p className="text-white/40 text-[10px] font-black uppercase tracking-wider">Low Stock Warnings</p>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-black ${lowStockItems > 0 ? 'text-amber-500 animate-pulse' : 'text-white'}`}>{lowStockItems} Items</span>
                {lowStockItems > 0 && <span className="text-[10px] text-amber-500 font-bold flex items-center gap-0.5"><AlertTriangle size={10} /> Reorder</span>}
              </div>
            </div>
            <div className="p-5 space-y-1">
              <p className="text-white/40 text-[10px] font-black uppercase tracking-wider">Storage Warehouses</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-white">2 Locations</span>
                <span className="text-[10px] text-white/40 font-bold">Fulfillment online</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Inventory adjustments Form - 4 Columns */}
            <div className="lg:col-span-4 glass-card p-6 border-white/5 space-y-4 bg-white/[0.01]">
              <h3 className="font-extrabold text-sm text-white border-b border-white/5 pb-2.5">Adjust Roster Stock</h3>

              <form onSubmit={handleAdjustSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-bold text-white/40 uppercase tracking-widest">Item SKU ID</label>
                  <input
                    type="text"
                    required
                    value={itemSku}
                    onChange={(e) => setItemSku(e.target.value)}
                    placeholder="e.g. HW-MBP-16"
                    className="glass-input text-xs uppercase"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[9px] font-bold text-white/40 uppercase tracking-widest">Item Name (New Entry only)</label>
                  <input
                    type="text"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder="e.g. Apple MacBook Pro 16\"
                    className="glass-input text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-bold text-white/40 uppercase tracking-widest">Target Quantity</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={itemQty}
                      onChange={(e) => setItemQty(e.target.value)}
                      placeholder="e.g. 15"
                      className="glass-input text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-bold text-white/40 uppercase tracking-widest">Unit Rate ($)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={itemRate}
                      onChange={(e) => setItemRate(e.target.value)}
                      placeholder="e.g. 120"
                      className="glass-input text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[9px] font-bold text-white/40 uppercase tracking-widest">Warehouse Location</label>
                  <input
                    type="text"
                    required
                    value={itemWarehouse}
                    onChange={(e) => setItemWarehouse(e.target.value)}
                    placeholder="e.g. Main Warehouse"
                    className="glass-input text-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn-primary h-10 w-full flex items-center justify-center gap-1.5 text-xs font-bold cursor-pointer"
                >
                  {isSaving ? <Loader2 size={13} className="animate-spin" /> : <ShoppingBag size={13} />}
                  Commit Stock Count
                </button>
              </form>
            </div>

            {/* Inventory Stock list table - 8 Columns */}
            <div className="lg:col-span-8 space-y-4">
              <h4 className="font-extrabold text-sm text-white border-b border-white/5 pb-2">Roster Stock Levels</h4>

              {invLoading ? (
                <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={24} /></div>
              ) : inventory.length === 0 ? (
                <div className="h-48 border border-white/5 rounded-xl bg-white/[0.01] flex items-center justify-center text-center p-6 text-white/30 text-xs">
                  No stock records listed. Create stock adjust above.
                </div>
              ) : (
                <div className="border border-white/5 rounded-xl bg-[#080710]/40 backdrop-blur-md overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-[9px] uppercase font-black text-white/30 tracking-widest pb-3 bg-white/[0.01]">
                        <th className="py-3 px-4">SKU</th>
                        <th className="py-3 px-4">Item Name</th>
                        <th className="py-3 px-4">Location</th>
                        <th className="py-3 px-4 text-right">In Stock</th>
                        <th className="py-3 px-4 text-right">Unit Rate</th>
                        <th className="py-3 px-4 text-right">Total Valuation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventory.map((item) => {
                        const lowStock = item.qty <= item.reorderLevel;
                        return (
                          <tr key={item.id} className={`border-b border-white/[0.03] hover:bg-white/[0.01] ${lowStock ? 'bg-amber-500/[0.02] border-amber-500/10' : ''}`}>
                            <td className="py-3 px-4 font-black text-white">{item.sku}</td>
                            <td className="py-3 px-4">
                              <div className="font-bold text-white/80">{item.name}</div>
                              {lowStock && <span className="text-[7px] font-black uppercase text-amber-400 bg-amber-500/5 px-1 py-0.5 rounded tracking-wide inline-block mt-1">⚠️ LOW STOCK (Reorder: {item.reorderLevel})</span>}
                            </td>
                            <td className="py-3 px-4 text-white/50">{item.warehouse}</td>
                            <td className={`py-3 px-4 text-right font-black ${lowStock ? 'text-amber-400 animate-pulse' : 'text-white'}`}>{item.qty} units</td>
                            <td className="py-3 px-4 text-right text-white/50">${(item.rate / 100).toLocaleString()}</td>
                            <td className="py-3 px-4 text-right font-black text-white">${((item.qty * item.rate) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Projects & Tasks tab */}
      {activeTab === 'projects' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Projects Switcher list sidebar - 4 Columns */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <h4 className="font-extrabold text-sm text-white">Active Projects</h4>
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
              <div className="h-32 border border-white/5 rounded-xl bg-white/[0.01] flex items-center justify-center text-center p-4 text-white/30 text-xs">
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
                      className={`border p-4 rounded-xl cursor-pointer hover:bg-white/[0.02] hover:border-white/10 transition-all space-y-2.5 ${selectedProjId === proj.id ? 'border-primary/30 bg-primary/5' : 'border-white/5 bg-black/20'}`}
                    >
                      <div className="flex justify-between items-start gap-1">
                        <h5 className="font-black text-xs text-white leading-tight">{proj.name}</h5>
                        <span className="text-[8px] font-black uppercase text-primary bg-primary/10 px-1.5 py-0.5 rounded tracking-wide shrink-0">{proj.status}</span>
                      </div>
                      
                      {proj.description && <p className="text-[10px] text-white/40 font-medium line-clamp-1">{proj.description}</p>}

                      {/* Progress bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[8px] font-bold text-white/40 uppercase tracking-widest">
                          <span>Progress: {progress}%</span>
                          <span>{compl} / {projTasks.length} Completed</span>
                        </div>
                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Nested Tasks Kanban - 8 Columns */}
          <div className="lg:col-span-8 space-y-4">
            {currentProj ? (
              <>
                {/* Project Header details */}
                <div className="border border-white/5 p-4 rounded-xl bg-white/[0.01] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-extrabold text-sm text-white uppercase tracking-wider">{currentProj.name}</h3>
                    <p className="text-white/40 text-[10px] mt-0.5 font-semibold">
                      {currentProj.description || "Active corporate project log."}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsTaskOpen(true)}
                      className="btn-primary h-9 text-[10px] font-black uppercase tracking-wider px-3.5 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus size={11} /> Add Task
                    </button>
                    <button
                      onClick={() => {
                        // Find first incomplete task
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
                      className="btn-secondary h-9 text-[10px] font-black uppercase tracking-wider px-3.5 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Clock size={11} /> Log Hours
                    </button>
                  </div>
                </div>

                {/* Sub Kanban columns for tasks */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Todo */}
                  <div className="border border-white/5 rounded-xl bg-[#080710]/40 backdrop-blur-md p-3 space-y-3 min-h-[300px]">
                    <h5 className="font-black text-[10px] uppercase tracking-wider text-white/50 border-b border-white/5 pb-1">To Do</h5>
                    <div className="space-y-2">
                      {projectTasksList.filter(t => t.status === 'todo').map(task => (
                        <div key={task.id} className="border border-white/5 p-3 rounded-lg bg-black/40 hover:bg-white/[0.01] transition-all space-y-2">
                          <h6 className="font-bold text-xs text-white/80 leading-tight">{task.title}</h6>
                          <div className="flex justify-between items-center text-[9px] pt-1">
                            <span className="text-white/40 font-semibold">{getEmpName(task.assignedEmployeeId)}</span>
                            <button
                              onClick={() => updateTaskMutation.mutate({ id: task.id, status: 'inprogress' })}
                              className="px-2 py-0.5 rounded bg-primary/10 hover:bg-primary/20 text-primary border border-primary/10 cursor-pointer font-bold"
                            >
                              Start
                            </button>
                          </div>
                        </div>
                      ))}
                      {projectTasksList.filter(t => t.status === 'todo').length === 0 && (
                        <div className="py-8 text-center text-[10px] text-white/10 italic">Empty</div>
                      )}
                    </div>
                  </div>

                  {/* In Progress */}
                  <div className="border border-white/5 rounded-xl bg-[#080710]/40 backdrop-blur-md p-3 space-y-3 min-h-[300px]">
                    <h5 className="font-black text-[10px] uppercase tracking-wider text-primary border-b border-white/5 pb-1 animate-pulse">In Progress</h5>
                    <div className="space-y-2">
                      {projectTasksList.filter(t => t.status === 'inprogress').map(task => (
                        <div key={task.id} className="border border-white/5 p-3 rounded-lg bg-black/40 hover:bg-white/[0.01] transition-all space-y-2">
                          <h6 className="font-bold text-xs text-white/80 leading-tight">{task.title}</h6>
                          <div className="text-[8px] text-white/30 uppercase tracking-widest font-black">Logged: {task.hoursLogged} Hours</div>
                          <div className="flex justify-between items-center text-[9px] pt-1 border-t border-white/[0.03]">
                            <span className="text-white/40 font-semibold">{getEmpName(task.assignedEmployeeId)}</span>
                            <button
                              onClick={() => updateTaskMutation.mutate({ id: task.id, status: 'completed' })}
                              className="px-2 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/10 cursor-pointer font-bold"
                            >
                              Finish
                            </button>
                          </div>
                        </div>
                      ))}
                      {projectTasksList.filter(t => t.status === 'inprogress').length === 0 && (
                        <div className="py-8 text-center text-[10px] text-white/10 italic">Empty</div>
                      )}
                    </div>
                  </div>

                  {/* Completed */}
                  <div className="border border-white/5 rounded-xl bg-[#080710]/40 backdrop-blur-md p-3 space-y-3 min-h-[300px]">
                    <h5 className="font-black text-[10px] uppercase tracking-wider text-emerald-400 border-b border-white/5 pb-1">Completed</h5>
                    <div className="space-y-2">
                      {projectTasksList.filter(t => t.status === 'completed').map(task => (
                        <div key={task.id} className="border border-white/5 p-3 rounded-lg bg-black/40 opacity-70 space-y-2">
                          <h6 className="font-bold text-xs text-white/50 leading-tight line-through">{task.title}</h6>
                          <div className="flex justify-between items-center text-[9px] pt-1">
                            <span className="text-white/30">{getEmpName(task.assignedEmployeeId)}</span>
                            <span className="text-[8px] font-black text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 px-1 py-0.5 rounded tracking-wide uppercase">✓ Done</span>
                          </div>
                        </div>
                      ))}
                      {projectTasksList.filter(t => t.status === 'completed').length === 0 && (
                        <div className="py-8 text-center text-[10px] text-white/10 italic">Empty</div>
                      )}
                    </div>
                  </div>

                </div>
              </>
            ) : (
              <div className="h-64 border border-white/5 rounded-xl bg-white/[0.01] flex items-center justify-center text-center p-6 text-white/30 text-xs">
                Select a project on the sidebar to view tasks.
              </div>
            )}
          </div>

        </div>
      )}

      {/* Support tickets tab */}
      {activeTab === 'tickets' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Ticket creator form - 4 Columns */}
          <div className="lg:col-span-4 glass-card p-6 border-white/5 space-y-4 bg-white/[0.01]">
            <h3 className="font-extrabold text-sm text-white border-b border-white/5 pb-2.5">Log Support Issue</h3>

            <form onSubmit={handleTicketSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[9px] font-bold text-white/40 uppercase tracking-widest">Customer / Party Name</label>
                <input
                  type="text"
                  required
                  value={tCustomer}
                  onChange={(e) => setTCustomer(e.target.value)}
                  placeholder="e.g. Acme Corporation"
                  className="glass-input text-xs bg-white/[0.01]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[9px] font-bold text-white/40 uppercase tracking-widest">Issue Subject</label>
                <input
                  type="text"
                  required
                  value={tSubject}
                  onChange={(e) => setTSubject(e.target.value)}
                  placeholder="e.g. 504 Webhook timeouts"
                  className="glass-input text-xs bg-white/[0.01]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[9px] font-bold text-white/40 uppercase tracking-widest">Full Description</label>
                <textarea
                  rows={3}
                  required
                  value={tDesc}
                  onChange={(e) => setTDesc(e.target.value)}
                  placeholder="Provide precise technical logs or context..."
                  className="glass-input text-xs h-20 resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[9px] font-bold text-white/40 uppercase tracking-widest">Priority Rating</label>
                <select
                  value={tPriority}
                  onChange={(e) => setTPriority(e.target.value as any)}
                  className="glass-input bg-[#080710] pr-8 cursor-pointer uppercase font-bold text-xs"
                >
                  <option value="low">LOW PRIORITY</option>
                  <option value="medium">MEDIUM PRIORITY</option>
                  <option value="high">HIGH PRIORITY</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="btn-primary h-10 w-full flex items-center justify-center gap-1.5 text-xs font-bold cursor-pointer"
              >
                {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Ticket size={13} />}
                File Helpdesk Ticket
              </button>
            </form>
          </div>

          {/* Tickets Log List - 8 Columns */}
          <div className="lg:col-span-8 space-y-4">
            <h4 className="font-extrabold text-sm text-white border-b border-white/5 pb-2">Support Helpdesk Ledger</h4>

            {ticketsLoading ? (
              <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={24} /></div>
            ) : tickets.length === 0 ? (
              <div className="h-48 border border-white/5 rounded-xl bg-white/[0.01] flex items-center justify-center text-center p-6 text-white/30 text-xs">
                No active helpdesk tickets logged.
              </div>
            ) : (
              <div className="border border-white/5 rounded-xl bg-[#080710]/40 backdrop-blur-md overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-[9px] uppercase font-black text-white/30 tracking-widest pb-3 bg-white/[0.01]">
                      <th className="py-3 px-4">Client</th>
                      <th className="py-3 px-4">Subject</th>
                      <th className="py-3 px-4 text-center">Priority</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map((t) => {
                      const priorityColor = t.priority === 'high' ? 'bg-rose-500/10 text-rose-400 border-rose-500/10' : t.priority === 'medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/10' : 'bg-sky-500/10 text-sky-400 border-sky-500/10';
                      return (
                        <tr key={t.id} className="border-b border-white/[0.03] hover:bg-white/[0.01]">
                          <td className="py-3.5 px-4 font-bold text-white">{t.customerName}</td>
                          <td className="py-3.5 px-4">
                            <div className="text-white/80 font-semibold">{t.subject}</div>
                            <div className="text-[10px] text-white/40 mt-0.5 line-clamp-1 max-w-[250px]">{t.description}</div>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${priorityColor}`}>{t.priority}</span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${t.status === 'resolved' ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400' : 'bg-amber-500/5 border-amber-500/10 text-amber-400 animate-pulse'}`}>{t.status}</span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {t.status !== 'resolved' ? (
                              <button
                                onClick={() => ticketStatusMutation.mutate({ id: t.id, status: 'resolved' })}
                                className="px-2.5 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/10 cursor-pointer font-bold text-[9px]"
                              >
                                Resolve
                              </button>
                            ) : (
                              <span className="text-[10px] text-white/20">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* New Project Creator Drawer Overlay */}
      {isProjOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="glass-card max-w-md w-full border-primary/20 bg-gradient-to-b from-[#0e0c1b] to-[#080710] p-6 space-y-5 animate-in zoom-in-95 duration-200 shadow-2xl relative overflow-hidden">
            <header className="flex items-center justify-between border-b border-white/5 pb-4">
              <h3 className="font-extrabold text-white text-base">Create Project</h3>
              <button onClick={() => setIsProjOpen(false)} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors cursor-pointer font-bold">✕</button>
            </header>
            <form onSubmit={handleProjSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[9px] font-bold text-white/40 uppercase tracking-widest">Project Name</label>
                <input type="text" required value={projName} onChange={(e) => setProjName(e.target.value)} placeholder="e.g. Website Rebranding" className="glass-input" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[9px] font-bold text-white/40 uppercase tracking-widest">Description</label>
                <textarea rows={3} value={projDesc} onChange={(e) => setProjDesc(e.target.value)} placeholder="Enter details..." className="glass-input resize-none h-16" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[9px] font-bold text-white/40 uppercase tracking-widest">Due Date</label>
                <input type="date" value={projDue} onChange={(e) => setProjDue(e.target.value)} className="glass-input" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={isSaving} className="btn-primary flex-1 h-11 text-xs font-bold cursor-pointer">Submit</button>
                <button type="button" onClick={() => setIsProjOpen(false)} className="btn-secondary h-11 px-4 text-xs font-bold">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Task Creator Drawer Overlay */}
      {isTaskOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="glass-card max-w-md w-full border-primary/20 bg-gradient-to-b from-[#0e0c1b] to-[#080710] p-6 space-y-5 animate-in zoom-in-95 duration-200 shadow-2xl relative overflow-hidden">
            <header className="flex items-center justify-between border-b border-white/5 pb-4">
              <h3 className="font-extrabold text-white text-base">Add Project Task</h3>
              <button onClick={() => setIsTaskOpen(false)} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors cursor-pointer font-bold">✕</button>
            </header>
            <form onSubmit={handleTaskSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[9px] font-bold text-white/40 uppercase tracking-widest">Task Title</label>
                <input type="text" required value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="e.g. Design Figma assets" className="glass-input" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[9px] font-bold text-white/40 uppercase tracking-widest">Assignee</label>
                <select value={taskAssignee} onChange={(e) => setTaskAssignee(e.target.value)} className="glass-input bg-[#080710] pr-8 cursor-pointer uppercase font-bold text-xs">
                  <option value="">UNASSIGNED</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name.toUpperCase()}</option>)}
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={isSaving} className="btn-primary flex-1 h-11 text-xs font-bold cursor-pointer">Submit</button>
                <button type="button" onClick={() => setIsTaskOpen(false)} className="btn-secondary h-11 px-4 text-xs font-bold">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Hours Timesheet Drawer Overlay */}
      {isLogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="glass-card max-w-md w-full border-primary/20 bg-gradient-to-b from-[#0e0c1b] to-[#080710] p-6 space-y-5 animate-in zoom-in-95 duration-200 shadow-2xl relative overflow-hidden">
            <header className="flex items-center justify-between border-b border-white/5 pb-4">
              <h3 className="font-extrabold text-white text-base">Log Timesheet Hours</h3>
              <button onClick={() => setIsLogOpen(false)} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors cursor-pointer font-bold">✕</button>
            </header>
            <form onSubmit={handleLogSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[9px] font-bold text-white/40 uppercase tracking-widest">Target Task</label>
                <select value={logTaskId} onChange={(e) => setLogTaskId(e.target.value)} className="glass-input bg-[#080710] pr-8 cursor-pointer uppercase font-bold text-xs">
                  {projectTasksList.map(t => <option key={t.id} value={t.id}>{t.title.toUpperCase()}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-[9px] font-bold text-white/40 uppercase tracking-widest">Hours Logged</label>
                <input type="number" required min="1" value={logHours} onChange={(e) => setLogHours(e.target.value)} placeholder="e.g. 8" className="glass-input" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={isSaving} className="btn-primary flex-1 h-11 text-xs font-bold cursor-pointer">Commit Hours</button>
                <button type="button" onClick={() => setIsLogOpen(false)} className="btn-secondary h-11 px-4 text-xs font-bold">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
