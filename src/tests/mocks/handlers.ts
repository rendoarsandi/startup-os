import { http, HttpResponse } from 'msw';
import { handleApiRequest } from '../../server/dispatcher';
import { createRealSqliteD1 } from './d1Simulator';

let sessionUser: any = null;
let realDbInstance: any = null;

export const setSessionUser = (user: any) => {
  sessionUser = user;
};

export const getRealDb = async () => {
  if (!realDbInstance) {
    realDbInstance = await createRealSqliteD1();
    const now = Math.floor(Date.now() / 1000);
    realDbInstance.sqlite.run(`
      INSERT INTO user (id, name, email, email_verified, created_at, updated_at)
      VALUES ('test-user', 'Test CEO', 'ceo1@teststartup.com', 1, ${now}, ${now}),
             ('test-user-id', 'Jane Doe', 'ceo2@teststartup.com', 1, ${now}, ${now});
    `);
    realDbInstance.sqlite.run(`
      INSERT INTO financial_account (id, user_id, name, type, balance, currency, created_at, updated_at)
      VALUES 
      ('acc-1', 'test-user', 'Silicon Valley Bank checking', 'depository', 25000000, 'USD', ${now}, ${now}),
      ('acc-1-b', 'test-user-id', 'Silicon Valley Bank checking', 'depository', 25000000, 'USD', ${now}, ${now}),
      ('acc-2', 'test-user', 'Brex Credit Card', 'credit', -1500000, 'USD', ${now}, ${now}),
      ('acc-2-b', 'test-user-id', 'Brex Credit Card', 'credit', -1500000, 'USD', ${now}, ${now});
    `);
    realDbInstance.sqlite.run(`
      INSERT INTO saas_config (id, user_id, starting_mrr, churn_rate, cac, arpu, created_at, updated_at)
      VALUES ('cfg-1', 'test-user', 1200000, 250, 50000, 15000, ${now}, ${now}),
             ('cfg-1-b', 'test-user-id', 1200000, 250, 50000, 15000, ${now}, ${now});
    `);
    realDbInstance.sqlite.run(`
      INSERT INTO "transaction" (id, user_id, account_id, amount, category, merchant, description, date, created_at)
      VALUES 
      ('t-1', 'test-user', 'acc-1', -200000, 'Technology', 'AWS Cloud Hosting', 'Monthly Cloud Infrastructure', ${now}, ${now}),
      ('t-2', 'test-user', 'acc-1', 1200000, 'Revenue', 'Stripe Payout - Customers', 'SaaS Subscriptions', ${now}, ${now}),
      ('t-1-b', 'test-user-id', 'acc-1-b', -200000, 'Technology', 'AWS Cloud Hosting', 'Monthly Cloud Infrastructure', ${now}, ${now}),
      ('t-2-b', 'test-user-id', 'acc-1-b', 1200000, 'Revenue', 'Stripe Payout - Customers', 'SaaS Subscriptions', ${now}, ${now});
    `);
  }
  return realDbInstance;
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

  http.all('*/api/*', async ({ request }) => {
    try {
      const db = await getRealDb();
      const cloned = request.clone();
      const res = await handleApiRequest(cloned, { DB: db as any, GEMINI_API_KEY: 'test-key' });
      return res;
    } catch (err: any) {
      console.error(`[MSW ERROR] ${request.url}`, err);
      return HttpResponse.json({ error: err.message }, { status: 500 });
    }
  })
];
