import { drizzle } from 'drizzle-orm/d1';
import { eq, and, desc } from 'drizzle-orm';
import { financialAccounts, saasConfigs, transactions, budgets, invoices } from '../../db/schema';
import { AnalysisService } from '../analysis';
import { GeminiService } from '../gemini';
import { v4 as uuidv4 } from 'uuid';
import {
  decodeCreateAccount,
  decodeSaasConfig,
  decodeCreateTransaction,
  decodeCreateBudget,
  decodeCreateInvoice,
  decodeParseInvoice,
  decodeParseInvoiceSecure,
  decodeUpdateInvoiceStatus,
} from '../schemas';
import { getValidatedBody, jsonResponse, matchRoute } from '../utils';

export async function handleCfoRoutes(request: Request, path: string, method: string, db: any, userId: string, env: any): Promise<Response | null> {
  // Accounts
  if (path === '/api/accounts') {
    if (method === 'GET') {
      const results = await db.select().from(financialAccounts).where(eq(financialAccounts.userId, userId)).all();
      return jsonResponse(results);
    }
    if (method === 'POST') {
      const body = await getValidatedBody(request, decodeCreateAccount);
      const newAccount = {
        id: uuidv4(),
        userId,
        name: body.name,
        type: body.type,
        balance: body.balance || 0,
        currency: body.currency || "USD",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await db.insert(financialAccounts).values(newAccount).run();
      return jsonResponse(newAccount, 201);
    }
  }

  // SaaS Config
  if (path === '/api/cfo/saas-config') {
    if (method === 'GET') {
      const config = await db.select().from(saasConfigs).where(eq(saasConfigs.userId, userId)).get();
      if (!config) {
        return jsonResponse({ startingMrr: 0, churnRate: 0, cac: 0, arpu: 0 });
      }
      return jsonResponse(config);
    }
    if (method === 'POST') {
      const { startingMrr, churnRate, cac, arpu } = await getValidatedBody(request, decodeSaasConfig);
      const existing = await db.select().from(saasConfigs).where(eq(saasConfigs.userId, userId)).get();
      const now = new Date();
      if (existing) {
        await db.update(saasConfigs)
          .set({ startingMrr, churnRate, cac, arpu, updatedAt: now })
          .where(eq(saasConfigs.userId, userId))
          .run();
      } else {
        await db.insert(saasConfigs)
          .values({ id: uuidv4(), userId, startingMrr, churnRate, cac, arpu, createdAt: now, updatedAt: now })
          .run();
      }
      const updated = await db.select().from(saasConfigs).where(eq(saasConfigs.userId, userId)).get();
      return jsonResponse(updated);
    }
  }

  // Runway
  if (path === '/api/cfo/runway' && method === 'GET') {
    const analysis = new AnalysisService(db);
    const runwayData = await analysis.calculateRunwayAndBurn(userId);
    return jsonResponse(runwayData);
  }

  // Financial Insights
  if (path === '/api/insights' && method === 'GET') {
    const gemini = new GeminiService(env.GEMINI_API_KEY);
    const analysis = new AnalysisService(db);
    const advice = await analysis.getFinancialAdvice(userId, gemini);
    const runway = await analysis.calculateRunwayAndBurn(userId);
    
    const items: any[] = [{ type: 'opportunity', message: advice }];

    if (runway.runwayMonths !== "Infinite" && runway.runwayMonths < 6) {
      items.unshift({
        type: 'warning',
        message: `CRITICAL ALERT: Your cash runway is down to ${runway.runwayMonths} months ($${(runway.netBurn/100).toLocaleString('en-US', { maximumFractionDigits: 2 })}/mo net burn). Consider freezing non-essential hiring or reducing marketing spends immediately.`
      });
    } else if (runway.runwayMonths === "Infinite") {
      items.push({
        type: 'success',
        message: "STABLE HEALTH: Your business is currently cash-flow positive! You have infinite runway at current growth rates."
      });
    } else {
      items.push({
        type: 'success',
        message: `STABLE HEALTH: Your cash runway is solid at ${runway.runwayMonths} months. Keep monitoring variable operating spends.`
      });
    }
    return jsonResponse({ advice, items });
  }

  // Transactions
  if (path === '/api/transactions') {
    if (method === 'GET') {
      const results = await db.select().from(transactions).where(eq(transactions.userId, userId)).all();
      return jsonResponse(results);
    }
    if (method === 'POST') {
      const gemini = new GeminiService(env.GEMINI_API_KEY);
      const analysis = new AnalysisService(db);
      const body = await getValidatedBody(request, decodeCreateTransaction);
      const account = await db.select().from(financialAccounts).where(
        and(eq(financialAccounts.id, body.accountId), eq(financialAccounts.userId, userId))
      ).get();
      if (!account) return jsonResponse({ error: "Account not found" }, 404);
      
      let category = body.category;
      if (!category || category === "Other") {
        try {
          category = await analysis.categorizeTransaction(body.merchant || "", body.description || "", gemini);
        } catch (error) {
          console.error("Categorization failed:", error);
          category = "Other";
        }
      }

      const newTransaction = {
        id: uuidv4(),
        userId,
        accountId: body.accountId,
        amount: body.amount,
        category,
        merchant: body.merchant || "Unknown Merchant",
        description: body.description,
        date: new Date(body.date || Date.now()),
        createdAt: new Date(),
      };

      await db.insert(transactions).values(newTransaction).run();
      return jsonResponse(newTransaction, 201);
    }
  }

  // Budgets
  if (path === '/api/budgets') {
    if (method === 'GET') {
      const results = await db.select().from(budgets).where(eq(budgets.userId, userId)).all();
      return jsonResponse(results);
    }
    if (method === 'POST') {
      const body = await getValidatedBody(request, decodeCreateBudget);
      const newBudget = {
        id: uuidv4(),
        userId,
        category: body.category,
        amount: body.amount,
        period: body.period || "monthly",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await db.insert(budgets).values(newBudget).run();
      return jsonResponse(newBudget, 201);
    }
  }

  // Invoices
  if (path === '/api/cfo/invoices') {
    if (method === 'GET') {
      const results = await db.select().from(invoices).where(eq(invoices.userId, userId)).orderBy(desc(invoices.createdAt)).all();
      return jsonResponse(results);
    }
    if (method === 'POST') {
      const body = await getValidatedBody(request, decodeCreateInvoice);
      const now = new Date();
      const newInvoice = {
        id: uuidv4(),
        userId,
        invoiceNumber: body.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`,
        clientName: body.clientName,
        type: body.type,
        amount: body.amount,
        status: body.status || 'unpaid',
        issueDate: new Date(body.issueDate),
        dueDate: new Date(body.dueDate),
        items: body.items ? JSON.stringify(body.items) : null,
        createdAt: now,
        updatedAt: now,
      };
      await db.insert(invoices).values(newInvoice).run();
      return jsonResponse(newInvoice, 201);
    }
  }

  const cfoInvoiceParams = matchRoute(path, '/api/cfo/invoices/:id/status');
  if (cfoInvoiceParams && method === 'PATCH') {
    const { status } = await getValidatedBody(request, decodeUpdateInvoiceStatus);
    const invoiceId = cfoInvoiceParams.id;
    await db.update(invoices).set({ status, updatedAt: new Date() }).where(and(eq(invoices.id, invoiceId), eq(invoices.userId, userId))).run();
    const updated = await db.select().from(invoices).where(and(eq(invoices.id, invoiceId), eq(invoices.userId, userId))).get();
    return jsonResponse(updated);
  }

  if (path === '/api/cfo/parse-invoice' && method === 'POST') {
    const gemini = new GeminiService(env.GEMINI_API_KEY);
    const { documentBase64, mimeType } = await getValidatedBody(request, decodeParseInvoice);
    const parsed = await gemini.parseInvoiceDocument(documentBase64, mimeType);
    return jsonResponse(parsed);
  }

  if (path === '/api/cfo/parse-invoice-secure' && method === 'POST') {
    const gemini = new GeminiService(env.GEMINI_API_KEY);
    const { documentBase64, mimeType } = await getValidatedBody(request, decodeParseInvoiceSecure);
    const parsed = await gemini.parseInvoiceDocument(documentBase64, mimeType);
    return jsonResponse(parsed);
  }

  return null;
}
