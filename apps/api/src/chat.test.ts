import { expect, test, describe, vi } from 'vitest';
import app from './index';

vi.mock('./gemini', () => {
  return {
    GeminiService: class {
      chat = vi.fn().mockResolvedValue('Hello from Mocked Gemini!')
    }
  };
});

describe('Chat Endpoint', () => {
  test('POST /api/chat returns response from Gemini', async () => {
    const res = await app.request('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'Hello' }),
      headers: {
        'Content-Type': 'application/json',
      },
    }, {
      GEMINI_API_KEY: 'test-key',
    } as any);

    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.response).toBe('Hello from Mocked Gemini!');
  });
});
