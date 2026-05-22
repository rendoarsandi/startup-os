// @vitest-environment jsdom
import './setupTests';
import { render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';

test('renders AI CFO Dashboard heading', async () => {
  global.fetch = vi.fn().mockImplementation((url: string) => {
    if (url === '/api/auth/get-session') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          user: {
            id: 'test-user',
            email: 'test@example.com',
            name: 'Test User'
          }
        })
      } as any);
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve([])
    } as any);
  });

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  );
  
  const heading = await screen.findByRole('heading', { name: /^AI CFO$/i, level: 1 });
  expect(heading).toBeInTheDocument();
});
