import { Hono } from 'hono'

const app = new Hono()

app.get('/api/health', (c) => {
  return c.json({ status: 'OK' })
})

app.get('/', (c) => {
  return c.text('AI CFO API')
})

export default app
