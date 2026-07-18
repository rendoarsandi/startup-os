import { expect, test, describe } from 'vitest';
import { handleApiRequest } from '../server/dispatcher';

describe('Database Integration', () => {
  test('GET /api/users is not exposed to authenticated users', async () => {
    const res = await handleApiRequest(new Request('http://localhost/api/users'), { DB: {} } as any);
    expect(res.status).toBe(404);
  });
});
