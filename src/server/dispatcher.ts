import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import {
  financialAccounts, saasConfigs, budgets, marketingCampaigns, employees,
  invoices, crmLeads, attendance, leaveRequests, expenseClaims, inventoryItems, projects, projectTasks, supportTickets
} from "../db/schema";
import { getAuth } from './auth';
import { v4 as uuidv4 } from 'uuid';
import { ValidationError, jsonResponse } from './utils';

import { handleCfoRoutes } from './routes/cfo';
import { handleMarketingRoutes } from './routes/marketing';
import { handleHrRoutes } from './routes/hr';
import { handleOperationsRoutes } from './routes/operations';
import { handleContractsRoutes } from './routes/contracts';
import { handlePlaidRoutes } from './routes/plaid';
import { handleChatRoutes } from './routes/chat';

export { runEffectHandler, ValidationError, jsonResponse, matchRoute } from './utils';

async function getUserId(request: Request, env: any): Promise<string | null> {
  let userId: string | null = null;

  try {
    const origin = new URL(request.url).origin;
    const auth = getAuth(env.DB, env.BETTER_AUTH_URL || origin, env.BETTER_AUTH_SECRET);
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (session && session.user && session.user.id) {
      userId = session.user.id;
    }
  } catch (error) {}

  if (!userId && typeof process !== 'undefined' && process.env && (process.env.VITEST || process.env.NODE_ENV === 'test' || process.env.BUN_TEST || process.env.TEST)) {
    userId = env.TEST_USER_ID === null ? null : env.TEST_USER_ID || "test-user-id";
  }

  if (userId && env.DB) {
    try {
      const db = drizzle(env.DB);
      await seedUser(db, userId);
    } catch (error) {}
  }

  return userId;
}

const seededUsers = new Set<string>();

