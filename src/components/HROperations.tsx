import React, { useState } from 'react';
import { 
  Users, CheckCircle2, XCircle, Plus, Loader2, LogIn, LogOut, DollarSign
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';

interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  salary: number;
}

interface AttendanceLog {
  id: string;
  employeeId: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  clockIn: string | null;
  clockOut: string | null;
}

interface LeaveRequest {
  id: string;
  employeeId: string;
  type: string;
  startDate: string;
  endDate: string;
  status: 'pending' | 'approved' | 'rejected';
  reason: string | null;
  createdAt: string;
}

interface ExpenseClaim {
  id: string;
  employeeId: string;
  title: string;
  amount: number;
  category: string;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
}

export const HROperations: React.FC<{
  activeTab?: 'attendance' | 'leaves' | 'expenses';
  onTabChange?: (tab: 'attendance' | 'leaves' | 'expenses') => void;
}> = ({ activeTab: propActiveTab, onTabChange }) => {
  const queryClient = useQueryClient();
  const [localActiveTab, setLocalActiveTab] = useState<'attendance' | 'leaves' | 'expenses'>('attendance');
  
  const activeTab = propActiveTab || localActiveTab;
  const setActiveTab = onTabChange || setLocalActiveTab;
  const [selectedEmpId, setSelectedEmpId] = useState('');

  // Leaves & Expense Form State
  const [leaveType, setLeaveType] = useState('vacation');
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [leaveReason, setLeaveReason] = useState('');

  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('supplies');
  const [expenseDate, setExpenseDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Queries
  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ['employees'],
    queryFn: async () => {
      const res = await fetch('/api/hr/employees');
      if (!res.ok) throw new Error('Failed to fetch employees');
      const data = await res.json();
      // Set default selected employee if not set
      if (data.length > 0 && !selectedEmpId) {
        setSelectedEmpId(data[0].id);
      }
      return data;
    }
  });

  const { data: attendanceLogs = [], isLoading: attLoading } = useQuery<AttendanceLog[]>({
    queryKey: ['attendance'],
    queryFn: async () => {
      const res = await fetch('/api/hr/attendance');
      if (!res.ok) throw new Error('Failed to fetch attendance');
      return res.json();
    }
  });

  const { data: leaves = [], isLoading: leavesLoading } = useQuery<LeaveRequest[]>({
    queryKey: ['leaves'],
    queryFn: async () => {
      const res = await fetch('/api/hr/leaves');
      if (!res.ok) throw new Error('Failed to fetch leaves');
      return res.json();
    }
  });

  const { data: expenses = [], isLoading: expLoading } = useQuery<ExpenseClaim[]>({
    queryKey: ['expenses'],
    queryFn: async () => {
      const res = await fetch('/api/hr/expenses');
      if (!res.ok) throw new Error('Failed to fetch expenses');
      return res.json();
    }
  });

  // Mutations
  const clockInMutation = useMutation({
    mutationFn: async (employeeId: string) => {
      const res = await fetch('/api/hr/attendance/clock-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId })
      });
      if (!res.ok) throw new Error('Failed to clock in');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    }
  });

  const clockOutMutation = useMutation({
    mutationFn: async (employeeId: string) => {
      const res = await fetch('/api/hr/attendance/clock-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId })
      });
      if (!res.ok) throw new Error('Failed to clock out');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    }
  });

  const leaveMutation = useMutation({
    mutationFn: async (leaveData: any) => {
      const res = await fetch('/api/hr/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leaveData)
      });
      if (!res.ok) throw new Error('Failed to save leave request');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      setLeaveStart('');
      setLeaveEnd('');
      setLeaveReason('');
    }
  });

  const leaveStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const res = await fetch(`/api/hr/leaves/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error('Failed to update leave status');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
    }
  });

  const expenseMutation = useMutation({
    mutationFn: async (expData: any) => {
      const res = await fetch('/api/hr/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expData)
      });
      if (!res.ok) throw new Error('Failed to save expense');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setExpenseTitle('');
      setExpenseAmount('');
      setExpenseDate('');
    }
  });

  const expenseStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const res = await fetch(`/api/hr/expenses/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error('Failed to update expense status');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    }
  });

  const getEmpName = (id: string) => {
    return employees.find(e => e.id === id)?.name || "Unknown Employee";
  };

  // Clock Actions
  const handleClockIn = () => {
    if (!selectedEmpId) return;
    clockInMutation.mutate(selectedEmpId);
  };

  const handleClockOut = () => {
    if (!selectedEmpId) return;
    clockOutMutation.mutate(selectedEmpId);
  };

  // Form Submissions
  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpId || !leaveStart || !leaveEnd) return;

    setIsSaving(true);
    try {
      await leaveMutation.mutateAsync({
        employeeId: selectedEmpId,
        type: leaveType,
        startDate: new Date(leaveStart).toISOString(),
        endDate: new Date(leaveEnd).toISOString(),
        reason: leaveReason
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpId || !expenseTitle || !expenseAmount) return;

    setIsSaving(true);
    const amountCents = Math.round(parseFloat(expenseAmount) * 100);
    try {
      await expenseMutation.mutateAsync({
        employeeId: selectedEmpId,
        title: expenseTitle,
        amount: amountCents,
        category: expenseCategory,
        date: expenseDate ? new Date(expenseDate).toISOString() : undefined
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // Calculations / Status checks
  const todayStr = new Date().toDateString();
  const employeeTodayLogs = attendanceLogs.filter(a => {
    return a.employeeId === selectedEmpId && new Date(a.date).toDateString() === todayStr;
  });

  const isClockedIn = employeeTodayLogs.length > 0 && employeeTodayLogs.some(l => !l.clockOut);

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">HR Operations Board</h2>
          <p className="text-muted-foreground text-xs mt-1">Manage employee daily clocking, log administrative leaves, and authorize corporate expense claims.</p>
        </div>
        {/* Quick Employee Switcher */}
        <div className="flex items-center gap-2.5">
          <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest shrink-0">Punch Card:</span>
          {employees.length > 0 && (
            <Select 
              value={selectedEmpId} 
              onValueChange={(val) => setSelectedEmpId(val)}
            >
              <SelectTrigger className="w-52 h-9 text-xs uppercase font-bold tracking-wider">
                <SelectValue placeholder="EMPLOYEE" />
              </SelectTrigger>
              <SelectContent>
                {employees.map(e => (
                  <SelectItem key={e.id} value={e.id}>{e.name.toUpperCase()}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </header>

      {/* Tab bar */}
      <Tabs 
        value={activeTab} 
        onValueChange={(val) => setActiveTab(val as any)} 
        className="w-full space-y-6"
      >
        <TabsList className="grid grid-cols-3 w-full sm:w-[480px] h-10 bg-black/10">
          <TabsTrigger value="attendance" className="py-2 text-[10px]">Attendance</TabsTrigger>
          <TabsTrigger value="leaves" className="py-2 text-[10px]">Leaves</TabsTrigger>
          <TabsTrigger value="expenses" className="py-2 text-[10px]">Expense Claims</TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="focus-visible:outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in duration-200">
            {/* Punch Card Controls */}
            <Card className="lg:col-span-4 border-border bg-card/60 space-y-5">
              <CardHeader className="pb-3 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-primary" />
                  <CardTitle className="text-sm font-bold text-foreground">Roster Punch Card</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-5 pt-4">
                <div className="text-center py-2 space-y-2 bg-black/10 rounded-lg border border-border/40 p-4">
                  <p className="text-muted-foreground text-[9px] font-bold uppercase tracking-wider">Active Staff Punching</p>
                  <h4 className="text-base font-black text-foreground">{getEmpName(selectedEmpId)}</h4>
                  <Badge variant={isClockedIn ? 'success' : 'outline'} className="text-[9px] font-black uppercase mt-1">
                    {isClockedIn ? "Punch Active" : "Off-Duty"}
                  </Badge>
                </div>

                <div className="flex flex-col gap-2">
                  {!isClockedIn ? (
                    <Button
                      onClick={handleClockIn}
                      className="w-full text-xs font-bold gap-2 h-10"
                    >
                      <LogIn size={14} />
                      Clock In for Today
                    </Button>
                  ) : (
                    <Button
                      onClick={handleClockOut}
                      className="w-full text-xs font-bold gap-2 h-10 bg-amber-500/10 hover:bg-amber-500/15 text-amber-400 border border-amber-500/20 active:scale-[0.98]"
                    >
                      <LogOut size={14} />
                      Clock Out (Sign Off)
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Attendance logs List */}
            <div className="lg:col-span-8 space-y-4">
              <h4 className="font-bold text-sm text-foreground border-b border-border pb-2.5">Roster Attendance Log</h4>

              {attLoading ? (
                <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={24} /></div>
              ) : attendanceLogs.length === 0 ? (
                <div className="h-48 border border-dashed border-border rounded-xl flex items-center justify-center text-center p-6 text-muted-foreground text-xs font-medium">
                  No attendance logs found. Clock in above to start logs.
                </div>
              ) : (
                <div className="border border-border rounded-xl bg-card/40 overflow-hidden shadow-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="pl-4">Employee</TableHead>
                        <TableHead className="text-center w-32">Date</TableHead>
                        <TableHead className="text-center w-28">Clock In</TableHead>
                        <TableHead className="text-center w-28">Clock Out</TableHead>
                        <TableHead className="text-center w-24 pr-4">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendanceLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-bold text-foreground pl-4">{getEmpName(log.employeeId)}</TableCell>
                          <TableCell className="text-center text-muted-foreground">{new Date(log.date).toLocaleDateString('en-US')}</TableCell>
                          <TableCell className="text-center font-bold text-emerald-400 font-mono">{log.clockIn || '—'}</TableCell>
                          <TableCell className="text-center font-bold text-amber-500 font-mono">{log.clockOut || '—'}</TableCell>
                          <TableCell className="text-center pr-4">
                            <Badge variant={log.status === 'present' ? 'success' : 'warning'} className="text-[9px] font-black uppercase py-0.5">
                              {log.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="leaves" className="focus-visible:outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in duration-200">
            {/* Leaves Submission Form */}
            <Card className="lg:col-span-4 border-border bg-card/60 space-y-4 p-5">
              <h3 className="font-bold text-sm text-foreground border-b border-border pb-2.5">Leave Application</h3>

              <form onSubmit={handleLeaveSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-bold text-muted-foreground uppercase tracking-widest pl-0.5">Leave Category</label>
                  <Select 
                    value={leaveType} 
                    onValueChange={(val) => setLeaveType(val)}
                  >
                    <SelectTrigger className="w-full text-xs font-bold uppercase tracking-wider h-10">
                      <SelectValue placeholder="CATEGORY" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vacation">VACATION LEAVE</SelectItem>
                      <SelectItem value="sick">SICK LEAVE</SelectItem>
                      <SelectItem value="unpaid">UNPAID ABSENCE</SelectItem>
                      <SelectItem value="maternity">MATERNITY/PATERNITY</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-bold text-muted-foreground uppercase tracking-widest pl-0.5">Start Date</label>
                    <Input
                      type="date"
                      required
                      value={leaveStart}
                      onChange={(e) => setLeaveStart(e.target.value)}
                      className="text-xs cursor-pointer"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-bold text-muted-foreground uppercase tracking-widest pl-0.5">End Date</label>
                    <Input
                      type="date"
                      required
                      value={leaveEnd}
                      onChange={(e) => setLeaveEnd(e.target.value)}
                      className="text-xs cursor-pointer"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[9px] font-bold text-muted-foreground uppercase tracking-widest pl-0.5">Leave Reason</label>
                  <textarea
                    rows={3}
                    required
                    value={leaveReason}
                    onChange={(e) => setLeaveReason(e.target.value)}
                    placeholder="Provide brief details regarding request..."
                    className="glass-input text-xs h-16 resize-none bg-black/10"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSaving}
                  className="w-full text-xs font-bold gap-1.5 h-10"
                >
                  {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                  Apply for Leave
                </Button>
              </form>
            </Card>

            {/* Leaves Requests List */}
            <div className="lg:col-span-8 space-y-4">
              <h4 className="font-bold text-sm text-foreground border-b border-border pb-2.5">Roster Leaves Ledger</h4>

              {leavesLoading ? (
                <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={24} /></div>
              ) : leaves.length === 0 ? (
                <div className="h-48 border border-dashed border-border rounded-xl flex items-center justify-center text-center p-6 text-muted-foreground text-xs font-medium">
                  No leave requests logged in system database.
                </div>
              ) : (
                <div className="border border-border rounded-xl bg-card/40 overflow-hidden shadow-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="pl-4">Employee</TableHead>
                        <TableHead className="text-center w-28">Type</TableHead>
                        <TableHead className="text-center w-36">Period</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead className="text-center w-28">Status</TableHead>
                        <TableHead className="text-center w-20 pr-4">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leaves.map((leave) => (
                        <TableRow key={leave.id}>
                          <TableCell className="font-bold text-foreground pl-4">{getEmpName(leave.employeeId)}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="text-[9px] font-black uppercase text-primary border-primary/20 bg-primary/5 py-0.5">{leave.type}</Badge>
                          </TableCell>
                          <TableCell className="text-center text-muted-foreground font-medium text-xs">
                            {new Date(leave.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(leave.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </TableCell>
                          <TableCell className="text-foreground/80 max-w-[150px] truncate">{leave.reason || '—'}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant={leave.status === 'approved' ? 'success' : leave.status === 'pending' ? 'warning' : 'destructive'} className="text-[9px] font-black uppercase py-0.5">
                              {leave.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center pr-4">
                            {leave.status === 'pending' ? (
                              <div className="flex gap-1 justify-center">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => leaveStatusMutation.mutate({ id: leave.id, status: 'approved' })}
                                  className="w-6 h-6 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                  title="Approve Leave"
                                >
                                  <CheckCircle2 size={10} />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => leaveStatusMutation.mutate({ id: leave.id, status: 'rejected' })}
                                  className="w-6 h-6 bg-rose-500/5 hover:bg-rose-500/10 text-rose-400 border-rose-500/20"
                                  title="Reject Leave"
                                >
                                  <XCircle size={10} />
                                </Button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-muted-foreground/60">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="expenses" className="focus-visible:outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in duration-200">
            {/* Expense Claim Form */}
            <Card className="lg:col-span-4 border-border bg-card/60 space-y-4 p-5">
              <h3 className="font-bold text-sm text-foreground border-b border-border pb-2.5">File Expense Claim</h3>

              <form onSubmit={handleExpenseSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-bold text-muted-foreground uppercase tracking-widest pl-0.5">Claim Title</label>
                  <Input
                    type="text"
                    required
                    value={expenseTitle}
                    onChange={(e) => setExpenseTitle(e.target.value)}
                    placeholder="e.g. Ergonomic Office Chair"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-bold text-muted-foreground uppercase tracking-widest pl-0.5">Claim Amount ($)</label>
                    <Input
                      type="number"
                      required
                      min="0"
                      value={expenseAmount}
                      onChange={(e) => setExpenseAmount(e.target.value)}
                      placeholder="e.g. 150"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-bold text-muted-foreground uppercase tracking-widest pl-0.5">Receipt Date</label>
                    <Input
                      type="date"
                      required
                      value={expenseDate}
                      onChange={(e) => setExpenseDate(e.target.value)}
                      className="cursor-pointer"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[9px] font-bold text-muted-foreground uppercase tracking-widest pl-0.5">Category</label>
                  <Select 
                    value={expenseCategory} 
                    onValueChange={(val) => setExpenseCategory(val)}
                  >
                    <SelectTrigger className="w-full text-xs font-bold uppercase tracking-wider h-10">
                      <SelectValue placeholder="CATEGORY" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="supplies">OFFICE SUPPLIES</SelectItem>
                      <SelectItem value="travel">BUSINESS TRAVEL</SelectItem>
                      <SelectItem value="meals">CLIENT MEALS</SelectItem>
                      <SelectItem value="software">SOFTWARE SUBSCRIPTIONS</SelectItem>
                      <SelectItem value="other">GENERAL OTHER</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="submit"
                  disabled={isSaving}
                  className="w-full text-xs font-bold gap-1.5 h-10"
                >
                  {isSaving ? <Loader2 size={13} className="animate-spin" /> : <DollarSign size={13} />}
                  Submit Claim
                </Button>
              </form>
            </Card>

            {/* Expense Claims List */}
            <div className="lg:col-span-8 space-y-4">
              <h4 className="font-bold text-sm text-foreground border-b border-border pb-2.5">Reimbursements Log</h4>

              {expLoading ? (
                <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={24} /></div>
              ) : expenses.length === 0 ? (
                <div className="h-48 border border-dashed border-border rounded-xl flex items-center justify-center text-center p-6 text-muted-foreground text-xs font-medium">
                  No expense claims logged in system database.
                </div>
              ) : (
                <div className="border border-border rounded-xl bg-card/40 overflow-hidden shadow-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="pl-4">Employee</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-center w-28">Category</TableHead>
                        <TableHead className="text-right w-28">Amount</TableHead>
                        <TableHead className="text-center w-28">Status</TableHead>
                        <TableHead className="text-center w-20 pr-4">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenses.map((claim) => (
                        <TableRow key={claim.id}>
                          <TableCell className="font-bold text-foreground pl-4">{getEmpName(claim.employeeId)}</TableCell>
                          <TableCell>
                            <div className="text-foreground/80 font-bold text-xs">{claim.title}</div>
                            <div className="text-[9px] text-muted-foreground font-bold uppercase mt-0.5 tracking-tight">{new Date(claim.date).toLocaleDateString('en-US')}</div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="text-[9px] font-black uppercase text-primary border-primary/20 bg-primary/5 py-0.5">{claim.category}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-bold text-foreground font-mono">
                            ${(claim.amount / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={claim.status === 'approved' ? 'success' : claim.status === 'pending' ? 'warning' : 'destructive'} className="text-[9px] font-black uppercase py-0.5">
                              {claim.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center pr-4">
                            {claim.status === 'pending' ? (
                              <div className="flex gap-1 justify-center">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => expenseStatusMutation.mutate({ id: claim.id, status: 'approved' })}
                                  className="w-6 h-6 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                  title="Approve Claim"
                                >
                                  <CheckCircle2 size={10} />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => expenseStatusMutation.mutate({ id: claim.id, status: 'rejected' })}
                                  className="w-6 h-6 bg-rose-500/5 hover:bg-rose-500/10 text-rose-400 border-rose-500/20"
                                  title="Reject Claim"
                                >
                                  <XCircle size={10} />
                                </Button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-muted-foreground/60">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
