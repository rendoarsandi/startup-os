// @vitest-environment node
import { describe, expect, test } from 'vitest'
import { http, HttpResponse } from 'msw'
import { AIService } from '../server/ai'
import { server } from './mocks/server'
function completion(text: string) {
 return { id: 'chat-test', object: 'chat.completion', created: 1, model: 'openai/gpt-4.1-mini', system_fingerprint: null, choices: [{ index: 0, message: { role: 'assistant', content: text }, finish_reason: 'stop' }] }
}
const service = new AIService({ OPENROUTER_API_KEY: 'test-openrouter-token' })
describe('OpenRouter SDK provider boundary', () => {
  test('preserves conversational history and executive context on the provider transport', async () => {
    let payload: any
    server.use(http.post('https://openrouter.ai/api/v1/chat/completions', async ({ request }) => { payload = await request.json(); return HttpResponse.json(completion('Recorded runway is missing.')) }))
    const result = await service.chat([{ role: 'user', parts: [{ text: 'We have two customers.' }] }, { role: 'model', parts: [{ text: 'Understood.' }] }], 'What next?', 'No cash records', 'cfo')
    expect(result).toBe('Recorded runway is missing.')
    expect(payload.model).toBe('openai/gpt-4.1-mini')
    expect(payload.messages.some((message: any) => message.role === 'assistant' && message.content === 'Understood.')).toBe(true)
    expect(payload.messages.some((message: any) => message.content.includes('No cash records'))).toBe(true)
  })
  test('malformed invoice output fails instead of creating a fabricated invoice', async () => {
    server.use(http.post('https://openrouter.ai/api/v1/chat/completions', () => HttpResponse.json(completion('not an invoice'))))
    await expect(service.parseInvoiceText('Invoice content')).rejects.toThrow('invalid invoice')
  })
  test('missing credentials never enable mocked intelligence', async () => {
    await expect(new AIService({}).generateResponse('What is our cash balance?')).rejects.toThrow('AI is not connected')
  })
})
