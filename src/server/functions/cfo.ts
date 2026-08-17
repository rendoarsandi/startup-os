import { query, mutation, action } from '../convex/core';
import { GeminiService } from '../gemini';

export const getAccounts = query({
  handler: async (ctx) => {
    return await ctx.db.query('financial_account').collect();
  },
});

export const createAccount = mutation({
  handler: async (ctx, args: { name: string; type: string; balance?: number; currency?: string }) => {
    if (!args.name || !args.type) {
      throw new Error('Account name and type are required');
    }
    const account = await ctx.db.insert('financial_account', {
      name: args.name,
      type: args.type,
      balance: args.balance ?? 0,
      currency: args.currency || 'USD',
      userId: ctx.auth.userId,
    });
    ctx.broadcast('accounts:changed', { type: 'insert', data: account });
    return account;
  },
});

export const getTransactions = query({
  handler: async (ctx) => {
    return await ctx.db.query('transaction').order('desc', 'date').collect();
  },
});

export const createTransaction = mutation({
  handler: async (ctx, args: {
    accountId: string;
    amount: number;
    merchant: string;
    category?: string;
    description?: string;
    date?: string;
  }) => {
    if (!args.accountId || args.amount === undefined || !args.merchant) {
      throw new Error('accountId, amount, and merchant are required');
    }

    const account = await ctx.db.get('financial_account', args.accountId);
    if (!account) {
      throw new Error(`Financial account with ID '${args.accountId}' not found`);
    }

    const tx = await ctx.db.insert('transaction', {
      accountId: args.accountId,
      amount: args.amount,
      merchant: args.merchant,
      category: args.category || 'General',
      description: args.description || '',
      date: args.date || new Date().toISOString(),
      userId: ctx.auth.userId,
    });

    // Update account balance
    const newBalance = (account.balance || 0) + args.amount;
    await ctx.db.patch('financial_account', args.accountId, { balance: newBalance });
    ctx.broadcast('accounts:changed', { type: 'update', data: { id: args.accountId, balance: newBalance } });

    ctx.broadcast('transactions:changed', { type: 'insert', data: tx });
    return tx;
  },
});

export const getBudgets = query({
  handler: async (ctx) => {
    return await ctx.db.query('budget').collect();
  },
});

export const createBudget = mutation({
  handler: async (ctx, args: { category: string; amount: number; period?: string }) => {
    if (!args.category || args.amount === undefined) {
      throw new Error('Category and amount are required');
    }
    const budget = await ctx.db.insert('budget', {
      category: args.category,
      amount: args.amount,
      period: args.period || 'monthly',
      userId: ctx.auth.userId,
    });
    ctx.broadcast('budgets:changed', { type: 'insert', data: budget });
    return budget;
  },
});

export const getInvoices = query({
  handler: async (ctx) => {
    return await ctx.db.query('invoice').order('desc', 'issueDate').collect();
  },
});

export const createInvoice = mutation({
  handler: async (ctx, args: {
    invoiceNumber: string;
    clientName: string;
    type: 'sales' | 'purchase';
    amount: number;
    status?: 'paid' | 'unpaid' | 'overdue';
    issueDate?: string;
    dueDate?: string;
    items?: string;
  }) => {
    if (!args.invoiceNumber || !args.clientName || !args.type || args.amount === undefined) {
      throw new Error('invoiceNumber, clientName, type, and amount are required');
    }

    const invoice = await ctx.db.insert('invoice', {
      invoiceNumber: args.invoiceNumber,
      clientName: args.clientName,
      type: args.type,
      amount: args.amount,
      status: args.status || 'unpaid',
      issueDate: args.issueDate || new Date().toISOString(),
      dueDate: args.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      items: args.items || '[]',
      userId: ctx.auth.userId,
    });

    ctx.broadcast('invoices:changed', { type: 'insert', data: invoice });
    return invoice;
  },
});

export const updateInvoiceStatus = mutation({
  handler: async (ctx, args: { id: string; status: 'paid' | 'unpaid' | 'overdue' }) => {
    const updated = await ctx.db.patch('invoice', args.id, { status: args.status });
    if (!updated) throw new Error('Invoice not found');
    ctx.broadcast('invoices:changed', { type: 'update', data: updated });
    return updated;
  },
});

export const getSaasConfig = query({
  handler: async (ctx) => {
    const configs = await ctx.db.query('saas_config').collect();
    return configs[0] || {
      startingMrr: 1500000,
      churnRate: 200,
      cac: 10000,
      arpu: 5000,
      grossMargin: 80,
    };
  },
});

export const updateSaasConfig = mutation({
  handler: async (ctx, args: {
    startingMrr?: number;
    churnRate?: number;
    cac?: number;
    arpu?: number;
    grossMargin?: number;
  }) => {
    const configs = await ctx.db.query('saas_config').collect();
    if (configs.length > 0) {
      const updated = await ctx.db.patch('saas_config', configs[0].id, args);
      ctx.broadcast('saasConfig:changed', { type: 'update', data: updated });
      return updated;
    }
    const created = await ctx.db.insert('saas_config', {
      ...args,
      userId: ctx.auth.userId,
    });
    ctx.broadcast('saasConfig:changed', { type: 'insert', data: created });
    return created;
  },
});
