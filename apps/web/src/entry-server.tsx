import { eventHandler, toWebRequest } from 'vinxi/http'
import { createStartHandler, defaultRenderHandler } from '@tanstack/react-start/server'

const handler = createStartHandler(defaultRenderHandler)

export default eventHandler(async (event) => {
  const pathname = event.path || ''
  if (
    pathname.startsWith('/@id/') ||
    pathname.startsWith('/@vite/') ||
    pathname.startsWith('/@fs/') ||
    pathname.startsWith('/node_modules/') ||
    pathname.startsWith('/src/') ||
    pathname.startsWith('/_build/') ||
    pathname.startsWith('/@react-refresh') ||
    pathname.startsWith('/@tanstack-start/')
  ) {
    return
  }

  const request = toWebRequest(event)
  return handler(request)
})
