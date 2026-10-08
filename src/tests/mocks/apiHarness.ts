import { drizzle } from 'drizzle-orm/d1'
import { businessHandlers, handleApiRequest as dispatch } from '../../server/dispatcher'
import { ValidationError, jsonResponse } from '../../server/utils'

// Business-route tests supply an authenticated owner. Real-cookie transport tests
// use dispatcher directly and do not use this fixture.
export async function handleApiRequest(request: Request, env: any = {}) {
  const path = new URL(request.url).pathname
  if (path === '/api/health' || path.startsWith('/api/auth/')) return dispatch(request, env)
  if (env.TEST_USER_ID === null) return jsonResponse({ error: 'Unauthorized' }, 401)
  try {
    for (const handler of businessHandlers) {
      const result = await handler(request, path, request.method, drizzle(env.DB), env.TEST_USER_ID || 'test-user-id', env)
      if (result) return result
    }
    return jsonResponse({ error: 'Not Found' }, 404)
  } catch (error) {
    if (error instanceof ValidationError) return jsonResponse({ error: error.message }, 400)
    return jsonResponse({ error: error instanceof Error ? error.message : 'Failed' }, 500)
  }
}
