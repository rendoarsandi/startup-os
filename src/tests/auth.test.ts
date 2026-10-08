// @vitest-environment node
import { beforeEach, describe, expect, test } from 'vitest'
import { createHmac } from 'node:crypto'
import { handleApiRequest } from '../server/dispatcher'
import { createRealSqliteD1 } from './mocks/d1Simulator'
import type { AppEnv } from '../server/env'
let env: AppEnv
function cookie(id: string) { return 'better-auth.session_token=' + encodeURIComponent(`${id}.${createHmac('sha256', env.BETTER_AUTH_SECRET).update(id).digest('base64')}`) }
async function request(path: string, method = 'GET', data?: unknown, identity?: string, origin = 'http://localhost') {
  return handleApiRequest(new Request('http://localhost' + path, { method, headers: { 'Content-Type': 'application/json', origin, ...(identity ? { Cookie: cookie(identity) } : {}) }, body: method === 'GET' ? undefined : JSON.stringify(data || {}) }), env)
}
beforeEach(async () => {
  env = { DB: await createRealSqliteD1() as AppEnv['DB'], BETTER_AUTH_SECRET: 'integration-test-secret-at-least-32-characters' }
  const now = Math.floor(Date.now() / 1000)
  for (const id of ['alice', 'bob']) {
    await env.DB.prepare('INSERT INTO user (id,name,email,email_verified,created_at,updated_at) VALUES (?,?,?,?,?,?)').bind(id,id,id+'@test.local',1,now,now).run()
    await env.DB.prepare('INSERT INTO session (id,user_id,token,expires_at,created_at,updated_at) VALUES (?,?,?,?,?,?)').bind(id,id,id,now+3600,now,now).run()
  }
})
describe('Authenticated HTTP boundary', () => {
  test('requires a real signed session and does not accept a body userId or legacy RPC', async () => {
    expect((await request('/api/accounts')).status).toBe(401)
    expect((await request('/api/rpc', 'POST', { userId: 'alice', functionName: 'cfo.getAccounts' })).status).toBe(401)
    expect((await request('/api/rpc', 'POST', { userId: 'bob' }, 'alice')).status).toBe(404)
    expect((await request('/api/ws', 'GET', undefined, 'alice')).status).toBe(404)
    const forged = await handleApiRequest(new Request('http://localhost/api/accounts', { headers: { Cookie: 'better-auth.session_token=alice.forged' } }), env)
    expect(forged.status).toBe(401)
  })
  test('new authenticated workspaces start empty and account ownership is isolated', async () => {
    expect(await (await request('/api/accounts', 'GET', undefined, 'alice')).json()).toEqual([])
    const created = await request('/api/accounts', 'POST', { name: 'Operating', type: 'checking', balance: 250000 }, 'alice')
    expect(created.status).toBe(201)
    expect(await (await request('/api/accounts', 'GET', undefined, 'bob')).json()).toEqual([])
    expect(await (await request('/api/accounts', 'GET', undefined, 'alice')).json()).toHaveLength(1)
    const account = await created.json()
    expect((await request('/api/transactions', 'POST', { accountId: account.id, amount: -1000 }, 'bob')).status).toBe(404)
  })
  test('rejects cross-origin writes and invalid cents before persistence', async () => {
    expect((await request('/api/accounts', 'POST', { name: 'Stolen', type: 'checking' }, 'alice', 'https://attacker.example')).status).toBe(403)
    expect((await request('/api/accounts', 'POST', { name: '', type: 'checking', balance: 1.5 }, 'alice')).status).toBe(400)
    expect(await (await request('/api/accounts', 'GET', undefined, 'alice')).json()).toEqual([])
  })
  test('signup establishes a session that can access the persistent workspace', async () => {
    const registered = await request('/api/auth/sign-up/email', 'POST', { name: 'Founder', email: 'founder@startup.test', password: 'correct-horse-battery-staple' })
    expect(registered.status).toBe(200)
    const value = registered.headers.getSetCookie().map(value => value.split(';')[0]).join('; ')
    expect(value).toContain('session_token')
    const session = await handleApiRequest(new Request('http://localhost/api/auth/get-session', { headers: { Cookie: value } }), env)
    expect((await session.json()).user.email).toBe('founder@startup.test')
    const accounts = await handleApiRequest(new Request('http://localhost/api/accounts', { headers: { Cookie: value } }), env)
    expect(await accounts.json()).toEqual([])
  })
})
