import type { DrizzleD1Database } from "drizzle-orm/d1";
import type { AppEnv } from "../env";
import { eq, and } from "drizzle-orm";
import {
  financialAccounts,
  plaidConnections,
  transactions,
} from "../../db/schema";
import { PlaidService } from "../plaid";
import { decodePlaidExchangeToken } from "../schemas";
import { getValidatedBody, jsonResponse } from "../utils";

async function syncConnection(
  db: DrizzleD1Database,
  userId: string,
  connection: typeof plaidConnections.$inferSelect,
  plaid: PlaidService,
) {
  const bankAccounts = await plaid.getAccounts(connection.accessToken);
  if (
    bankAccounts.some((account) => account.balances.iso_currency_code !== "USD")
  )
    throw new Error("Only USD accounts are supported by this workspace.");
  const endDate = new Date().toISOString().slice(0, 10);
  const startDate = new Date(Date.now() - 90 * 86400000)
    .toISOString()
    .slice(0, 10);
  const bankTransactions = await plaid.getTransactions(
    connection.accessToken,
    startDate,
    endDate,
  );
  const accountMap = new Map<string, string>();
  const now = new Date();
  for (const account of bankAccounts) {
    const existing = await db
      .select()
      .from(financialAccounts)
      .where(
        and(
          eq(financialAccounts.userId, userId),
          eq(financialAccounts.plaidAccountId, account.account_id),
        ),
      )
      .get();
    const values = {
      id: existing?.id || `plaid:${userId}:${account.account_id}`,
      userId,
      name: account.name,
      type:
        account.type === "depository"
          ? account.subtype || "checking"
          : account.type,
      balance: Math.round((account.balances.current || 0) * 100),
      currency: "USD",
      plaidAccountId: account.account_id,
      plaidConnectionId: connection.id,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };
    await db
      .insert(financialAccounts)
      .values(values)
      .onConflictDoUpdate({
        target: financialAccounts.id,
        set: {
          name: values.name,
          balance: values.balance,
          updatedAt: now,
          plaidConnectionId: connection.id,
        },
      })
      .run();
    accountMap.set(account.account_id, values.id);
  }
  let newTransactions = 0;
  for (const transaction of bankTransactions) {
    const accountId = accountMap.get(transaction.account_id);
    if (!accountId) continue;
    const existing = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.plaidTransactionId, transaction.transaction_id),
        ),
      )
      .get();
    const values = {
      id: existing?.id || `plaid:${userId}:${transaction.transaction_id}`,
      userId,
      accountId,
      amount: Math.round(-transaction.amount * 100),
      category: transaction.category?.[0] || "Other",
      merchant: transaction.merchant_name || transaction.name,
      description: transaction.name,
      date: new Date(transaction.date),
      plaidTransactionId: transaction.transaction_id,
      createdAt: existing?.createdAt || now,
    };
    if (existing) {
      await db
        .update(transactions)
        .set(values)
        .where(
          and(
            eq(transactions.id, existing.id),
            eq(transactions.userId, userId),
          ),
        )
        .run();
    } else {
      const inserted = await db
        .insert(transactions)
        .values(values)
        .onConflictDoNothing()
        .returning()
        .all();
      newTransactions += inserted.length;
    }
  }
  return {
    accountsSynced: bankAccounts.length,
    newTransactionsSynced: newTransactions,
  };
}

export async function handlePlaidRoutes(
  request: Request,
  path: string,
  method: string,
  db: DrizzleD1Database,
  userId: string,
  env: AppEnv,
): Promise<Response | null> {
  if (!path.startsWith("/api/plaid/")) return null;
  if (!env.PLAID_CLIENT_ID || !env.PLAID_SECRET)
    return jsonResponse(
      {
        error:
          "Banking is not connected. Configure Plaid credentials on the server.",
      },
      503,
    );
  const plaid = new PlaidService({
    clientId: env.PLAID_CLIENT_ID,
    secret: env.PLAID_SECRET,
    environment: env.PLAID_ENV,
  });
  if (path === "/api/plaid/create-link-token" && method === "POST")
    return jsonResponse({ linkToken: await plaid.createLinkToken(userId) });
  if (path === "/api/plaid/exchange-token" && method === "POST") {
    const { publicToken, institutionName } = await getValidatedBody(
      request,
      decodePlaidExchangeToken,
    );
    if (publicToken.startsWith("mock_"))
      return jsonResponse(
        { error: "A real Plaid Link token is required." },
        400,
      );
    const { accessToken, itemId } =
      await plaid.exchangePublicToken(publicToken);
    const existing = await db
      .select()
      .from(plaidConnections)
      .where(
        and(
          eq(plaidConnections.userId, userId),
          eq(plaidConnections.itemId, itemId),
        ),
      )
      .get();
    const connection = {
      id: existing?.id || `plaid:${userId}:${itemId}`,
      userId,
      accessToken,
      itemId,
      institutionName: institutionName || "Connected bank",
      status: "active",
      createdAt: existing?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    await db
      .insert(plaidConnections)
      .values(connection)
      .onConflictDoUpdate({
        target: plaidConnections.id,
        set: { accessToken, status: "active", updatedAt: new Date() },
      })
      .run();
    await syncConnection(db, userId, connection, plaid);
    return jsonResponse({ success: true, itemId });
  }
  if (path === "/api/plaid/sync-transactions" && method === "POST") {
    const connections = await db
      .select()
      .from(plaidConnections)
      .where(
        and(
          eq(plaidConnections.userId, userId),
          eq(plaidConnections.status, "active"),
        ),
      )
      .all();
    let accountsSynced = 0;
    let newTransactionsSynced = 0;
    for (const connection of connections) {
      const result = await syncConnection(db, userId, connection, plaid);
      accountsSynced += result.accountsSynced;
      newTransactionsSynced += result.newTransactionsSynced;
    }
    return jsonResponse({
      success: true,
      accountsSynced,
      newTransactionsSynced,
    });
  }
  return null;
}
