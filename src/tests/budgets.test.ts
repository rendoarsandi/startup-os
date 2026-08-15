import { expect, test, describe, beforeEach } from 'vitest';
import { handleApiRequest } from '../server/dispatcher';
import { createRealSqliteD1 } from './mocks/d1Simulator';

interface MockEnv {
  DB: any;
  DISABLE_SEED?: boolean;
}

describe('Budgets Endpoints', () => {
  let realDb: any;
  let env: MockEnv;

  beforeEach(async () => {
    realDb = await createRealSqliteD1();
    env = { DB: realDb };
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
    // SAFETY: POST /api/budgets returns serialized Budget record
    const data = (await res.json()) as { category: string; amount: number; period: string };
    expect(data.category).toBe('Food');
    expect(data.amount).toBe(50000);
    expect(data.period).toBe('monthly');

    // Query real SQLite database engine
    const row = await realDb.prepare('SELECT * FROM budget WHERE category = ?').bind('Food').first();
    expect(row).toBeDefined();
    expect(row.amount).toBe(50000);
  });

  test('GET /api/budgets returns 200 with empty list when no budgets exist', async () => {
    const cleanDb = await createRealSqliteD1();
    const testEnv: MockEnv = { DB: cleanDb, DISABLE_SEED: true };
    const res = await handleApiRequest(new Request('http://localhost/api/budgets', {}), testEnv);

    expect(res.status).toBe(200);
    // SAFETY: GET /api/budgets returns array of budgets
    const data = (await res.json()) as unknown[];
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(0);
  });
});
