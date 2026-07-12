// @vitest-environment jsdom
import './setupTests';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { expect, test, vi, beforeEach, describe } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';

// Setup query client
const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

describe('STARTUP OS - Full Integration & End-to-End Test', () => {
  let queryClient: QueryClient;
  let fetchMock: any;

  let isLoggedIn = false;

  beforeEach(() => {
    queryClient = createQueryClient();
    isLoggedIn = false;
    
    // Reset/Setup Fetch Mock for all API calls
    fetchMock = vi.fn().mockImplementation((url: string, _options?: any) => {
      // Mock Session Endpoint - first returns null (requires login)
      if (url === '/api/auth/get-session') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(isLoggedIn ? {
            user: {
              id: 'test-user-id',
              email: 'ceo@teststartup.com',
              name: 'Jane Doe'
            }
          } : null)
        } as any);
      }
      
      // Mock Sign Up Endpoint
      if (url === '/api/auth/sign-up/email') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        } as any);
      }
      
      // Mock Sign In Endpoint
      if (url === '/api/auth/sign-in/email') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            user: {
              id: 'test-user-id',
              email: 'ceo@teststartup.com',
              name: 'Jane Doe'
            }
          })
        } as any);
      }

      // Mock Accounts Endpoint
      if (url === '/api/accounts') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { id: 'acc-1', name: 'Silicon Valley Bank checking', balance: 250000, type: 'depository' },
            { id: 'acc-2', name: 'Brex Credit Card', balance: -15000, type: 'credit' }
          ])
        } as any);
      }

      // Mock Insights Endpoint
      if (url === '/api/insights') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            advice: 'Burn rate is healthy. Suggest shifting 10% cash to yield checking.',
            items: []
          })
        } as any);
      }

      // Mock Runway and Burn Rate Endpoint
      if (url === '/api/cfo/runway') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            cashBalance: 235000,
            fixedCosts: { payroll: 18000, subscriptions: 2000, total: 20000 },
            variableExpenses: 5000,
            monthlyRevenue: 12000,
            netBurn: 13000,
            runwayMonths: 18,
            projections: [
              { month: 'May', balance: 235000 },
              { month: 'Jun', balance: 222000 },
              { month: 'Jul', balance: 209000 }
            ]
          })
        } as any);
      }

      // Mock SaaS Config Endpoint
      if (url === '/api/cfo/saas-config') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            startingMrr: 1200000,
            churnRate: 250,
            cac: 50000,
            arpu: 15000
          })
        } as any);
      }

      // Mock Transactions Endpoint
      if (url.includes('/api/transactions')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { id: 't-1', date: '2026-05-20', description: 'AWS Cloud Hosting', amount: -2000, category: 'Technology' },
            { id: 't-2', date: '2026-05-19', description: 'Stripe Payout - Customers', amount: 12000, category: 'Revenue' }
          ])
        } as any);
      }

      // Mock Chat Endpoint
      if (url.includes('/api/chat')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            response: 'Here is your current burn rate and runway report: You have 18 months of runway left.'
          })
        } as any);
      }

      // Default fallback
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      } as any);
    });

    globalThis.fetch = fetchMock;
  });

  test('User Registration, Log In, Workspace Tab Switching, and Chat Assistant interaction flow', async () => {
    // 1. Render Application in Query Client
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    );

    // 2. Verify Auth Screen loaded (Sign In Header)
    const signInTitle = await screen.findByText(/Autonomous C-Suite ERP system/i);
    expect(signInTitle).toBeInTheDocument();

    // 3. Switch to "Create Account" tab
    const createAccountTab = screen.getByRole('button', { name: /Create Account/i });
    fireEvent.click(createAccountTab);

    // 4. Fill registration form
    const nameInput = screen.getByPlaceholderText('John Doe');
    const emailInput = screen.getByPlaceholderText('you@company.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');

    fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });
    fireEvent.change(emailInput, { target: { value: 'ceo@teststartup.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    // Mock session API to return active user ONCE register / sign-in is submitted
    isLoggedIn = true;

    // 5. Submit Registration form to register and log in
    const submitBtn = screen.getByRole('button', { name: /Create Workspace/i });
    fireEvent.click(submitBtn);

    // 6. Verify Dashboard heading renders successfully after login
    const dashboardTitle = await screen.findByRole('heading', { name: /STARTUP OS/i, level: 1 });
    expect(dashboardTitle).toBeInTheDocument();
    
    // Check that we logged in as Jane Doe
    const userInitials = screen.getByText('JD');
    expect(userInitials).toBeInTheDocument();

    // 7. Verify CFO/Finance workspace contains core elements (SVB checking account, burn rate)
    const checkAccount = await screen.findByText('Silicon Valley Bank checking');
    expect(checkAccount).toBeInTheDocument();

    // 8. Navigate to CMO/Marketing Workspace via sidebar button
    const marketingTab = screen.getByRole('button', { name: /Marketing \(CMO\)/i });
    fireEvent.click(marketingTab);

    // Confirm that the Marketing/CMO office dashboard renders
    const marketingContent = await screen.findByText(/Growth & Campaigns/i);
    expect(marketingContent).toBeInTheDocument();

    // 9. Navigate to HR/People Ops Workspace via sidebar button
    const hrTab = screen.getByRole('button', { name: /People Ops \(CHRO\)/i });
    fireEvent.click(hrTab);

    // Confirm that the People Ops/CHRO dashboard renders
    const hrContent = await screen.findByText(/People Ops & Talent/i);
    expect(hrContent).toBeInTheDocument();

    // 10. Switch back to Finance (CFO)
    const cfoTab = screen.getByRole('button', { name: /Finance \(CFO\)/i });
    fireEvent.click(cfoTab);
    expect(await screen.findByText(/Finance & Accounting/i)).toBeInTheDocument();

    // 11. Open AI CFO Chat Drawer
    const chatToggle = screen.getByRole('button', { name: /Open chat/i });
    expect(chatToggle).toBeTruthy();
    fireEvent.click(chatToggle);

    // Verify AI Chat greeting is shown
    const chatGreeting = await screen.findByText(/How can I help you manage your finances/i);
    expect(chatGreeting).toBeInTheDocument();

    // 12. Submit message to the AI CFO Assistant
    const chatInput = screen.getByPlaceholderText('Type a message...');
    fireEvent.change(chatInput, { target: { value: 'What is my current runway?' } });

    const sendBtn = container.querySelector('button[type="submit"]');
    expect(sendBtn).toBeTruthy();
    fireEvent.click(sendBtn!);

    // Verify the user's message is added to the screen
    expect(screen.getByText('What is my current runway?')).toBeInTheDocument();

    // Verify the AI responds correctly with mock advice
    await waitFor(async () => {
      const responseMsg = await screen.findByText(/You have 18 months of runway left/i);
      expect(responseMsg).toBeInTheDocument();
    });

    console.log('🎉 E2E Integration test succeeded! Account login, workspace tab switching, and AI chat messaging flows verified.');
  }, 60000);
});
