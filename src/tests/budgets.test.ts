import { expect, test, describe, vi } from 'vitest';
import { handleApiRequest } from '../server/dispatcher';

describe('Budgets Endpoints', () => {
  test('POST /api/budgets creates a budget', async () => {
    const res = await handleApiRequest(new Request('http://localhost' + '/api/budgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        category: 'Food', 
        amount: 50000 
      }),
    }), {
      DB: {
        prepare: vi.fn().mockReturnValue({
          bind: vi.fn().mockReturnThis(),
          run: vi.fn().mockResolvedValue({ success: true }),
        }),
      },
    } as any);

    expect(res.status).toBe(201);
    const data = await res.json() as any;
    expect(data.category).toBe('Food');
    expect(data.amount).toBe(50000);
    expect(data.period).toBe('monthly');
  });

  test('GET /api/budgets returns 200 with empty list', async () => {
    // Drizzle D1 adapter: all() -> values() -> stmt.bind().raw()
    // raw() must return an array of arrays (rows)
    const res = await handleApiRequest(new Request('http://localhost' + '/api/budgets', {}), {
      DB: {
        prepare: vi.fn().mockReturnValue({
          bind: vi.fn().mockReturnThis(),
          raw: vi.fn().mockResolvedValue([]),
        }),
      },
    } as any);

    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(0);
  });
});
