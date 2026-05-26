import { GoogleGenerativeAI } from "@google/generative-ai";

export const SYSTEM_PROMPTS = {
  cfo: `You are a brilliant, hyper-analytical AI CFO (Chief Financial Officer). You specialize in corporate finance, cashflow optimization, budgeting, burn-rate analysis, and providing strategic financial advice based on historical transactions and account balances. Keep your responses highly precise, professional, and numbers-focused.`,
  marketer: `You are a creative, data-driven AI CMO (Chief Marketing Officer). You specialize in digital marketing, customer acquisition funnels, campaign ROI calculation, search engine optimization (SEO), social media strategy, brand building, and creating copy concepts. You analyze marketing spends and provide growth tactics. Keep your responses engaging, strategic, and focused on marketing ROI and user acquisition.`,
  hr: `You are an empathetic, highly structured AI CHRO (Chief Human Resources Officer) and HR expert. You specialize in talent acquisition, payroll administration, employee engagement, HR policy compliance, benefits, workforce planning, and career pathing. You assist in drafting professional job descriptions, employee offer letters, and policy documents. Keep your responses professional, supportive, compliant, and well-structured.`
};

export class GeminiService {
  private genAI: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async generateResponse(prompt: string, context?: string, role: keyof typeof SYSTEM_PROMPTS = 'cfo'): Promise<string> {
    const modelWithSystem = this.genAI.getGenerativeModel({ 
      model: "gemini-3.5-flash",
      systemInstruction: SYSTEM_PROMPTS[role] || SYSTEM_PROMPTS.cfo,
      generationConfig: {
        serviceTier: "flex",
        thinkingConfig: {
          thinkingLevel: "MEDIUM"
        }
      } as any
    });

    const fullPrompt = context 
      ? `Context: ${context}\n\nUser: ${prompt}`
      : prompt;

    const result = await modelWithSystem.generateContent(fullPrompt);
    const response = await result.response;
    return response.text();
  }

  async chat(
    history: { role: "user" | "model", parts: string[] }[], 
    message: string, 
    context?: string,
    role: keyof typeof SYSTEM_PROMPTS = 'cfo'
  ): Promise<string> {
    const modelWithSystem = this.genAI.getGenerativeModel({ 
      model: "gemini-3.5-flash",
      systemInstruction: SYSTEM_PROMPTS[role] || SYSTEM_PROMPTS.cfo,
      generationConfig: {
        serviceTier: "flex",
        thinkingConfig: {
          thinkingLevel: "MEDIUM"
        }
      } as any
    });

    const chatSession = modelWithSystem.startChat({
      history: history.map(h => ({
        role: h.role,
        parts: [{ text: h.parts[0] }]
      })),
      generationConfig: {
        maxOutputTokens: 1000,
      },
    });

    const contextPrefix = role === 'marketer' 
      ? '[Marketing Context]' 
      : role === 'hr' 
      ? '[HR / Employee Context]' 
      : '[Financial Context]';

    const finalMessage = context 
      ? `${contextPrefix}\n${context}\n\n[User Message]\n${message}`
      : message;

    const result = await chatSession.sendMessage(finalMessage);
    const response = await result.response;
    return response.text();
  }

  async generateMultimodalResponse(prompt: string, fileBase64: string, mimeType: string, role: keyof typeof SYSTEM_PROMPTS = 'cfo'): Promise<string> {
    const modelWithSystem = this.genAI.getGenerativeModel({ 
      model: "gemini-3.5-flash",
      systemInstruction: SYSTEM_PROMPTS[role] || SYSTEM_PROMPTS.cfo,
      generationConfig: {
        serviceTier: "flex",
        thinkingConfig: {
          thinkingLevel: "MEDIUM"
        }
      } as any
    });

    const filePart = {
      inlineData: {
        data: fileBase64,
        mimeType: mimeType
      }
    };

    const result = await modelWithSystem.generateContent([prompt, filePart]);
    const response = await result.response;
    return response.text();
  }
}

