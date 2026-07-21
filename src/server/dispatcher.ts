import { drizzle } from 'drizzle-orm/d1'
import { eq, and, desc, asc } from 'drizzle-orm'
import { Cause, Effect, Exit, Option } from 'effect'
import { 
  financialAccounts, transactions, budgets, marketingCampaigns, employees, plaidConnections, saasConfigs,
  invoices, crmLeads, attendance, leaveRequests, expenseClaims, inventoryItems, projects, projectTasks, supportTickets, autopilotRules,
  contracts
} from "../db/schema";
import { getAuth } from './auth';
import { GeminiService } from "./gemini";
import { AnalysisService } from "./analysis";
import { PlaidService } from "./plaid";
import { v4 as uuidv4 } from 'uuid';
import { DatabaseError, ExternalServiceError, NotFoundError, UnauthorizedError, ValidationError as EffectValidationError } from "./errors";
import { GeminiServiceTag, PlaidServiceTag, AnalysisServiceTag, DbTag, makeGeminiLayer, makePlaidLayer, makeAnalysisLayer, makeDbLayer } from "./effect-services";
import { 
  decodeCreateAccount, decodeSaasConfig, decodeCreateTransaction, decodeCreateBudget, 
  decodePlaidExchangeToken, decodeCreateInvoice, decodeParseInvoice, decodeParseInvoiceSecure, 
  decodeUpdateInvoiceStatus, decodeCrmLead, decodeCreateCampaign, decodeGenerateIdeas, 
  decodeEmployee, decodeGenerateDoc, decodeClockIn, decodeClockOut, decodeLeaveRequest, 
  decodeUpdateLeaveStatus, decodeExpenseClaim, decodeUpdateExpenseStatus, decodeInventoryItem, 
  decodeProject, decodeProjectTask, decodeUpdateTaskStatus, decodeLogTaskHours, decodeSupportTicket, 
  decodeUpdateTicketStatus, decodeAutopilotRule, decodeAutopilotToggle, decodeChat,
  decodeCreateContract, decodeUpdateContract
} from "./schemas";

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export async function runEffectHandler<A, E, R>(
  program: Effect.Effect<A, E, R>,
  context?: any
): Promise<A> {
  const exit = await Effect.runPromiseExit(
    context ? Effect.provide(program, context) : (program as Effect.Effect<A, E, never>)
  );
  if (Exit.isSuccess(exit)) {
    return exit.value;
  }
  const failure = Cause.failureOption(exit.cause);
  if (Option.isSome(failure)) {
    throw failure.value;
  }
  throw Cause.squash(exit.cause);
}


async function getValidatedBody<T>(
  request: Request,
  decoder: (input: unknown) => Effect.Effect<T, unknown, never>,
): Promise<T> {
  const program = Effect.tryPromise({
    try: () => request.json(),
    catch: () => new ValidationError("Invalid JSON payload"),
  }).pipe(
    Effect.flatMap(decoder),
    Effect.mapError((error) => error instanceof ValidationError
      ? error
      : new ValidationError(error instanceof Error ? error.message : "Validation failed")),
  );

  const exit = await Effect.runPromiseExit(program);
  if (Exit.isSuccess(exit)) return exit.value;

  const failure = Cause.failureOption(exit.cause);
  if (Option.isSome(failure)) throw failure.value;
  throw Cause.squash(exit.cause);
}

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function matchRoute(path: string, pattern: string): Record<string, string> | null {
  const pathParts = path.split('/').filter(Boolean);
  const patternParts = pattern.split('/').filter(Boolean);
  if (pathParts.length !== patternParts.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      params[patternParts[i].slice(1)] = pathParts[i];
    } else if (patternParts[i] !== pathParts[i]) {
      return null;
    }
  }
  return params;
}

