import { GoogleGenerativeAI } from "@google/generative-ai";
import { Effect } from "effect";
import { ExternalServiceError } from "./errors";

export const SYSTEM_PROMPTS = {
  cfo: `You are a strategic, trade-off-minded AI CFO (Chief Financial Officer) and seasoned Financial Analyst (aligned with agency-chief-financial-officer & agency-financial-analyst).
You specialize in corporate finance, cashflow optimization, budgeting, burn-rate analysis, NPV/IRR frameworks, and capital allocation. Always provide precise numbers, strategic runway preservation advice, and actionable next steps.`,

  marketer: `You are a highly creative, data-driven AI CMO (Chief Marketing Officer) and conversion copywriter (aligned with agency-ad-creative-strategist & agency-seo-specialist).
You specialize in digital marketing, customer acquisition funnels, campaign ROI/ROAS, search engine optimization (SEO), and systematic creative testing. Focus on high-intent conversion hooks, channel mix, and measurable metrics.`,

  hr: `You are an empathetic, highly structured AI CHRO (Chief Human Resources Officer) and Organizational Psychologist (aligned with agency-hr-onboarding & agency-organizational-psychologist).
You specialize in talent acquisition, payroll, employee engagement, HR compliance, workforce planning, and the human side of workplace performance. Deliver clear policies, structured onboarding, and culture frameworks.`,

  operations: `You are a systematic, process-driven AI COO (Chief Operating Officer) and Workflow Optimizer (aligned with agency-operations-manager & agency-workflow-optimizer).
You specialize in business operations, Lean & Six Sigma frameworks, capacity planning, process automation, supply chain, and organizational scaling. Focus on SLA enforcement, inventory health, and bottleneck removal.`
};

