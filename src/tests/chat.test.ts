import { expect, test, describe, vi } from 'vitest';
import { handleApiRequest } from '../server/dispatcher';

vi.mock('../server/gemini', () => {
  return {
    GeminiService: class {
      chat = vi.fn().mockResolvedValue('Hello from Mocked Gemini!')
    }
  };
});

interface ChatTestEnv {
  GEMINI_API_KEY?: string;
  DB?: any;
}

describe('Chat Endpoint', () => {
  test('POST /api/chat returns response from Gemini', async () => {
    const env: ChatTestEnv = {
      GEMINI_API_KEY: 'test-key',
      DB: {
        prepare: vi.fn().mockReturnValue({
          bind: vi.fn().mockReturnThis(),
          all: vi.fn().mockResolvedValue([]),
          get: vi.fn().mockResolvedValue({ id: 'test-user', name: 'Test User' }),
          raw: vi.fn().mockResolvedValue([]),
        }),
      },
    };

    const res = await handleApiRequest(new Request('http://localhost' + '/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'Hello' }),
      headers: {
        'Content-Type': 'application/json',
      },
    }), env);

    expect(res.status).toBe(200);
    // SAFETY: Response contains chat response string
    const data = (await res.json()) as { response: string };
    expect(data.response).toBe('Hello from Mocked Gemini!');
  });
});
