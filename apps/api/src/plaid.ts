/**
 * Plaid Service - Handles Plaid Link token creation and public token exchange
 * Uses Plaid Sandbox mode for development
 */

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

  async createLinkToken(userId: string): Promise<string> {
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

  async getTransactions(accessToken: string, startDate: string, endDate: string): Promise<any[]> {
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
