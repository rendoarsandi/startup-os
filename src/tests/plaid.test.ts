import { expect, test, describe, vi } from 'vitest';
import { handleApiRequest } from '../server/dispatcher';

// Mock the PlaidService for Hono endpoint testing
vi.mock('../server/plaid', () => {
  return {
    PlaidService: class {
      createLinkToken = vi.fn().mockResolvedValue('link-sandbox-test-token')
      
      exchangePublicToken = vi.fn().mockImplementation((token: string) => {
        return Promise.resolve({
          accessToken: `mock_access_token_${token.includes('svb') ? 'svb' : 'chase'}`,
          itemId: 'item-sandbox-123'
        });
      })
      
      getAccounts = vi.fn().mockImplementation((_token: string) => {
        return Promise.resolve([
          {
            account_id: 'mock_chase_checking',
            name: 'Chase Business Checking',
            type: 'depository',
            subtype: 'checking',
            balances: { current: 125450.00, available: 125450.00, iso_currency_code: 'USD' }
          }
        ]);
      })
      
      getTransactions = vi.fn().mockImplementation((_token: string, _start: string, _end: string) => {
        return Promise.resolve([
          {
            transaction_id: 'tx_chase_checking_aws',
            account_id: 'mock_chase_checking',
            amount: 850.00,
            merchant_name: 'Amazon Web Services',
            name: 'AWS Cloud Services',
            category: ['Service', 'Technology'],
            date: '2026-05-20',
          }
        ]);
      })
    }
  };
});

interface PlaidTestEnv {
  PLAID_CLIENT_ID?: string;
  PLAID_SECRET?: string;
  PLAID_ENV?: string;
  GEMINI_API_KEY?: string;
  DB?: any;
}

describe('Plaid Endpoint Routing Tests', () => {
  test('POST /api/plaid/create-link-token returns a link token', async () => {
    const env: PlaidTestEnv = {
      PLAID_CLIENT_ID: 'test-client-id',
      PLAID_SECRET: 'test-secret',
      PLAID_ENV: 'sandbox',
      DB: {
        prepare: vi.fn().mockReturnValue({
          bind: vi.fn().mockReturnThis(),
          run: vi.fn().mockResolvedValue({ success: true }),
        }),
      },
    };

    const res = await handleApiRequest(new Request('http://localhost' + '/api/plaid/create-link-token', {
      method: 'POST',
    }), env);

    expect(res.status).toBe(200);
    // SAFETY: Response contains linkToken
    const data = (await res.json()) as { linkToken: string };
    expect(data.linkToken).toBe('link-sandbox-test-token');
  });

  test('POST /api/plaid/exchange-token performs flow successfully', async () => {
    const env: PlaidTestEnv = {
      PLAID_CLIENT_ID: 'test-client-id',
      PLAID_SECRET: 'test-secret',
      PLAID_ENV: 'sandbox',
      GEMINI_API_KEY: 'test-gemini-key',
      DB: {
        prepare: vi.fn().mockReturnValue({
          bind: vi.fn().mockReturnThis(),
          run: vi.fn().mockResolvedValue({ success: true }),
          get: vi.fn().mockResolvedValue(null),
          all: vi.fn().mockResolvedValue({ results: [] }),
          raw: vi.fn().mockResolvedValue([]),
        }),
      },
    };

    const res = await handleApiRequest(new Request('http://localhost' + '/api/plaid/exchange-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publicToken: 'mock_public_token_chase', institutionName: 'Chase Bank' }),
    }), env);

    if (res.status === 500) {
      const errBody = await res.json();
      console.error("EXCHANGE TOKEN 500 ERROR:", errBody);
    }

    expect(res.status).toBe(200);
    // SAFETY: Response contains exchange success payload
    const data = (await res.json()) as { success: boolean; itemId: string };
    expect(data.success).toBe(true);
    expect(data.itemId).toBe('item-sandbox-123');
  });

  test('POST /api/plaid/sync-transactions synchronizes accounts and transactions', async () => {
    const env: PlaidTestEnv = {
      PLAID_CLIENT_ID: 'test-client-id',
      PLAID_SECRET: 'test-secret',
      PLAID_ENV: 'sandbox',
      GEMINI_API_KEY: 'test-gemini-key',
      DB: {
        prepare: vi.fn().mockImplementation((sql: string) => {
          const isConnectionQuery = sql.toLowerCase().includes('plaid_connection');
          return {
            bind: vi.fn().mockReturnThis(),
            run: vi.fn().mockResolvedValue({ success: true }),
            get: vi.fn().mockResolvedValue(null),
            all: vi.fn().mockImplementation(() => {
              if (isConnectionQuery) {
                return Promise.resolve({
                  results: [
                    {
                      id: 'conn-123',
                      userId: 'test-user',
                      accessToken: 'mock_access_token_chase',
                      itemId: 'item-sandbox-123',
                      institutionName: 'Chase Bank',
                      status: 'active',
                      createdAt: new Date(),
                      updatedAt: new Date(),
                    }
                  ]
                });
              }
              return Promise.resolve({ results: [] });
            }),
            raw: vi.fn().mockImplementation(() => {
              if (isConnectionQuery) {
                return Promise.resolve([
                  [
                    'conn-123',
                    'test-user',
                    'mock_access_token_chase',
                    'item-sandbox-123',
                    'Chase Bank',
                    'active',
                    new Date(),
                    new Date()
                  ]
                ]);
              }
              return Promise.resolve([]);
            }),
          };
        }),
      },
    };

    const res = await handleApiRequest(new Request('http://localhost' + '/api/plaid/sync-transactions', {
      method: 'POST',
    }), env);

    if (res.status === 500) {
      const errBody = await res.json();
      console.error("SYNC TRANSACTIONS 500 ERROR:", errBody);
    }

    expect(res.status).toBe(200);
    // SAFETY: Response contains sync transaction counts
    const data = (await res.json()) as { success: boolean; accountsSynced: number; newTransactionsSynced: number };
    expect(data.success).toBe(true);
    expect(data.accountsSynced).toBe(1);
    expect(data.newTransactionsSynced).toBe(1);
  });
});
