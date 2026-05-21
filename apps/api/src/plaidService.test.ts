import { expect, test, describe } from 'vitest';
import { PlaidService } from './plaid';

describe('Plaid Service Layer Direct Tests', () => {
  test('PlaidService handles mock token exchange fallback correctly', async () => {
    const service = new PlaidService({ clientId: 'mock_client', secret: 'mock_secret' });
    const exchangeResult = await service.exchangePublicToken('mock_public_token_svb');
    expect(exchangeResult.accessToken).toBe('mock_access_token_svb');
    expect(exchangeResult.itemId).toContain('mock_item_svb_');
  });

  test('PlaidService returns mock accounts based on token type', async () => {
    const service = new PlaidService({ clientId: 'mock_client', secret: 'mock_secret' });
    const svbAccounts = await service.getAccounts('mock_access_token_svb');
    expect(svbAccounts.length).toBe(2);
    expect(svbAccounts[0].account_id).toBe('mock_svb_checking');
    expect(svbAccounts[1].name).toBe('SVB MM Account');

    const chaseAccounts = await service.getAccounts('mock_access_token_chase');
    expect(chaseAccounts.length).toBe(3);
    expect(chaseAccounts[0].account_id).toBe('mock_chase_checking');
  });

  test('PlaidService returns realistic mock transactions inside date range', async () => {
    const service = new PlaidService({ clientId: 'mock_client', secret: 'mock_secret' });
    const transactions = await service.getTransactions('mock_access_token_svb', '2026-05-01', '2026-06-01');
    expect(transactions.length).toBeGreaterThan(0);
    expect(transactions[0].merchant_name).toBe('Stripe Payout');
    expect(transactions[1].merchant_name).toBe('Amazon Web Services');
  });
});
