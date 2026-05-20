import { expect, test, describe, vi } from 'vitest';
import app from './index';

vi.mock('./gemini', () => ({
  GeminiService: class {
    generateResponse = vi.fn().mockResolvedValue('Food')
  }
}));

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

  test('POST /api/transactions creates a transaction with AI categorization', async () => {
    const res = await app.request('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        accountId: 'acc-123', 
        amount: -5000, 
        merchant: 'McDonalds' 
      }),
    }, {
      GEMINI_API_KEY: 'test-key',
      DB: {
        prepare: vi.fn().mockReturnValue({
          bind: vi.fn().mockReturnThis(),
          run: vi.fn().mockResolvedValue({ success: true }),
        }),
      },
    } as any);

    expect(res.status).toBe(201);
    const data = await res.json() as any;
    expect(data.merchant).toBe('McDonalds');
    expect(data.category).toBe('Food'); // Mocked value
  });
});
