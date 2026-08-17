import { action } from '../runtime/core';
import { GeminiService } from '../gemini';

export const sendMessage = action({
  handler: async (ctx, args: { message: string; role?: string; context?: any }) => {
    if (!args.message) {
      throw new Error('Message is required');
    }

    const apiKey = ctx.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        response: 'AI Service is currently operating in offline mode. Configure GEMINI_API_KEY to enable live intelligence.',
      };
    }

    const gemini = new GeminiService(apiKey);
    const rolePrompt = args.role
      ? `You are the ${args.role.toUpperCase()} of this startup. Respond from this executive perspective.`
      : 'You are the Autonomous C-Suite Executive Assistant for this startup.';

    const systemPrompt = `${rolePrompt} Provide concise, strategic, actionable operational advice.`;
    const response = await gemini.chat([], args.message, systemPrompt, (args.role as any) || 'cfo');

    return { response };
  },
});
