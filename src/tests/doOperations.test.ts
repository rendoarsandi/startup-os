// @vitest-environment node
import { describe, test, expect, beforeEach } from 'vitest';
import { createTestContext, TestContext } from './mocks/doTestHarness';
import { api } from '../server/functions';

describe('Durable Objects Operations & Autopilot Unit Tests', () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = createTestContext();
  });

  test('createAutopilotRule and toggleAutopilotRule work reliably', async () => {
    const rule = await ctx.mutation(api.operations.createAutopilotRule, {
      name: 'High Priority Slack Alert',
      triggerType: 'high_priority_ticket',
      triggerValue: 'urgent',
      actionType: 'webhook_alert',
      actionTarget: 'https://hooks.slack.com/services/test',
    });

    expect(rule.name).toBe('High Priority Slack Alert');
    expect(rule.enabled).toBe(true);

    const toggled = await ctx.mutation(api.operations.toggleAutopilotRule, {
      id: rule.id,
      enabled: false,
    });
    expect(toggled?.enabled).toBe(false);

    const rules = await ctx.query(api.operations.getAutopilotRules);
    expect(rules.length).toBe(1);
    expect(rules[0].enabled).toBe(false);
  });

  test('inventory operations update stock levels deterministically', async () => {
    const item = await ctx.mutation(api.operations.createInventoryItem, {
      sku: 'HW-MBP-14',
      name: 'MacBook Pro 14"',
      qty: 10,
      rate: 199900,
    });

    expect(item.qty).toBe(10);

    const updated = await ctx.mutation(api.operations.updateInventoryStock, {
      id: item.id,
      delta: -3,
    });
    expect(updated?.qty).toBe(7);

    const inventory = await ctx.query(api.operations.getInventory);
    expect(inventory[0].qty).toBe(7);
  });

  test('tickets and projects lifecycle management', async () => {
    const project = await ctx.mutation(api.operations.createProject, {
      name: 'Security Audit Q3',
      description: 'Penetration testing & SOC2 prep',
    });
    expect(project.status).toBe('active');

    const updatedProject = await ctx.mutation(api.operations.updateProjectStatus, {
      id: project.id,
      status: 'completed',
    });
    expect(updatedProject?.status).toBe('completed');

    const ticket = await ctx.mutation(api.operations.createTicket, {
      customerName: 'Acme Corp',
      subject: 'SSO configuration issue',
      description: 'SAML 2.0 metadata certificate mismatch',
      priority: 'high',
    });
    expect(ticket.status).toBe('open');

    const resolvedTicket = await ctx.mutation(api.operations.updateTicketStatus, {
      id: ticket.id,
      status: 'resolved',
    });
    expect(resolvedTicket?.status).toBe('resolved');
  });
});
