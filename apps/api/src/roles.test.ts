import { expect, test, describe, vi } from 'vitest';
import app from './index';

vi.mock('./gemini', () => {
  return {
    GeminiService: class {
      chat = vi.fn().mockResolvedValue('Hello from Mocked Gemini!');
      generateResponse = vi.fn().mockResolvedValue('Mocked Generative Response');
    }
  };
});

describe('Multi-Role Executive API Endpoints', () => {
  const mockEnv = {
    GEMINI_API_KEY: 'test-key',
    DB: {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        all: vi.fn().mockResolvedValue([]),
        get: vi.fn().mockResolvedValue(null),
        raw: vi.fn().mockResolvedValue([]),
        run: vi.fn().mockResolvedValue({ success: true }),
      }),
    },
  } as any;

  test('POST /api/chat supports marketer role', async () => {
    const res = await app.request('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'Hello Marketer', role: 'marketer' }),
      headers: { 'Content-Type': 'application/json' },
    }, mockEnv);

    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.response).toBe('Hello from Mocked Gemini!');
  });

  test('POST /api/chat supports hr role', async () => {
    const res = await app.request('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'Hello HR', role: 'hr' }),
      headers: { 'Content-Type': 'application/json' },
    }, mockEnv);

    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.response).toBe('Hello from Mocked Gemini!');
  });

  test('GET /api/marketing/campaigns returns campaigns', async () => {
    const res = await app.request('/api/marketing/campaigns', {
      method: 'GET',
    }, mockEnv);

    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]).toHaveProperty('name');
  });

  test('POST /api/marketing/campaigns adds/updates campaign', async () => {
    const res = await app.request('/api/marketing/campaigns', {
      method: 'POST',
      body: JSON.stringify({ name: 'New Ad Campaign', budget: 100000 }),
      headers: { 'Content-Type': 'application/json' },
    }, mockEnv);

    expect(res.status).toBe(201);
    const data = await res.json() as any;
    expect(data.name).toBe('New Ad Campaign');
    expect(data.budget).toBe(100000);
  });

  test('POST /api/marketing/generate-ideas returns ideas from Gemini', async () => {
    const res = await app.request('/api/marketing/generate-ideas', {
      method: 'POST',
      body: JSON.stringify({ productDescription: 'A Cool App', targetAudience: 'Teens' }),
      headers: { 'Content-Type': 'application/json' },
    }, mockEnv);

    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.ideas).toBe('Mocked Generative Response');
  });

  test('GET /api/hr/employees returns employee roster', async () => {
    const res = await app.request('/api/hr/employees', {
      method: 'GET',
    }, mockEnv);

    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]).toHaveProperty('role');
  });

  test('POST /api/hr/employees adds/updates employee', async () => {
    const res = await app.request('/api/hr/employees', {
      method: 'POST',
      body: JSON.stringify({ name: 'Frank Ocean', role: 'Musician', department: 'Arts', salary: 20000000 }),
      headers: { 'Content-Type': 'application/json' },
    }, mockEnv);

    expect(res.status).toBe(201);
    const data = await res.json() as any;
    expect(data.name).toBe('Frank Ocean');
    expect(data.salary).toBe(20000000);
  });

  test('POST /api/hr/generate-doc returns generated document from Gemini', async () => {
    const res = await app.request('/api/hr/generate-doc', {
      method: 'POST',
      body: JSON.stringify({ docType: 'offer_letter', title: 'Developer', department: 'Engineering', salary: '$100,000' }),
      headers: { 'Content-Type': 'application/json' },
    }, mockEnv);

    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.document).toBe('Mocked Generative Response');
  });
});
