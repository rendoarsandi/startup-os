import { query, mutation } from '../runtime/core';

export const getEmployees = query({
  handler: async (ctx) => {
    return await ctx.db.query('employee').collect();
  },
});

export const createEmployee = mutation({
  handler: async (ctx, args: {
    name: string;
    role: string;
    department: string;
    salary: number;
    status?: string;
    startDate?: string;
  }) => {
    if (!args.name || !args.role || !args.department || args.salary === undefined) {
      throw new Error('name, role, department, and salary are required');
    }
    const emp = await ctx.db.insert('employee', {
      name: args.name,
      role: args.role,
      department: args.department,
      salary: args.salary,
      status: args.status || 'active',
      startDate: args.startDate || new Date().toISOString(),
      userId: ctx.auth.userId,
    });
    ctx.broadcast('employees:changed', { type: 'insert', data: emp });
    return emp;
  },
});

export const getAttendance = query({
  handler: async (ctx) => {
    return await ctx.db.query('attendance').order('desc', 'date').collect();
  },
});

export const logAttendance = mutation({
  handler: async (ctx, args: {
    employeeId: string;
    date?: string;
    status?: string;
    clockIn?: string;
    clockOut?: string;
  }) => {
    const record = await ctx.db.insert('attendance', {
      employeeId: args.employeeId,
      date: args.date || new Date().toISOString(),
      status: args.status || 'present',
      clockIn: args.clockIn || '09:00 AM',
      clockOut: args.clockOut || '06:00 PM',
      userId: ctx.auth.userId,
    });
    ctx.broadcast('attendance:changed', { type: 'insert', data: record });
    return record;
  },
});

export const getLeaveRequests = query({
  handler: async (ctx) => {
    return await ctx.db.query('leave_request').order('desc', 'startDate').collect();
  },
});

export const submitLeaveRequest = mutation({
  handler: async (ctx, args: {
    employeeId: string;
    type: string;
    startDate: string;
    endDate: string;
    reason?: string;
  }) => {
    const leave = await ctx.db.insert('leave_request', {
      employeeId: args.employeeId,
      type: args.type,
      startDate: args.startDate,
      endDate: args.endDate,
      status: 'pending',
      reason: args.reason || '',
      userId: ctx.auth.userId,
    });
    ctx.broadcast('leaveRequests:changed', { type: 'insert', data: leave });
    return leave;
  },
});

export const updateLeaveStatus = mutation({
  handler: async (ctx, args: { id: string; status: 'approved' | 'rejected' | 'pending' }) => {
    const updated = await ctx.db.patch('leave_request', args.id, { status: args.status });
    if (!updated) throw new Error('Leave request not found');
    ctx.broadcast('leaveRequests:changed', { type: 'update', data: updated });
    return updated;
  },
});

export const getExpenseClaims = query({
  handler: async (ctx) => {
    return await ctx.db.query('expense_claim').order('desc', 'date').collect();
  },
});

export const submitExpenseClaim = mutation({
  handler: async (ctx, args: {
    employeeId: string;
    title: string;
    amount: number;
    category: string;
    receiptUrl?: string;
  }) => {
    const claim = await ctx.db.insert('expense_claim', {
      employeeId: args.employeeId,
      title: args.title,
      amount: args.amount,
      category: args.category,
      receiptUrl: args.receiptUrl || '',
      status: 'pending',
      date: new Date().toISOString(),
      userId: ctx.auth.userId,
    });
    ctx.broadcast('expenseClaims:changed', { type: 'insert', data: claim });
    return claim;
  },
});

export const updateExpenseStatus = mutation({
  handler: async (ctx, args: { id: string; status: 'approved' | 'rejected' | 'pending' }) => {
    const updated = await ctx.db.patch('expense_claim', args.id, { status: args.status });
    if (!updated) throw new Error('Expense claim not found');
    ctx.broadcast('expenseClaims:changed', { type: 'update', data: updated });
    return updated;
  },
});
