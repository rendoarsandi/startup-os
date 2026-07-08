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

  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver = ResizeObserverMock;

  // Mock localStorage and sessionStorage for Node 26 compatibility in JSDOM
  class StorageMock implements Storage {
    private store: Record<string, string> = {};
    get length() { return Object.keys(this.store).length; }
    clear() { this.store = {}; }
    getItem(key: string) { return this.store[key] || null; }
    setItem(key: string, value: string) { this.store[key] = String(value); }
    removeItem(key: string) { delete this.store[key]; }
    key(index: number) { return Object.keys(this.store)[index] || null; }
  }
  Object.defineProperty(globalThis, 'localStorage', { value: new StorageMock(), writable: true });
  Object.defineProperty(globalThis, 'sessionStorage', { value: new StorageMock(), writable: true });
});
