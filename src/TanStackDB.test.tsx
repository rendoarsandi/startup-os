// @vitest-environment node
import { expect, test, describe } from 'vitest';
import { transactionsCollection, upsertTransactions, invoicesCollection, upsertInvoices } from './utils/db';
import type { Invoice } from './utils/db';

describe('TanStack DB Schema and Sync Logic Unit Tests', () => {
  test('Transactions collection can store, retrieve, update, and upsert items successfully', () => {
    const uniqueId1 = 'tx-' + Date.now() + '-100';
    const uniqueId2 = 'tx-' + Date.now() + '-200';

    const mockTransactions = [
      { id: uniqueId1, accountId: 'manual', amount: -2500, category: 'Food', merchant: 'Stripe Cafe', date: '2026-07-01' },
      { id: uniqueId2, accountId: 'manual', amount: 5000, category: 'Shopping', merchant: 'Refund Corp', date: '2026-07-02' }
    ];

    upsertTransactions(mockTransactions);

    expect(transactionsCollection.has(uniqueId1)).toBe(true);
    expect(transactionsCollection.has(uniqueId2)).toBe(true);

    const firstItem = transactionsCollection.get(uniqueId1);
    expect(firstItem?.merchant).toBe('Stripe Cafe');
    expect(firstItem?.amount).toBe(-2500);

    const updatedTransactions = [
      { id: uniqueId1, accountId: 'manual', amount: -3500, category: 'Food', merchant: 'Stripe Cafe Premium', date: '2026-07-01' }
    ];
    upsertTransactions(updatedTransactions);

    const updatedItem = transactionsCollection.get(uniqueId1);
    expect(updatedItem?.merchant).toBe('Stripe Cafe Premium');
    expect(updatedItem?.amount).toBe(-3500);
  });

  test('Invoices collection can store, retrieve, update, and upsert items successfully', () => {
    const uniqueInvId1 = 'inv-' + Date.now() + '-100';
    const uniqueInvId2 = 'inv-' + Date.now() + '-200';

    const mockInvoices: Invoice[] = [
      {
        id: uniqueInvId1,
        invoiceNumber: 'INV-2026-001',
        clientName: 'Wayne Enterprises',
        type: 'sales',
        amount: 250000,
        status: 'unpaid',
        issueDate: '2026-07-01',
        dueDate: '2026-07-31',
        items: JSON.stringify([{ description: 'Legal Services', qty: 1, rate: 250000 }])
      },
      {
        id: uniqueInvId2,
        invoiceNumber: 'INV-2026-002',
        clientName: 'Stark Industries',
        type: 'purchase',
        amount: 150000,
        status: 'paid',
        issueDate: '2026-07-02',
        dueDate: '2026-07-15',
        items: JSON.stringify([{ description: 'Nanotech Support', qty: 1, rate: 150000 }])
      }
    ];

    upsertInvoices(mockInvoices);

    expect(invoicesCollection.has(uniqueInvId1)).toBe(true);
    expect(invoicesCollection.has(uniqueInvId2)).toBe(true);

    const firstInvoice = invoicesCollection.get(uniqueInvId1);
    expect(firstInvoice?.clientName).toBe('Wayne Enterprises');
    expect(firstInvoice?.amount).toBe(250000);
    expect(firstInvoice?.status).toBe('unpaid');

    const updatedInvoices: Invoice[] = [
      {
        id: uniqueInvId1,
        invoiceNumber: 'INV-2026-001',
        clientName: 'Wayne Enterprises Premium',
        type: 'sales',
        amount: 250000,
        status: 'paid',
        issueDate: '2026-07-01',
        dueDate: '2026-07-31',
        items: JSON.stringify([{ description: 'Legal Services', qty: 1, rate: 250000 }])
      }
    ];
    upsertInvoices(updatedInvoices);

    const updatedInvoice = invoicesCollection.get(uniqueInvId1);
    expect(updatedInvoice?.clientName).toBe('Wayne Enterprises Premium');
    expect(updatedInvoice?.status).toBe('paid');
  });
});
