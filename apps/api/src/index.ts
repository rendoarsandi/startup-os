import { Hono } from 'hono'
import { drizzle } from 'drizzle-orm/d1'
import { users } from '@ai-cfo/db'
import { getAuth } from './auth'

type Bindings = {
  DB: D1Database
  BETTER_AUTH_URL: string
  BETTER_AUTH_SECRET: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.get('/api/health', (c) => {
  return c.json({ status: 'OK' })
})

app.on(['POST', 'GET'], '/api/auth/*', (c) => {
  const auth = getAuth(c.env.DB, c.env.BETTER_AUTH_URL);
  return auth.handler(c.req.raw);
});

app.get('/api/users', async (c) => {
  const db = drizzle(c.env.DB)
  const allUsers = await db.select().from(users).all()
  return c.json(allUsers)
})

app.get('/', (c) => {
  return c.text('AI CFO API')
})

export default app
