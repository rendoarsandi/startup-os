import { Hono } from 'hono'
import { drizzle } from 'drizzle-orm/d1'
import { eq, and, desc } from 'drizzle-orm'
import { users, financialAccounts, transactions, budgets, marketingCampaigns, employees, plaidConnections } from "@ai-cfo/db";
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

// Resilient Mock Data Seeds
const DEFAULT_CAMPAIGNS = [
  { id: 'mc-1', name: 'Google Ads Q2', status: 'active', budget: 500000, spend: 320000, conversions: 240, roas: 420 },
  { id: 'mc-2', name: 'Meta Retargeting', status: 'active', budget: 400000, spend: 380000, conversions: 310, roas: 380 },
  { id: 'mc-3', name: 'TikTok Product Launch', status: 'active', budget: 600000, spend: 450000, conversions: 180, roas: 290 },
  { id: 'mc-4', name: 'LinkedIn Enterprise', status: 'paused', budget: 500000, spend: 95000, conversions: 12, roas: 180 }
];

const DEFAULT_EMPLOYEES = [
  { id: 'emp-1', name: 'Alice Vance', role: 'Engineering Lead', department: 'Engineering', salary: 14500000, status: 'active', startDate: new Date('2024-03-15') },
  { id: 'emp-2', name: 'Bob Sterling', role: 'Senior Designer', department: 'Product', salary: 11000000, status: 'active', startDate: new Date('2024-09-01') },
  { id: 'emp-3', name: 'Clara Hayes', role: 'Growth Marketer', department: 'Marketing', salary: 9500000, status: 'active', startDate: new Date('2025-01-10') },
  { id: 'emp-4', name: 'David Miller', role: 'HR Specialist', department: 'People & Culture', salary: 8500000, status: 'active', startDate: new Date('2025-04-01') },
  { id: 'emp-5', name: 'Emily Rose', role: 'Frontend Engineer', department: 'Engineering', salary: 10500000, status: 'onboarding', startDate: new Date('2026-06-01') }
];

