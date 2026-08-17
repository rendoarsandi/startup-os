import { query, mutation } from '../runtime/core';

export const getCampaigns = query({
  handler: async (ctx) => {
    return await ctx.db.query('marketing_campaign').collect();
  },
});

export const createCampaign = mutation({
  handler: async (ctx, args: {
    name: string;
    budget: number;
    spend?: number;
    conversions?: number;
    roas?: number;
    status?: 'active' | 'paused' | 'completed';
  }) => {
    if (!args.name || args.budget === undefined) {
      throw new Error('name and budget are required');
    }
    const campaign = await ctx.db.insert('marketing_campaign', {
      name: args.name,
      budget: args.budget,
      spend: args.spend ?? 0,
      conversions: args.conversions ?? 0,
      roas: args.roas ?? 0,
      status: args.status || 'active',
      userId: ctx.auth.userId,
    });
    ctx.broadcast('campaigns:changed', { type: 'insert', data: campaign });
    return campaign;
  },
});

export const updateCampaignStatus = mutation({
  handler: async (ctx, args: { id: string; status: 'active' | 'paused' | 'completed' }) => {
    const updated = await ctx.db.patch('marketing_campaign', args.id, { status: args.status });
    if (!updated) throw new Error('Campaign not found');
    ctx.broadcast('campaigns:changed', { type: 'update', data: updated });
    return updated;
  },
});
