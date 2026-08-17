import { query, mutation } from '../convex/core';

export const getContracts = query({
  handler: async (ctx) => {
    return await ctx.db.query('contract').collect();
  },
});

export const getContractById = query({
  handler: async (ctx, args: { id: string }) => {
    return await ctx.db.get('contract', args.id);
  },
});

export const createContract = mutation({
  handler: async (ctx, args: {
    title: string;
    description?: string;
    value?: number;
    clientId?: string;
    startDate?: string;
    endDate?: string;
    status?: 'draft' | 'under_review' | 'active' | 'expired' | 'terminated';
  }) => {
    if (!args.title) throw new Error('Contract title is required');
    const contract = await ctx.db.insert('contract', {
      title: args.title,
      description: args.description || '',
      value: args.value ?? 0,
      clientId: args.clientId || '',
      startDate: args.startDate,
      endDate: args.endDate,
      status: args.status || 'draft',
      userId: ctx.auth.userId,
    });
    ctx.broadcast('contracts:changed', { type: 'insert', data: contract });
    return contract;
  },
});

export const updateContractStatus = mutation({
  handler: async (ctx, args: { id: string; status: 'draft' | 'under_review' | 'active' | 'expired' | 'terminated' }) => {
    const updated = await ctx.db.patch('contract', args.id, { status: args.status });
    if (!updated) throw new Error('Contract not found');
    ctx.broadcast('contracts:changed', { type: 'update', data: updated });
    return updated;
  },
});
