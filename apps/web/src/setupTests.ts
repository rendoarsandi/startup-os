import '@testing-library/jest-dom/vitest';
import { vi, beforeAll } from 'vitest';

beforeAll(() => {
  globalThis.fetch = vi.fn().mockImplementation((url: string) => {
    if (url.includes('/api/transactions')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      });
    }
    if (url.includes('/api/chat')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ response: 'Mock AI response' }),
      });
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}),
    });
  }) as any;
});
