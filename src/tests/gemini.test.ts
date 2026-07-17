import { expect, test, describe, vi } from 'vitest';
import { GeminiService } from '../server/gemini';

vi.mock('@google/generative-ai', () => {
  const mockGenerateContent = vi.fn().mockResolvedValue({
    response: {
      text: () => 'Hello from AI CFO!',
    },
  });
  
  const mockGetGenerativeModel = vi.fn().mockReturnValue({
    generateContent: mockGenerateContent,
  });

  return {
    GoogleGenerativeAI: class {
      getGenerativeModel = mockGetGenerativeModel;
    },
  };
});

describe('Gemini Service', () => {
  test('generateResponse returns a string from mocked GoogleGenerativeAI SDK', async () => {
    const service = new GeminiService('test-key');
    const response = await service.generateResponse('Hello');
    expect(response).toBe('Hello from AI CFO!');
  });
});
