import React, { useState } from 'react';
import { 
  Users, CheckCircle2, XCircle, Plus, Loader2, LogIn, LogOut, DollarSign
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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

export const HROperations: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'attendance' | 'leaves' | 'expenses'>('attendance');
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
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">HR Operations Board</h2>
          <p className="text-white/40 text-xs mt-1">Manage employee daily clocking, log administrative leaves, and authorize corporate expense claims.</p>
        </div>
        {/* Quick Employee Switcher */}
        <div className="flex items-center gap-2.5">
          <span className="text-[10px] text-white/40 uppercase font-black tracking-widest shrink-0">Punch Card:</span>
          <select
            value={selectedEmpId}
            onChange={(e) => setSelectedEmpId(e.target.value)}
            className="glass-input h-9 px-3 py-1 font-bold text-xs cursor-pointer uppercase bg-white/[0.02] border-white/5 max-w-[200px]"
          >
            {employees.map(e => (
              <option key={e.id} value={e.id}>{e.name.toUpperCase()}</option>
            ))}
          </select>
        </div>
      </header>

      {/* Tab bar - Clean ERP styled buttons */}
      <div className="flex border-b border-white/5">
        <button
          onClick={() => setActiveTab('attendance')}
          className={`px-5 py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-all ${activeTab === 'attendance' ? 'border-primary text-white font-extrabold' : 'border-transparent text-white/40 hover:text-white/70'}`}
        >
          Attendance
        </button>
        <button
          onClick={() => setActiveTab('leaves')}
          className={`px-5 py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-all ${activeTab === 'leaves' ? 'border-primary text-white font-extrabold' : 'border-transparent text-white/40 hover:text-white/70'}`}
        >
          Leaves
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={`px-5 py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-all ${activeTab === 'expenses' ? 'border-primary text-white font-extrabold' : 'border-transparent text-white/40 hover:text-white/70'}`}
        >
          Expense Claims
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'attendance' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Punch Card Controls - 4 Columns */}
          <div className="lg:col-span-4 glass-card p-6 border-white/5 space-y-5 bg-white/[0.01]">
            <div className="flex items-center gap-2 border-b border-white/5 pb-3">
              <Users size={16} className="text-primary animate-pulse" />
              <h3 className="font-extrabold text-sm text-white">Roster Punch Card</h3>
            </div>

            <div className="text-center py-4 space-y-2">
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider">Active Staff Punching</p>
              <h4 className="text-base font-black text-white">{getEmpName(selectedEmpId)}</h4>
              <p className="text-white/30 text-[10px] mt-1">Status: {isClockedIn ? "Punch Active" : "Off-Duty"}</p>
            </div>

            <div className="flex flex-col gap-2">
              {!isClockedIn ? (
                <button
                  onClick={handleClockIn}
                  className="btn-primary h-11 w-full flex items-center justify-center gap-2 text-xs font-extrabold cursor-pointer"
                >
                  <LogIn size={14} />
                  Clock In for Today
                </button>
              ) : (
                <button
                  onClick={handleClockOut}
                  className="btn-secondary h-11 w-full flex items-center justify-center gap-2 text-xs font-extrabold cursor-pointer bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20"
                >
                  <LogOut size={14} />
                  Clock Out (Sign Off)
                </button>
              )}
            </div>
          </div>

          {/* Attendance logs List - 8 Columns */}
          <div className="lg:col-span-8 space-y-4">
            <h4 className="font-extrabold text-sm text-white border-b border-white/5 pb-2">Roster Attendance Log</h4>

            {attLoading ? (
              <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={24} /></div>
            ) : attendanceLogs.length === 0 ? (
              <div className="h-48 border border-white/5 rounded-xl bg-white/[0.01] flex items-center justify-center text-center p-6 text-white/30 text-xs">
                No attendance logs found. Clock in above to start logs.
              </div>
            ) : (
              <div className="border border-white/5 rounded-xl bg-[#080710]/40 backdrop-blur-md overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-[9px] uppercase font-black text-white/30 tracking-widest pb-3 bg-white/[0.01]">
                      <th className="py-3 px-4">Employee</th>
                      <th className="py-3 px-4 text-center">Date</th>
                      <th className="py-3 px-4 text-center">Clock In</th>
                      <th className="py-3 px-4 text-center">Clock Out</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceLogs.map((log) => (
                      <tr key={log.id} className="border-b border-white/[0.03] hover:bg-white/[0.01]">
                        <td className="py-3 px-4 font-bold text-white">{getEmpName(log.employeeId)}</td>
                        <td className="py-3 px-4 text-center text-white/50">{new Date(log.date).toLocaleDateString('en-US')}</td>
                        <td className="py-3 px-4 text-center font-black text-emerald-400">{log.clockIn || '—'}</td>
                        <td className="py-3 px-4 text-center font-black text-amber-500">{log.clockOut || '—'}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${log.status === 'present' ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400' : 'bg-amber-500/5 border-amber-500/10 text-amber-400'}`}>{log.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Leaves Tab */}
      {activeTab === 'leaves' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Leaves Submission Form - 4 Columns */}
          <div className="lg:col-span-4 glass-card p-6 border-white/5 space-y-4 bg-white/[0.01]">
            <h3 className="font-extrabold text-sm text-white border-b border-white/5 pb-2.5">Leave Application</h3>

            <form onSubmit={handleLeaveSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[9px] font-bold text-white/40 uppercase tracking-widest">Leave Category</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="glass-input bg-[#080710] pr-8 cursor-pointer uppercase font-bold text-xs"
                >
                  <option value="vacation">VACATION LEAVE</option>
                  <option value="sick">SICK LEAVE</option>
                  <option value="unpaid">UNPAID ABSENCE</option>
                  <option value="maternity">MATERNITY/PATERNITY</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-bold text-white/40 uppercase tracking-widest">Start Date</label>
                  <input
                    type="date"
                    required
                    value={leaveStart}
                    onChange={(e) => setLeaveStart(e.target.value)}
                    className="glass-input text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-bold text-white/40 uppercase tracking-widest">End Date</label>
                  <input
                    type="date"
                    required
                    value={leaveEnd}
                    onChange={(e) => setLeaveEnd(e.target.value)}
                    className="glass-input text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[9px] font-bold text-white/40 uppercase tracking-widest">Leave Reason</label>
                <textarea
                  rows={3}
                  required
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder="Provide brief details regarding request..."
                  className="glass-input text-xs h-16 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="btn-primary h-10 w-full flex items-center justify-center gap-1.5 text-xs font-bold cursor-pointer"
              >
                {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                Apply for Leave
              </button>
            </form>
          </div>

          {/* Leaves Requests List - 8 Columns */}
          <div className="lg:col-span-8 space-y-4">
            <h4 className="font-extrabold text-sm text-white border-b border-white/5 pb-2">Roster Leaves Ledger</h4>

            {leavesLoading ? (
              <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={24} /></div>
            ) : leaves.length === 0 ? (
              <div className="h-48 border border-white/5 rounded-xl bg-white/[0.01] flex items-center justify-center text-center p-6 text-white/30 text-xs">
                No leave requests logged in system database.
              </div>
            ) : (
              <div className="border border-white/5 rounded-xl bg-[#080710]/40 backdrop-blur-md overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-[9px] uppercase font-black text-white/30 tracking-widest pb-3 bg-white/[0.01]">
                      <th className="py-3 px-4">Employee</th>
                      <th className="py-3 px-4 text-center">Type</th>
                      <th className="py-3 px-4 text-center">Period</th>
                      <th className="py-3 px-4">Reason</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-center">Authorization</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaves.map((leave) => (
                      <tr key={leave.id} className="border-b border-white/[0.03] hover:bg-white/[0.01]">
                        <td className="py-3.5 px-4 font-bold text-white">{getEmpName(leave.employeeId)}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-block text-[9px] font-black uppercase text-primary tracking-wider">{leave.type}</span>
                        </td>
                        <td className="py-3.5 px-4 text-center text-white/40">
                          {new Date(leave.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(leave.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </td>
                        <td className="py-3.5 px-4 text-white/70 max-w-[150px] truncate">{leave.reason || '—'}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[9px] font-black uppercase border ${leave.status === 'approved' ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400' : leave.status === 'pending' ? 'bg-amber-500/5 border-amber-500/10 text-amber-400 animate-pulse' : 'bg-rose-500/5 border-rose-500/10 text-rose-400'}`}>{leave.status}</span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {leave.status === 'pending' ? (
                            <div className="flex gap-1 justify-center">
                              <button
                                onClick={() => leaveStatusMutation.mutate({ id: leave.id, status: 'approved' })}
                                className="p-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/10 cursor-pointer"
                                title="Approve Leave"
                              >
                                <CheckCircle2 size={10} />
                              </button>
                              <button
                                onClick={() => leaveStatusMutation.mutate({ id: leave.id, status: 'rejected' })}
                                className="p-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/10 cursor-pointer"
                                title="Reject Leave"
                              >
                                <XCircle size={10} />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-white/20">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Expenses Tab */}
      {activeTab === 'expenses' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Expense Claim Form - 4 Columns */}
          <div className="lg:col-span-4 glass-card p-6 border-white/5 space-y-4 bg-white/[0.01]">
            <h3 className="font-extrabold text-sm text-white border-b border-white/5 pb-2.5">File Expense Claim</h3>

            <form onSubmit={handleExpenseSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[9px] font-bold text-white/40 uppercase tracking-widest">Claim Title</label>
                <input
                  type="text"
                  required
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  placeholder="e.g. Ergonomic Office Chair"
                  className="glass-input text-xs bg-white/[0.01]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-bold text-white/40 uppercase tracking-widest">Claim Amount ($)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    placeholder="e.g. 150"
                    className="glass-input text-xs bg-white/[0.01]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-bold text-white/40 uppercase tracking-widest">Receipt Date</label>
                  <input
                    type="date"
                    required
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="glass-input text-xs bg-white/[0.01]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[9px] font-bold text-white/40 uppercase tracking-widest">Category</label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value)}
                  className="glass-input bg-[#080710] pr-8 cursor-pointer uppercase font-bold text-xs"
                >
                  <option value="supplies">OFFICE SUPPLIES</option>
                  <option value="travel">BUSINESS TRAVEL</option>
                  <option value="meals">CLIENT MEALS</option>
                  <option value="software">SOFTWARE SUBSCRIPTIONS</option>
                  <option value="other">GENERAL OTHER</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="btn-primary h-10 w-full flex items-center justify-center gap-1.5 text-xs font-bold cursor-pointer"
              >
                {isSaving ? <Loader2 size={13} className="animate-spin" /> : <DollarSign size={13} />}
                Submit Claim
              </button>
            </form>
          </div>

          {/* Expense Claims List - 8 Columns */}
          <div className="lg:col-span-8 space-y-4">
            <h4 className="font-extrabold text-sm text-white border-b border-white/5 pb-2">Reimbursements Log</h4>

            {expLoading ? (
              <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={24} /></div>
            ) : expenses.length === 0 ? (
              <div className="h-48 border border-white/5 rounded-xl bg-white/[0.01] flex items-center justify-center text-center p-6 text-white/30 text-xs">
                No expense claims logged in system database.
              </div>
            ) : (
              <div className="border border-white/5 rounded-xl bg-[#080710]/40 backdrop-blur-md overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-[9px] uppercase font-black text-white/30 tracking-widest pb-3 bg-white/[0.01]">
                      <th className="py-3 px-4">Employee</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4 text-center">Category</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((claim) => (
                      <tr key={claim.id} className="border-b border-white/[0.03] hover:bg-white/[0.01]">
                        <td className="py-3.5 px-4 font-bold text-white">{getEmpName(claim.employeeId)}</td>
                        <td className="py-3.5 px-4">
                          <div className="text-white/80 font-semibold">{claim.title}</div>
                          <div className="text-[9px] text-white/30 font-bold uppercase mt-0.5 tracking-tight">{new Date(claim.date).toLocaleDateString('en-US')}</div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="text-[9px] font-black uppercase text-primary px-1.5 py-0.5 rounded bg-primary/5 tracking-wider">{claim.category}</span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-white">
                          ${(claim.amount / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[9px] font-black uppercase border ${claim.status === 'approved' ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400' : claim.status === 'pending' ? 'bg-amber-500/5 border-amber-500/10 text-amber-400 animate-pulse' : 'bg-rose-500/5 border-rose-500/10 text-rose-400'}`}>{claim.status}</span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {claim.status === 'pending' ? (
                            <div className="flex gap-1 justify-center">
                              <button
                                onClick={() => expenseStatusMutation.mutate({ id: claim.id, status: 'approved' })}
                                className="p-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/10 cursor-pointer"
                                title="Approve Claim"
                              >
                                <CheckCircle2 size={10} />
                              </button>
                              <button
                                onClick={() => expenseStatusMutation.mutate({ id: claim.id, status: 'rejected' })}
                                className="p-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/10 cursor-pointer"
                                title="Reject Claim"
                              >
                                <XCircle size={10} />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-white/20">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
};
