// @vitest-environment node
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { createTestContext, TestContext } from './mocks/doTestHarness';
import { api } from '../server/functions';

vi.mock('../server/gemini', () => ({
  GeminiService: class {
    chat = vi.fn().mockResolvedValue('Based on your SaaS metrics, you have 18 months of runway.')
  }
}));

describe('Convex-Style AI Chat Action Tests', () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = createTestContext();
  });

  test('sendMessage returns structured AI response', async () => {
    const result = await ctx.action(api.chat.sendMessage, {
      message: 'What is my current runway?',
      role: 'cfo',
    });

    expect(result).toBeDefined();
    expect(result.response).toContain('18 months of runway');
  });
});
