import { expect, test, describe, vi } from 'vitest';
import app from './index';

describe('Database Integration', () => {
  test('GET /api/users returns empty list initially', async () => {
    // Mock D1 binding
    const mockDb = {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        all: vi.fn().mockResolvedValue({ results: [] }),
        raw: vi.fn().mockResolvedValue([]),
      }),
    };

    const res = await app.request('/api/users', {}, { DB: mockDb } as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBe(0);
  });
});
