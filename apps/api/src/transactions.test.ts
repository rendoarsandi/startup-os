import { expect, test, describe, vi } from 'vitest';
import app from './index';

describe('Transactions & Accounts Endpoints', () => {
  test('POST /api/accounts creates an account', async () => {
    const res = await app.request('/api/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Checking', type: 'checking', balance: 100000 }),
    }, {
      DB: {
        prepare: vi.fn().mockReturnValue({
          bind: vi.fn().mockReturnThis(),
          run: vi.fn().mockResolvedValue({ success: true }),
        }),
      },
    } as any);

    expect(res.status).toBe(201);
    const data = await res.json() as any;
    expect(data.name).toBe('Checking');
  });

  test('POST /api/transactions creates a transaction', async () => {
    const res = await app.request('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        accountId: 'acc-123', 
        amount: -5000, 
        category: 'Food', 
        merchant: 'Starbucks' 
      }),
    }, {
      DB: {
        prepare: vi.fn().mockReturnValue({
          bind: vi.fn().mockReturnThis(),
          run: vi.fn().mockResolvedValue({ success: true }),
        }),
      },
    } as any);

    expect(res.status).toBe(201);
    const data = await res.json() as any;
    expect(data.merchant).toBe('Starbucks');
  });
});
