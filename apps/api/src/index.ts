import { Hono } from 'hono'
import { drizzle } from 'drizzle-orm/d1'
import { users } from '@ai-cfo/db'
import { getAuth } from './auth'
import { GeminiService } from "./gemini";

type Bindings = {
  DB: D1Database
  BETTER_AUTH_URL: string
  BETTER_AUTH_SECRET: string
  GEMINI_API_KEY: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.get('/api/health', (c) => {
  return c.json({ status: 'OK' })
})

app.on(['POST', 'GET'], '/api/auth/*', (c) => {
  const auth = getAuth(c.env.DB, c.env.BETTER_AUTH_URL);
  return auth.handler(c.req.raw);
});

app.post("/api/chat", async (c) => {
  const gemini = new GeminiService(c.env.GEMINI_API_KEY);
  const { message, history } = await c.req.json();
  
  try {
    const response = await gemini.chat(history || [], message);
    return c.json({ response });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
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
