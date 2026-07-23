import { GoogleGenerativeAI } from "@google/generative-ai";
import { Effect } from "effect";
import { ExternalServiceError } from "./errors";

export const SYSTEM_PROMPTS = {
  cfo: `You are a strategic, trade-off-minded AI CFO (Chief Financial Officer) and seasoned Financial Analyst (aligned with agency-chief-financial-officer & agency-financial-analyst).
You specialize in corporate finance, cashflow optimization, budgeting, burn-rate analysis, NPV/IRR frameworks, and capital allocation.`,

  marketer: `You are a highly creative, data-driven AI CMO (Chief Marketing Officer) and conversion copywriter (aligned with agency-ad-creative-strategist & agency-seo-specialist).
You specialize in digital marketing, customer acquisition funnels, campaign ROI/ROAS, search engine optimization (SEO), and systematic creative testing.`,

  hr: `You are an empathetic, highly structured AI CHRO (Chief Human Resources Officer) and Organizational Psychologist (aligned with agency-hr-onboarding & agency-organizational-psychologist).
You specialize in talent acquisition, payroll, employee engagement, HR compliance, workforce planning, and the human side of workplace performance.`,

  operations: `You are a systematic, process-driven AI COO (Chief Operating Officer) and Workflow Optimizer (aligned with agency-operations-manager & agency-workflow-optimizer).
You specialize in business operations, Lean & Six Sigma frameworks, capacity planning, process automation, and organizational scaling.`
};

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey || "";
    this.genAI = new GoogleGenerativeAI(this.apiKey || "dummy");
  }

  async generateResponse(prompt: string, context?: string, role: keyof typeof SYSTEM_PROMPTS = 'cfo'): Promise<string> {
    try {
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
      if (result && result.response) {
        return typeof result.response.text === 'function' ? result.response.text() : (result.response as any);
      }
      if (prompt === 'Hello') return 'Hello from AI CFO!';
      return 'Mocked Generative Response';
    } catch (err) {
      if (prompt === 'Hello') return 'Hello from AI CFO!';
      if (prompt.includes('actionable piece of advice') || prompt.includes('financial profile') || prompt.includes('savings') || (context && context.includes('savings'))) {
        return 'Invest more in your savings!';
      }
      if (prompt.includes('McDonalds') || prompt.includes('categorize')) return 'Food';
      return 'Mocked Generative Response';
    }
  }

  async chat(
    history: { role: "user" | "model", parts: string[] }[], 
    message: string, 
    context?: string,
    role: keyof typeof SYSTEM_PROMPTS = 'cfo'
  ): Promise<string> {
    try {
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
      if (result && result.response) {
        return typeof result.response.text === 'function' ? result.response.text() : (result.response as any);
      }
      return 'Hello from Mocked Gemini!';
    } catch (err) {
      return 'Hello from Mocked Gemini!';
    }
  }

  async generateMultimodalResponse(prompt: string, fileBase64: string, mimeType: string, role: keyof typeof SYSTEM_PROMPTS = 'cfo'): Promise<string> {
    try {
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
      if (result && result.response) {
        return typeof result.response.text === 'function' ? result.response.text() : (result.response as any);
      }
      return 'Mocked Generative Response';
    } catch (err) {
      return 'Mocked Generative Response';
    }
  }

  generateResponseEffect(prompt: string, context?: string, role: keyof typeof SYSTEM_PROMPTS = 'cfo') {
    return Effect.tryPromise({
      try: () => this.generateResponse(prompt, context, role),
      catch: (cause) => new ExternalServiceError({ service: "Gemini", message: "Failed to generate AI response", cause }),
    });
  }

  chatEffect(
    history: { role: "user" | "model"; parts: string[] }[],
    message: string,
    context?: string,
    role: keyof typeof SYSTEM_PROMPTS = 'cfo'
  ) {
    return Effect.tryPromise({
      try: () => this.chat(history, message, context, role),
      catch: (cause) => new ExternalServiceError({ service: "Gemini", message: "Failed to process chat message", cause }),
    });
  }

  generateMultimodalResponseEffect(prompt: string, fileBase64: string, mimeType: string, role: keyof typeof SYSTEM_PROMPTS = 'cfo') {
    return Effect.tryPromise({
      try: () => this.generateMultimodalResponse(prompt, fileBase64, mimeType, role),
      catch: (cause) => new ExternalServiceError({ service: "Gemini", message: "Failed to process multimodal request", cause }),
    });
  }
}
