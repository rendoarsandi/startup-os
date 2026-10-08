// @vitest-environment node
import { beforeEach, expect, test } from 'vitest'
import { http, HttpResponse } from 'msw'
import { handleApiRequest } from './mocks/apiHarness'
import { createRealSqliteD1 } from './mocks/d1Simulator'
import { server } from './mocks/server'
let env: any
async function request(path: string, body?: object) { return handleApiRequest(new Request('http://localhost' + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) }), env) }
beforeEach(async () => { env = { DB: await createRealSqliteD1(), TEST_USER_ID:'founder', PLAID_CLIENT_ID:'protocol-client',PLAID_SECRET:'protocol-secret' }; const now = Math.floor(Date.now()/1000); await env.DB.prepare('INSERT INTO user (id,name,email,email_verified,created_at,updated_at) VALUES (?,?,?,?,?,?)').bind('founder','Founder','founder@test.local',1,now,now).run() })
test('bank imports page real provider responses and repeated sync retains one account and transaction', async () => {
 server.use(
  http.post('https://sandbox.plaid.com/item/public_token/exchange',()=>HttpResponse.json({access_token:'access-fixture',item_id:'item-fixture'})),
  http.post('https://sandbox.plaid.com/accounts/balance/get',()=>HttpResponse.json({accounts:[{account_id:'bank-fixture',name:'Operating',type:'depository',subtype:'checking',balances:{current:1234.56,iso_currency_code:'USD'}}]})),
  http.post('https://sandbox.plaid.com/transactions/get',()=>HttpResponse.json({transactions:[{transaction_id:'expense-fixture',account_id:'bank-fixture',amount:12.34,date:'2026-10-01',name:'Software',category:['Software']}],total_transactions:1})),
 )
 expect((await request('/api/plaid/exchange-token',{publicToken:'public-fixture'})).status).toBe(200)
 expect((await request('/api/plaid/sync-transactions')).status).toBe(200)
 const accounts = await env.DB.prepare('SELECT * FROM financial_account').all(); const transactions = await env.DB.prepare('SELECT * FROM "transaction"').all()
 expect(accounts.results).toHaveLength(1); expect(accounts.results[0].balance).toBe(123456)
 expect(transactions.results).toHaveLength(1); expect(transactions.results[0].amount).toBe(-1234)
 expect((await request('/api/plaid/sync-transactions')).status).toBe(200)
 expect((await env.DB.prepare('SELECT * FROM "transaction"').all()).results).toHaveLength(1)
})
test('missing credentials and fabricated Link tokens cannot create banking records', async () => {
 env.PLAID_SECRET = undefined
 expect((await request('/api/plaid/create-link-token')).status).toBe(503)
 env.PLAID_SECRET = 'protocol-secret'
 expect((await request('/api/plaid/exchange-token',{publicToken:'mock_public_token'})).status).toBe(400)
 expect((await env.DB.prepare('SELECT * FROM financial_account').all()).results).toEqual([])
})
