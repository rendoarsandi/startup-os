import { expect, test, describe, vi } from 'vitest';
import app from './index';

vi.mock('./gemini', () => ({
  GeminiService: class {
    generateResponse = vi.fn().mockResolvedValue('Invest more in your savings!')
  }
}));

describe('Insights Endpoint', () => {
  test('GET /api/insights returns advice', async () => {
    const res = await app.request('/api/insights', {}, {
      DB: {
        prepare: vi.fn().mockReturnValue({
          bind: vi.fn().mockReturnThis(),
          get: vi.fn().mockResolvedValue({ id: 'test-user', name: 'Test' }),
          raw: vi.fn().mockResolvedValue([['test-user', 'Test']]), // In case it uses raw
        }),
      },
      GEMINI_API_KEY: 'test-key',
    } as any);

    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.advice).toBe('Invest more in your savings!');
  });
});
