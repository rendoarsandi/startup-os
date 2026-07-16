import '@testing-library/jest-dom/vitest';
import { beforeAll, afterEach, afterAll } from 'vitest';
import { server } from './tests/mocks/server';

beforeAll(() => {
  // Start Mock Service Worker
  server.listen({ onUnhandledRequest: 'bypass' });

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

afterEach(() => {
  // Reset MSW handlers to clear runtime changes
  server.resetHandlers();
});

afterAll(() => {
  // Close MSW server
  server.close();
});

