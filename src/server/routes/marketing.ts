import { eq, and, desc } from 'drizzle-orm';
import { crmLeads, marketingCampaigns } from '../../db/schema';
import { GeminiService } from '../gemini';
import { v4 as uuidv4 } from 'uuid';
import { decodeCrmLead, decodeCreateCampaign, decodeGenerateIdeas } from '../schemas';
import { getValidatedBody, jsonResponse, matchRoute } from '../utils';

export async function handleMarketingRoutes(request: Request, path: string, method: string, db: any, userId: string, env: any): Promise<Response | null> {
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

  return null;
}
