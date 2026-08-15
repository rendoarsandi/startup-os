import { expect, test, describe, vi } from 'vitest';
import { GeminiService } from '../server/gemini';

vi.mock('@google/generative-ai', () => {
  const mockGenerateContent = vi.fn().mockResolvedValue({
    response: {
      text: () => 'Hello from AI CFO!',
    },
  });

  const mockStartChat = vi.fn().mockReturnValue({
    sendMessage: vi.fn().mockResolvedValue({
      response: {
        text: () => 'You have 18 months of runway left.',
      },
    }),
  });
  
  const mockGetGenerativeModel = vi.fn().mockReturnValue({
    generateContent: mockGenerateContent,
    startChat: mockStartChat,
  });

  return {
    GoogleGenerativeAI: class {
      getGenerativeModel = mockGetGenerativeModel;
    },
  };
});

describe('Gemini Service (gemini-3.7-flash)', () => {
  test('generateResponse returns a string from GoogleGenerativeAI SDK', async () => {
    const service = new GeminiService('test-key', 'gemini-3.7-flash');
    const response = await service.generateResponse('Hello');
    expect(response).toBe('Hello from AI CFO!');
  });

  test('chat method processes conversational history and context', async () => {
    const service = new GeminiService('test-key', 'gemini-3.7-flash');
    const response = await service.chat([], 'What is my runway?', 'Monthly spend is $10k');
    expect(response).toContain('runway');
  });

  test('parseInvoiceText parses text and validates math accuracy', async () => {
    const service = new GeminiService('test-key');
    const result = await service.parseInvoiceText('Acme Corp billed us $1,250 for consulting');
    expect(result.clientName).toBe('Acme Corp');
    expect(result.grandTotal).toBe(1250);
    expect(result.calculatedGrandTotal).toBe(1250);
    expect(result.isMathAccurate).toBe(true);
  });

  test('parseInvoiceDocument extracts structured invoice from multimodal document', async () => {
    const service = new GeminiService('test-key');
    const result = await service.parseInvoiceDocument('base64...', 'application/pdf');
    expect(result.clientName).toBe('Wayne Enterprises');
    expect(result.grandTotal).toBe(3000);
    expect(result.items.length).toBeGreaterThan(0);
  });
});
