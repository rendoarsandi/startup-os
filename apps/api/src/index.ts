import { Hono } from 'hono'
import { drizzle } from 'drizzle-orm/d1'
import { eq, and, desc } from 'drizzle-orm'
import { 
  users, financialAccounts, transactions, budgets, marketingCampaigns, employees, plaidConnections, saasConfigs,
  invoices, crmLeads, attendance, leaveRequests, expenseClaims, inventoryItems, projects, projectTasks, supportTickets
} from "@ai-cfo/db";
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

async function seedUser(db: any, userId: string) {
  // Check if financial accounts already exist
  const existingAccounts = await db.select().from(financialAccounts).where(eq(financialAccounts.userId, userId)).limit(1).all();
  if (existingAccounts.length > 0) {
    return; // Already seeded
  }

  const now = new Date();
  
  // 1. Create Financial Accounts
  const checkingId = uuidv4();
  const savingsId = uuidv4();
  const creditId = uuidv4();

  await db.insert(financialAccounts).values([
    {
      id: checkingId,
      userId,
      name: "SVB Checking",
      type: "checking",
      balance: 4259020, // $42,590.20
      currency: "USD",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: savingsId,
      userId,
      name: "Chase Savings",
      type: "savings",
      balance: 15000000, // $150,000.00
      currency: "USD",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: creditId,
      userId,
      name: "Brex Corporate Card",
      type: "credit",
      balance: -1245030, // -$12,450.30
      currency: "USD",
      createdAt: now,
      updatedAt: now,
    }
  ]).run();

  // 2. Create SaaS Config
  await db.insert(saasConfigs).values({
    id: uuidv4(),
    userId,
    startingMrr: 1500000, // $15,000.00
    churnRate: 200, // 2.0%
    cac: 10000, // $100
    arpu: 5000, // $50
    createdAt: now,
    updatedAt: now,
  }).run();

  // 3. Create Budgets
  await db.insert(budgets).values([
    {
      id: uuidv4(),
      userId,
      category: "Marketing",
      amount: 500000, // $5,000.00
      period: "monthly",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: uuidv4(),
      userId,
      category: "Utilities", // SaaS / Cloud hosting
      amount: 200000, // $2,000.00
      period: "monthly",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: uuidv4(),
      userId,
      category: "Other", // General office
      amount: 100000, // $1,000.00
      period: "monthly",
      createdAt: now,
      updatedAt: now,
    }
  ]).run();

  // 4. Create Marketing Campaigns
  await db.insert(marketingCampaigns).values([
    { id: uuidv4(), userId, name: 'Google Ads Q2', status: 'active', budget: 500000, spend: 320000, conversions: 240, roas: 420, createdAt: now, updatedAt: now },
    { id: uuidv4(), userId, name: 'Meta Retargeting', status: 'active', budget: 400000, spend: 380000, conversions: 310, roas: 380, createdAt: now, updatedAt: now },
    { id: uuidv4(), userId, name: 'TikTok Product Launch', status: 'active', budget: 600000, spend: 450000, conversions: 180, roas: 290, createdAt: now, updatedAt: now },
    { id: uuidv4(), userId, name: 'LinkedIn Enterprise', status: 'paused', budget: 500000, spend: 95000, conversions: 12, roas: 180, createdAt: now, updatedAt: now }
  ]).run();

  // 5. Create Employees
  await db.insert(employees).values([
    { id: uuidv4(), userId, name: 'Alice Vance', role: 'Engineering Lead', department: 'Engineering', salary: 14500000, status: 'active', startDate: new Date('2024-03-15'), createdAt: now, updatedAt: now },
    { id: uuidv4(), userId, name: 'Bob Sterling', role: 'Senior Designer', department: 'Product', salary: 11000000, status: 'active', startDate: new Date('2024-09-01'), createdAt: now, updatedAt: now },
    { id: uuidv4(), userId, name: 'Clara Hayes', role: 'Growth Marketer', department: 'Marketing', salary: 9500000, status: 'active', startDate: new Date('2025-01-10'), createdAt: now, updatedAt: now },
    { id: uuidv4(), userId, name: 'David Miller', role: 'HR Specialist', department: 'People & Culture', salary: 8500000, status: 'active', startDate: new Date('2025-04-01'), createdAt: now, updatedAt: now },
    { id: uuidv4(), userId, name: 'Emily Rose', role: 'Frontend Engineer', department: 'Engineering', salary: 10500000, status: 'onboarding', startDate: new Date('2026-06-01'), createdAt: now, updatedAt: now }
  ]).run();

  // 6. Generate 90 days of transactions
  const transactionsToInsert: any[] = [];
  const totalDays = 90;
  
  for (let i = totalDays; i >= 0; i--) {
    const txDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dayOfWeek = txDate.getDay();
    const dayOfMonth = txDate.getDate();

    // 1st of month: Rent
    if (dayOfMonth === 1) {
      transactionsToInsert.push({
        id: uuidv4(),
        userId,
        accountId: checkingId,
        amount: -250000, // -$2,500.00
        category: "Housing",
        merchant: "WeWork Office",
        description: "Monthly Rent",
        date: txDate,
        createdAt: now
      });
    }

    // 5th of month: Cloud hosting & SaaS subscriptions
    if (dayOfMonth === 5) {
      transactionsToInsert.push({
        id: uuidv4(),
        userId,
        accountId: creditId,
        amount: -85000, // -$850.00
        category: "Utilities",
        merchant: "Amazon Web Services",
        description: "AWS Cloud Infrastructure",
        date: txDate,
        createdAt: now
      });
      transactionsToInsert.push({
        id: uuidv4(),
        userId,
        accountId: creditId,
        amount: -12000, // -$120.00
        category: "Utilities",
        merchant: "GitHub",
        description: "Organization seats",
        date: txDate,
        createdAt: now
      });
      transactionsToInsert.push({
        id: uuidv4(),
        userId,
        accountId: creditId,
        amount: -32000, // -$320.00
        category: "Utilities",
        merchant: "Slack",
        description: "Pro plan subscription",
        date: txDate,
        createdAt: now
      });
    }

    // 15th and 30th of month: Payroll payouts
    if (dayOfMonth === 15 || dayOfMonth === 30) {
      const payrollAmount = Math.round((14500000 + 11000000 + 9500000 + 8500000) / 24);
      transactionsToInsert.push({
        id: uuidv4(),
        userId,
        accountId: checkingId,
        amount: -payrollAmount,
        category: "Other",
        merchant: "Gusto Payroll",
        description: "Semi-monthly payroll",
        date: txDate,
        createdAt: now
      });
    }

    // Every Friday: Stripe Deposit (Revenue)
    if (dayOfWeek === 5) {
      const depositAmt = Math.round((3500 + Math.random() * 2500) * 100);
      transactionsToInsert.push({
        id: uuidv4(),
        userId,
        accountId: checkingId,
        amount: depositAmt,
        category: "Income",
        merchant: "Stripe",
        description: "Stripe payout payout_weekly",
        date: txDate,
        createdAt: now
      });
    }

    // Every Monday: Ads marketing expenses
    if (dayOfWeek === 1) {
      transactionsToInsert.push({
        id: uuidv4(),
        userId,
        accountId: creditId,
        amount: -120000, // -$1,200.00
        category: "Other",
        merchant: "Google Ads",
        description: "Google Search Ads campaign",
        date: txDate,
        createdAt: now
      });
      transactionsToInsert.push({
        id: uuidv4(),
        userId,
        accountId: creditId,
        amount: -80000, // -$800.00
        category: "Other",
        merchant: "Meta Ads",
        description: "Meta Social Retargeting",
        date: txDate,
        createdAt: now
      });
    }

    // Regular random food/office supplies
    if (Math.random() < 0.3) {
      const foodAmt = Math.round((15 + Math.random() * 85) * 100);
      transactionsToInsert.push({
        id: uuidv4(),
        userId,
        accountId: creditId,
        amount: -foodAmt,
        category: "Food",
        merchant: Math.random() > 0.5 ? "UberEats" : "Whole Foods",
        description: "Team lunch",
        date: txDate,
        createdAt: now
      });
    }
  }

  if (transactionsToInsert.length > 0) {
    await db.insert(transactions).values(transactionsToInsert).run();
  }

  // Fetch seeded employees to reference correct foreign key IDs
  const seededEmployees = await db.select().from(employees).where(eq(employees.userId, userId)).all();
  const empAlice = seededEmployees.find(e => e.name === 'Alice Vance') || seededEmployees[0];
  const empBob = seededEmployees.find(e => e.name === 'Bob Sterling') || seededEmployees[1];
  const empClara = seededEmployees.find(e => e.name === 'Clara Hayes') || seededEmployees[2];
  const empDavid = seededEmployees.find(e => e.name === 'David Miller') || seededEmployees[3];
  const empEmily = seededEmployees.find(e => e.name === 'Emily Rose') || seededEmployees[4];

  // 7. Seed Invoices
  await db.insert(invoices).values([
    {
      id: uuidv4(),
      userId,
      invoiceNumber: "INV-2026-001",
      clientName: "Acme Corporation",
      type: "sales",
      amount: 1250000,
      status: "paid",
      issueDate: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
      dueDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      items: JSON.stringify([
        { description: "SaaS Enterprise Core Integration", qty: 1, rate: 1000000 },
        { description: "API Maintenance Support (Q1)", qty: 1, rate: 250000 }
      ]),
      createdAt: now,
      updatedAt: now
    },
    {
      id: uuidv4(),
      userId,
      invoiceNumber: "INV-2026-002",
      clientName: "Globex Corporation",
      type: "sales",
      amount: 850000,
      status: "unpaid",
      issueDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      dueDate: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000),
      items: JSON.stringify([
        { description: "Custom UI/UX Implementation", qty: 1, rate: 850000 }
      ]),
      createdAt: now,
      updatedAt: now
    },
    {
      id: uuidv4(),
      userId,
      invoiceNumber: "INV-2026-003",
      clientName: "Wayne Enterprises",
      type: "sales",
      amount: 4500000,
      status: "overdue",
      issueDate: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000),
      dueDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      items: JSON.stringify([
        { description: "Cryptographic Security Auditing", qty: 3, rate: 1500000 }
      ]),
      createdAt: now,
      updatedAt: now
    },
    {
      id: uuidv4(),
      userId,
      invoiceNumber: "INV-PUR-001",
      clientName: "Amazon Web Services",
      type: "purchase",
      amount: 145000,
      status: "paid",
      issueDate: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
      dueDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      items: JSON.stringify([
        { description: "Cloud Hosting Credits", qty: 1, rate: 145000 }
      ]),
      createdAt: now,
      updatedAt: now
    },
    {
      id: uuidv4(),
      userId,
      invoiceNumber: "INV-PUR-002",
      clientName: "GitHub Inc.",
      type: "purchase",
      amount: 48000,
      status: "unpaid",
      issueDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      dueDate: new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000),
      items: JSON.stringify([
        { description: "GitHub Enterprise Copilot Seats", qty: 24, rate: 2000 }
      ]),
      createdAt: now,
      updatedAt: now
    }
  ]).run();

  // 8. Seed CRM Leads
  await db.insert(crmLeads).values([
    { id: uuidv4(), userId, name: "Bruce Wayne", company: "Wayne Enterprises", email: "bruce@wayne.co", phone: "+1-555-0192", value: 5000000, status: "proposal", createdAt: now, updatedAt: now },
    { id: uuidv4(), userId, name: "Tony Stark", company: "Stark Industries", email: "tony@stark.io", phone: "+1-555-3000", value: 12000000, status: "contacted", createdAt: now, updatedAt: now },
    { id: uuidv4(), userId, name: "Peter Parker", company: "Daily Bugle", email: "peter@bugle.com", phone: "+1-555-9821", value: 150000, status: "lead", createdAt: now, updatedAt: now },
    { id: uuidv4(), userId, name: "Richard Hendricks", company: "Pied Piper", email: "richard@piedpiper.co", phone: "+1-555-8822", value: 2500000, status: "won", createdAt: now, updatedAt: now },
    { id: uuidv4(), userId, name: "Gregory House", company: "PPTH Clinic", email: "greg@ppth.org", phone: "+1-555-4040", value: 850000, status: "lost", createdAt: now, updatedAt: now }
  ]).run();

  // 9. Seed Attendance
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

  // 10. Seed Leave Requests
  if (empBob && empDavid) {
    await db.insert(leaveRequests).values([
      {
        id: uuidv4(),
        userId,
        employeeId: empBob.id,
        type: "vacation",
        startDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000),
        status: "approved",
        reason: "Annual family summer trip to Yosemite",
        createdAt: now,
        updatedAt: now
      },
      {
        id: uuidv4(),
        userId,
        employeeId: empDavid.id,
        type: "sick",
        startDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        status: "approved",
        reason: "Dental cleaning and checkup appointment",
        createdAt: now,
        updatedAt: now
      }
    ]).run();
  }

  // 11. Seed Expense Claims
  if (empAlice && empClara) {
    await db.insert(expenseClaims).values([
      {
        id: uuidv4(),
        userId,
        employeeId: empAlice.id,
        title: "Mechanical Keyboard & Trackpad for Office",
        amount: 32500,
        category: "supplies",
        status: "approved",
        date: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000),
        createdAt: now
      },
      {
        id: uuidv4(),
        userId,
        employeeId: empClara.id,
        title: "Growth Hackers Annual Conference Tickets",
        amount: 85000,
        category: "travel",
        status: "pending",
        date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        createdAt: now
      }
    ]).run();
  }

  // 12. Seed Inventory Items
  await db.insert(inventoryItems).values([
    { id: uuidv4(), userId, sku: "HW-MBP-16", name: "Apple MacBook Pro 16\" (M3 Max, 36GB)", qty: 8, rate: 349900, warehouse: "San Francisco HQ", reorderLevel: 5, createdAt: now, updatedAt: now },
    { id: uuidv4(), userId, sku: "HW-MON-32", name: "Dell UltraSharp 32\" 4K USB-C Hub Monitor", qty: 3, rate: 89900, warehouse: "San Francisco HQ", reorderLevel: 5, createdAt: now, updatedAt: now },
    { id: uuidv4(), userId, sku: "HW-YUBI-5", name: "YubiKey 5C NFC Security Key", qty: 25, rate: 5500, warehouse: "NY Fulfillment Center", reorderLevel: 10, createdAt: now, updatedAt: now },
    { id: uuidv4(), userId, sku: "SW-FPA-01", name: "Startup OS Premium License Dongle", qty: 100, rate: 12000, warehouse: "Cloud Vault", reorderLevel: 15, createdAt: now, updatedAt: now }
  ]).run();

  // 13. Seed Projects & Tasks
  const projRedesignId = uuidv4();
  const projSocId = uuidv4();
  await db.insert(projects).values([
    { id: projRedesignId, userId, name: "Website Rebranding Q3", description: "Complete visual redesign of public landing page and documentation hub.", status: "active", dueDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), createdAt: now, updatedAt: now },
    { id: projSocId, userId, name: "SOC-2 Type II Compliance", description: "Establish security controls and prepare audit trials for system compliance.", status: "active", dueDate: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000), createdAt: now, updatedAt: now }
  ]).run();

  if (empAlice && empBob && empEmily) {
    await db.insert(projectTasks).values([
      { id: uuidv4(), userId, projectId: projRedesignId, title: "Create Figma Brand Assets and Visual Mockups", assignedEmployeeId: empBob.id, status: "completed", hoursLogged: 25, createdAt: now, updatedAt: now },
      { id: uuidv4(), userId, projectId: projRedesignId, title: "Implement Responsive Web Components in TanStack", assignedEmployeeId: empEmily.id, status: "inprogress", hoursLogged: 12, createdAt: now, updatedAt: now },
      { id: uuidv4(), userId, projectId: projSocId, title: "Formulate Encryption at Rest Infrastructure Policies", assignedEmployeeId: empAlice.id, status: "todo", hoursLogged: 0, createdAt: now, updatedAt: now }
    ]).run();
  }

  // 14. Seed Support Tickets
  await db.insert(supportTickets).values([
    { id: uuidv4(), userId, customerName: "Wayne Enterprises IT", subject: "Webhook Endpoint latency spikes", description: "We are seeing 504 Gateway Timeouts on payments callbacks under high load.", status: "open", priority: "high", createdAt: now, updatedAt: now },
    { id: uuidv4(), userId, customerName: "Globex Inc (HR Department)", subject: "Invoice calculation formula typo", description: "Invoice INV-2026-002 displays standard rate instead of contracted discount. Please review.", status: "replied", priority: "medium", createdAt: now, updatedAt: now },
    { id: uuidv4(), userId, customerName: "Pied Piper Dev Team", subject: "API Integration Token Reset", description: "Need to regenerate OAuth API tokens for the staging sandbox.", status: "resolved", priority: "low", createdAt: now, updatedAt: now }
  ]).run();
}

