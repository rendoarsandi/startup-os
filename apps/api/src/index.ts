import { Hono } from 'hono'
import { drizzle } from 'drizzle-orm/d1'
import { eq } from 'drizzle-orm'
import { users, financialAccounts, transactions, budgets } from "@ai-cfo/db";
import { getAuth } from './auth';
import { GeminiService } from "./gemini";
import { AnalysisService } from "./analysis";
import { PlaidService } from "./plaid";
import { v4 as uuidv4 } from 'uuid';

type Bindings = {
  DB: D1Database
  BETTER_AUTH_URL: string
  BETTER_AUTH_SECRET: string
  GEMINI_API_KEY: string
  PLAID_CLIENT_ID: string
  PLAID_SECRET: string
  PLAID_ENV: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.get('/api/health', (c) => {
  return c.json({ status: 'OK' })
})

app.on(['POST', 'GET'], '/api/auth/*', (c) => {
  const auth = getAuth(c.env.DB, c.env.BETTER_AUTH_URL);
  return auth.handler(c.req.raw);
});

app.post("/api/chat", async (c) => {
  const db = drizzle(c.env.DB);
  const gemini = new GeminiService(c.env.GEMINI_API_KEY);
  const analysis = new AnalysisService(db);
  const { message, history } = await c.req.json();
  
  // Mocking userId for now
  const userId = "test-user";
  
  try {
    const context = await analysis.getUserContext(userId);
    const response = await gemini.chat(history || [], message, context);
    return c.json({ response });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

app.get("/api/insights", async (c) => {
  const db = drizzle(c.env.DB);
  const gemini = new GeminiService(c.env.GEMINI_API_KEY);
  const analysis = new AnalysisService(db);
  
  // Mocking userId for now since we don't have session middleware fully wired in Hono yet
  const userId = "test-user";
  
  try {
    const advice = await analysis.getFinancialAdvice(userId, gemini);
    return c.json({ advice });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

app.get("/api/accounts", async (c) => {
  const db = drizzle(c.env.DB);
  const userId = "test-user";
  const results = await db.select().from(financialAccounts).where(eq(financialAccounts.userId, userId)).all();
  return c.json(results);
});

app.post("/api/accounts", async (c) => {
  const db = drizzle(c.env.DB);
  const userId = "test-user";
  const body = await c.req.json();
  
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
  return c.json(newAccount, 201);
});

app.get("/api/transactions", async (c) => {
  const db = drizzle(c.env.DB);
  const userId = "test-user";
  const results = await db.select().from(transactions).where(eq(transactions.userId, userId)).all();
  return c.json(results);
});

app.post("/api/transactions", async (c) => {
  const db = drizzle(c.env.DB);
  const gemini = new GeminiService(c.env.GEMINI_API_KEY);
  const analysis = new AnalysisService(db);
  const userId = "test-user";
  const body = await c.req.json();
  
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
    merchant: body.merchant,
    description: body.description,
    date: new Date(body.date || Date.now()),
    createdAt: new Date(),
  };

  await db.insert(transactions).values(newTransaction).run();
  return c.json(newTransaction, 201);
});

app.get('/api/users', async (c) => {
  const db = drizzle(c.env.DB)
  const allUsers = await db.select().from(users).all()
  return c.json(allUsers)
})

app.get("/api/budgets", async (c) => {
  const db = drizzle(c.env.DB);
  const userId = "test-user";
  try {
    const results = await db.select().from(budgets).where(eq(budgets.userId, userId)).all();
    return c.json(results);
  } catch (error: any) {
    console.error("GET /api/budgets error:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.post("/api/budgets", async (c) => {
  const db = drizzle(c.env.DB);
  const userId = "test-user";
  const body = await c.req.json();
  
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
  return c.json(newBudget, 201);
});

// Plaid endpoints
app.post("/api/plaid/create-link-token", async (c) => {
  try {
    const plaid = new PlaidService({
      clientId: c.env.PLAID_CLIENT_ID,
      secret: c.env.PLAID_SECRET,
      environment: c.env.PLAID_ENV || 'sandbox',
    });
    const userId = "test-user";
    const linkToken = await plaid.createLinkToken(userId);
    return c.json({ linkToken });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

app.post("/api/plaid/exchange-token", async (c) => {
  try {
    const plaid = new PlaidService({
      clientId: c.env.PLAID_CLIENT_ID,
      secret: c.env.PLAID_SECRET,
      environment: c.env.PLAID_ENV || 'sandbox',
    });
    const { publicToken } = await c.req.json();
    const { accessToken, itemId } = await plaid.exchangePublicToken(publicToken);
    // TODO: Store accessToken securely in the database
    return c.json({ success: true, itemId });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

app.get('/', (c) => {
  return c.text('AI CFO API')
})

export default app
