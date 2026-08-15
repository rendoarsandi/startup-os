import { expect, test, describe, vi } from 'vitest';
import { handleApiRequest } from '../server/dispatcher';

vi.mock('../server/gemini', () => {
  return {
    GeminiService: class {
      chat = vi.fn().mockResolvedValue('Hello from Mocked Gemini!');
      generateResponse = vi.fn().mockResolvedValue('Mocked Generative Response');
    }
  };
});

interface RoleTestEnv {
  GEMINI_API_KEY?: string;
  DB?: any;
}

describe('Multi-Role Executive API Endpoints', () => {
  const mockEnv: RoleTestEnv = {
    GEMINI_API_KEY: 'test-key',
    DB: {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        all: vi.fn().mockResolvedValue({ results: [] }),
        get: vi.fn().mockResolvedValue(null),
        raw: vi.fn().mockResolvedValue([]),
        run: vi.fn().mockResolvedValue({ success: true }),
      }),
    },
  };

  test('POST /api/chat supports marketer role', async () => {
    const res = await handleApiRequest(new Request('http://localhost' + '/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'Hello Marketer', role: 'marketer' }),
      headers: { 'Content-Type': 'application/json' },
    }), mockEnv);

    expect(res.status).toBe(200);
    // SAFETY: Chat endpoint returns response string payload
    const data = (await res.json()) as { response: string };
    expect(data.response).toBe('Hello from Mocked Gemini!');
  });

  test('POST /api/chat supports hr role', async () => {
    const res = await handleApiRequest(new Request('http://localhost' + '/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'Hello HR', role: 'hr' }),
      headers: { 'Content-Type': 'application/json' },
    }), mockEnv);

    expect(res.status).toBe(200);
    // SAFETY: Chat endpoint returns response string payload
    const data = (await res.json()) as { response: string };
    expect(data.response).toBe('Hello from Mocked Gemini!');
  });

  test('POST /api/chat supports operations role', async () => {
    const res = await handleApiRequest(new Request('http://localhost' + '/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'Hello Operations', role: 'operations' }),
      headers: { 'Content-Type': 'application/json' },
    }), mockEnv);

    expect(res.status).toBe(200);
    // SAFETY: Chat endpoint returns response string payload
    const data = (await res.json()) as { response: string };
    expect(data.response).toBe('Hello from Mocked Gemini!');
  });

  test('GET /api/marketing/campaigns returns campaigns', async () => {
    const mockEnvWithCampaigns: RoleTestEnv = {
      ...mockEnv,
      DB: {
        prepare: vi.fn().mockReturnValue({
          bind: vi.fn().mockReturnThis(),
          all: vi.fn().mockResolvedValue({ results: [] }),
          raw: vi.fn().mockResolvedValue([['mc-1', 'test-user', 'Mock Campaign', 'active', 500000, 0, 0, 0, new Date().toISOString(), new Date().toISOString()]]),
          get: vi.fn().mockResolvedValue(null),
          run: vi.fn().mockResolvedValue({ success: true }),
        }),
      },
    };

    const res = await handleApiRequest(new Request('http://localhost' + '/api/marketing/campaigns', {
      method: 'GET',
    }), mockEnvWithCampaigns);

    expect(res.status).toBe(200);
    // SAFETY: Marketing campaigns endpoint returns array of campaign records
    const data = (await res.json()) as { name: string }[];
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]).toHaveProperty('name');
  });

  test('POST /api/marketing/campaigns adds/updates campaign', async () => {
    const res = await handleApiRequest(new Request('http://localhost' + '/api/marketing/campaigns', {
      method: 'POST',
      body: JSON.stringify({ name: 'New Ad Campaign', budget: 100000 }),
      headers: { 'Content-Type': 'application/json' },
    }), mockEnv);

    expect(res.status).toBe(201);
    // SAFETY: Created campaign returns campaign payload
    const data = (await res.json()) as { name: string; budget: number };
    expect(data.name).toBe('New Ad Campaign');
    expect(data.budget).toBe(100000);
  });

  test('POST /api/marketing/generate-ideas returns ideas from Gemini', async () => {
    const res = await handleApiRequest(new Request('http://localhost' + '/api/marketing/generate-ideas', {
      method: 'POST',
      body: JSON.stringify({ productDescription: 'A Cool App', targetAudience: 'Teens' }),
      headers: { 'Content-Type': 'application/json' },
    }), mockEnv);

    expect(res.status).toBe(200);
    // SAFETY: Generate ideas returns ideas string payload
    const data = (await res.json()) as { ideas: string };
    expect(data.ideas).toBe('Mocked Generative Response');
  });

  test('GET /api/hr/employees returns employee roster', async () => {
    const mockEnvWithEmployees: RoleTestEnv = {
      ...mockEnv,
      DB: {
        prepare: vi.fn().mockReturnValue({
          bind: vi.fn().mockReturnThis(),
          all: vi.fn().mockResolvedValue({ results: [] }),
          raw: vi.fn().mockResolvedValue([['emp-1', 'test-user', 'Mock Employee', 'Developer', 'Engineering', 10000000, 'active', new Date().toISOString(), new Date().toISOString(), new Date().toISOString()]]),
          get: vi.fn().mockResolvedValue(null),
          run: vi.fn().mockResolvedValue({ success: true }),
        }),
      },
    };

    const res = await handleApiRequest(new Request('http://localhost' + '/api/hr/employees', {
      method: 'GET',
    }), mockEnvWithEmployees);

    expect(res.status).toBe(200);
    // SAFETY: HR employees endpoint returns array of employee records
    const data = (await res.json()) as { role: string }[];
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]).toHaveProperty('role');
  });

  test('POST /api/hr/employees adds/updates employee', async () => {
    const res = await handleApiRequest(new Request('http://localhost' + '/api/hr/employees', {
      method: 'POST',
      body: JSON.stringify({ name: 'Frank Ocean', role: 'Musician', department: 'Arts', salary: 20000000 }),
      headers: { 'Content-Type': 'application/json' },
    }), mockEnv);

    expect(res.status).toBe(201);
    // SAFETY: Created employee returns employee payload
    const data = (await res.json()) as { name: string; salary: number };
    expect(data.name).toBe('Frank Ocean');
    expect(data.salary).toBe(20000000);
  });

  test('POST /api/hr/generate-doc returns generated document from Gemini', async () => {
    const res = await handleApiRequest(new Request('http://localhost' + '/api/hr/generate-doc', {
      method: 'POST',
      body: JSON.stringify({ docType: 'offer_letter', title: 'Developer', department: 'Engineering', salary: '$100,000' }),
      headers: { 'Content-Type': 'application/json' },
    }), mockEnv);

    expect(res.status).toBe(200);
    // SAFETY: Generate doc returns document string payload
    const data = (await res.json()) as { document: string };
    expect(data.document).toBe('Mocked Generative Response');
  });
});
