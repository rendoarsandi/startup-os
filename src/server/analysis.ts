import { users, transactions, financialAccounts, employees, saasConfigs } from "../db/schema";
import { eq, desc } from "drizzle-orm";
import { Effect } from "effect";
import { DatabaseError } from "./errors";

export class AnalysisService {
  private readonly db: import('drizzle-orm/d1').DrizzleD1Database;
  constructor(db: import('drizzle-orm/d1').DrizzleD1Database) { this.db = db; }

  async getUserContext(userId: string): Promise<string> {
    const user = await this.db.select().from(users).where(eq(users.id, userId)).get();

    // Fetch last 20 transactions for context
    const recentTransactions = await this.db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.date))
      .limit(20)
      .all();

    if (!user) return "No user data found.";

    let context = `User Name: ${user.name || 'User'}\n`;

    if (recentTransactions.length > 0) {
      context += "Recent Transactions:\n";
      recentTransactions.forEach((tx: any) => {
        context += `- ${tx.date}: ${tx.merchant} (${tx.category}) - $${(tx.amount / 100).toFixed(2)}\n`;
      });
    } else {
      context += "Financial Profile: No transactions recorded yet. Currently setting up initial account.";
    }

    // Append Cash Runway and Burn details if available
    try {
      const runway = await this.calculateRunwayAndBurn(userId);
      context += `\nFinancial Runway & Burn Analysis:\n`;
      context += `- Current Cash Balance: $${(runway.cashBalance / 100).toFixed(2)}\n`;
      context += `- Total Monthly Fixed Costs: $${(runway.fixedCosts.total / 100).toFixed(2)} (Payroll: $${(runway.fixedCosts.payroll / 100).toFixed(2)}, Subscriptions: $${(runway.fixedCosts.subscriptions / 100).toFixed(2)})\n`;
      context += `- Rolling Average Monthly Variable Spend: $${(runway.variableExpenses / 100).toFixed(2)}\n`;
      context += `- Rolling Average Monthly Revenue: $${(runway.monthlyRevenue / 100).toFixed(2)}\n`;
      context += `- Net Monthly Burn: $${(runway.netBurn / 100).toFixed(2)}\n`;
      context += `- Current Runway: ${runway.dataQuality === "missing" ? "Insufficient records" : runway.runwayMonths === "Infinite" ? "Recorded costs covered" : runway.runwayMonths + " Months"}\n`;
      context += `- Data quality: ${runway.dataQuality}. ${runway.assumptions.join(" ")}\n`;
      context += `- SaaS Starting MRR: $${(runway.startingMrr / 100).toFixed(2)}\n`;
      context += `- SaaS Monthly Churn Rate: ${(runway.churnRate / 100).toFixed(2)}%\n`;
    } catch (e) {
      console.warn("Could not calculate runway for context:", e);
    }

    return context;
  }

  async calculateRunwayAndBurn(userId: string): Promise<{
    cashBalance: number;
    fixedCosts: { payroll: number; subscriptions: number; total: number };
    variableExpenses: number;
    monthlyRevenue: number;
    netBurn: number;
    runwayMonths: number | "Infinite";
    projections: { month: string; balance: number }[];
    dataQuality: 'missing' | 'limited' | 'recorded';
    historyDays: number;
    assumptions: string[];
    startingMrr: number;
    churnRate: number;
    cac: number;
    arpu: number;
  }> {
    // 1. Fetch current total balance from financial accounts
    const accounts = await this.db
      .select()
      .from(financialAccounts)
      .where(eq(financialAccounts.userId, userId))
      .all();

    const cashBalance = accounts.filter(account => ['checking', 'savings', 'cash', 'money market'].includes(account.type) && account.currency === 'USD').reduce((sum, account) => sum + account.balance, 0);

    // 2. Fetch all employees and calculate monthly payroll
    const employeeList = await this.db
      .select()
      .from(employees)
      .where(eq(employees.userId, userId))
      .all();

    // Sum annual salaries of active/onboarding employees, convert to monthly cents
    const activeEmployees = employeeList.filter((emp: any) => emp.status === 'active' || emp.status === 'onboarding');
    const annualPayroll = activeEmployees.reduce((sum: number, emp: any) => sum + emp.salary, 0);
    let monthlyPayroll = Math.round(annualPayroll / 12);

    // 3. Fetch recent transactions to compute rolling variable expenses, subscription expenses, and revenue
    const txs = await this.db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.date))
      .all();

    let monthlySubscriptions = 0;
    let totalVariableExpenses = 0;
    let totalRevenue = 0;

    const now = Date.now();
    const ninetyDaysAgo = now - 90 * 24 * 60 * 60 * 1000;

    const recent = txs.filter(tx => tx.date.getTime() >= ninetyDaysAgo && tx.date.getTime() <= now);
    const historyDays = recent.length ? Math.min(90, Math.max(30, Math.ceil((now - Math.min(...recent.map(tx => tx.date.getTime()))) / 86400000))) : 0;
    let observedPayroll = 0;
    if (recent.length > 0) {
      recent.forEach((tx: any) => {
        const txDate = tx.date instanceof Date ? tx.date.getTime() : new Date(tx.date).getTime();

        // Parse transactions from the last 90 days for rolling metrics
        if (txDate >= ninetyDaysAgo && txDate <= now) {
          if (/^(transfer|funding|loan|credit card payment)$/i.test(tx.category)) return;
          const amount = tx.amount;

          if (amount < 0) {
            const absAmt = Math.abs(amount);
            const descLower = (tx.description || "").toLowerCase();
            const merchantLower = (tx.merchant || "").toLowerCase();
            if (/payroll|salary/i.test(tx.category + ' ' + descLower + ' ' + merchantLower) || /gusto|rippling/i.test(merchantLower)) { observedPayroll += absAmt; return; }
            const isRecurringKeyword = descLower.includes("subscription") ||
                                       descLower.includes("saas") ||
                                       descLower.includes("cloud") ||
                                       descLower.includes("license") ||
                                       merchantLower.includes("aws") ||
                                       merchantLower.includes("google workspace") ||
                                       merchantLower.includes("slack") ||
                                       merchantLower.includes("github") ||
                                       merchantLower.includes("zoom") ||
                                       merchantLower.includes("netflix") ||
                                       merchantLower.includes("figma") ||
                                       merchantLower.includes("vercel") ||
                                       tx.category === "Utilities" ||
                                       tx.category === "Insurance" ||
                                       tx.category === "Housing";

            if (isRecurringKeyword) {
              monthlySubscriptions += absAmt;
            } else {
              totalVariableExpenses += absAmt;
            }
          } else {
            totalRevenue += amount;
          }
        }
      });

      // Scale to 30 days
      const dayRange = historyDays;
      monthlySubscriptions = Math.round((monthlySubscriptions * 30) / dayRange);
      totalVariableExpenses = Math.round((totalVariableExpenses * 30) / dayRange);
      totalRevenue = Math.round((totalRevenue * 30) / dayRange);
      monthlyPayroll = Math.max(monthlyPayroll, Math.round(observedPayroll * 30 / dayRange));
    }

    // 4. Fetch SaaS Config and auto-detect recurring revenue
    let saasConfig = null;
    try {
      saasConfig = await this.db
        .select()
        .from(saasConfigs)
        .where(eq(saasConfigs.userId, userId))
        .get();
    } catch (e) {
      console.warn("Could not fetch saasConfig, table might not exist in D1 yet:", e);
    }

    let startingMrr = 0;
    let churnRate = 0;
    let cac = 0;
    let arpu = 0;

    if (saasConfig) {
      startingMrr = saasConfig.startingMrr;
      churnRate = saasConfig.churnRate;
      cac = saasConfig.cac;
      arpu = saasConfig.arpu;
    }

    const totalFixedCosts = monthlyPayroll + monthlySubscriptions;
    const nonRecurringRevenue = Math.max(0, totalRevenue - startingMrr);

    // 5. Generate Projections for the next 12 months with SaaS metrics
    const projections = [];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    let currentProjBalance = cashBalance;
    const currentMonthIdx = new Date().getMonth();

    // Month 0
    projections.push({
      month: monthNames[currentMonthIdx],
      balance: Math.round(currentProjBalance)
    });

    let currentMrr = startingMrr;

    for (let i = 1; i <= 12; i++) {
      const monthIdx = (currentMonthIdx + i) % 12;
      const monthLabel = monthNames[monthIdx];

      // Decaying MRR month-over-month
      currentMrr = Math.round(currentMrr * (1 - churnRate / 10000));

      const projectedRevenue = currentMrr + nonRecurringRevenue;
      const projectedExpenses = totalFixedCosts + totalVariableExpenses;
      const monthNetBurn = projectedExpenses - projectedRevenue;

      currentProjBalance -= monthNetBurn;
      if (currentProjBalance < 0) {
        currentProjBalance = 0;
      }

      projections.push({
        month: monthLabel,
        balance: Math.round(currentProjBalance)
      });
    }

    const netBurn = totalFixedCosts + totalVariableExpenses - Math.max(totalRevenue, startingMrr);

    // 6. Calculate Runway in Months
    let runwayMonths: number | "Infinite" = "Infinite";
    if (netBurn > 0) {
      runwayMonths = parseFloat((cashBalance / netBurn).toFixed(1));
    }

    return {
      cashBalance,
      dataQuality: !accounts.length || (!recent.length && !monthlyPayroll && !saasConfig) ? 'missing' : historyDays < 90 ? 'limited' : 'recorded',
      historyDays,
      assumptions: [`Monthly averages use ${historyDays || 0} days of recorded transactions.`, 'Cash excludes credit and investment accounts. Unrecorded costs are excluded.', 'MRR and churn use your explicit SaaS settings; they are not inferred from deposits.'],
      fixedCosts: {
        payroll: monthlyPayroll,
        subscriptions: monthlySubscriptions,
        total: totalFixedCosts
      },
      variableExpenses: totalVariableExpenses,
      monthlyRevenue: totalRevenue,
      netBurn,
      runwayMonths,
      projections,
      startingMrr,
      churnRate,
      cac,
      arpu
    };
  }

  async getFinancialAdvice(userId: string, gemini: any): Promise<string> {
    const context = await this.getUserContext(userId);
    const prompt = "Based on my financial profile, give me one short, actionable piece of advice for today.";

    return gemini.generateResponse(prompt, context);
  }

  async categorizeTransaction(merchant: string, description: string, gemini: any): Promise<string> {
    const categories = [
      "Housing", "Transport", "Food", "Utilities", "Insurance", "Healthcare",
      "Savings", "Personal", "Entertainment", "Income", "Other"
    ];
    const prompt = `Categorize this transaction into one of these: ${categories.join(", ")}.
    Merchant: ${merchant}
    Description: ${description}
    Respond with ONLY the category name.`;

    const category = await gemini.generateResponse(prompt);
    const trimmed = category.trim();

    return categories.includes(trimmed) ? trimmed : "Other";
  }

  getUserContextEffect(userId: string) {
    return Effect.tryPromise({
      try: () => this.getUserContext(userId),
      catch: (cause) => new DatabaseError({ message: "Failed to generate user context from database", cause }),
    });
  }

  calculateRunwayAndBurnEffect(userId: string) {
    return Effect.tryPromise({
      try: () => this.calculateRunwayAndBurn(userId),
      catch: (cause) => new DatabaseError({ message: "Failed to calculate runway and burn analysis", cause }),
    });
  }
}

