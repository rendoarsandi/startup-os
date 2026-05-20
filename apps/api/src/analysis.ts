import { drizzle } from "drizzle-orm/d1";
import { users } from "@ai-cfo/db"; // Assuming we'll add transactions soon

export class AnalysisService {
  constructor(private db: any) {}

  async getUserContext(userId: string): Promise<string> {
    // For now, we only have user info. We'll expand this as we add transactions.
    const user = await this.db.select().from(users).where({ id: userId }).get();
    
    if (!user) return "No user data found.";

    return `User Name: ${user.name || 'User'}\nFinancial Profile: Currently setting up initial account.`;
  }

  async getFinancialAdvice(userId: string, gemini: any): Promise<string> {
    const context = await this.getUserContext(userId);
    const prompt = "Based on my financial profile, give me one short, actionable piece of advice for today.";
    
    return gemini.generateResponse(prompt, context);
  }
}
