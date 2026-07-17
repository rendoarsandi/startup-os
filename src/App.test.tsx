// @vitest-environment jsdom
import './setupTests';
import { render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { setSessionUser } from './tests/mocks/handlers';

test('renders AI CFO Dashboard heading', async () => {
  setSessionUser({
    user: {
      id: 'test-user',
      email: 'test@example.com',
      name: 'Test User'
    }
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
  
  const heading = await screen.findByRole('heading', { name: /STARTUP OS/i, level: 1 });
  expect(heading).toBeInTheDocument();
}, 30000);