async function seedUser(db: any, userId: string) {
  if (seededUsers.has(userId)) {
    return;
  }
  const existingAccounts = await db.select().from(financialAccounts).where(eq(financialAccounts.userId, userId)).limit(1).all();
  if (existingAccounts.length > 0) {
    seededUsers.add(userId);
    return;
  }

  const now = new Date();
  const checkingId = uuidv4();
  const savingsId = uuidv4();
  const creditId = uuidv4();

  await db.insert(financialAccounts).values([
    { id: checkingId, userId, name: "SVB Checking", type: "checking", balance: 4259020, currency: "USD", createdAt: now, updatedAt: now },
    { id: savingsId, userId, name: "Chase Savings", type: "savings", balance: 15000000, currency: "USD", createdAt: now, updatedAt: now },
    { id: creditId, userId, name: "Brex Corporate Card", type: "credit", balance: -1245030, currency: "USD", createdAt: now, updatedAt: now }
  ]).run();

  await db.insert(saasConfigs).values({
    id: uuidv4(),
    userId,
    startingMrr: 1500000,
    churnRate: 200,
    cac: 10000,
    arpu: 5000,
    createdAt: now,
    updatedAt: now,
  }).run();

  await db.insert(budgets).values([
    { id: uuidv4(), userId, category: "Marketing", amount: 500000, period: "monthly", createdAt: now, updatedAt: now },
    { id: uuidv4(), userId, category: "Utilities", amount: 200000, period: "monthly", createdAt: now, updatedAt: now },
    { id: uuidv4(), userId, category: "Other", amount: 100000, period: "monthly", createdAt: now, updatedAt: now }
  ]).run();

  await db.insert(marketingCampaigns).values([
    { id: uuidv4(), userId, name: 'Google Ads Q2', status: 'active', budget: 500000, spend: 320000, conversions: 240, roas: 420, createdAt: now, updatedAt: now },
    { id: uuidv4(), userId, name: 'Meta Retargeting', status: 'active', budget: 400000, spend: 380000, conversions: 310, roas: 380, createdAt: now, updatedAt: now },
    { id: uuidv4(), userId, name: 'TikTok Product Launch', status: 'active', budget: 600000, spend: 450000, conversions: 180, roas: 290, createdAt: now, updatedAt: now },
    { id: uuidv4(), userId, name: 'LinkedIn Enterprise', status: 'paused', budget: 500000, spend: 95000, conversions: 12, roas: 180, createdAt: now, updatedAt: now }
  ]).run();

  await db.insert(employees).values([
    { id: uuidv4(), userId, name: 'Alice Vance', role: 'Engineering Lead', department: 'Engineering', salary: 14500000, status: 'active', startDate: new Date('2024-03-15'), createdAt: now, updatedAt: now },
    { id: uuidv4(), userId, name: 'Bob Sterling', role: 'Senior Designer', department: 'Product', salary: 11000000, status: 'active', startDate: new Date('2024-09-01'), createdAt: now, updatedAt: now },
    { id: uuidv4(), userId, name: 'Clara Hayes', role: 'Growth Marketer', department: 'Marketing', salary: 9500000, status: 'active', startDate: new Date('2025-01-10'), createdAt: now, updatedAt: now },
    { id: uuidv4(), userId, name: 'David Miller', role: 'HR Specialist', department: 'People & Culture', salary: 8500000, status: 'active', startDate: new Date('2025-04-01'), createdAt: now, updatedAt: now },
    { id: uuidv4(), userId, name: 'Emily Rose', role: 'Frontend Engineer', department: 'Engineering', salary: 10500000, status: 'onboarding', startDate: new Date('2026-06-01'), createdAt: now, updatedAt: now }
  ]).run();

  const transactionsToInsert: any[] = [];
  const totalDays = 90;
  for (let i = totalDays; i >= 0; i--) {
    const txDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dayOfWeek = txDate.getDay();
    const dayOfMonth = txDate.getDate();

    if (dayOfMonth === 1) {
      transactionsToInsert.push({ id: uuidv4(), userId, accountId: checkingId, amount: -250000, category: "Housing", merchant: "WeWork Office", description: "Monthly Rent", date: txDate, createdAt: now });
    }
    if (dayOfMonth === 5) {
      transactionsToInsert.push({ id: uuidv4(), userId, accountId: creditId, amount: -85000, category: "Utilities", merchant: "Amazon Web Services", description: "AWS Cloud Infrastructure", date: txDate, createdAt: now });
      transactionsToInsert.push({ id: uuidv4(), userId, accountId: creditId, amount: -12000, category: "Utilities", merchant: "GitHub", description: "Organization seats", date: txDate, createdAt: now });
      transactionsToInsert.push({ id: uuidv4(), userId, accountId: creditId, amount: -32000, category: "Utilities", merchant: "Slack", description: "Pro plan subscription", date: txDate, createdAt: now });
    }
    if (dayOfMonth === 15 || dayOfMonth === 30) {
      const payrollAmount = Math.round((14500000 + 11000000 + 9500000 + 8500000) / 24);
      transactionsToInsert.push({ id: uuidv4(), userId, accountId: checkingId, amount: -payrollAmount, category: "Other", merchant: "Gusto Payroll", description: "Semi-monthly payroll", date: txDate, createdAt: now });
    }
    if (dayOfWeek === 5) {
      const depositAmt = Math.round((3500 + Math.random() * 2500) * 100);
      transactionsToInsert.push({ id: uuidv4(), userId, accountId: checkingId, amount: depositAmt, category: "Income", merchant: "Stripe", description: "Stripe payout payout_weekly", date: txDate, createdAt: now });
    }
    if (dayOfWeek === 1) {
      transactionsToInsert.push({ id: uuidv4(), userId, accountId: creditId, amount: -120000, category: "Other", merchant: "Google Ads", description: "Google Search Ads campaign", date: txDate, createdAt: now });
      transactionsToInsert.push({ id: uuidv4(), userId, accountId: creditId, amount: -80000, category: "Other", merchant: "Meta Ads", description: "Meta Social Retargeting", date: txDate, createdAt: now });
    }
  }

  if (transactionsToInsert.length > 0) {
    await db.insert(transactions).values(transactionsToInsert).run();
  }

  const seededEmployees = await db.select().from(employees).where(eq(employees.userId, userId)).all();
  const empAlice = seededEmployees.find(e => e.name === 'Alice Vance') || seededEmployees[0];
  const empBob = seededEmployees.find(e => e.name === 'Bob Sterling') || seededEmployees[1];
  const empClara = seededEmployees.find(e => e.name === 'Clara Hayes') || seededEmployees[2];
  const empDavid = seededEmployees.find(e => e.name === 'David Miller') || seededEmployees[3];

  await db.insert(invoices).values([
    { id: uuidv4(), userId, invoiceNumber: "INV-2026-001", clientName: "Acme Corporation", type: "sales", amount: 1250000, status: "paid", issueDate: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000), dueDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), items: JSON.stringify([{ description: "SaaS Enterprise Core Integration", qty: 1, rate: 1000000 }, { description: "API Maintenance Support (Q1)", qty: 1, rate: 250000 }]), createdAt: now, updatedAt: now },
    { id: uuidv4(), userId, invoiceNumber: "INV-2026-002", clientName: "Globex Corporation", type: "sales", amount: 850000, status: "unpaid", issueDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), dueDate: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000), items: JSON.stringify([{ description: "Custom UI/UX Implementation", qty: 1, rate: 850000 }]), createdAt: now, updatedAt: now },
    { id: uuidv4(), userId, invoiceNumber: "INV-2026-003", clientName: "Wayne Enterprises", type: "sales", amount: 4500000, status: "overdue", issueDate: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000), dueDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), items: JSON.stringify([{ description: "Cryptographic Security Auditing", qty: 3, rate: 1500000 }]), createdAt: now, updatedAt: now },
    { id: uuidv4(), userId, invoiceNumber: "INV-PUR-001", clientName: "Amazon Web Services", type: "purchase", amount: 145000, status: "paid", issueDate: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000), dueDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), items: JSON.stringify([{ description: "Cloud Hosting Credits", qty: 1, rate: 145000 }]), createdAt: now, updatedAt: now },
    { id: uuidv4(), userId, invoiceNumber: "INV-PUR-002", clientName: "GitHub Inc.", type: "purchase", amount: 48000, status: "unpaid", issueDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), dueDate: new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000), items: JSON.stringify([{ description: "GitHub Enterprise Copilot Seats", qty: 24, rate: 2000 }]), createdAt: now, updatedAt: now }
  ]).run();

  await db.insert(crmLeads).values([
    { id: uuidv4(), userId, name: "Bruce Wayne", company: "Wayne Enterprises", email: "bruce@wayne.co", phone: "+1-555-0192", value: 5000000, status: "proposal", createdAt: now, updatedAt: now },
    { id: uuidv4(), userId, name: "Tony Stark", company: "Stark Industries", email: "tony@stark.io", phone: "+1-555-3000", value: 12000000, status: "contacted", createdAt: now, updatedAt: now },
    { id: uuidv4(), userId, name: "Peter Parker", company: "Daily Bugle", email: "peter@bugle.com", phone: "+1-555-9821", value: 150000, status: "lead", createdAt: now, updatedAt: now }
  ]).run();

  if (empAlice && empBob && empClara) {
    const daysToSeed = [0, 1, 2, 3, 4];
    const attendanceRecords: any[] = [];
    for (const day of daysToSeed) {
      const logDate = new Date(now.getTime() - day * 24 * 60 * 60 * 1000);
      if (logDate.getDay() === 0 || logDate.getDay() === 6) continue;
      attendanceRecords.push(
        { id: uuidv4(), userId, employeeId: empAlice.id, date: logDate, status: "present", clockIn: "08:55 AM", clockOut: "06:05 PM", createdAt: now },
        { id: uuidv4(), userId, employeeId: empBob.id, date: logDate, status: day === 2 ? "late" : "present", clockIn: day === 2 ? "10:12 AM" : "09:02 AM", clockOut: "06:00 PM", createdAt: now },
        { id: uuidv4(), userId, employeeId: empClara.id, date: logDate, status: "present", clockIn: "08:45 AM", clockOut: "05:55 PM", createdAt: now }
      );
    }
    if (attendanceRecords.length > 0) {
      await db.insert(attendance).values(attendanceRecords).run();
    }
  }

  if (empBob && empDavid) {
    await db.insert(leaveRequests).values([
      { id: uuidv4(), userId, employeeId: empBob.id, type: "vacation", startDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), endDate: new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000), status: "approved", reason: "Annual family summer trip to Yosemite", createdAt: now, updatedAt: now }
    ]).run();
  }

  if (empAlice && empClara) {
    await db.insert(expenseClaims).values([
      { id: uuidv4(), userId, employeeId: empAlice.id, title: "Mechanical Keyboard & Trackpad for Office", amount: 32500, category: "supplies", status: "approved", date: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000), createdAt: now }
    ]).run();
  }

  await db.insert(inventoryItems).values([
    { id: uuidv4(), userId, sku: "HW-MBP-16", name: "Apple MacBook Pro 16\" (M3 Max, 36GB)", qty: 8, rate: 349900, warehouse: "San Francisco HQ", reorderLevel: 5, createdAt: now, updatedAt: now },
    { id: uuidv4(), userId, sku: "HW-MON-32", name: "Dell UltraSharp 32\" 4K USB-C Hub Monitor", qty: 3, rate: 89900, warehouse: "San Francisco HQ", reorderLevel: 5, createdAt: now, updatedAt: now }
  ]).run();

  const projRedesignId = uuidv4();
  await db.insert(projects).values([
    { id: projRedesignId, userId, name: "Website Rebranding Q3", description: "Complete visual redesign of public landing page and documentation hub.", status: "active", dueDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), createdAt: now, updatedAt: now }
  ]).run();

  await db.insert(supportTickets).values([
    { id: uuidv4(), userId, customerName: "Wayne Enterprises IT", subject: "Webhook Endpoint latency spikes", description: "We are seeing 504 Gateway Timeouts on payments callbacks under high load.", status: "open", priority: "high", createdAt: now, updatedAt: now }
  ]).run();

  seededUsers.add(userId);
}

