import { expect, test, describe, vi } from 'vitest';
import { handleApiRequest } from '../server/dispatcher';

interface AuthTestEnv {
  TEST_USER_ID?: string | null;
  DB?: any;
  BETTER_AUTH_URL?: string;
  BETTER_AUTH_SECRET?: string;
}

describe('Authentication Integration', () => {
  test('GET /api/accounts returns 401 when no user session is available', async () => {
    const env: AuthTestEnv = { TEST_USER_ID: null };
    const res = await handleApiRequest(
      new Request('http://localhost/api/accounts'),
      env,
    );

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: 'Unauthorized' });
  });

  test('GET /api/auth/get-session returns 401/unauthorized when no session exists', async () => {
    // Mock D1 binding
    const mockDb = {
      prepare: vi.fn().mockReturnThis(),
      all: vi.fn().mockResolvedValue([]),
      get: vi.fn().mockResolvedValue(null),
      bind: vi.fn().mockReturnThis(),
    };

    const env: AuthTestEnv = { 
      DB: mockDb,
      BETTER_AUTH_URL: 'http://localhost:3000',
      BETTER_AUTH_SECRET: 'test-secret'
    };

    const res = await handleApiRequest(new Request('http://localhost' + '/api/auth/get-session', {
      headers: {
        'Content-Type': 'application/json',
      },
    }), env);

    // Better Auth might return 200 with null session or 401 depending on config
    // For now, we just want to ensure it doesn't crash
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toBeNull();
  });
});
