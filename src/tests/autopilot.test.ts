import { expect, test, describe, beforeEach } from 'vitest';
import { handleApiRequest } from '../server/dispatcher';
import { createRealSqliteD1 } from './mocks/d1Simulator';

describe('COO Autopilot Rules API Endpoints', () => {
  let realDb: any;
  let mockEnv: { GEMINI_API_KEY: string; TEST_USER_ID: string; DB: any };

  beforeEach(async () => {
    realDb = await createRealSqliteD1();
    mockEnv = {
      GEMINI_API_KEY: 'test-key',
      TEST_USER_ID: 'test-user-id',
      DB: realDb as any,
    };
  });

  test('GET /api/operations/autopilot returns rule list', async () => {
    const res = await handleApiRequest(new Request('http://localhost/api/operations/autopilot', {
      method: 'GET',
    }), mockEnv);

    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(Array.isArray(data)).toBe(true);
  });

  test('POST /api/operations/autopilot creates or updates rule', async () => {
    const res = await handleApiRequest(new Request('http://localhost/api/operations/autopilot', {
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

    const resAll = await realDb.prepare('SELECT * FROM autopilot_rule WHERE user_id = ?').bind('test-user-id').all();
    expect(resAll.results.length).toBe(1);
    expect(resAll.results[0].name).toBe('Urgent Ticket Alert Hook');
  });

  test('PUT /api/operations/autopilot/:id/toggle toggles rule state', async () => {
    const createRes = await handleApiRequest(new Request('http://localhost/api/operations/autopilot', {
      method: 'POST',
      body: JSON.stringify({
        id: 'rule-1',
        name: 'Urgent Ticket Alert Hook',
        triggerType: 'high_priority_ticket',
        triggerValue: 'high',
        actionType: 'webhook_alert',
        actionTarget: 'https://hooks.slack.com/services/test'
      }),
      headers: { 'Content-Type': 'application/json' },
    }), mockEnv);

    const createdData = await createRes.json() as any;
    const ruleId = createdData.id || 'rule-1';

    const toggleRes = await handleApiRequest(new Request(`http://localhost/api/operations/autopilot/${ruleId}/toggle`, {
      method: 'PUT',
      body: JSON.stringify({ active: false }),
      headers: { 'Content-Type': 'application/json' },
    }), mockEnv);

    expect(toggleRes.status).toBe(200);
    const toggleData = await toggleRes.json() as any;
    expect(toggleData.success).toBe(true);
    expect(toggleData.active).toBe(false);

    const row = await realDb.prepare('SELECT * FROM autopilot_rule WHERE id = ?').bind(ruleId).first();
    expect(row).toBeDefined();
    expect(Boolean(row.active)).toBe(false);
  });

  test('POST /api/operations/autopilot/run-checks evaluates autopilot triggers', async () => {
    const res = await handleApiRequest(new Request('http://localhost/api/operations/autopilot/run-checks', {
      method: 'POST',
    }), mockEnv);

    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(Array.isArray(data.logs)).toBe(true);
  });
});
