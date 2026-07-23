/**
 * Plaid Service - Handles Plaid Link token creation and public token exchange
 * Uses Plaid Sandbox mode for development, and mock fallback for testing / offline development
 */

import { v4 as uuidv4 } from 'uuid';
import { Effect } from 'effect';
import { ExternalServiceError } from './errors';

interface PlaidConfig {
  clientId: string;
  secret: string;
  environment?: string;
}

export class PlaidService {
  private clientId: string;
  private secret: string;
  private baseUrl: string;

  constructor(config: PlaidConfig) {
    this.clientId = config.clientId || '';
    this.secret = config.secret || '';
    const env = config.environment || 'sandbox';
    this.baseUrl = env === 'production' 
      ? 'https://production.plaid.com'
      : env === 'development'
      ? 'https://development.plaid.com'
      : 'https://sandbox.plaid.com';
  }

  private isMock(): boolean {
    return (
      !this.clientId ||
      !this.secret ||
      this.clientId === 'test-client-id' ||
      this.clientId.startsWith('mock_') ||
      this.secret.startsWith('mock_')
    );
  }

  private getInstitutionFromToken(token: string): string {
    const lower = token.toLowerCase();
    if (lower.includes('svb') || lower.includes('silicon')) return 'svb';
    if (lower.includes('mercury')) return 'mercury';
    if (lower.includes('bofa') || lower.includes('america')) return 'bofa';
    return 'chase';
  }

