import { expect, test, describe, vi } from 'vitest';
import { handleApiRequest } from '../server/dispatcher';

vi.mock('../server/gemini', () => ({
  GeminiService: class {
    generateResponse = vi.fn().mockResolvedValue('Food')
  }
}));

interface TransactionsTestEnv {
  GEMINI_API_KEY?: string;
  DB?: any;
}

describe('Transactions & Accounts Endpoints', () => {
  test('POST /api/accounts creates an account', async () => {
    const env: TransactionsTestEnv = {
      DB: {
        prepare: vi.fn().mockReturnValue({
          bind: vi.fn().mockReturnThis(),
          run: vi.fn().mockResolvedValue({ success: true }),
        }),
      },
    };

    const res = await handleApiRequest(new Request('http://localhost' + '/api/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Checking', type: 'checking', balance: 100000 }),
    }), env);

    expect(res.status).toBe(201);
    // SAFETY: Response contains created account name
    const data = (await res.json()) as { name: string };
    expect(data.name).toBe('Checking');
  });

  test('POST /api/transactions creates a transaction with AI categorization', async () => {
    const env: TransactionsTestEnv = {
      GEMINI_API_KEY: 'test-key',
      DB: {
        prepare: vi.fn().mockReturnValue({
          bind: vi.fn().mockReturnThis(),
          raw: vi.fn().mockResolvedValue([
            ['acc-123', 'test-user', 'Checking', 'checking', 0, 'USD', null, null, new Date(), new Date()],
          ]),
          run: vi.fn().mockResolvedValue({ success: true }),
        }),
      },
    };

    const res = await handleApiRequest(new Request('http://localhost' + '/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        accountId: 'acc-123', 
        amount: -5000, 
        merchant: 'McDonalds' 
      }),
    }), env);

    expect(res.status).toBe(201);
    // SAFETY: Response contains created transaction fields
    const data = (await res.json()) as { merchant: string; category: string };
    expect(data.merchant).toBe('McDonalds');
    expect(data.category).toBe('Food'); // Mocked value
  });

  test('POST /api/transactions rejects an account outside the current user', async () => {
    const env: TransactionsTestEnv = {
      DB: {
        prepare: vi.fn().mockReturnValue({
          bind: vi.fn().mockReturnThis(),
          raw: vi.fn().mockResolvedValue([]),
        }),
      },
    };

    const res = await handleApiRequest(new Request('http://localhost/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId: 'other-user-account', amount: -5000, merchant: 'McDonalds' }),
    }), env);

    expect(res.status).toBe(404);
  });
});
