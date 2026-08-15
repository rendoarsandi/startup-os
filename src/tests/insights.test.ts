import { expect, test, describe, vi } from 'vitest';
import { handleApiRequest } from '../server/dispatcher';

vi.mock('../server/gemini', () => ({
  GeminiService: class {
    generateResponse = vi.fn().mockResolvedValue('Invest more in your savings!')
  }
}));

interface InsightsTestEnv {
  GEMINI_API_KEY?: string;
  DB?: any;
}

describe('Insights Endpoint', () => {
  test('GET /api/insights returns advice', async () => {
    const env: InsightsTestEnv = {
      DB: {
        prepare: vi.fn().mockReturnValue({
          bind: vi.fn().mockReturnThis(),
          get: vi.fn().mockResolvedValue({ id: 'test-user', name: 'Test' }),
          all: vi.fn().mockResolvedValue([]),
          raw: vi.fn().mockResolvedValue([]),
        }),
      },
      GEMINI_API_KEY: 'test-key',
    };

    const res = await handleApiRequest(new Request('http://localhost' + '/api/insights', {}), env);

    expect(res.status).toBe(200);
    // SAFETY: Response contains advice string
    const data = (await res.json()) as { advice: string };
    expect(data.advice).toBe('Invest more in your savings!');
  });
});
