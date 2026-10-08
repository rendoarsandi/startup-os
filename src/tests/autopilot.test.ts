// @vitest-environment node
import { beforeEach, describe, expect, test } from 'vitest'
import { handleApiRequest } from './mocks/apiHarness'
import { createRealSqliteD1 } from './mocks/d1Simulator'
let env: any
async function request(path: string, method = 'GET', input?: unknown, owner = 'founder') {
  return handleApiRequest(new Request('http://localhost' + path, { method, headers: { 'Content-Type': 'application/json' }, body: method === 'GET' ? undefined : JSON.stringify(input || {}) }), { ...env, TEST_USER_ID: owner })
}
beforeEach(async () => {
  const DB = await createRealSqliteD1()
  env = { DB }
  const now = Math.floor(Date.now() / 1000)
  for (const id of ['founder', 'other']) await DB.prepare('INSERT INTO user (id,name,email,email_verified,created_at,updated_at) VALUES (?,?,?,?,?,?)').bind(id,id,id+'@test.local',1,now,now).run()
})
async function lowStockRule() {
  await request('/api/operations/inventory', 'POST', { sku: 'LAPTOP', name: 'Laptop', qty: 2, rate: 150000 })
  const res = await request('/api/operations/autopilot', 'POST', { name: 'Restock', triggerType: 'low_stock', triggerValue: '5', actionType: 'auto_task' })
  expect(res.status).toBe(201)
  return res.json()
}
describe('Persistent automation', () => {
  test('manual and concurrent checks deduplicate work, and approval creates exactly one persisted task', async () => {
    const rule = await lowStockRule()
    const checks = await Promise.all([request('/api/operations/autopilot/run-checks', 'POST'), request('/api/operations/autopilot/run-checks', 'POST')])
    for (const res of checks) expect(res.status).toBe(200)
    const runs = await (await request('/api/automation/runs')).json()
    expect(runs).toHaveLength(1)
    expect(runs[0].status).toBe('awaiting_approval')
    await request(`/api/operations/autopilot/${rule.id}/toggle`, 'PUT', { active: false })
    await request(`/api/operations/autopilot/${rule.id}/toggle`, 'PUT', { active: true })
    await request('/api/operations/autopilot/run-checks', 'POST')
    expect(await (await request('/api/automation/runs')).json()).toHaveLength(1)
    expect(await (await request('/api/operations/tasks')).json()).toEqual([])
    const approvals = await Promise.all([request(`/api/automation/runs/${runs[0].id}/review`, 'POST', { decision: 'approve' }), request(`/api/automation/runs/${runs[0].id}/review`, 'POST', { decision: 'approve' })])
    expect(approvals.map(res => res.status).sort()).toEqual([200,409])
    const tasks = await (await request('/api/operations/tasks')).json()
    expect(tasks).toHaveLength(1)
    expect(tasks[0].title).toBe('Review stock for Laptop')
    expect((await (await request('/api/automation/runs')).json())[0].status).toBe('completed')
  })
  test('server autonomy setting allows internal work without fabricated execution', async () => {
    await request('/api/workspace/settings', 'PUT', { companyName: 'Small team', companyDescription: '', autonomy: 'internal' })
    await lowStockRule()
    await request('/api/operations/autopilot/run-checks', 'POST')
    expect(await (await request('/api/operations/tasks')).json()).toHaveLength(1)
  })
  test('rule deletion, toggling, and review cannot affect another founder', async () => {
    const rule = await lowStockRule()
    expect((await request(`/api/operations/autopilot/${rule.id}`, 'DELETE', undefined, 'other')).status).toBe(404)
    expect((await request(`/api/operations/autopilot/${rule.id}/toggle`, 'PUT', { active: false }, 'other')).status).toBe(404)
    await request('/api/operations/autopilot/run-checks', 'POST')
    const runs = await (await request('/api/automation/runs')).json()
    expect((await request(`/api/automation/runs/${runs[0].id}/review`, 'POST', { decision: 'approve' }, 'other')).status).toBe(409)
    expect(await (await request('/api/automation/runs', 'GET', undefined, 'other')).json()).toEqual([])
  })
  test('missing AI credentials persist a failure and never claim a customer reply was sent', async () => {
    await request('/api/operations/tickets', 'POST', { customerName: 'Customer', subject: 'Help', description: 'Login fails', priority: 'high' })
    await request('/api/operations/autopilot', 'POST', { name: 'Support draft', triggerType: 'high_priority_ticket', triggerValue: 'high', actionType: 'ai_reply' })
    await request('/api/operations/autopilot/run-checks', 'POST')
    const runs = await (await request('/api/automation/runs')).json()
    expect(runs[0].status).toBe('failed')
    expect(runs[0].error).toContain('AI is not connected')
    expect((await (await request('/api/operations/tickets')).json())[0].status).toBe('open')
    expect((await request(`/api/automation/runs/${runs[0].id}/review`, 'POST', { decision: 'retry' })).status).toBe(200)
    expect((await (await request('/api/automation/runs')).json())[0].attempts).toBe(2)
  })
})
