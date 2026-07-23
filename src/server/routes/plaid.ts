import { eq, and, desc } from 'drizzle-orm';
import { financialAccounts, plaidConnections, transactions } from '../../db/schema';
import { PlaidService } from '../plaid';
import { AnalysisService } from '../analysis';
import { GeminiService } from '../gemini';
import { v4 as uuidv4 } from 'uuid';
import { decodePlaidExchangeToken } from '../schemas';
import { getValidatedBody, jsonResponse } from '../utils';

export async function handlePlaidRoutes(request: Request, path: string, method: string, db: any, userId: string, env: any): Promise<Response | null> {
  if (path === '/api/plaid/create-link-token' && method === 'POST') {
    const plaid = new PlaidService({
      clientId: env.PLAID_CLIENT_ID,
      secret: env.PLAID_SECRET,
      environment: env.PLAID_ENV || 'sandbox',
    });
    const linkToken = await plaid.createLinkToken(userId);
    return jsonResponse({ linkToken });
  }

  if (path === '/api/plaid/exchange-token' && method === 'POST') {
    const plaid = new PlaidService({
      clientId: env.PLAID_CLIENT_ID,
      secret: env.PLAID_SECRET,
      environment: env.PLAID_ENV || 'sandbox',
    });
    const analysis = new AnalysisService(db);
    const gemini = new GeminiService(env.GEMINI_API_KEY);

    const { publicToken, institutionName } = await getValidatedBody(request, decodePlaidExchangeToken);
    const { accessToken, itemId } = await plaid.exchangePublicToken(publicToken);
    
    const connectionId = uuidv4();
    await db.insert(plaidConnections).values({
      id: connectionId,
      userId,
      accessToken,
      itemId,
      institutionName: institutionName || 'Chase',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    }).run();

    const plaidAccounts = await plaid.getAccounts(accessToken);
    const accountIdMap = new Map<string, string>();

    for (const plaidAcc of plaidAccounts) {
      const accBalanceCents = Math.round((plaidAcc.balances.current || 0) * 100);
      const existingAcc = await db.select().from(financialAccounts).where(
        and(eq(financialAccounts.userId, userId), eq(financialAccounts.plaidAccountId, plaidAcc.account_id))
      ).get();

      let localAccountId = uuidv4();
      if (existingAcc) {
        localAccountId = existingAcc.id;
        await db.update(financialAccounts).set({
          name: plaidAcc.name,
          balance: accBalanceCents,
          plaidConnectionId: connectionId,
          updatedAt: new Date(),
        }).where(eq(financialAccounts.id, localAccountId)).run();
      } else {
        await db.insert(financialAccounts).values({
          id: localAccountId,
          userId,
          name: plaidAcc.name,
          type: plaidAcc.type === 'depository' ? (plaidAcc.subtype || 'checking') : plaidAcc.type,
          balance: accBalanceCents,
          currency: plaidAcc.balances.iso_currency_code || 'USD',
          plaidAccountId: plaidAcc.account_id,
          plaidConnectionId: connectionId,
          createdAt: new Date(),
          updatedAt: new Date(),
        }).run();
      }
      accountIdMap.set(plaidAcc.account_id, localAccountId);
    }

    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const plaidTxList = await plaid.getTransactions(accessToken, startDate, endDate);

    for (const tx of plaidTxList) {
      const existingTx = await db.select().from(transactions).where(eq(transactions.plaidTransactionId, tx.transaction_id)).get();
      if (existingTx) continue;

      const localAccId = accountIdMap.get(tx.account_id);
      if (!localAccId) continue;

      const localAmount = Math.round(-tx.amount * 100);
      let category = 'Other';
      try {
        category = await analysis.categorizeTransaction(tx.merchant_name || tx.name || '', tx.name || '', gemini);
      } catch (err) {
        category = (tx.category && tx.category[0]) || 'Other';
      }

      await db.insert(transactions).values({
        id: uuidv4(),
        userId,
        accountId: localAccId,
        amount: localAmount,
        category,
        merchant: tx.merchant_name || tx.name || 'Unknown Merchant',
        description: tx.name || '',
        date: new Date(tx.date),
        plaidTransactionId: tx.transaction_id,
        createdAt: new Date(),
      }).run();
    }

    return jsonResponse({ success: true, itemId });
  }

  if (path === '/api/plaid/sync-transactions' && method === 'POST') {
    const plaid = new PlaidService({
      clientId: env.PLAID_CLIENT_ID,
      secret: env.PLAID_SECRET,
      environment: env.PLAID_ENV || 'sandbox',
    });
    const analysis = new AnalysisService(db);
    const gemini = new GeminiService(env.GEMINI_API_KEY);

    const activeConnections = await db.select().from(plaidConnections).where(
      and(eq(plaidConnections.userId, userId), eq(plaidConnections.status, 'active'))
    ).all();

    let accountsSynced = 0;
    let newTransactionsSynced = 0;

    for (const conn of activeConnections) {
      const plaidAccounts = await plaid.getAccounts(conn.accessToken);
      const accountIdMap = new Map<string, string>();

      for (const plaidAcc of plaidAccounts) {
        const accBalanceCents = Math.round((plaidAcc.balances.current || 0) * 100);
        const existingAcc = await db.select().from(financialAccounts).where(
          and(eq(financialAccounts.userId, userId), eq(financialAccounts.plaidAccountId, plaidAcc.account_id))
        ).get();

        let localAccountId = uuidv4();
        if (existingAcc) {
          localAccountId = existingAcc.id;
          await db.update(financialAccounts).set({
            name: plaidAcc.name,
            balance: accBalanceCents,
            plaidConnectionId: conn.id,
            updatedAt: new Date(),
          }).where(eq(financialAccounts.id, localAccountId)).run();
        } else {
          await db.insert(financialAccounts).values({
            id: localAccountId,
            userId,
            name: plaidAcc.name,
            type: plaidAcc.type === 'depository' ? (plaidAcc.subtype || 'checking') : plaidAcc.type,
            balance: accBalanceCents,
            currency: plaidAcc.balances.iso_currency_code || 'USD',
            plaidAccountId: plaidAcc.account_id,
            plaidConnectionId: conn.id,
            createdAt: new Date(),
            updatedAt: new Date(),
          }).run();
        }
        accountIdMap.set(plaidAcc.account_id, localAccountId);
        accountsSynced++;
      }

      const latestTx = await db.select().from(transactions).where(eq(transactions.userId, userId)).orderBy(desc(transactions.date)).limit(1).get();
      const startDate = latestTx
        ? new Date(latestTx.date.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const endDate = new Date().toISOString().split('T')[0];

      const plaidTxList = await plaid.getTransactions(conn.accessToken, startDate, endDate);

      for (const tx of plaidTxList) {
        const existingTx = await db.select().from(transactions).where(eq(transactions.plaidTransactionId, tx.transaction_id)).get();
        if (existingTx) continue;

        const localAccId = accountIdMap.get(tx.account_id);
        if (!localAccId) continue;

        const localAmount = Math.round(-tx.amount * 100);
        let category = 'Other';
        try {
          category = await analysis.categorizeTransaction(tx.merchant_name || tx.name || '', tx.name || '', gemini);
        } catch (err) {
          category = (tx.category && tx.category[0]) || 'Other';
        }

        await db.insert(transactions).values({
          id: uuidv4(),
          userId,
          accountId: localAccId,
          amount: localAmount,
          category,
          merchant: tx.merchant_name || tx.name || 'Unknown Merchant',
          description: tx.name || '',
          date: new Date(tx.date),
          plaidTransactionId: tx.transaction_id,
          createdAt: new Date(),
        }).run();

        newTransactionsSynced++;
      }
    }

    return jsonResponse({ success: true, accountsSynced, newTransactionsSynced });
  }

  return null;
}