async function getUserId(c: any): Promise<string | null> {
  if (typeof process !== 'undefined' && process.env && process.env.VITEST) {
    return "test-user";
  }

  try {
    const origin = new URL(c.req.url).origin;
    const auth = getAuth(c.env.DB, c.env.BETTER_AUTH_URL || origin, c.env.BETTER_AUTH_SECRET);
    const session = await auth.api.getSession({
      headers: c.req.raw.headers
    });

    if (!session || !session.user) {
      return null;
    }

    const userId = session.user.id;

    // Automatically seed data for new users
    const db = drizzle(c.env.DB);
    await seedUser(db, userId);

    return userId;
  } catch (error) {
    console.error("Error in getUserId session retrieval:", error);
    return null;
  }
}

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
  const origin = new URL(c.req.url).origin;
  const auth = getAuth(c.env.DB, c.env.BETTER_AUTH_URL || origin, c.env.BETTER_AUTH_SECRET);
  return auth.handler(c.req.raw);
});

app.post("/api/chat", async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const db = drizzle(c.env.DB);
  const gemini = new GeminiService(c.env.GEMINI_API_KEY);
  const analysis = new AnalysisService(db);
  const { message, history, role, activeScenario } = await c.req.json();
  
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
  const userId = await getUserId(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const db = drizzle(c.env.DB);
  try {
    const results = await db.select().from(marketingCampaigns).where(eq(marketingCampaigns.userId, userId)).all();
    return c.json(results.length > 0 ? results : campaignsStore);
  } catch (error) {
    console.warn("DB campaigns query failed, using in-memory fallback:", error);
    return c.json(campaignsStore);
  }
});