// Memory fallback stores
const campaignsStore = [...DEFAULT_CAMPAIGNS];
const employeesStore = [...DEFAULT_EMPLOYEES];

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
  const { message, history, role, activeScenario } = await c.req.json();
  
  // Mocking userId for now
  const userId = "test-user";
  
  try {
    let context = "";
    if (!role || role === 'cfo') {
      context = await analysis.getUserContext(userId);

      // Inject active scenario context if present
      if (activeScenario) {
        context += `\n\n--- ACTIVE WHAT-IF SCENARIO SIMULATION ---\n`;
        context += `The user is currently running a financial forecasting simulation with the following parameters:\n`;
        context += `- MoM Revenue Growth Rate: ${activeScenario.revenueGrowthRate || 0}%\n`;
        context += `- Additional Marketing Spend: $${(activeScenario.marketingSpendDelta || 0).toLocaleString()}/mo\n`;
        context += `- Simulated Marketing ROAS: ${activeScenario.marketingRoas || 1.5}x\n`;
        context += `- Variable Overhead Multiplier: ${activeScenario.overheadMultiplier || 100}%\n`;
        
        if (activeScenario.newHires && activeScenario.newHires.length > 0) {
          context += `- Simulated New Hires (${activeScenario.newHires.length}):\n`;
          activeScenario.newHires.forEach((hire: any) => {
            context += `  * ${hire.name} - ${hire.role} (${hire.department}), $${(hire.salary || 0).toLocaleString()}/yr, starting Month ${hire.startMonth}\n`;
          });
        } else {
          context += `- No simulated new hires.\n`;
        }
        context += `--- END SCENARIO ---\n`;
        context += `When responding, factor in the above scenario parameters and provide analysis specific to this simulation. Be concrete about the financial impact.`;
      }
    } else if (role === 'marketer') {
      context = `Marketing Profile:\nActive Campaigns:\n` + campaignsStore.map(c => `- ${c.name} (${c.status}): Budget $${(c.budget/100).toFixed(2)}, Spend $${(c.spend/100).toFixed(2)}, ROAS ${(c.roas/100).toFixed(1)}x`).join('\n') + `\n\nGoal: Keep average CAC under $45 and boost conversion funnel.`;
    } else if (role === 'hr') {
      context = `HR & People Profile:\nTotal Employees: ${employeesStore.length}\nActive Staff:\n` + employeesStore.map(e => `- ${e.name}: ${e.role} (${e.department}) - $${(e.salary/100).toFixed(2)}/yr`).join('\n') + `\n\nHiring targets: Q3 Headcount growth and document generator.`;
    }

    const response = await gemini.chat(history || [], message, context, role || 'cfo');
    return c.json({ response });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Marketing campaigns API
app.get("/api/marketing/campaigns", async (c) => {
  const db = drizzle(c.env.DB);
  const userId = "test-user";
  try {
    const results = await db.select().from(marketingCampaigns).where(eq(marketingCampaigns.userId, userId)).all();
    return c.json(results.length > 0 ? results : campaignsStore);
  } catch (error) {
    console.warn("DB campaigns query failed, using in-memory fallback:", error);
    return c.json(campaignsStore);
  }
});

app.post("/api/marketing/campaigns", async (c) => {
  const db = drizzle(c.env.DB);
  const userId = "test-user";
  
  try {
    const body = await c.req.json();
    const newCampaign = {
      id: body.id || uuidv4(),
      userId,
      name: body.name,
      status: body.status || 'active',
      budget: Number(body.budget) || 500000,
      spend: Number(body.spend) || 0,
      conversions: Number(body.conversions) || 0,
      roas: Number(body.roas) || 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const existing = await db.select().from(marketingCampaigns).where(eq(marketingCampaigns.id, newCampaign.id)).get();
    if (existing) {
      await db.update(marketingCampaigns).set({
        name: newCampaign.name,
        status: newCampaign.status,
        budget: newCampaign.budget,
        spend: newCampaign.spend,
        conversions: newCampaign.conversions,
        roas: newCampaign.roas,
        updatedAt: new Date()
      }).where(eq(marketingCampaigns.id, newCampaign.id)).run();
    } else {
      await db.insert(marketingCampaigns).values(newCampaign).run();
    }

    const existingIdx = campaignsStore.findIndex(x => x.id === newCampaign.id);
    if (existingIdx >= 0) {
      campaignsStore[existingIdx] = {
        ...campaignsStore[existingIdx],
        ...newCampaign,
        spend: body.spend !== undefined ? Number(body.spend) : campaignsStore[existingIdx].spend,
        conversions: body.conversions !== undefined ? Number(body.conversions) : campaignsStore[existingIdx].conversions,
        roas: body.roas !== undefined ? Number(body.roas) : campaignsStore[existingIdx].roas,
      };
    } else {
      campaignsStore.push(newCampaign);
    }

    return c.json(newCampaign, 201);
  } catch (error: any) {
    console.error("DB campaigns insert/update failed:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.post("/api/marketing/generate-ideas", async (c) => {
  const gemini = new GeminiService(c.env.GEMINI_API_KEY);
  const { productDescription, targetAudience } = await c.req.json();
  const prompt = `Brainstorm 4 creative marketing campaign concepts for this product: "${productDescription}" targeting this audience: "${targetAudience}". 
  For each campaign, provide:
  1. Campaign Name
  2. Concept Description
  3. Primary Marketing Channel (e.g. Social, Search, Email, Video, Event)
  4. Suggested Initial Budget & Target ROI/ROAS.
  Format your response as a clean, highly structured, and readable Markdown list. Do not include excessive preambles. Go straight into the ideas.`;
  
  try {
    const ideas = await gemini.generateResponse(prompt, "", "marketer");
    return c.json({ ideas });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// HR Employees API
app.get("/api/hr/employees", async (c) => {
  const db = drizzle(c.env.DB);
  const userId = "test-user";
  try {
    const results = await db.select().from(employees).where(eq(employees.userId, userId)).all();
    return c.json(results.length > 0 ? results : employeesStore);
  } catch (error) {
    console.warn("DB employees query failed, using in-memory fallback:", error);
    return c.json(employeesStore);
  }
});

app.post("/api/hr/employees", async (c) => {
  const db = drizzle(c.env.DB);
  const userId = "test-user";
  
  try {
    const body = await c.req.json();
    const newEmployee = {
      id: body.id || uuidv4(),
      userId,
      name: body.name,
      role: body.role,
      department: body.department,
      salary: Number(body.salary),
      status: body.status || 'active',
      startDate: body.startDate ? new Date(body.startDate) : new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const existing = await db.select().from(employees).where(eq(employees.id, newEmployee.id)).get();
    if (existing) {
      await db.update(employees).set({
        name: newEmployee.name,
        role: newEmployee.role,
        department: newEmployee.department,
        salary: newEmployee.salary,
        status: newEmployee.status,
        updatedAt: new Date()
      }).where(eq(employees.id, newEmployee.id)).run();
    } else {
      await db.insert(employees).values(newEmployee).run();
    }

    const existingIdx = employeesStore.findIndex(x => x.id === newEmployee.id);
    if (existingIdx >= 0) {
      employeesStore[existingIdx] = { ...employeesStore[existingIdx], ...newEmployee };
    } else {
      employeesStore.push(newEmployee);
    }

    return c.json(newEmployee, 201);
  } catch (error: any) {
    console.error("DB employees insert/update failed:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.post("/api/hr/generate-doc", async (c) => {
  const gemini = new GeminiService(c.env.GEMINI_API_KEY);
  const { docType, title, department, salary, details } = await c.req.json();
  
  let prompt = "";
  if (docType === "job_description") {
    prompt = `Create a professional Job Description for a "${title}" in the "${department}" department. 
    Salary Range: ${salary}. 
    Additional details/responsibilities: ${details || 'None'}.
    Include:
    - Position Summary
    - Key Responsibilities
    - Required Qualifications
    - Key Benefits & Why Join Us.`;
  } else if (docType === "offer_letter") {
    prompt = `Draft a standard professional Employee Offer Letter for a candidate named "${details || 'Candidate Name'}" for the position of "${title}" in the "${department}" department.
    Annual Base Salary: ${salary}.
    Assume start date is two weeks from today.
    Include standard sections: Job Title, Salary, Benefits (medical, dental, 401k), At-Will Employment statement, and sign-off blocks.`;
  } else {
    prompt = `Draft a company HR Policy regarding "${title}" for the "${department}" department / general company-wide policy.
    Key constraints/context: ${details || 'None'}.
    Include:
    - Policy Objective
    - Scope of Policy
    - Specific Rules & Guidelines
    - Compliance and Penalties.`;
  }
  
  prompt += "\nFormat the output in professional, highly structured, clean Markdown document layout. Direct response, do not include chatter or generic introduction.";
  
  try {
    const document = await gemini.generateResponse(prompt, "", "hr");
    return c.json({ document });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});


app.get("/api/cfo/runway", async (c) => {
  const db = drizzle(c.env.DB);
  const analysis = new AnalysisService(db);
  const userId = "test-user";
  try {
    const runwayData = await analysis.calculateRunwayAndBurn(userId);
    return c.json(runwayData);
  } catch (error: any) {
    console.error("GET /api/cfo/runway error:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.get("/api/insights", async (c) => {
  const db = drizzle(c.env.DB);
  const gemini = new GeminiService(c.env.GEMINI_API_KEY);
  const analysis = new AnalysisService(db);
  const userId = "test-user";
  
  try {
    const advice = await analysis.getFinancialAdvice(userId, gemini);
    const runway = await analysis.calculateRunwayAndBurn(userId);
    
    const items = [
      { type: 'opportunity', message: advice }
    ];

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

    return c.json({ advice, items });
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
  const db = drizzle(c.env.DB);
  const userId = "test-user";
  
  try {
    const plaid = new PlaidService({
      clientId: c.env.PLAID_CLIENT_ID,
      secret: c.env.PLAID_SECRET,
      environment: c.env.PLAID_ENV || 'sandbox',
    });
    const analysis = new AnalysisService(db);
    const gemini = new GeminiService(c.env.GEMINI_API_KEY);

    const { publicToken, institutionName } = await c.req.json();
    const { accessToken, itemId } = await plaid.exchangePublicToken(publicToken);
    
    // Store plaid connection securely
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

    // Fetch accounts and sync them
    const plaidAccounts = await plaid.getAccounts(accessToken);
    const accountIdMap = new Map<string, string>();

    for (const plaidAcc of plaidAccounts) {
      const accBalanceCents = Math.round((plaidAcc.balances.current || 0) * 100);
      
      const existingAcc = await db.select().from(financialAccounts).where(
        and(
          eq(financialAccounts.userId, userId),
          eq(financialAccounts.plaidAccountId, plaidAcc.account_id)
        )
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

    // Sync last 30 days of transactions
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const plaidTxList = await plaid.getTransactions(accessToken, startDate, endDate);

    for (const tx of plaidTxList) {
      const existingTx = await db.select().from(transactions).where(
        eq(transactions.plaidTransactionId, tx.transaction_id)
      ).get();

      if (existingTx) continue;

      const localAccId = accountIdMap.get(tx.account_id);
      if (!localAccId) continue;

      // Invert amount (Plaid positive = money spent. In local DB: negative = money spent).
      const localAmount = Math.round(-tx.amount * 100);

      let category = 'Other';
      try {
        category = await analysis.categorizeTransaction(tx.merchant_name || tx.name || '', tx.name || '', gemini);
      } catch (err) {
        console.warn("AI categorization failed, using Plaid or Other:", err);
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

    return c.json({ success: true, itemId });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

app.post("/api/plaid/sync-transactions", async (c) => {
  const db = drizzle(c.env.DB);
  const userId = "test-user";
  
  try {
    const plaid = new PlaidService({
      clientId: c.env.PLAID_CLIENT_ID,
      secret: c.env.PLAID_SECRET,
      environment: c.env.PLAID_ENV || 'sandbox',
    });
    const analysis = new AnalysisService(db);
    const gemini = new GeminiService(c.env.GEMINI_API_KEY);

    // Query active connections
    const activeConnections = await db.select().from(plaidConnections).where(
      and(
        eq(plaidConnections.userId, userId),
        eq(plaidConnections.status, 'active')
      )
    ).all();

    let accountsSynced = 0;
    let newTransactionsSynced = 0;

    for (const conn of activeConnections) {
      // Get updated accounts and balances
      const plaidAccounts = await plaid.getAccounts(conn.accessToken);
      const accountIdMap = new Map<string, string>();

      for (const plaidAcc of plaidAccounts) {
        const accBalanceCents = Math.round((plaidAcc.balances.current || 0) * 100);

        const existingAcc = await db.select().from(financialAccounts).where(
          and(
            eq(financialAccounts.userId, userId),
            eq(financialAccounts.plaidAccountId, plaidAcc.account_id)
          )
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

      // Fetch transactions with overlap safety
      const latestTx = await db.select().from(transactions).where(
        eq(transactions.userId, userId)
      ).orderBy(desc(transactions.date)).limit(1).get();

      const startDate = latestTx
        ? new Date(latestTx.date.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const endDate = new Date().toISOString().split('T')[0];

      const plaidTxList = await plaid.getTransactions(conn.accessToken, startDate, endDate);

      for (const tx of plaidTxList) {
        const existingTx = await db.select().from(transactions).where(
          eq(transactions.plaidTransactionId, tx.transaction_id)
        ).get();

        if (existingTx) continue;

        const localAccId = accountIdMap.get(tx.account_id);
        if (!localAccId) continue;

        const localAmount = Math.round(-tx.amount * 100);

        let category = 'Other';
        try {
          category = await analysis.categorizeTransaction(tx.merchant_name || tx.name || '', tx.name || '', gemini);
        } catch (err) {
          console.warn("AI categorization failed, using Plaid or Other:", err);
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

    return c.json({
      success: true,
      accountsSynced,
      newTransactionsSynced,
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

app.get('/', (c) => {
  return c.text('AI CFO API')
})

export default app
