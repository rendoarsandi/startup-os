import { eventHandler, toWebRequest } from 'vinxi/http'
import { handleApiRequest } from './server/dispatcher'

export default eventHandler(async (event) => {
  const request = toWebRequest(event)
  return handleApiRequest(request)
})
