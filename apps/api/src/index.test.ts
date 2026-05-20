import { expect, test } from 'vitest';
import app from './index';

test('GET /api/health returns 200 OK', async () => {
  const res = await app.request('/api/health');
  expect(res.status).toBe(200);
  const body = await res.json();
  expect(body).toEqual({ status: 'OK' });
});
