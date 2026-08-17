import { mutation } from '../convex/core';

export const seedWorkspaceData = mutation({
  handler: async (ctx) => {
    const existingAccounts = await ctx.db.query('financial_account').collect();
    if (existingAccounts.length > 0) {
      return { seeded: false, reason: 'Already seeded' };
    }

    const now = new Date().toISOString();
    const userId = ctx.auth.userId;

    // 1. Seed Accounts
    const checking = await ctx.db.insert('financial_account', {
      userId,
      name: 'SVB Checking',
      type: 'checking',
      balance: 4259020,
      currency: 'USD',
    });
    await ctx.db.insert('financial_account', {
      userId,
      name: 'Chase Savings',
      type: 'savings',
      balance: 15000000,
      currency: 'USD',
    });
    const credit = await ctx.db.insert('financial_account', {
      userId,
      name: 'Brex Corporate Card',
      type: 'credit',
      balance: -1245030,
      currency: 'USD',
    });

    // 2. Seed SaaS Config
    await ctx.db.insert('saas_config', {
      userId,
      startingMrr: 1500000,
      churnRate: 200,
      cac: 10000,
      arpu: 5000,
      grossMargin: 80,
    });

    // 3. Seed Budgets
    await ctx.db.insert('budget', { userId, category: 'Marketing', amount: 500000, period: 'monthly' });
    await ctx.db.insert('budget', { userId, category: 'Utilities', amount: 200000, period: 'monthly' });
    await ctx.db.insert('budget', { userId, category: 'Other', amount: 100000, period: 'monthly' });

    // 4. Seed Campaigns
    await ctx.db.insert('marketing_campaign', { userId, name: 'Google Ads Q2', status: 'active', budget: 500000, spend: 320000, conversions: 240, roas: 420 });
    await ctx.db.insert('marketing_campaign', { userId, name: 'Meta Retargeting', status: 'active', budget: 400000, spend: 380000, conversions: 310, roas: 380 });
    await ctx.db.insert('marketing_campaign', { userId, name: 'TikTok Product Launch', status: 'active', budget: 600000, spend: 450000, conversions: 180, roas: 290 });

    // 5. Seed Employees
    const empAlice = await ctx.db.insert('employee', { userId, name: 'Alice Vance', role: 'Engineering Lead', department: 'Engineering', salary: 14500000, status: 'active' });
    const empBob = await ctx.db.insert('employee', { userId, name: 'Bob Sterling', role: 'Senior Designer', department: 'Product', salary: 11000000, status: 'active' });
    const empClara = await ctx.db.insert('employee', { userId, name: 'Clara Hayes', role: 'Growth Marketer', department: 'Marketing', salary: 9500000, status: 'active' });
    const empDavid = await ctx.db.insert('employee', { userId, name: 'David Miller', role: 'HR Specialist', department: 'People & Culture', salary: 8500000, status: 'active' });

    // 6. Seed Invoices
    await ctx.db.insert('invoice', {
      userId,
      invoiceNumber: 'INV-2026-001',
      clientName: 'Acme Corporation',
      type: 'sales',
      amount: 1250000,
      status: 'paid',
      issueDate: new Date(Date.now() - 25 * 24 * 3600 * 1000).toISOString(),
      dueDate: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
      items: JSON.stringify([{ description: 'SaaS Enterprise Core Integration', qty: 1, rate: 1000000 }]),
    });
    await ctx.db.insert('invoice', {
      userId,
      invoiceNumber: 'INV-2026-002',
      clientName: 'Globex Corporation',
      type: 'sales',
      amount: 850000,
      status: 'unpaid',
      issueDate: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
      dueDate: new Date(Date.now() + 20 * 24 * 3600 * 1000).toISOString(),
      items: JSON.stringify([{ description: 'Custom UI/UX Implementation', qty: 1, rate: 850000 }]),
    });

    // 7. Seed Transactions
    await ctx.db.insert('transaction', {
      userId,
      accountId: checking.id,
      amount: -250000,
      category: 'Housing',
      merchant: 'WeWork Office',
      description: 'Monthly Rent',
      date: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
    });
    await ctx.db.insert('transaction', {
      userId,
      accountId: credit.id,
      amount: -85000,
      category: 'Utilities',
      merchant: 'Amazon Web Services',
      description: 'AWS Cloud Infrastructure',
      date: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
    });
    await ctx.db.insert('transaction', {
      userId,
      accountId: checking.id,
      amount: 450000,
      category: 'Income',
      merchant: 'Stripe',
      description: 'Stripe payout weekly',
      date: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    });

    // 8. Seed Operations (Inventory, Project, Ticket)
    await ctx.db.insert('inventory_item', {
      userId,
      sku: 'HW-MBP-16',
      name: 'Apple MacBook Pro 16" (M3 Max, 36GB)',
      qty: 8,
      rate: 349900,
      warehouse: 'San Francisco HQ',
      reorderLevel: 5,
    });
    await ctx.db.insert('project', {
      userId,
      name: 'Website Rebranding Q3',
      description: 'Complete visual redesign of public landing page.',
      status: 'active',
    });
    await ctx.db.insert('support_ticket', {
      userId,
      customerName: 'Wayne Enterprises IT',
      subject: 'Webhook Endpoint latency spikes',
      description: 'Seeing 504 timeouts on callback under high load.',
      priority: 'high',
      status: 'open',
    });

    return { seeded: true };
  },
});
