// @vitest-environment node
import { describe, test, expect, beforeEach } from 'vitest';
import { createTestContext, TestContext } from './mocks/doTestHarness';
import { api } from '../server/functions';

describe('Convex-Style CFO & Financial Operations Unit Tests', () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = createTestContext();
  });

  test('createAccount and getAccounts correctly manage financial accounts', async () => {
    const account = await ctx.mutation(api.cfo.createAccount, {
      name: 'SVB Operating',
      type: 'checking',
      balance: 1000000,
      currency: 'USD',
    });

    expect(account).toBeDefined();
    expect(account.id).toBeDefined();
    expect(account.name).toBe('SVB Operating');
    expect(account.balance).toBe(1000000);

    const accounts = await ctx.query(api.cfo.getAccounts);
    expect(accounts.length).toBe(1);
    expect(accounts[0].name).toBe('SVB Operating');
  });

  test('createTransaction automatically updates account balance and creates transaction record', async () => {
    const account = await ctx.mutation(api.cfo.createAccount, {
      name: 'Brex Corporate',
      type: 'credit',
      balance: 500000,
    });

    const tx = await ctx.mutation(api.cfo.createTransaction, {
      accountId: account.id,
      amount: -75000,
      merchant: 'AWS Cloud Services',
      category: 'Utilities',
      description: 'Production infrastructure monthly',
    });

    expect(tx).toBeDefined();
    expect(tx.merchant).toBe('AWS Cloud Services');
    expect(tx.amount).toBe(-75000);

    // Verify account balance was updated
    const accounts = await ctx.query(api.cfo.getAccounts);
    const updatedAccount = accounts.find((a) => a.id === account.id);
    expect(updatedAccount?.balance).toBe(425000);

    const transactions = await ctx.query(api.cfo.getTransactions);
    expect(transactions.length).toBe(1);
    expect(transactions[0].merchant).toBe('AWS Cloud Services');
  });

  test('createInvoice and updateInvoiceStatus manage sales and purchase lifecycle', async () => {
    const invoice = await ctx.mutation(api.cfo.createInvoice, {
      invoiceNumber: 'INV-2026-101',
      clientName: 'Wayne Enterprises',
      type: 'sales',
      amount: 5000000,
      status: 'unpaid',
      items: JSON.stringify([{ description: 'Enterprise License', qty: 1, rate: 5000000 }]),
    });

    expect(invoice.invoiceNumber).toBe('INV-2026-101');
    expect(invoice.status).toBe('unpaid');

    const updated = await ctx.mutation(api.cfo.updateInvoiceStatus, {
      id: invoice.id,
      status: 'paid',
    });

    expect(updated?.status).toBe('paid');

    const invoices = await ctx.query(api.cfo.getInvoices);
    expect(invoices.length).toBe(1);
    expect(invoices[0].status).toBe('paid');
  });

  test('seedWorkspaceData seeds default enterprise entities when workspace is empty', async () => {
    const res = await ctx.mutation(api.seed.seedWorkspaceData);
    expect(res.seeded).toBe(true);

    const accounts = await ctx.query(api.cfo.getAccounts);
    expect(accounts.length).toBe(3);

    const transactions = await ctx.query(api.cfo.getTransactions);
    expect(transactions.length).toBe(3);

    const invoices = await ctx.query(api.cfo.getInvoices);
    expect(invoices.length).toBe(2);

    // Running seed a second time should be idempotent
    const secondRes = await ctx.mutation(api.seed.seedWorkspaceData);
    expect(secondRes.seeded).toBe(false);
  });
});
