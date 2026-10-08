import type { DrizzleD1Database } from 'drizzle-orm/d1';
import type { AppEnv } from '../env';
import { eq } from 'drizzle-orm';
import { marketingCampaigns, employees, projects, projectTasks, supportTickets, workspaceSettings } from '../../db/schema';
import { createAIService } from '../ai';
import { AnalysisService } from '../analysis';
import { decodeChat } from '../schemas';
import { getValidatedBody, jsonResponse } from '../utils';

export async function handleChatRoutes(request: Request, path: string, method: string, db: DrizzleD1Database, userId: string, env: AppEnv): Promise<Response | null> {
  if (path === '/api/chat' && method === 'POST') {
    const gemini = createAIService(env);
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
        context = `Marketing Profile:\nActive Campaigns:\n` + (dbCampaigns.length > 0 ? dbCampaigns.map(c => `- ${c.name} (${c.status}): Budget $${((c.budget || 0)/100).toFixed(2)}, Spend $${((c.spend || 0)/100).toFixed(2)}, ROAS ${((c.roas || 0)/100).toFixed(1)}x`).join('\n') : '- No active campaigns') + `\n\nAsk for the company goals and target CAC if they have not been recorded.`;
      } catch (_dbError) {
        context = `Marketing Profile:\nAsk for the company goals and target CAC if they have not been recorded.`;
      }
    } else if (role === 'hr') {
      try {
        const dbEmployees = await db.select().from(employees).where(eq(employees.userId, userId)).all();
        context = `HR & People Profile:\nTotal Employees: ${dbEmployees.length}\nActive Staff:\n` + (dbEmployees.length > 0 ? dbEmployees.map(e => `- ${e.name}: ${e.role} (${e.department}) - $${((e.salary || 0)/100).toFixed(2)}/yr`).join('\n') : '- No active employees') + `\n\nNo hiring targets recorded.`;
      } catch (_dbError) {
        context = `HR & People Profile:\nNo hiring targets recorded.`;
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
      } catch (_dbError) {
        context = `Operations & Inventory Profile:\nRecords could not be loaded. State that operations data is unavailable.`;
      }
    }

    const settings = await db.select().from(workspaceSettings).where(eq(workspaceSettings.userId, userId)).get();
    if (settings) context = `Company: ${settings.companyName}\nCompany context: ${settings.companyDescription}\n\n${context}`;
    const response = await gemini.chat(history || [], message, context, role || 'cfo');
    return jsonResponse({ response });
  }

  return null;
}
