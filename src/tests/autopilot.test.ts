import { expect, test, describe, vi } from 'vitest';
import { handleApiRequest } from '../server/dispatcher';

describe('COO Autopilot Rules API Endpoints', () => {
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

  test('GET /api/operations/autopilot returns rule list', async () => {
    const res = await handleApiRequest(new Request('http://localhost' + '/api/operations/autopilot', {
      method: 'GET',
    }), mockEnv);

    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]).toHaveProperty('triggerType');
  });

  test('POST /api/operations/autopilot creates or updates rule', async () => {
    const res = await handleApiRequest(new Request('http://localhost' + '/api/operations/autopilot', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Urgent Ticket Alert Hook',
        triggerType: 'high_priority_ticket',
        triggerValue: 'high',
        actionType: 'webhook_alert',
        actionTarget: 'https://hooks.slack.com/services/test'
      }),
      headers: { 'Content-Type': 'application/json' },
    }), mockEnv);

    expect(res.status).toBe(201);
    const data = await res.json() as any;
    expect(data.name).toBe('Urgent Ticket Alert Hook');
    expect(data.triggerType).toBe('high_priority_ticket');
    expect(data.actionType).toBe('webhook_alert');
  });

  test('PUT /api/operations/autopilot/:id/toggle toggles rule state', async () => {
    const res = await handleApiRequest(new Request('http://localhost' + '/api/operations/autopilot/rule-1/toggle', {
      method: 'PUT',
      body: JSON.stringify({ active: false }),
      headers: { 'Content-Type': 'application/json' },
    }), mockEnv);

    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(data.active).toBe(false);
  });

  test('POST /api/operations/autopilot/run-checks evaluates autopilot triggers', async () => {
    const res = await handleApiRequest(new Request('http://localhost' + '/api/operations/autopilot/run-checks', {
      method: 'POST',
    }), mockEnv);

    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(Array.isArray(data.logs)).toBe(true);
    expect(data.logs.length).toBeGreaterThan(0);
    expect(data.logs[0]).toHaveProperty('triggered');
  });
});