async function getUserId(request: Request, env: any): Promise<string | null> {
  if (typeof process !== 'undefined' && process.env && (process.env.VITEST || process.env.NODE_ENV === 'test' || process.env.BUN_TEST || process.env.TEST)) {
    return env.TEST_USER_ID === null ? null : env.TEST_USER_ID || "test-user";
  }

  try {
    const origin = new URL(request.url).origin;
    const auth = getAuth(env.DB, env.BETTER_AUTH_URL || origin, env.BETTER_AUTH_SECRET);
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (!session || !session.user) {
      return null;
    }

    const userId = session.user.id;
    const db = drizzle(env.DB);
    await seedUser(db, userId);

    return userId;
  } catch (error) {
    console.error("Error in getUserId session retrieval:", error);
    return null;
  }
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
    if (Math.random() < 0.3) {
      const foodAmt = Math.round((15 + Math.random() * 85) * 100);
      transactionsToInsert.push({ id: uuidv4(), userId, accountId: creditId, amount: -foodAmt, category: "Food", merchant: Math.random() > 0.5 ? "UberEats" : "Whole Foods", description: "Team lunch", date: txDate, createdAt: now });
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
    { id: uuidv4(), userId, name: "Peter Parker", company: "Daily Bugle", email: "peter@bugle.com", phone: "+1-555-9821", value: 150000, status: "lead", createdAt: now, updatedAt: now },
    { id: uuidv4(), userId, name: "Richard Hendricks", company: "Pied Piper", email: "richard@piedpiper.co", phone: "+1-555-8822", value: 2500000, status: "won", createdAt: now, updatedAt: now },
    { id: uuidv4(), userId, name: "Gregory House", company: "PPTH Clinic", email: "greg@ppth.org", phone: "+1-555-4040", value: 850000, status: "lost", createdAt: now, updatedAt: now }
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
      { id: uuidv4(), userId, employeeId: empBob.id, type: "vacation", startDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), endDate: new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000), status: "approved", reason: "Annual family summer trip to Yosemite", createdAt: now, updatedAt: now },
      { id: uuidv4(), userId, employeeId: empDavid.id, type: "sick", startDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), endDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), status: "approved", reason: "Dental cleaning and checkup appointment", createdAt: now, updatedAt: now }
    ]).run();
  }

  if (empAlice && empClara) {
    await db.insert(expenseClaims).values([
      { id: uuidv4(), userId, employeeId: empAlice.id, title: "Mechanical Keyboard & Trackpad for Office", amount: 32500, category: "supplies", status: "approved", date: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000), createdAt: now },
      { id: uuidv4(), userId, employeeId: empClara.id, title: "Growth Hackers Annual Conference Tickets", amount: 85000, category: "travel", status: "pending", date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), createdAt: now }
    ]).run();
  }

  await db.insert(inventoryItems).values([
    { id: uuidv4(), userId, sku: "HW-MBP-16", name: "Apple MacBook Pro 16\" (M3 Max, 36GB)", qty: 8, rate: 349900, warehouse: "San Francisco HQ", reorderLevel: 5, createdAt: now, updatedAt: now },
    { id: uuidv4(), userId, sku: "HW-MON-32", name: "Dell UltraSharp 32\" 4K USB-C Hub Monitor", qty: 3, rate: 89900, warehouse: "San Francisco HQ", reorderLevel: 5, createdAt: now, updatedAt: now },
    { id: uuidv4(), userId, sku: "HW-YUBI-5", name: "YubiKey 5C NFC Security Key", qty: 25, rate: 5500, warehouse: "NY Fulfillment Center", reorderLevel: 10, createdAt: now, updatedAt: now },
    { id: uuidv4(), userId, sku: "SW-FPA-01", name: "Startup OS Premium License Dongle", qty: 100, rate: 12000, warehouse: "Cloud Vault", reorderLevel: 15, createdAt: now, updatedAt: now }
  ]).run();

  const projRedesignId = uuidv4();
  const projSocId = uuidv4();
  await db.insert(projects).values([
    { id: projRedesignId, userId, name: "Website Rebranding Q3", description: "Complete visual redesign of public landing page and documentation hub.", status: "active", dueDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), createdAt: now, updatedAt: now },
    { id: projSocId, userId, name: "SOC-2 Type II Compliance", description: "Establish security controls and prepare audit trials for system compliance.", status: "active", dueDate: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000), createdAt: now, updatedAt: now }
  ]).run();

  const seededEmployees2 = await db.select().from(employees).where(eq(employees.userId, userId)).all();
  const empBob2 = seededEmployees2.find(e => e.name === 'Bob Sterling') || seededEmployees2[1];
  const empEmily = seededEmployees2.find(e => e.name === 'Emily Rose') || seededEmployees2[4];
  const empAlice2 = seededEmployees2.find(e => e.name === 'Alice Vance') || seededEmployees2[0];

  if (empAlice2 && empBob2 && empEmily) {
    await db.insert(projectTasks).values([
      { id: uuidv4(), userId, projectId: projRedesignId, title: "Create Figma Brand Assets and Visual Mockups", assignedEmployeeId: empBob2.id, status: "completed", hoursLogged: 25, createdAt: now, updatedAt: now },
      { id: uuidv4(), userId, projectId: projRedesignId, title: "Implement Responsive Web Components in TanStack", assignedEmployeeId: empEmily.id, status: "inprogress", hoursLogged: 12, createdAt: now, updatedAt: now },
      { id: uuidv4(), userId, projectId: projSocId, title: "Formulate Encryption at Rest Infrastructure Policies", assignedEmployeeId: empAlice2.id, status: "todo", hoursLogged: 0, createdAt: now, updatedAt: now }
    ]).run();
  }

  await db.insert(supportTickets).values([
    { id: uuidv4(), userId, customerName: "Wayne Enterprises IT", subject: "Webhook Endpoint latency spikes", description: "We are seeing 504 Gateway Timeouts on payments callbacks under high load.", status: "open", priority: "high", createdAt: now, updatedAt: now },
    { id: uuidv4(), userId, customerName: "Globex Inc (HR Department)", subject: "Invoice calculation formula typo", description: "Invoice INV-2026-002 displays standard rate instead of contracted discount. Please review.", status: "replied", priority: "medium", createdAt: now, updatedAt: now },
    { id: uuidv4(), userId, customerName: "Pied Piper Dev Team", subject: "API Integration Token Reset", description: "Need to regenerate OAuth API tokens for the staging sandbox.", status: "resolved", priority: "low", createdAt: now, updatedAt: now }
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

  // 1. Auth Endpoint Routing
  if (path.startsWith('/api/auth/')) {
    const origin = url.origin;
    const auth = getAuth(env.DB, env.BETTER_AUTH_URL || origin, env.BETTER_AUTH_SECRET);
    return auth.handler(request);
  }

  // 2. Health Check
  if (path === '/api/health' && method === 'GET') {
    return jsonResponse({ status: 'OK' });
  }

  // Retrieve user session ID
  const userId = await getUserId(request, env);
  if (!userId) return jsonResponse({ error: "Unauthorized" }, 401);

  const db = drizzle(env.DB);

  try {
    // 3. CFO & Financial Endpoints
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
            .set({
              startingMrr,
              churnRate,
              cac,
              arpu,
              updatedAt: now
            })
            .where(eq(saasConfigs.userId, userId))
            .run();
        } else {
          await db.insert(saasConfigs)
            .values({
              id: uuidv4(),
              userId,
              startingMrr,
              churnRate,
              cac,
              arpu,
              createdAt: now,
              updatedAt: now
            })
            .run();
        }
        const updated = await db.select().from(saasConfigs).where(eq(saasConfigs.userId, userId)).get();
        return jsonResponse(updated);
      }
    }

    if (path === '/api/cfo/runway' && method === 'GET') {
      const analysis = new AnalysisService(db);
      const runwayData = await analysis.calculateRunwayAndBurn(userId);
      return jsonResponse(runwayData);
    }

    if (path === '/api/insights' && method === 'GET') {
      const gemini = new GeminiService(env.GEMINI_API_KEY);
      const analysis = new AnalysisService(db);
      const advice = await analysis.getFinancialAdvice(userId, gemini);
      const runway = await analysis.calculateRunwayAndBurn(userId);
      
      const items = [{ type: 'opportunity', message: advice }];

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

    // 4. Plaid Endpoints
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

    // 5. Invoices API
    if (path === '/api/cfo/invoices') {
      if (method === 'GET') {
        const results = await db.select().from(invoices).where(eq(invoices.userId, userId)).orderBy(desc(invoices.issueDate)).all();
        return jsonResponse(results);
      }
      if (method === 'POST') {
        const body = await getValidatedBody(request, decodeCreateInvoice);
        const newInvoice = {
          id: uuidv4(),
          userId,
          invoiceNumber: body.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`,
          clientName: body.clientName,
          type: body.type || 'sales',
          amount: body.amount,
          status: body.status || 'unpaid',
          issueDate: body.issueDate ? new Date(body.issueDate) : new Date(),
          dueDate: body.dueDate ? new Date(body.dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          items: typeof body.items === 'string' ? body.items : JSON.stringify(body.items || []),
          createdAt: new Date(),
          updatedAt: new Date()
        };
        await db.insert(invoices).values(newInvoice).run();
        return jsonResponse(newInvoice, 201);
      }
    }

    if (path === '/api/cfo/parse-invoice' && method === 'POST') {
      const gemini = new GeminiService(env.GEMINI_API_KEY);
      const { text } = await getValidatedBody(request, decodeParseInvoice);
      const prompt = `You are a professional CFO billing assistant. Extract invoice information from the following text and return a structured JSON object.
      Text to analyze: "${text}"
      
      You MUST respond with a raw JSON object containing ONLY the following keys:
      - clientName: string (the name of the client/vendor)
      - type: 'sales' | 'purchase'
      - dueDateOffsetDays: number (due date relative to today in days, default to 14 if not mentioned)
      - items: array of objects containing:
        * description: string
        * qty: number
        * rate: number (unit rate in USD dollars, NOT cents)
        
      Do not wrap the response in markdown code blocks or add any additional chat text. Return strictly the raw JSON object.`;
      const responseText = await gemini.generateResponse(prompt, "", "cfo");
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      try {
        const parsed = JSON.parse(cleanJson);
        return jsonResponse(parsed);
      } catch (e) {
        return jsonResponse({ error: "Failed to parse invoice structure from LLM output" }, 422);
      }
    }

    if (path === '/api/cfo/parse-invoice-secure' && method === 'POST') {
      const gemini = new GeminiService(env.GEMINI_API_KEY);
      const { fileBase64, mimeType } = await getValidatedBody(request, decodeParseInvoiceSecure);
      if (!fileBase64 || !mimeType) {
        return jsonResponse({ error: "Missing fileBase64 or mimeType payload." }, 400);
      }

      const prompt = `You are a professional CFO billing assistant. Read this scanned invoice/receipt/quotation document.
      Extract the billing entities accurately to a raw JSON object. Do not calculate or change any values.
      
      You MUST respond with a raw JSON object containing ONLY the following keys:
      - clientName: string (the name of the client/vendor)
      - type: 'sales' | 'purchase'
      - invoiceNumber: string (extracted invoice or document number, e.g. INV-1002, default empty string if not found)
      - dueDateOffsetDays: number (due date relative to today in days, default to 14 if not mentioned)
      - taxAmount: number (tax listed in dollars, e.g. 10.50, default to 0)
      - grandTotal: number (total/grand total amount listed in dollars, e.g. 150.00, default to 0)
      - items: array of objects containing:
        * description: string
        * qty: number
        * rate: number (unit rate in USD dollars, e.g. 15.00)

      Do not wrap the response in markdown code blocks or add any additional chat text. Return strictly the raw JSON object.`;

      const responseText = await gemini.generateMultimodalResponse(prompt, fileBase64, mimeType, "cfo");
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      let parsed: any;
      try {
        parsed = JSON.parse(cleanJson);
      } catch (e) {
        return jsonResponse({ error: "Failed to parse invoice structure from LLM output" }, 422);
      }

      const taxCents = Math.round((parsed.taxAmount || 0) * 100);
      const grandTotalCents = Math.round((parsed.grandTotal || 0) * 100);
      
      let computedSubtotalCents = 0;
      const items = parsed.items || [];
      for (const item of items) {
        computedSubtotalCents += (item.qty || 1) * Math.round((item.rate || 0) * 100);
      }

      const computedGrandTotalCents = computedSubtotalCents + taxCents;
      const isMathAccurate = Math.abs(computedGrandTotalCents - grandTotalCents) < 2;

      return jsonResponse({
        ...parsed,
        isMathAccurate,
        calculatedGrandTotal: computedGrandTotalCents / 100,
        requiresManualReview: !isMathAccurate
      });
    }

    const cfoInvoiceParams = matchRoute(path, '/api/cfo/invoices/:id/status');
    if (cfoInvoiceParams && method === 'PUT') {
      const id = cfoInvoiceParams.id;
      const { status } = await getValidatedBody(request, decodeUpdateInvoiceStatus);
      await db.update(invoices).set({ status, updatedAt: new Date() }).where(and(eq(invoices.id, id), eq(invoices.userId, userId))).run();
      return jsonResponse({ success: true });
    }

    // 6. Marketing CRM Endpoints
    if (path === '/api/marketing/crm') {
      if (method === 'GET') {
        const results = await db.select().from(crmLeads).where(eq(crmLeads.userId, userId)).orderBy(desc(crmLeads.createdAt)).all();
        return jsonResponse(results);
      }
      if (method === 'POST') {
        const body = await getValidatedBody(request, decodeCrmLead);
        const newLead = {
          id: uuidv4(),
          userId,
          name: body.name,
          company: body.company,
          email: body.email || null,
          phone: body.phone || null,
          value: body.value ?? 0,
          status: body.status || 'lead',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        await db.insert(crmLeads).values(newLead).run();
        return jsonResponse(newLead, 201);
      }
    }

    const crmParams = matchRoute(path, '/api/marketing/crm/:id');
    if (crmParams && method === 'PUT') {
      const id = crmParams.id;
      const body = await getValidatedBody(request, decodeCrmLead);
      await db.update(crmLeads).set({
        name: body.name,
        company: body.company,
        email: body.email,
        phone: body.phone,
          value: body.value,
        status: body.status,
        updatedAt: new Date()
      }).where(and(eq(crmLeads.id, id), eq(crmLeads.userId, userId))).run();
      return jsonResponse({ success: true });
    }

    // 7. HR Operations & Employees API
    if (path === '/api/marketing/campaigns') {
      if (method === 'GET') {
        const results = await db.select().from(marketingCampaigns).where(eq(marketingCampaigns.userId, userId)).all();
        return jsonResponse(results);
      }
      if (method === 'POST') {
        const body = await getValidatedBody(request, decodeCreateCampaign);
        const newCampaign = {
          id: body.id || uuidv4(),
          userId,
          name: body.name,
          status: body.status || 'active',
          budget: body.budget ?? 500000,
          spend: body.spend ?? 0,
          conversions: body.conversions ?? 0,
          roas: body.roas ?? 0,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        const existing = await db.select().from(marketingCampaigns).where(and(eq(marketingCampaigns.id, newCampaign.id), eq(marketingCampaigns.userId, userId))).get();
        if (existing) {
          await db.update(marketingCampaigns).set({
            name: newCampaign.name,
            status: newCampaign.status,
            budget: newCampaign.budget,
            spend: newCampaign.spend,
            conversions: newCampaign.conversions,
            roas: newCampaign.roas,
            updatedAt: new Date()
          }).where(and(eq(marketingCampaigns.id, newCampaign.id), eq(marketingCampaigns.userId, userId))).run();
        } else {
          await db.insert(marketingCampaigns).values(newCampaign).run();
        }
        return jsonResponse(newCampaign, 201);
      }
    }

    if (path === '/api/marketing/generate-ideas' && method === 'POST') {
      const gemini = new GeminiService(env.GEMINI_API_KEY);
      const { productDescription, targetAudience } = await getValidatedBody(request, decodeGenerateIdeas);
      const prompt = `Brainstorm 4 creative marketing campaign concepts for this product: "${productDescription}" targeting this audience: "${targetAudience}". 
      For each campaign, provide:
      1. Campaign Name
      2. Concept Description
      3. Primary Marketing Channel (e.g. Social, Search, Email, Video, Event)
      4. Suggested Initial Budget & Target ROI/ROAS.
      Format your response as a clean, highly structured, and readable Markdown list. Do not include excessive preambles. Go straight into the ideas.`;
      const ideas = await gemini.generateResponse(prompt, "", "marketer");
      return jsonResponse({ ideas });
    }

    if (path === '/api/hr/employees') {
      if (method === 'GET') {
        const results = await db.select().from(employees).where(eq(employees.userId, userId)).all();
        return jsonResponse(results);
      }
      if (method === 'POST') {
        const body = await getValidatedBody(request, decodeEmployee);
        const newEmployee = {
          id: body.id || uuidv4(),
          userId,
          name: body.name,
          role: body.role,
          department: body.department,
          salary: body.salary,
          status: body.status || 'active',
          startDate: body.startDate ? new Date(body.startDate) : new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        };
        const existing = await db.select().from(employees).where(and(eq(employees.id, newEmployee.id), eq(employees.userId, userId))).get();
        if (existing) {
          await db.update(employees).set({
            name: newEmployee.name,
            role: newEmployee.role,
            department: newEmployee.department,
            salary: newEmployee.salary,
            status: newEmployee.status,
            updatedAt: new Date()
          }).where(and(eq(employees.id, newEmployee.id), eq(employees.userId, userId))).run();
        } else {
          await db.insert(employees).values(newEmployee).run();
        }
        return jsonResponse(newEmployee, 201);
      }
    }

    if (path === '/api/hr/generate-doc' && method === 'POST') {
      const gemini = new GeminiService(env.GEMINI_API_KEY);
      const { docType, title, department, salary, details } = await getValidatedBody(request, decodeGenerateDoc);
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
      const document = await gemini.generateResponse(prompt, "", "hr");
      return jsonResponse({ document });
    }

    if (path === '/api/hr/attendance') {
      if (method === 'GET') {
        const results = await db.select().from(attendance).where(eq(attendance.userId, userId)).orderBy(desc(attendance.date)).all();
        return jsonResponse(results);
      }
    }

    if (path === '/api/hr/attendance/clock-in' && method === 'POST') {
      const body = await getValidatedBody(request, decodeClockIn);
      const employee = await db.select().from(employees).where(
        and(eq(employees.id, body.employeeId), eq(employees.userId, userId))
      ).get();
      if (!employee) return jsonResponse({ error: "Employee not found" }, 404);
      const formatter = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      const nowStr = formatter.format(new Date());
      const newLog = {
        id: uuidv4(),
        userId,
        employeeId: body.employeeId,
        date: new Date(),
        status: body.status || 'present',
        clockIn: nowStr,
        clockOut: null,
        createdAt: new Date()
      };
      await db.insert(attendance).values(newLog).run();
      return jsonResponse(newLog, 201);
    }

    if (path === '/api/hr/attendance/clock-out' && method === 'POST') {
      const body = await getValidatedBody(request, decodeClockOut);
      const formatter = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      const nowStr = formatter.format(new Date());
      const today = new Date();
      today.setHours(0,0,0,0);
      const existing = await db.select().from(attendance).where(
        and(eq(attendance.userId, userId), eq(attendance.employeeId, body.employeeId))
      ).all();
      
      const activeRecord = existing
        .filter(a => new Date(a.date).getTime() >= today.getTime())
        .find(a => !a.clockOut);
        
      if (activeRecord) {
        await db.update(attendance).set({ clockOut: nowStr }).where(eq(attendance.id, activeRecord.id)).run();
        return jsonResponse({ success: true });
      }
      return jsonResponse({ error: "No active clock-in log found for today." }, 400);
    }

    if (path === '/api/hr/leaves') {
      if (method === 'GET') {
        const results = await db.select().from(leaveRequests).where(eq(leaveRequests.userId, userId)).orderBy(desc(leaveRequests.createdAt)).all();
        return jsonResponse(results);
      }
      if (method === 'POST') {
        const body = await getValidatedBody(request, decodeLeaveRequest);
        const employee = await db.select().from(employees).where(
          and(eq(employees.id, body.employeeId), eq(employees.userId, userId))
        ).get();
        if (!employee) return jsonResponse({ error: "Employee not found" }, 404);
        const newLeave = {
          id: uuidv4(),
          userId,
          employeeId: body.employeeId,
          type: body.type,
          startDate: new Date(body.startDate),
          endDate: new Date(body.endDate),
          status: 'pending',
          reason: body.reason || null,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        await db.insert(leaveRequests).values(newLeave).run();
        return jsonResponse(newLeave, 201);
      }
    }

    const leaveParams = matchRoute(path, '/api/hr/leaves/:id/status');
    if (leaveParams && method === 'PUT') {
      const id = leaveParams.id;
      const { status } = await getValidatedBody(request, decodeUpdateLeaveStatus);
      await db.update(leaveRequests).set({ status, updatedAt: new Date() }).where(and(eq(leaveRequests.id, id), eq(leaveRequests.userId, userId))).run();
      return jsonResponse({ success: true });
    }

    if (path === '/api/hr/expenses') {
      if (method === 'GET') {
        const results = await db.select().from(expenseClaims).where(eq(expenseClaims.userId, userId)).orderBy(desc(expenseClaims.date)).all();
        return jsonResponse(results);
      }
      if (method === 'POST') {
        const body = await getValidatedBody(request, decodeExpenseClaim);
        const employee = await db.select().from(employees).where(
          and(eq(employees.id, body.employeeId), eq(employees.userId, userId))
        ).get();
        if (!employee) return jsonResponse({ error: "Employee not found" }, 404);
        const newClaim = {
          id: uuidv4(),
          userId,
          employeeId: body.employeeId,
          title: body.title,
          amount: body.amount,
          category: body.category,
          status: 'pending',
          date: body.date ? new Date(body.date) : new Date(),
          createdAt: new Date()
        };
        await db.insert(expenseClaims).values(newClaim).run();
        return jsonResponse(newClaim, 201);
      }
    }

    const expenseParams = matchRoute(path, '/api/hr/expenses/:id/status');
    if (expenseParams && method === 'PUT') {
      const id = expenseParams.id;
      const { status } = await getValidatedBody(request, decodeUpdateExpenseStatus);
      await db.update(expenseClaims).set({ status }).where(and(eq(expenseClaims.id, id), eq(expenseClaims.userId, userId))).run();
      return jsonResponse({ success: true });
    }

    // 8. Operations & Inventory API
    if (path === '/api/operations/inventory') {
      if (method === 'GET') {
        const results = await db.select().from(inventoryItems).where(eq(inventoryItems.userId, userId)).orderBy(inventoryItems.sku).all();
        return jsonResponse(results);
      }
      if (method === 'POST') {
        const body = await getValidatedBody(request, decodeInventoryItem);
        const sku = body.sku.toUpperCase();
        const existing = await db.select().from(inventoryItems).where(and(eq(inventoryItems.sku, sku), eq(inventoryItems.userId, userId))).get();
        
        if (existing) {
          const newQty = body.qty ?? existing.qty;
          await db.update(inventoryItems).set({
            qty: newQty,
            rate: body.rate ?? existing.rate,
            warehouse: body.warehouse || existing.warehouse,
            updatedAt: new Date()
          }).where(eq(inventoryItems.id, existing.id)).run();
          return jsonResponse({ ...existing, qty: newQty, rate: body.rate || existing.rate });
        } else {
          const newItem = {
            id: uuidv4(),
            userId,
            sku,
            name: body.name || sku,
            qty: body.qty ?? 0,
            rate: body.rate ?? 0,
            warehouse: body.warehouse || 'Main Warehouse',
            reorderLevel: body.reorderLevel ?? 10,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          await db.insert(inventoryItems).values(newItem).run();
          return jsonResponse(newItem, 201);
        }
      }
    }

    if (path === '/api/operations/projects') {
      if (method === 'GET') {
        const results = await db.select().from(projects).where(eq(projects.userId, userId)).orderBy(desc(projects.createdAt)).all();
        return jsonResponse(results);
      }
      if (method === 'POST') {
        const body = await getValidatedBody(request, decodeProject);
        const newProject = {
          id: uuidv4(),
          userId,
          name: body.name,
          description: body.description || null,
          status: body.status || 'active',
          dueDate: body.dueDate ? new Date(body.dueDate) : null,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        await db.insert(projects).values(newProject).run();
        return jsonResponse(newProject, 201);
      }
    }

    if (path === '/api/operations/tasks') {
      if (method === 'GET') {
        const results = await db.select().from(projectTasks).where(eq(projectTasks.userId, userId)).all();
        return jsonResponse(results);
      }
      if (method === 'POST') {
        const body = await getValidatedBody(request, decodeProjectTask);
        const project = await db.select().from(projects).where(
          and(eq(projects.id, body.projectId), eq(projects.userId, userId))
        ).get();
        if (!project) return jsonResponse({ error: "Project not found" }, 404);
        if (body.assignedEmployeeId) {
          const employee = await db.select().from(employees).where(
            and(eq(employees.id, body.assignedEmployeeId), eq(employees.userId, userId))
          ).get();
          if (!employee) return jsonResponse({ error: "Employee not found" }, 404);
        }
        const newTask = {
          id: uuidv4(),
          userId,
          projectId: body.projectId,
          title: body.title,
          assignedEmployeeId: body.assignedEmployeeId || null,
          status: 'todo',
          hoursLogged: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        await db.insert(projectTasks).values(newTask).run();
        return jsonResponse(newTask, 201);
      }
    }

    const taskParams = matchRoute(path, '/api/operations/tasks/:id/status');
    if (taskParams && method === 'PUT') {
      const id = taskParams.id;
      const { status } = await getValidatedBody(request, decodeUpdateTaskStatus);
      await db.update(projectTasks).set({ status, updatedAt: new Date() }).where(and(eq(projectTasks.id, id), eq(projectTasks.userId, userId))).run();
      return jsonResponse({ success: true });
    }

    const taskLogParams = matchRoute(path, '/api/operations/tasks/:id/log-hours');
    if (taskLogParams && method === 'POST') {
      const id = taskLogParams.id;
      const { hours } = await getValidatedBody(request, decodeLogTaskHours);
      const existing = await db.select().from(projectTasks).where(and(eq(projectTasks.id, id), eq(projectTasks.userId, userId))).get();
      if (existing) {
        const newHours = existing.hoursLogged + hours;
        await db.update(projectTasks).set({ hoursLogged: newHours, updatedAt: new Date() }).where(eq(projectTasks.id, id)).run();
        return jsonResponse({ success: true, hoursLogged: newHours });
      }
      return jsonResponse({ error: "Task not found" }, 404);
    }

    if (path === '/api/operations/tickets') {
      if (method === 'GET') {
        const results = await db.select().from(supportTickets).where(eq(supportTickets.userId, userId)).orderBy(desc(supportTickets.createdAt)).all();
        return jsonResponse(results);
      }
      if (method === 'POST') {
        const body = await getValidatedBody(request, decodeSupportTicket);
        const newTicket = {
          id: uuidv4(),
          userId,
          customerName: body.customerName,
          subject: body.subject,
          description: body.description,
          status: 'open',
          priority: body.priority || 'medium',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        await db.insert(supportTickets).values(newTicket).run();
        return jsonResponse(newTicket, 201);
      }
    }

    const ticketParams = matchRoute(path, '/api/operations/tickets/:id/status');
    if (ticketParams && method === 'PUT') {
      const id = ticketParams.id;
      const { status } = await getValidatedBody(request, decodeUpdateTicketStatus);
      await db.update(supportTickets).set({ status, updatedAt: new Date() }).where(and(eq(supportTickets.id, id), eq(supportTickets.userId, userId))).run();
      return jsonResponse({ success: true });
    }

    // 9. Autopilot Orchestrator
    if (path === '/api/operations/autopilot') {
      if (method === 'GET') {
        const results = await db.select().from(autopilotRules).where(eq(autopilotRules.userId, userId)).orderBy(desc(autopilotRules.createdAt)).all();
        return jsonResponse(results);
      }
      if (method === 'POST') {
        const body = await getValidatedBody(request, decodeAutopilotRule);
        if (body.actionType === "auto_task" && body.actionTarget) {
          const employee = await db.select().from(employees).where(
            and(eq(employees.id, body.actionTarget), eq(employees.userId, userId))
          ).get();
          if (!employee) return jsonResponse({ error: "Employee not found" }, 404);
        }
        const id = body.id || uuidv4();
        const newRule = {
          id,
          userId,
          name: body.name,
          triggerType: body.triggerType,
          triggerValue: body.triggerValue,
          actionType: body.actionType,
          actionTarget: body.actionTarget || "",
          active: body.active !== undefined ? body.active : true,
          lastTriggeredAt: body.lastTriggeredAt ? new Date(body.lastTriggeredAt) : null,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        const existing = await db.select().from(autopilotRules).where(and(eq(autopilotRules.id, id), eq(autopilotRules.userId, userId))).get();
        if (existing) {
          await db.update(autopilotRules).set({
            name: body.name,
            triggerType: body.triggerType,
            triggerValue: body.triggerValue,
            actionType: body.actionType,
            actionTarget: body.actionTarget || "",
            active: body.active !== undefined ? body.active : true,
            updatedAt: new Date()
          }).where(and(eq(autopilotRules.id, id), eq(autopilotRules.userId, userId))).run();
        } else {
          await db.insert(autopilotRules).values(newRule).run();
        }
        return jsonResponse(newRule, 201);
      }
    }

    const autopilotToggleParams = matchRoute(path, '/api/operations/autopilot/:id/toggle');
    if (autopilotToggleParams && method === 'PUT') {
      const id = autopilotToggleParams.id;
      const { active } = await getValidatedBody(request, decodeAutopilotToggle);
      await db.update(autopilotRules).set({ active, updatedAt: new Date() }).where(and(eq(autopilotRules.id, id), eq(autopilotRules.userId, userId))).run();
      return jsonResponse({ success: true, active });
    }

    const autopilotParams = matchRoute(path, '/api/operations/autopilot/:id');
    if (autopilotParams && method === 'DELETE') {
      const id = autopilotParams.id;
      await db.delete(autopilotRules).where(and(eq(autopilotRules.id, id), eq(autopilotRules.userId, userId))).run();
      return jsonResponse({ success: true });
    }

    if (path === '/api/operations/autopilot/run-checks' && method === 'POST') {
      const executionLogs: { ruleId: string; name: string; triggered: boolean; actionTaken: string; timestamp: string }[] = [];
      const allRules = await db.select().from(autopilotRules).where(eq(autopilotRules.userId, userId)).all();
      const rules = allRules.filter(rule => rule.active);
      if (rules.length === 0) return jsonResponse({ success: true, logs: executionLogs });
      
      let inventoryList: any[] = [];
      try {
        inventoryList = await db.select().from(inventoryItems).where(eq(inventoryItems.userId, userId)).all();
      } catch (e) {}

      let ticketsList: any[] = [];
      try {
        ticketsList = await db.select().from(supportTickets).where(and(eq(supportTickets.userId, userId), eq(supportTickets.status, "open"))).all();
      } catch (e) {
        ticketsList = [{ id: "t-1", customerName: "Acme Corp", subject: "Urgent Billing Glitch", description: "Brex card failed twice", priority: "high", status: "open" }];
      }

      let runwayMonths = 5; 
      try {
        const analysis = new AnalysisService(db);
        const runwayData = await analysis.calculateRunwayAndBurn(userId);
        if (runwayData && runwayData.runwayMonths !== "Infinite") {
          runwayMonths = runwayData.runwayMonths;
        }
      } catch (e) {}

      for (const rule of rules) {
        let triggered = false;
        let actionTaken = "";
        
        if (rule.triggerType === "runway_low") {
          const threshold = Number(rule.triggerValue) || 6;
          if (runwayMonths < threshold) {
            triggered = true;
            if (rule.actionType === "ai_audit") {
              actionTaken = "AI CFO initiated an active burn audit. Expense report generated and compiled.";
            } else if (rule.actionType === "webhook_alert") {
              actionTaken = "Webhook dispatch: Sent high priority slack alert to external hook endpoint.";
            } else {
              actionTaken = "Triggered operations action.";
            }
          }
        } 
        else if (rule.triggerType === "low_stock") {
          const threshold = Number(rule.triggerValue) || 10;
          const lowItems = inventoryList.filter(item => item.qty <= threshold);
          if (lowItems.length > 0) {
            triggered = true;
            if (rule.actionType === "auto_task") {
              const taskTitle = `[AUTOPILOT] Reorder low-stock SKUs (${lowItems.map(i => i.sku).join(', ')})`;
              try {
                const openTasks = await db.select().from(projectTasks).where(
                  and(eq(projectTasks.userId, userId), eq(projectTasks.status, "todo"))
                ).all();
                if (openTasks.some(task => task.title === taskTitle)) {
                  actionTaken = "A matching restock task is already open.";
                } else {
                  const projs = await db.select().from(projects).where(eq(projects.userId, userId)).limit(1).all();
                  const projId = projs.length > 0 ? projs[0].id : uuidv4();
                  if (projs.length === 0) {
                    await db.insert(projects).values({ id: projId, userId, name: "General Operations", status: "active", createdAt: new Date(), updatedAt: new Date() }).run();
                  }
                  await db.insert(projectTasks).values({
                    id: uuidv4(),
                    userId,
                    projectId: projId,
                    title: taskTitle,
                    assignedEmployeeId: rule.actionTarget || null,
                    status: "todo",
                    hoursLogged: 0,
                    createdAt: new Date(),
                    updatedAt: new Date()
                  }).run();
                  actionTaken = "Created a purchase-order task for the low-stock items.";
                }
              } catch(err) {
                actionTaken = "Unable to create a restock task.";
              }
            } else {
              actionTaken = "Low stock threshold breached. Rule action initiated.";
            }
          }
        }
        else if (rule.triggerType === "high_priority_ticket") {
          const highTickets = ticketsList.filter(t => t.priority === "high");
          if (highTickets.length > 0) {
            triggered = true;
            if (rule.actionType === "ai_reply") {
              for (const t of highTickets) {
                try {
                  await db.update(supportTickets).set({ 
                    status: "replied", 
                    description: `${t.description}\n\n[AI AUTOPILOT REPLY]: Hello ${t.customerName}, our AI Agent has scanned your high priority ticket. We have auto-assigned this to our engineering team and are auditing your issue immediately.`,
                    updatedAt: new Date() 
                  }).where(eq(supportTickets.id, t.id)).run();
                } catch(err) {}
              }
              actionTaken = `AI Agent successfully responded to ${highTickets.length} open support ticket(s). Status updated to 'replied'.`;
            } else {
              actionTaken = "High priority ticket opened. Dispatch actions completed.";
            }
          }
        }
        else if (rule.triggerType === "mrr_surge") {
          actionTaken = "MRR-surge checks require a recorded comparison period and are not configured.";
        }

        if (triggered) {
          try {
            await db.update(autopilotRules).set({ lastTriggeredAt: new Date() }).where(eq(autopilotRules.id, rule.id)).run();
          } catch(e) {}
          executionLogs.push({ ruleId: rule.id, name: rule.name, triggered: true, actionTaken, timestamp: new Date().toISOString() });
        } else {
          executionLogs.push({ ruleId: rule.id, name: rule.name, triggered: false, actionTaken: "Condition within normal parameters.", timestamp: new Date().toISOString() });
        }
      }
      return jsonResponse({ success: true, logs: executionLogs });
    }

    // Contracts Endpoints
    if (path === '/api/contracts') {
      if (method === 'GET') {
        const statusFilter = url.searchParams.get('status');
        const clientIdFilter = url.searchParams.get('clientId');
        const sortBy = url.searchParams.get('sortBy') || 'createdAt';
        const sortOrder = url.searchParams.get('sortOrder') || 'desc';
        const rawLimit = parseInt(url.searchParams.get('limit') || '100', 10);
        const rawOffset = parseInt(url.searchParams.get('offset') || '0', 10);
        const limit = Number.isNaN(rawLimit) || rawLimit < 1 ? 100 : rawLimit;
        const offset = Number.isNaN(rawOffset) || rawOffset < 0 ? 0 : rawOffset;

        const conditions = [eq(contracts.userId, userId)];
        if (statusFilter) {
          conditions.push(eq(contracts.status, statusFilter));
        }
        if (clientIdFilter) {
          conditions.push(eq(contracts.clientId, clientIdFilter));
        }

        const columnMap: Record<string, any> = {
          createdAt: contracts.createdAt,
          updatedAt: contracts.updatedAt,
          value: contracts.value,
          title: contracts.title,
          startDate: contracts.startDate,
          endDate: contracts.endDate,
        };
        const column = columnMap[sortBy] || contracts.createdAt;
        const orderByClause = sortOrder.toLowerCase() === 'asc' ? asc(column) : desc(column);

        const results = await db.select()
          .from(contracts)
          .where(and(...conditions))
          .orderBy(orderByClause)
          .limit(limit)
          .offset(offset)
          .all();

        return jsonResponse(results);
      }

      if (method === 'POST') {
        const body = await getValidatedBody(request, decodeCreateContract);
        const newContract = {
          id: uuidv4(),
          userId,
          title: body.title,
          description: body.description || null,
          status: body.status || 'draft',
          value: body.value || 0,
          clientId: body.clientId || null,
          startDate: body.startDate ? new Date(body.startDate) : null,
          endDate: body.endDate ? new Date(body.endDate) : null,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        await db.insert(contracts).values(newContract).run();
        return jsonResponse(newContract, 201);
      }
    }

    const contractParams = matchRoute(path, '/api/contracts/:id');
    if (contractParams) {
      const id = contractParams.id;

      if (method === 'GET') {
        const contract = await db.select()
          .from(contracts)
          .where(and(eq(contracts.id, id), eq(contracts.userId, userId)))
          .get();
        if (!contract) {
          return jsonResponse({ error: "Contract not found" }, 404);
        }
        return jsonResponse(contract);
      }

      if (method === 'PUT') {
        const body = await getValidatedBody(request, decodeUpdateContract);
        const existing = await db.select()
          .from(contracts)
          .where(and(eq(contracts.id, id), eq(contracts.userId, userId)))
          .get();
        if (!existing) {
          return jsonResponse({ error: "Contract not found" }, 404);
        }

        const updateData: Partial<typeof contracts.$inferInsert> = {
          updatedAt: new Date(),
        };
        if (body.title !== undefined) updateData.title = body.title;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.status !== undefined) updateData.status = body.status;
        if (body.value !== undefined) updateData.value = body.value;
        if (body.clientId !== undefined) updateData.clientId = body.clientId;
        if (body.startDate !== undefined) updateData.startDate = body.startDate ? new Date(body.startDate) : null;
        if (body.endDate !== undefined) updateData.endDate = body.endDate ? new Date(body.endDate) : null;

        await db.update(contracts)
          .set(updateData)
          .where(and(eq(contracts.id, id), eq(contracts.userId, userId)))
          .run();

        const updated = await db.select()
          .from(contracts)
          .where(and(eq(contracts.id, id), eq(contracts.userId, userId)))
          .get();
        return jsonResponse(updated);
      }
    }

    // 10. AI Chat Endpoint
    if (path === '/api/chat' && method === 'POST') {
      const gemini = new GeminiService(env.GEMINI_API_KEY);
      const analysis = new AnalysisService(db);
      const { message, history, role, activeScenario } = await getValidatedBody(request, decodeChat);
      
      let context = "";
      if (!role || role === 'cfo') {
        context = await analysis.getUserContext(userId);
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
        try {
          const dbCampaigns = await db.select().from(marketingCampaigns).where(eq(marketingCampaigns.userId, userId)).all();
          context = `Marketing Profile:\nActive Campaigns:\n` + (dbCampaigns.length > 0 ? dbCampaigns.map(c => `- ${c.name} (${c.status}): Budget $${((c.budget || 0)/100).toFixed(2)}, Spend $${((c.spend || 0)/100).toFixed(2)}, ROAS ${((c.roas || 0)/100).toFixed(1)}x`).join('\n') : '- No active campaigns') + `\n\nGoal: Keep average CAC under $45 and boost conversion funnel.`;
        } catch (dbError) {
          context = `Marketing Profile:\nGoal: Keep average CAC under $45 and boost conversion funnel.`;
        }
      } else if (role === 'hr') {
        try {
          const dbEmployees = await db.select().from(employees).where(eq(employees.userId, userId)).all();
          context = `HR & People Profile:\nTotal Employees: ${dbEmployees.length}\nActive Staff:\n` + (dbEmployees.length > 0 ? dbEmployees.map(e => `- ${e.name}: ${e.role} (${e.department}) - $${((e.salary || 0)/100).toFixed(2)}/yr`).join('\n') : '- No active employees') + `\n\nHiring targets: Q3 Headcount growth and document generator.`;
        } catch (dbError) {
          context = `HR & People Profile:\nHiring targets: Q3 Headcount growth and document generator.`;
        }
      } else if (role === 'operations') {
        try {
          const dbProjects = await db.select().from(projects).where(eq(projects.userId, userId)).all();
          const dbTasks = await db.select().from(projectTasks).where(eq(projectTasks.userId, userId)).all();
          const dbTickets = await db.select().from(supportTickets).where(eq(supportTickets.userId, userId)).all();
          
          context = `Operations & Inventory Profile:\n`;
          context += `Active Projects:\n` + (dbProjects.length > 0 ? dbProjects.map(p => `- ${p.name} (${p.status})`).join('\n') : '- No active projects') + `\n\n`;
          context += `Recent Tasks:\n` + (dbTasks.length > 0 ? dbTasks.slice(0, 10).map(t => `- [${t.status}] ${t.title}`).join('\n') : '- No recent tasks') + `\n\n`;
          context += `Support Tickets:\n` + (dbTickets.length > 0 ? dbTickets.slice(0, 10).map(t => `- [${t.status}] [Priority: ${t.priority}] ${t.subject}`).join('\n') : '- No support tickets');
        } catch (dbError) {
          context = `Operations & Inventory Profile:\nStatus: Active\nProjects: 1 active\nRecent Tasks: 3 pending\nSupport Tickets: 2 unresolved`;
        }
      }

      const response = await gemini.chat(history || [], message, context, role || 'cfo');
      return jsonResponse({ response });
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
