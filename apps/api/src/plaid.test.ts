import { expect, test, describe, vi } from 'vitest';
import app from './index';

// Mock the PlaidService
vi.mock('./plaid', () => ({
  PlaidService: class {
    createLinkToken = vi.fn().mockResolvedValue('link-sandbox-test-token')
    exchangePublicToken = vi.fn().mockResolvedValue({ accessToken: 'access-sandbox-123', itemId: 'item-sandbox-456' })
  }
}));

describe('Plaid Endpoints', () => {
  test('POST /api/plaid/create-link-token returns a link token', async () => {
    const res = await app.request('/api/plaid/create-link-token', {
      method: 'POST',
    }, {
      PLAID_CLIENT_ID: 'test-client-id',
      PLAID_SECRET: 'test-secret',
      PLAID_ENV: 'sandbox',
      DB: {
        prepare: vi.fn().mockReturnValue({
          bind: vi.fn().mockReturnThis(),
          run: vi.fn().mockResolvedValue({ success: true }),
        }),
      },
    } as any);

    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.linkToken).toBe('link-sandbox-test-token');
  });

  test('POST /api/plaid/exchange-token exchanges public token', async () => {
    const res = await app.request('/api/plaid/exchange-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publicToken: 'public-sandbox-test' }),
    }, {
      PLAID_CLIENT_ID: 'test-client-id',
      PLAID_SECRET: 'test-secret',
      PLAID_ENV: 'sandbox',
      DB: {
        prepare: vi.fn().mockReturnValue({
          bind: vi.fn().mockReturnThis(),
          run: vi.fn().mockResolvedValue({ success: true }),
        }),
      },
    } as any);

    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.itemId).toBe('item-sandbox-456');
  });
});
