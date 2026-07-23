import { expect, test, describe, beforeEach } from 'vitest';
import { handleApiRequest } from '../server/dispatcher';
import { createRealSqliteD1 } from './mocks/d1Simulator';

describe('Budgets Endpoints', () => {
  let realDb: any;
  let env: { DB: any };

  beforeEach(async () => {
    realDb = await createRealSqliteD1();
    env = { DB: realDb as any };
  });

  test('POST /api/budgets creates a budget', async () => {
    const res = await handleApiRequest(new Request('http://localhost/api/budgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        category: 'Food', 
        amount: 50000 
      }),
    }), env);

    expect(res.status).toBe(201);
    const data = await res.json() as any;
    expect(data.category).toBe('Food');
    expect(data.amount).toBe(50000);
    expect(data.period).toBe('monthly');

    // Query real SQLite database engine
    const row = await realDb.prepare('SELECT * FROM budget WHERE category = ?').bind('Food').first();
    expect(row).toBeDefined();
    expect(row.amount).toBe(50000);
  });

  test('GET /api/budgets returns 200 with empty list when no budgets exist', async () => {
    const res = await handleApiRequest(new Request('http://localhost/api/budgets', {}), env);

    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(0);
  });
});