export async function handleApiRequest(request: Request, passedEnv?: any): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  const context = (request as any).context || {};
  const cloudflare = context.cloudflare || {};
  const env = passedEnv || cloudflare.env || process.env || {};

  // Auth Endpoint Routing
  if (path.startsWith('/api/auth/')) {
    const origin = url.origin;
    const auth = getAuth(env.DB, env.BETTER_AUTH_URL || origin, env.BETTER_AUTH_SECRET);
    return auth.handler(request);
  }

  // Health Check
  if (path === '/api/health' && method === 'GET') {
    return jsonResponse({ status: 'OK' });
  }

  // Retrieve user session ID
  const userId = await getUserId(request, env);
  if (!userId) return jsonResponse({ error: "Unauthorized" }, 401);

  const db = drizzle(env.DB);

  try {
    const handlers = [
      handleCfoRoutes,
      handleMarketingRoutes,
      handleHrRoutes,
      handleOperationsRoutes,
      handleContractsRoutes,
      handlePlaidRoutes,
      handleChatRoutes
    ];

    for (const handler of handlers) {
      const response = await handler(request, path, method, db, userId, env.GEMINI_API_KEY ? env : url);
      if (response) return response;
    }

    return jsonResponse({ error: `Not Found: ${method} ${path}` }, 404);
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return jsonResponse({ error: error.message }, 400);
    }
    console.error(`API Error on ${method} ${path}:`, error);
    return jsonResponse({ error: error.message }, 500);
  }
}
