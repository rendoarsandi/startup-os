/**
 * Plaid Service - Handles Plaid Link token creation and public token exchange
 * Uses Plaid Sandbox mode for development, and mock fallback for testing / offline development
 */

import { v4 as uuidv4 } from 'uuid';

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
    this.clientId = config.clientId;
    this.secret = config.secret;
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
      return `mock_link_token_${uuidv4()}`;
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
    } else if (inst === 'mercury') {
      return [
        {
          account_id: 'mock_mercury_checking',
          name: 'Mercury Checking',
          type: 'depository',
          subtype: 'checking',
          balances: { current: 85000.00, available: 85000.00, iso_currency_code: 'USD' }
        },
        {
          account_id: 'mock_mercury_treasury',
          name: 'Mercury Treasury',
          type: 'depository',
          subtype: 'savings',
          balances: { current: 1200000.00, available: 1200000.00, iso_currency_code: 'USD' }
        }
      ];
    } else if (inst === 'bofa') {
      return [
        {
          account_id: 'mock_bofa_checking',
          name: 'BofA Checking',
          type: 'depository',
          subtype: 'checking',
          balances: { current: 45000.00, available: 45000.00, iso_currency_code: 'USD' }
        },
        {
          account_id: 'mock_bofa_credit',
          name: 'BofA Business Credit Card',
          type: 'credit',
          subtype: 'credit card',
          balances: { current: 3500.00, available: 16500.00, iso_currency_code: 'USD' }
        }
      ];
    } else {
      // Default to Chase
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

  async getTransactions(accessToken: string, startDate: string, endDate: string): Promise<any[]> {
    if (this.isMock() || accessToken.startsWith('mock_')) {
      const inst = this.getInstitutionFromToken(accessToken);
      const accounts = this.getMockAccounts(inst);
      
      const mockTransactions: any[] = [];
      const end = new Date(endDate);
      
      accounts.forEach(acc => {
        const accSuffix = acc.account_id.replace('mock_', '');
        
        if (acc.type === 'depository') {
          mockTransactions.push({
            transaction_id: `tx_${accSuffix}_revenue`,
            account_id: acc.account_id,
            amount: -5000.00, // Negative in Plaid = money incoming / revenue
            merchant_name: 'Stripe Payout',
            name: 'Stripe Payout Transfer',
            category: ['Transfer', 'Deposit'],
            date: new Date(end.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          });
          
          mockTransactions.push({
            transaction_id: `tx_${accSuffix}_aws`,
            account_id: acc.account_id,
            amount: 850.00, // Positive in Plaid = money outgoing / expense
            merchant_name: 'Amazon Web Services',
            name: 'AWS Cloud Services',
            category: ['Service', 'Technology'],
            date: new Date(end.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          });

          mockTransactions.push({
            transaction_id: `tx_${accSuffix}_payroll`,
            account_id: acc.account_id,
            amount: 12000.00,
            merchant_name: 'Gusto Payroll',
            name: 'Gusto Salary Payment',
            category: ['Service', 'Payroll'],
            date: new Date(end.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          });

          mockTransactions.push({
            transaction_id: `tx_${accSuffix}_google`,
            account_id: acc.account_id,
            amount: 450.00,
            merchant_name: 'Google Workspace',
            name: 'Google GSuite Subscription',
            category: ['Service', 'Technology'],
            date: new Date(end.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          });
        } else if (acc.type === 'credit') {
          mockTransactions.push({
            transaction_id: `tx_${accSuffix}_fb_ads`,
            account_id: acc.account_id,
            amount: 1500.00,
            merchant_name: 'Facebook Ads',
            name: 'Meta Ads Manager',
            category: ['Service', 'Advertising'],
            date: new Date(end.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          });

          mockTransactions.push({
            transaction_id: `tx_${accSuffix}_starbucks`,
            account_id: acc.account_id,
            amount: 45.50,
            merchant_name: 'Starbucks',
            name: 'Starbucks Coffee',
            category: ['Food and Drink'],
            date: new Date(end.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          });

          mockTransactions.push({
            transaction_id: `tx_${accSuffix}_github`,
            account_id: acc.account_id,
            amount: 99.00,
            merchant_name: 'GitHub',
            name: 'GitHub Copilot Enterprise',
            category: ['Service', 'Technology'],
            date: new Date(end.getTime() - 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          });
        }
      });
      
      return mockTransactions.filter(tx => {
        return tx.date >= startDate && tx.date <= endDate;
      });
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
}
