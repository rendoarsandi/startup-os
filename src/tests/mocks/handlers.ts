import { http, HttpResponse } from 'msw';
import { handleApiRequest } from '../../server/dispatcher';

let sessionUser: any = null;

export const setSessionUser = (user: any) => {
  sessionUser = user;
};

// Mock D1 DB binding for MSW test environment
const mockDb = {
  prepare: () => {
    const chainable = {
      bind: () => chainable,
      all: async () => [],
      get: async () => null,
      run: async () => ({ success: true }),
      raw: async () => []
    };
    return chainable;
  }
};

export const handlers = [
  http.get('*/api/auth/get-session', () => {
    return HttpResponse.json(sessionUser);
  }),
  
  http.post('*/api/auth/sign-up/email', () => {
    return HttpResponse.json({ success: true });
  }),
  
  http.post('*/api/auth/sign-in/email', () => {
    return HttpResponse.json({
      user: {
        id: 'test-user-id',
        email: 'ceo@teststartup.com',
        name: 'Jane Doe'
      }
    });
  }),

  http.get('*/api/accounts', () => {
    return HttpResponse.json([
      { id: 'acc-1', name: 'Silicon Valley Bank checking', balance: 250000, type: 'depository' },
      { id: 'acc-2', name: 'Brex Credit Card', balance: -15000, type: 'credit' }
    ]);
  }),
  
  http.get('*/api/insights', () => {
    return HttpResponse.json({
      advice: 'Burn rate is healthy. Suggest shifting 10% cash to yield checking.',
      items: []
    });
  }),
  
  http.get('*/api/cfo/runway', () => {
    return HttpResponse.json({
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
    });
  }),
  
  http.get('*/api/cfo/saas-config', () => {
    return HttpResponse.json({
      startingMrr: 1200000,
      churnRate: 250,
      cac: 50000,
      arpu: 15000
    });
  }),
  
  http.get('*/api/transactions*', () => {
    return HttpResponse.json([
      { id: 't-1', date: '2026-05-20', description: 'AWS Cloud Hosting', amount: -2000, category: 'Technology' },
      { id: 't-2', date: '2026-05-19', description: 'Stripe Payout - Customers', amount: 12000, category: 'Revenue' }
    ]);
  }),
  
  http.post('*/api/chat*', () => {
    return HttpResponse.json({
      response: 'Here is your current burn rate and runway report: You have 18 months of runway left.'
    });
  }),
  
  http.all('*/api/*', async ({ request }) => {
    try {
      const cloned = request.clone();
      const res = await handleApiRequest(cloned, { DB: mockDb });
      return res;
    } catch (err: any) {
      return HttpResponse.json({ error: err.message }, { status: 500 });
    }
  })
];