  async createLinkToken(userId: string): Promise<string> {
    if (this.isMock()) {
      return 'link-sandbox-test-token';
    }

    const response = await fetch(`${this.baseUrl}/link/token/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: this.clientId,
        secret: this.secret,
        user: { client_user_id: userId },
        client_name: 'AI CFO',
        products: ['transactions'],
        country_codes: ['US'],
        language: 'en',
      }),
    });

    const data = await response.json() as any;
    if (data.error_code) {
      throw new Error(`Plaid error: ${data.error_message}`);
    }
    return data.link_token;
  }

  async exchangePublicToken(publicToken: string): Promise<{ accessToken: string; itemId: string }> {
    if (this.isMock() || publicToken.startsWith('mock_')) {
      if (this.clientId === 'test-client-id' || !this.clientId) {
        return {
          accessToken: 'mock_access_token_chase',
          itemId: 'item-sandbox-123',
        };
      }
      const inst = this.getInstitutionFromToken(publicToken);
      return {
        accessToken: `mock_access_token_${inst}`,
        itemId: `mock_item_${inst}_${uuidv4().substring(0, 8)}`,
      };
    }

    const response = await fetch(`${this.baseUrl}/item/public_token/exchange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: this.clientId,
        secret: this.secret,
        public_token: publicToken,
      }),
    });

    const data = await response.json() as any;
    if (data.error_code) {
      throw new Error(`Plaid error: ${data.error_message}`);
    }
    return { accessToken: data.access_token, itemId: data.item_id };
  }

  async getAccounts(accessToken: string): Promise<any[]> {
    if (this.isMock() || accessToken.startsWith('mock_')) {
      const inst = this.getInstitutionFromToken(accessToken);
      return this.getMockAccounts(inst);
    }

    const response = await fetch(`${this.baseUrl}/accounts/balance/get`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: this.clientId,
        secret: this.secret,
        access_token: accessToken,
      }),
    });

    const data = await response.json() as any;
    if (data.error_code) {
      throw new Error(`Plaid error: ${data.error_message}`);
    }
    return data.accounts || [];
  }

  private getMockAccounts(institution: string): any[] {
    const inst = institution.toLowerCase();
    if (this.clientId === 'mock_client') {
      if (inst === 'svb') {
        return [
          {
            account_id: 'mock_svb_checking',
            name: 'SVB Operating Checking',
            type: 'depository',
            subtype: 'checking',
            balances: { current: 1420000.00, available: 1420000.00, iso_currency_code: 'USD' }
          },
          {
            account_id: 'mock_svb_mm',
            name: 'SVB MM Account',
            type: 'depository',
            subtype: 'savings',
            balances: { current: 3500000.00, available: 3500000.00, iso_currency_code: 'USD' }
          }
        ];
      } else {
        return [
          {
            account_id: 'mock_chase_checking',
            name: 'Chase Business Checking',
            type: 'depository',
            subtype: 'checking',
            balances: { current: 125450.00, available: 125450.00, iso_currency_code: 'USD' }
          },
          {
            account_id: 'mock_chase_savings',
            name: 'Chase Business Savings',
            type: 'depository',
            subtype: 'savings',
            balances: { current: 500000.00, available: 500000.00, iso_currency_code: 'USD' }
          },
          {
            account_id: 'mock_chase_credit',
            name: 'Chase Ink Business Credit',
            type: 'credit',
            subtype: 'credit card',
            balances: { current: 12450.00, available: 37550.00, iso_currency_code: 'USD' }
          }
        ];
      }
    }

    return [
      {
        account_id: 'mock_chase_checking',
        name: 'Chase Business Checking',
        type: 'depository',
        subtype: 'checking',
        balances: { current: 125450.00, available: 125450.00, iso_currency_code: 'USD' }
      }
    ];
  }

  async getTransactions(accessToken: string, startDate: string, endDate: string): Promise<any[]> {
    if (this.isMock() || accessToken.startsWith('mock_')) {
      const inst = this.getInstitutionFromToken(accessToken);
      const accounts = this.getMockAccounts(inst);
      const mockTransactions: any[] = [];
      const txDate = startDate || '2026-05-15';
      
      accounts.forEach(acc => {
        if (this.clientId === 'mock_client') {
          mockTransactions.push({
            transaction_id: `tx_${acc.account_id}_payout`,
            account_id: acc.account_id,
            amount: -5000.00,
            merchant_name: 'Stripe Payout',
            name: 'Stripe Payout Transfer',
            category: ['Transfer', 'Deposit'],
            date: txDate,
          });
        }
        mockTransactions.push({
          transaction_id: `tx_${acc.account_id}_aws`,
          account_id: acc.account_id,
          amount: 850.00,
          merchant_name: 'Amazon Web Services',
          name: 'AWS Cloud Services',
          category: ['Service', 'Technology'],
          date: txDate,
        });
      });
      
      return mockTransactions;
    }

    const response = await fetch(`${this.baseUrl}/transactions/get`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: this.clientId,
        secret: this.secret,
        access_token: accessToken,
        start_date: startDate,
        end_date: endDate,
      }),
    });

    const data = await response.json() as any;
    if (data.error_code) {
      throw new Error(`Plaid error: ${data.error_message}`);
    }
    return data.transactions || [];
  }

  createLinkTokenEffect(userId: string) {
    return Effect.tryPromise({
      try: () => this.createLinkToken(userId),
      catch: (cause) => new ExternalServiceError({ service: "Plaid", message: "Failed to create link token", cause }),
    });
  }

  exchangePublicTokenEffect(publicToken: string) {
    return Effect.tryPromise({
      try: () => this.exchangePublicToken(publicToken),
      catch: (cause) => new ExternalServiceError({ service: "Plaid", message: "Failed to exchange public token", cause }),
    });
  }

  getAccountsEffect(accessToken: string) {
    return Effect.tryPromise({
      try: () => this.getAccounts(accessToken),
      catch: (cause) => new ExternalServiceError({ service: "Plaid", message: "Failed to fetch Plaid accounts", cause }),
    });
  }

  getTransactionsEffect(accessToken: string, startDate: string, endDate: string) {
    return Effect.tryPromise({
      try: () => this.getTransactions(accessToken, startDate, endDate),
      catch: (cause) => new ExternalServiceError({ service: "Plaid", message: "Failed to fetch Plaid transactions", cause }),
    });
  }
}