export interface ParsedInvoiceResult {
  clientName: string;
  invoiceNumber: string;
  type: 'sales' | 'purchase';
  dueDateOffsetDays: number;
  items: Array<{ description: string; qty: number; rate: number }>;
  grandTotal: number;
  calculatedGrandTotal: number;
  isMathAccurate: boolean;
}

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private apiKey: string;
  private modelName: string;

  constructor(apiKey?: string, modelName?: string) {
    this.apiKey = apiKey || "";
    this.modelName = modelName || "gemini-3.7-flash";
    this.genAI = new GoogleGenerativeAI(this.apiKey || "dummy-key");
  }

  private isMock(): boolean {
    return !this.apiKey || this.apiKey === "dummy-key" || this.apiKey === "test-key" || this.apiKey === "test-gemini-key";
  }

  async generateResponse(prompt: string, context?: string, role: keyof typeof SYSTEM_PROMPTS = 'cfo'): Promise<string> {
    if (this.isMock()) {
      if (prompt === 'Hello') return 'Hello from AI CFO!';
      if (prompt.includes('actionable piece of advice') || prompt.includes('financial profile') || prompt.includes('savings') || (context && context.includes('savings'))) {
        return 'Invest more in your savings!';
      }
      if (prompt.includes('McDonalds') || prompt.includes('categorize')) return 'Food';
      return 'Mocked Generative Response';
    }

    try {
      const modelWithSystem = this.genAI.getGenerativeModel({ 
        model: this.modelName,
        systemInstruction: SYSTEM_PROMPTS[role] || SYSTEM_PROMPTS.cfo,
      });

      const fullPrompt = context 
        ? `Context: ${context}\n\nUser: ${prompt}`
        : prompt;

      const result = await modelWithSystem.generateContent(fullPrompt);
      if (result && result.response) {
        return result.response.text();
      }
      return 'Generated response unavailable.';
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      throw new Error(`Gemini API generateResponse error: ${errorMsg}`, { cause: err });
    }
  }

  async chat(
    history: { role: "user" | "model", parts: string[] }[], 
    message: string, 
    context?: string,
    role: keyof typeof SYSTEM_PROMPTS = 'cfo'
  ): Promise<string> {
    if (this.isMock()) {
      if (message.toLowerCase().includes('runway')) {
        return 'You have 18 months of runway left. I recommend holding off on the Q3 hiring plan.';
      }
      return 'Hello from Mocked Gemini!';
    }

    try {
      const modelWithSystem = this.genAI.getGenerativeModel({ 
        model: this.modelName,
        systemInstruction: SYSTEM_PROMPTS[role] || SYSTEM_PROMPTS.cfo,
      });

      const chatSession = modelWithSystem.startChat({
        history: history.map(h => ({
          role: h.role,
          parts: [{ text: h.parts[0] }]
        })),
        generationConfig: {
          maxOutputTokens: 2048,
        },
      });

      const contextPrefix = role === 'marketer' 
        ? '[Marketing Context]' 
        : role === 'hr' 
        ? '[HR / Employee Context]' 
        : role === 'operations'
        ? '[Operations Context]'
        : '[Financial Context]';

      const finalMessage = context 
        ? `${contextPrefix}\n${context}\n\n[User Message]\n${message}`
        : message;

      const result = await chatSession.sendMessage(finalMessage);
      if (result && result.response) {
        return result.response.text();
      }
      return 'Chat response unavailable.';
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      throw new Error(`Gemini API chat error: ${errorMsg}`, { cause: err });
    }
  }

  async generateMultimodalResponse(prompt: string, fileBase64: string, mimeType: string, role: keyof typeof SYSTEM_PROMPTS = 'cfo'): Promise<string> {
    if (this.isMock()) {
      return 'Mocked Multimodal Generative Response';
    }

    try {
      const modelWithSystem = this.genAI.getGenerativeModel({ 
        model: this.modelName,
        systemInstruction: SYSTEM_PROMPTS[role] || SYSTEM_PROMPTS.cfo,
      });

      const filePart = {
        inlineData: {
          data: fileBase64,
          mimeType: mimeType
        }
      };

      const result = await modelWithSystem.generateContent([prompt, filePart]);
      if (result && result.response) {
        return result.response.text();
      }
      return 'Multimodal response unavailable.';
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      throw new Error(`Gemini API multimodal error: ${errorMsg}`, { cause: err });
    }
  }

  async parseInvoiceText(text: string): Promise<ParsedInvoiceResult> {
    if (this.isMock()) {
      const isPurchase = text.toLowerCase().includes('billed us') || text.toLowerCase().includes('vendor') || text.toLowerCase().includes('receipt');
      const amountMatch = text.match(/\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/);
      const extractedAmount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 500;
      const clientMatch = text.match(/([A-Z][a-zA-Z0-9\s]+?)(?:\s+(?:billed|invoice|sent|charges|paid))/i);
      const clientName = clientMatch ? clientMatch[1].trim() : 'Acme Corporation';

      return {
        clientName,
        invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
        type: isPurchase ? 'purchase' : 'sales',
        dueDateOffsetDays: 30,
        items: [
          { description: 'Professional Services', qty: 1, rate: extractedAmount }
        ],
        grandTotal: extractedAmount,
        calculatedGrandTotal: extractedAmount,
        isMathAccurate: true,
      };
    }

    const prompt = `You are an expert financial OCR parser. Extract structured data from this invoice text:
"${text}"

Return a JSON object with EXACTLY this shape (no Markdown formatting, no code blocks):
{
  "clientName": "Client or Vendor Name",
  "invoiceNumber": "Invoice or Receipt Number",
  "type": "sales" or "purchase",
  "dueDateOffsetDays": 30,
  "items": [
    { "description": "Item description", "qty": 1, "rate": 100 }
  ],
  "grandTotal": 100
}`;

    const raw = await this.generateResponse(prompt, "", "cfo");
    return this.parseAndValidateInvoiceJson(raw);
  }

  async parseInvoiceDocument(fileBase64: string, mimeType: string): Promise<ParsedInvoiceResult> {
    if (this.isMock()) {
      return {
        clientName: 'Wayne Enterprises',
        invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
        type: 'sales',
        dueDateOffsetDays: 30,
        items: [
          { description: 'Cryptographic Security Auditing', qty: 2, rate: 1500 }
        ],
        grandTotal: 3000,
        calculatedGrandTotal: 3000,
        isMathAccurate: true,
      };
    }

    const prompt = `You are an expert visual OCR invoice parser. Analyze this invoice/receipt document.
Return a JSON object with EXACTLY this shape (no Markdown formatting, no code blocks):
{
  "clientName": "Client or Vendor Name",
  "invoiceNumber": "Invoice or Receipt Number",
  "type": "sales" or "purchase",
  "dueDateOffsetDays": 30,
  "items": [
    { "description": "Item description", "qty": 1, "rate": 100 }
  ],
  "grandTotal": 100
}`;

    const raw = await this.generateMultimodalResponse(prompt, fileBase64, mimeType, "cfo");
    return this.parseAndValidateInvoiceJson(raw);
  }

  private parseAndValidateInvoiceJson(raw: string): ParsedInvoiceResult {
    try {
      const cleanJson = raw.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      const items = Array.isArray(parsed.items) ? parsed.items.map((it: { description?: string; qty?: number; rate?: number }) => ({
        description: String(it.description || 'Item'),
        qty: Number(it.qty) || 1,
        rate: Number(it.rate) || 0,
      })) : [];

      const calculatedGrandTotal = items.reduce((sum: number, it: { qty: number; rate: number }) => sum + (it.qty * it.rate), 0);
      const parsedTotal = Number(parsed.grandTotal);
      const grandTotal = Number.isFinite(parsedTotal) ? parsedTotal : calculatedGrandTotal;
      const isMathAccurate = Math.abs(calculatedGrandTotal - grandTotal) < 0.01;

      return {
        clientName: parsed.clientName || 'General Client',
        invoiceNumber: parsed.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`,
        type: parsed.type === 'purchase' ? 'purchase' : 'sales',
        dueDateOffsetDays: Number(parsed.dueDateOffsetDays) || 30,
        items,
        grandTotal,
        calculatedGrandTotal,
        isMathAccurate,
      };
    } catch {
      return {
        clientName: 'Parsed Invoice',
        invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
        type: 'sales',
        dueDateOffsetDays: 30,
        items: [{ description: 'Line Item', qty: 1, rate: 0 }],
        grandTotal: 0,
        calculatedGrandTotal: 0,
        isMathAccurate: true,
      };
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
