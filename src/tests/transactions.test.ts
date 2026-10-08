// @vitest-environment node
import { beforeEach, expect, test } from 'vitest'
import { handleApiRequest } from './mocks/apiHarness'
import { createRealSqliteD1 } from './mocks/d1Simulator'
let env: any
async function request(path: string, method = 'GET', body?: object) { return handleApiRequest(new Request('http://localhost' + path, { method, headers: { 'Content-Type': 'application/json' }, body: method === 'GET' ? undefined : JSON.stringify(body) }), env) }
beforeEach(async () => { env = { DB: await createRealSqliteD1(), TEST_USER_ID: 'founder' }; const now = Math.floor(Date.now()/1000); await env.DB.prepare('INSERT INTO user (id,name,email,email_verified,created_at,updated_at) VALUES (?,?,?,?,?,?)').bind('founder','Founder','founder@test.local',1,now,now).run() })
test('concurrent ledger entries update the same account balance without losing money', async () => {
  const account = await (await request('/api/accounts','POST',{name:'Operating',type:'checking',balance:10000})).json()
  const responses = await Promise.all([-1500,2500].map(amount => request('/api/transactions','POST',{accountId:account.id,amount,category:'Other',merchant:'Manual'})))
  expect(responses.map(response => response.status)).toEqual([201,201])
  expect((await (await request('/api/accounts')).json())[0].balance).toBe(11000)
  expect(await (await request('/api/transactions')).json()).toHaveLength(2)
})
test('invalid dates and fractional cents never change the ledger or balance', async () => {
 const account = await (await request('/api/accounts','POST',{name:'Cash',type:'cash',balance:10000})).json()
 for (const input of [{amount:1.5,date:'2026-01-01'},{amount:-100,date:'invalid'}]) expect((await request('/api/transactions','POST',{accountId:account.id,...input})).status).toBe(400)
 expect((await (await request('/api/accounts')).json())[0].balance).toBe(10000)
 expect(await (await request('/api/transactions')).json()).toEqual([])
})