app.post("/api/marketing/campaigns", async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const db = drizzle(c.env.DB);
  
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
  const userId = await getUserId(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const db = drizzle(c.env.DB);
  try {
    const results = await db.select().from(employees).where(eq(employees.userId, userId)).all();
    return c.json(results.length > 0 ? results : employeesStore);
  } catch (error) {
    console.warn("DB employees query failed, using in-memory fallback:", error);
    return c.json(employeesStore);
  }
});

app.post("/api/hr/employees", async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const db = drizzle(c.env.DB);
  
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

app.get("/api/cfo/saas-config", async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const db = drizzle(c.env.DB);
  try {
    const config = await db.select().from(saasConfigs).where(eq(saasConfigs.userId, userId)).get();
    if (!config) {
      return c.json({
        startingMrr: 0,
        churnRate: 0,
        cac: 0,
        arpu: 0
      });
    }
    return c.json(config);
  } catch (error: any) {
    console.error("GET /api/cfo/saas-config error:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.post("/api/cfo/saas-config", async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const db = drizzle(c.env.DB);
  try {
    const { startingMrr, churnRate, cac, arpu } = await c.req.json();
    const existing = await db.select().from(saasConfigs).where(eq(saasConfigs.userId, userId)).get();
    const now = new Date();
    if (existing) {
      await db.update(saasConfigs)
        .set({
          startingMrr: Number(startingMrr),
          churnRate: Number(churnRate),
          cac: Number(cac),
          arpu: Number(arpu),
          updatedAt: now
        })
        .where(eq(saasConfigs.userId, userId))
        .run();
    } else {
      await db.insert(saasConfigs)
        .values({
          id: uuidv4(),
          userId,
          startingMrr: Number(startingMrr),
          churnRate: Number(churnRate),
          cac: Number(cac),
          arpu: Number(arpu),
          createdAt: now,
          updatedAt: now
        })
        .run();
    }
    const updated = await db.select().from(saasConfigs).where(eq(saasConfigs.userId, userId)).get();
    return c.json(updated);
  } catch (error: any) {
    console.error("POST /api/cfo/saas-config error:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.get("/api/cfo/runway", async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const db = drizzle(c.env.DB);
  const analysis = new AnalysisService(db);
  try {
    const runwayData = await analysis.calculateRunwayAndBurn(userId);
    return c.json(runwayData);
  } catch (error: any) {
    console.error("GET /api/cfo/runway error:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.get("/api/insights", async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const db = drizzle(c.env.DB);
  const gemini = new GeminiService(c.env.GEMINI_API_KEY);
  const analysis = new AnalysisService(db);
  
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
  const userId = await getUserId(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const db = drizzle(c.env.DB);
  const results = await db.select().from(financialAccounts).where(eq(financialAccounts.userId, userId)).all();
  return c.json(results);
});

app.post("/api/accounts", async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const db = drizzle(c.env.DB);
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
  const userId = await getUserId(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const db = drizzle(c.env.DB);
  const results = await db.select().from(transactions).where(eq(transactions.userId, userId)).all();
  return c.json(results);
});

app.post("/api/transactions", async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const db = drizzle(c.env.DB);
  const gemini = new GeminiService(c.env.GEMINI_API_KEY);
  const analysis = new AnalysisService(db);
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
  const userId = await getUserId(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const db = drizzle(c.env.DB)
  const allUsers = await db.select().from(users).all()
  return c.json(allUsers)
})

app.get("/api/budgets", async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const db = drizzle(c.env.DB);
  try {
    const results = await db.select().from(budgets).where(eq(budgets.userId, userId)).all();
    return c.json(results);
  } catch (error: any) {
    console.error("GET /api/budgets error:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.post("/api/budgets", async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const db = drizzle(c.env.DB);
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
  const userId = await getUserId(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  try {
    const plaid = new PlaidService({
      clientId: c.env.PLAID_CLIENT_ID,
      secret: c.env.PLAID_SECRET,
      environment: c.env.PLAID_ENV || 'sandbox',
    });
    const linkToken = await plaid.createLinkToken(userId);
    return c.json({ linkToken });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

app.post("/api/plaid/exchange-token", async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const db = drizzle(c.env.DB);
  
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
  const userId = await getUserId(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const db = drizzle(c.env.DB);
  
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

// ==========================================
// CFO INVOICES API
// ==========================================
app.get("/api/cfo/invoices", async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  const db = drizzle(c.env.DB);
  try {
    const results = await db.select().from(invoices).where(eq(invoices.userId, userId)).orderBy(desc(invoices.issueDate)).all();
    return c.json(results);
  } catch (error) {
    console.error("GET /api/cfo/invoices error:", error);
    return c.json([]);
  }
});

app.post("/api/cfo/invoices", async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  const db = drizzle(c.env.DB);
  try {
    const body = await c.req.json();
    const newInvoice = {
      id: uuidv4(),
      userId,
      invoiceNumber: body.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`,
      clientName: body.clientName,
      type: body.type || 'sales',
      amount: Number(body.amount), // in cents
      status: body.status || 'unpaid',
      issueDate: body.issueDate ? new Date(body.issueDate) : new Date(),
      dueDate: body.dueDate ? new Date(body.dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      items: typeof body.items === 'string' ? body.items : JSON.stringify(body.items || []),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    await db.insert(invoices).values(newInvoice).run();
    return c.json(newInvoice, 201);
  } catch (error: any) {
    console.error("POST /api/cfo/invoices error:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.post("/api/cfo/parse-invoice", async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  const gemini = new GeminiService(c.env.GEMINI_API_KEY);
  try {
    const { text } = await c.req.json();
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
    
    // Clean up potential markdown formatting in response
    const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);
    return c.json(parsed);
  } catch (error: any) {
    console.error("AI parse invoice failed:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.post("/api/cfo/parse-invoice-secure", async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  const gemini = new GeminiService(c.env.GEMINI_API_KEY);
  try {
    const { fileBase64, mimeType } = await c.req.json();
    if (!fileBase64 || !mimeType) {
      return c.json({ error: "Missing fileBase64 or mimeType payload." }, 400);
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
    
    // Clean up potential markdown formatting in response
    const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    // Deterministic Math Verification
    const taxCents = Math.round((parsed.taxAmount || 0) * 100);
    const grandTotalCents = Math.round((parsed.grandTotal || 0) * 100);
    
    let computedSubtotalCents = 0;
    const items = parsed.items || [];
    for (const item of items) {
      const rateCents = Math.round((item.rate || 0) * 100);
      const qty = item.qty || 1;
      computedSubtotalCents += qty * rateCents;
    }

    const computedGrandTotalCents = computedSubtotalCents + taxCents;
    const isMathAccurate = Math.abs(computedGrandTotalCents - grandTotalCents) < 2;

    return c.json({
      ...parsed,
      isMathAccurate,
      calculatedGrandTotal: computedGrandTotalCents / 100,
      requiresManualReview: !isMathAccurate
    });
  } catch (error: any) {
    console.error("AI parse secure invoice failed:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.put("/api/cfo/invoices/:id/status", async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  const db = drizzle(c.env.DB);
  try {
    const id = c.req.param("id");
    const { status } = await c.req.json();
    await db.update(invoices).set({ status, updatedAt: new Date() }).where(and(eq(invoices.id, id), eq(invoices.userId, userId))).run();
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// ==========================================
// CMO CRM LEADS API
// ==========================================
app.get("/api/marketing/crm", async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  const db = drizzle(c.env.DB);
  try {
    const results = await db.select().from(crmLeads).where(eq(crmLeads.userId, userId)).orderBy(desc(crmLeads.createdAt)).all();
    return c.json(results);
  } catch (error) {
    console.error("GET /api/marketing/crm error:", error);
    return c.json([]);
  }
});

app.post("/api/marketing/crm", async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  const db = drizzle(c.env.DB);
  try {
    const body = await c.req.json();
    const newLead = {
      id: uuidv4(),
      userId,
      name: body.name,
      company: body.company,
      email: body.email || null,
      phone: body.phone || null,
      value: Number(body.value || 0),
      status: body.status || 'lead',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    await db.insert(crmLeads).values(newLead).run();
    return c.json(newLead, 201);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

app.put("/api/marketing/crm/:id", async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  const db = drizzle(c.env.DB);
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    await db.update(crmLeads).set({
      name: body.name,
      company: body.company,
      email: body.email,
      phone: body.phone,
      value: body.value !== undefined ? Number(body.value) : undefined,
      status: body.status,
      updatedAt: new Date()
    }).where(and(eq(crmLeads.id, id), eq(crmLeads.userId, userId))).run();
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// ==========================================
// CHRO HR OPERATIONS API
// ==========================================
app.get("/api/hr/attendance", async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  const db = drizzle(c.env.DB);
  try {
    const results = await db.select().from(attendance).where(eq(attendance.userId, userId)).orderBy(desc(attendance.date)).all();
    return c.json(results);
  } catch (error) {
    return c.json([]);
  }
});

app.post("/api/hr/attendance/clock-in", async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  const db = drizzle(c.env.DB);
  try {
    const body = await c.req.json();
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
    return c.json(newLog, 201);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

app.post("/api/hr/attendance/clock-out", async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  const db = drizzle(c.env.DB);
  try {
    const body = await c.req.json();
    const formatter = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const nowStr = formatter.format(new Date());
    const today = new Date();
    today.setHours(0,0,0,0);
    const existing = await db.select().from(attendance).where(
      and(
        eq(attendance.userId, userId),
        eq(attendance.employeeId, body.employeeId)
      )
    ).all();
    
    const activeRecord = existing
      .filter(a => new Date(a.date).getTime() >= today.getTime())
      .find(a => !a.clockOut);
      
    if (activeRecord) {
      await db.update(attendance).set({ clockOut: nowStr }).where(eq(attendance.id, activeRecord.id)).run();
      return c.json({ success: true });
    }
    return c.json({ error: "No active clock-in log found for today." }, 400);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

app.get("/api/hr/leaves", async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  const db = drizzle(c.env.DB);
  try {
    const results = await db.select().from(leaveRequests).where(eq(leaveRequests.userId, userId)).orderBy(desc(leaveRequests.createdAt)).all();
    return c.json(results);
  } catch (error) {
    return c.json([]);
  }
});

app.post("/api/hr/leaves", async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  const db = drizzle(c.env.DB);
  try {
    const body = await c.req.json();
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
    return c.json(newLeave, 201);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

app.put("/api/hr/leaves/:id/status", async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  const db = drizzle(c.env.DB);
  try {
    const id = c.req.param("id");
    const { status } = await c.req.json();
    await db.update(leaveRequests).set({ status, updatedAt: new Date() }).where(and(eq(leaveRequests.id, id), eq(leaveRequests.userId, userId))).run();
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

app.get("/api/hr/expenses", async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  const db = drizzle(c.env.DB);
  try {
    const results = await db.select().from(expenseClaims).where(eq(expenseClaims.userId, userId)).orderBy(desc(expenseClaims.date)).all();
    return c.json(results);
  } catch (error) {
    return c.json([]);
  }
});

app.post("/api/hr/expenses", async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  const db = drizzle(c.env.DB);
  try {
    const body = await c.req.json();
    const newClaim = {
      id: uuidv4(),
      userId,
      employeeId: body.employeeId,
      title: body.title,
      amount: Number(body.amount),
      category: body.category,
      status: 'pending',
      date: body.date ? new Date(body.date) : new Date(),
      createdAt: new Date()
    };
    await db.insert(expenseClaims).values(newClaim).run();
    return c.json(newClaim, 201);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

app.put("/api/hr/expenses/:id/status", async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  const db = drizzle(c.env.DB);
  try {
    const id = c.req.param("id");
    const { status } = await c.req.json();
    await db.update(expenseClaims).set({ status }).where(and(eq(expenseClaims.id, id), eq(expenseClaims.userId, userId))).run();
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// ==========================================
// COO OPERATIONS & INVENTORY API
// ==========================================
app.get("/api/operations/inventory", async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  const db = drizzle(c.env.DB);
  try {
    const results = await db.select().from(inventoryItems).where(eq(inventoryItems.userId, userId)).orderBy(inventoryItems.sku).all();
    return c.json(results);
  } catch (error) {
    return c.json([]);
  }
});

app.post("/api/operations/inventory", async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  const db = drizzle(c.env.DB);
  try {
    const body = await c.req.json();
    const sku = body.sku.toUpperCase();
    const existing = await db.select().from(inventoryItems).where(and(eq(inventoryItems.sku, sku), eq(inventoryItems.userId, userId))).get();
    
    if (existing) {
      const newQty = body.qty !== undefined ? Number(body.qty) : existing.qty;
      await db.update(inventoryItems).set({
        qty: newQty,
        rate: body.rate !== undefined ? Number(body.rate) : existing.rate,
        warehouse: body.warehouse || existing.warehouse,
        updatedAt: new Date()
      }).where(eq(inventoryItems.id, existing.id)).run();
      return c.json({ ...existing, qty: newQty, rate: body.rate || existing.rate });
    } else {
      const newItem = {
        id: uuidv4(),
        userId,
        sku,
        name: body.name,
        qty: Number(body.qty || 0),
        rate: Number(body.rate),
        warehouse: body.warehouse || 'Main Warehouse',
        reorderLevel: Number(body.reorderLevel || 10),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await db.insert(inventoryItems).values(newItem).run();
      return c.json(newItem, 201);
    }
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

app.get("/api/operations/projects", async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  const db = drizzle(c.env.DB);
  try {
    const results = await db.select().from(projects).where(eq(projects.userId, userId)).orderBy(desc(projects.createdAt)).all();
    return c.json(results);
  } catch (error) {
    return c.json([]);
  }
});

app.post("/api/operations/projects", async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  const db = drizzle(c.env.DB);
  try {
    const body = await c.req.json();
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
    return c.json(newProject, 201);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

app.get("/api/operations/tasks", async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  const db = drizzle(c.env.DB);
  try {
    const results = await db.select().from(projectTasks).where(eq(projectTasks.userId, userId)).all();
    return c.json(results);
  } catch (error) {
    return c.json([]);
  }
});

app.post("/api/operations/tasks", async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  const db = drizzle(c.env.DB);
  try {
    const body = await c.req.json();
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
    return c.json(newTask, 201);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

app.put("/api/operations/tasks/:id/status", async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  const db = drizzle(c.env.DB);
  try {
    const id = c.req.param("id");
    const { status } = await c.req.json();
    await db.update(projectTasks).set({ status, updatedAt: new Date() }).where(and(eq(projectTasks.id, id), eq(projectTasks.userId, userId))).run();
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

app.post("/api/operations/tasks/:id/log-hours", async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  const db = drizzle(c.env.DB);
  try {
    const id = c.req.param("id");
    const { hours } = await c.req.json();
    const existing = await db.select().from(projectTasks).where(and(eq(projectTasks.id, id), eq(projectTasks.userId, userId))).get();
    if (existing) {
      const newHours = existing.hoursLogged + Number(hours);
      await db.update(projectTasks).set({ hoursLogged: newHours, updatedAt: new Date() }).where(eq(projectTasks.id, id)).run();
      return c.json({ success: true, hoursLogged: newHours });
    }
    return c.json({ error: "Task not found" }, 404);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

app.get("/api/operations/tickets", async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  const db = drizzle(c.env.DB);
  try {
    const results = await db.select().from(supportTickets).where(eq(supportTickets.userId, userId)).orderBy(desc(supportTickets.createdAt)).all();
    return c.json(results);
  } catch (error) {
    return c.json([]);
  }
});

app.post("/api/operations/tickets", async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  const db = drizzle(c.env.DB);
  try {
    const body = await c.req.json();
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
    return c.json(newTicket, 201);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

app.put("/api/operations/tickets/:id/status", async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  const db = drizzle(c.env.DB);
  try {
    const id = c.req.param("id");
    const { status } = await c.req.json();
    await db.update(supportTickets).set({ status, updatedAt: new Date() }).where(and(eq(supportTickets.id, id), eq(supportTickets.userId, userId))).run();
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

app.get('/', (c) => {
  return c.text('AI CFO API')
})

export default app
