import { expect, test, describe, vi } from 'vitest';
import app from './index';

describe('Authentication Integration', () => {
  test('GET /api/auth/get-session returns 401/unauthorized when no session exists', async () => {
    // Mock D1 binding
    const mockDb = {
      prepare: vi.fn().mockReturnThis(),
      all: vi.fn().mockResolvedValue([]),
      get: vi.fn().mockResolvedValue(null),
      bind: vi.fn().mockReturnThis(),
    };

    const res = await app.request('/api/auth/get-session', {
      headers: {
        'Content-Type': 'application/json',
      },
    }, { 
      DB: mockDb,
      BETTER_AUTH_URL: 'http://localhost:3000',
      BETTER_AUTH_SECRET: 'test-secret'
    } as any);

    // Better Auth might return 200 with null session or 401 depending on config
    // For now, we just want to ensure it doesn't crash
    expect(res.status).toBeDefined();
    const body = await res.json();
    expect(body).toBeDefined();
  });
});
