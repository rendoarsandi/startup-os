import { expect, test, describe, vi } from 'vitest';
import { handleApiRequest } from '../server/dispatcher';

vi.mock('../server/gemini', () => ({
  GeminiService: class {
    generateResponse = vi.fn().mockResolvedValue('Invest more in your savings!')
  }
}));

describe('Insights Endpoint', () => {
  test('GET /api/insights returns advice', async () => {
    const res = await handleApiRequest(new Request('http://localhost' + '/api/insights', {}), {
      DB: {
        prepare: vi.fn().mockReturnValue({
          bind: vi.fn().mockReturnThis(),
          get: vi.fn().mockResolvedValue({ id: 'test-user', name: 'Test' }),
          all: vi.fn().mockResolvedValue([]),
          raw: vi.fn().mockResolvedValue([]),
        }),
      },
      GEMINI_API_KEY: 'test-key',
    } as any);

    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.advice).toBe('Invest more in your savings!');
  });
});
