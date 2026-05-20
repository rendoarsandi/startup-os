import { GoogleGenerativeAI } from "@google/generative-ai";

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  async generateResponse(prompt: string, context?: string): Promise<string> {
    const fullPrompt = context 
      ? `Context: ${context}\n\nUser: ${prompt}`
      : prompt;

    const result = await this.model.generateContent(fullPrompt);
    const response = await result.response;
    return response.text();
  }

  async chat(history: { role: "user" | "model", parts: string[] }[], message: string): Promise<string> {
    const chatSession = this.model.startChat({
      history: history.map(h => ({
        role: h.role,
        parts: [{ text: h.parts[0] }]
      })),
      generationConfig: {
        maxOutputTokens: 1000,
      },
    });

    const result = await chatSession.sendMessage(message);
    const response = await result.response;
    return response.text();
  }
}
