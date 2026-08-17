import { action } from '../convex/core';
import { PlaidService } from '../plaid';
import * as cfo from './cfo';

export const createLinkToken = action({
  handler: async (ctx) => {
    const clientId = ctx.env.PLAID_CLIENT_ID || process.env.PLAID_CLIENT_ID;
    const secret = ctx.env.PLAID_SECRET || process.env.PLAID_SECRET;
    const env = ctx.env.PLAID_ENV || process.env.PLAID_ENV || 'sandbox';

    if (!clientId || !secret) {
      return { link_token: 'mock-plaid-link-token-' + Date.now() };
    }

    const plaid = new PlaidService(clientId, secret, env);
    const linkToken = await plaid.createLinkToken(ctx.auth.userId || 'anonymous-user');
    return { link_token: linkToken };
  },
});

export const exchangePublicToken = action({
  handler: async (ctx, args: { publicToken: string; institutionName?: string }) => {
    const clientId = ctx.env.PLAID_CLIENT_ID || process.env.PLAID_CLIENT_ID;
    const secret = ctx.env.PLAID_SECRET || process.env.PLAID_SECRET;
    const env = ctx.env.PLAID_ENV || process.env.PLAID_ENV || 'sandbox';

    let accessToken = 'mock-access-token-' + Date.now();
    let itemId = 'mock-item-' + Date.now();

    if (clientId && secret) {
      const plaid = new PlaidService(clientId, secret, env);
      const res = await plaid.exchangePublicToken(args.publicToken);
      accessToken = res.accessToken;
      itemId = res.itemId;
    }

    return {
      success: true,
      accessToken,
      itemId,
    };
  },
});
