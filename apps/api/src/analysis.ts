import { users, transactions } from "@ai-cfo/db";
import { eq, desc } from "drizzle-orm";

export class AnalysisService {
  constructor(private db: any) {}

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

    return context;
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
}
