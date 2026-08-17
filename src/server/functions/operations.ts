import { query, mutation } from '../runtime/core';

export const getInventory = query({
  handler: async (ctx) => {
    return await ctx.db.query('inventory_item').collect();
  },
});

export const createInventoryItem = mutation({
  handler: async (ctx, args: {
    sku: string;
    name: string;
    qty: number;
    rate: number;
    warehouse?: string;
    reorderLevel?: number;
  }) => {
    if (!args.sku || !args.name || args.qty === undefined || args.rate === undefined) {
      throw new Error('sku, name, qty, and rate are required');
    }
    const item = await ctx.db.insert('inventory_item', {
      sku: args.sku,
      name: args.name,
      qty: args.qty,
      rate: args.rate,
      warehouse: args.warehouse || 'Main Warehouse',
      reorderLevel: args.reorderLevel ?? 5,
      userId: ctx.auth.userId,
    });
    ctx.broadcast('inventory:changed', { type: 'insert', data: item });
    return item;
  },
});

export const updateInventoryStock = mutation({
  handler: async (ctx, args: { id: string; delta: number }) => {
    const item = await ctx.db.get('inventory_item', args.id);
    if (!item) throw new Error('Inventory item not found');
    const newQty = Math.max(0, (item.qty || 0) + args.delta);
    const updated = await ctx.db.patch('inventory_item', args.id, { qty: newQty });
    ctx.broadcast('inventory:changed', { type: 'update', data: updated });
    return updated;
  },
});

export const getProjects = query({
  handler: async (ctx) => {
    return await ctx.db.query('project').collect();
  },
});

export const createProject = mutation({
  handler: async (ctx, args: {
    name: string;
    description?: string;
    status?: 'active' | 'completed' | 'on_hold';
    dueDate?: string;
  }) => {
    if (!args.name) throw new Error('Project name is required');
    const proj = await ctx.db.insert('project', {
      name: args.name,
      description: args.description || '',
      status: args.status || 'active',
      dueDate: args.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      userId: ctx.auth.userId,
    });
    ctx.broadcast('projects:changed', { type: 'insert', data: proj });
    return proj;
  },
});

export const updateProjectStatus = mutation({
  handler: async (ctx, args: { id: string; status: 'active' | 'completed' | 'on_hold' }) => {
    const updated = await ctx.db.patch('project', args.id, { status: args.status });
    if (!updated) throw new Error('Project not found');
    ctx.broadcast('projects:changed', { type: 'update', data: updated });
    return updated;
  },
});

export const getTickets = query({
  handler: async (ctx) => {
    return await ctx.db.query('support_ticket').collect();
  },
});

export const createTicket = mutation({
  handler: async (ctx, args: {
    customerName: string;
    subject: string;
    description: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
  }) => {
    if (!args.customerName || !args.subject || !args.description) {
      throw new Error('customerName, subject, and description are required');
    }
    const ticket = await ctx.db.insert('support_ticket', {
      customerName: args.customerName,
      subject: args.subject,
      description: args.description,
      priority: args.priority || 'medium',
      status: 'open',
      userId: ctx.auth.userId,
    });
    ctx.broadcast('tickets:changed', { type: 'insert', data: ticket });
    return ticket;
  },
});

export const updateTicketStatus = mutation({
  handler: async (ctx, args: { id: string; status: 'open' | 'in_progress' | 'resolved' }) => {
    const updated = await ctx.db.patch('support_ticket', args.id, { status: args.status });
    if (!updated) throw new Error('Ticket not found');
    ctx.broadcast('tickets:changed', { type: 'update', data: updated });
    return updated;
  },
});

export const getAutopilotRules = query({
  handler: async (ctx) => {
    return await ctx.db.query('autopilot_rule').collect();
  },
});

export const createAutopilotRule = mutation({
  handler: async (ctx, args: {
    name: string;
    triggerType: string;
    triggerValue: string;
    actionType: string;
    actionTarget: string;
    actionTemplate?: string;
  }) => {
    if (!args.name || !args.triggerType || !args.triggerValue || !args.actionType || !args.actionTarget) {
      throw new Error('name, triggerType, triggerValue, actionType, and actionTarget are required');
    }
    const rule = await ctx.db.insert('autopilot_rule', {
      name: args.name,
      triggerType: args.triggerType,
      triggerValue: args.triggerValue,
      actionType: args.actionType,
      actionTarget: args.actionTarget,
      actionTemplate: args.actionTemplate || '',
      enabled: true,
      executionCount: 0,
      userId: ctx.auth.userId,
    });
    ctx.broadcast('autopilot:changed', { type: 'insert', data: rule });
    return rule;
  },
});

export const toggleAutopilotRule = mutation({
  handler: async (ctx, args: { id: string; enabled?: boolean }) => {
    const rule = await ctx.db.get('autopilot_rule', args.id);
    if (!rule) throw new Error('Autopilot rule not found');
    const newEnabled = args.enabled !== undefined ? args.enabled : !rule.enabled;
    const updated = await ctx.db.patch('autopilot_rule', args.id, { enabled: newEnabled });
    ctx.broadcast('autopilot:changed', { type: 'update', data: updated });
    return updated;
  },
});
