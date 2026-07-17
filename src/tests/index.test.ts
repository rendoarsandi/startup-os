import { expect, test } from 'vitest';
import { handleApiRequest } from '../server/dispatcher';

test('GET /api/health returns 200 OK', async () => {
  const res = await handleApiRequest(new Request('http://localhost' + '/api/health', undefined));
  expect(res.status).toBe(200);
  const body = await res.json();
  expect(body).toEqual({ status: 'OK' });
});
