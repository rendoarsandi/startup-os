import { expect, test, describe, vi } from 'vitest';
import { handleApiRequest } from '../server/dispatcher';

vi.mock('../server/gemini', () => {
  return {
    GeminiService: class {
      chat = vi.fn().mockResolvedValue('Hello from Mocked Gemini!')
    }
  };
});

describe('Chat Endpoint', () => {
  test('POST /api/chat returns response from Gemini', async () => {
    const res = await handleApiRequest(new Request('http://localhost' + '/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'Hello' }),
      headers: {
        'Content-Type': 'application/json',
      },
    }), {
      GEMINI_API_KEY: 'test-key',
      DB: {
        prepare: vi.fn().mockReturnValue({
          bind: vi.fn().mockReturnThis(),
          all: vi.fn().mockResolvedValue([]),
          get: vi.fn().mockResolvedValue({ id: 'test-user', name: 'Test User' }),
          raw: vi.fn().mockResolvedValue([]),
        }),
      },
    } as any);

    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.response).toBe('Hello from Mocked Gemini!');
  });
});
