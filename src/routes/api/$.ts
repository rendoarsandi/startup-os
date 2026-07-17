import { createFileRoute } from '@tanstack/react-router'
import { handleApiRequest } from '../../server/dispatcher'

const handler = async ({ request }: { request: Request }) => {
  return handleApiRequest(request)
}

export const Route = createFileRoute('/api/$')({
  server: {
    handlers: {
      GET: handler,
      POST: handler,
      PUT: handler,
      DELETE: handler,
      PATCH: handler,
      OPTIONS: handler,
      HEAD: handler,
    },
  },
})
