import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import {
  addMessage,
  createConversation,
  deleteConversation,
  getConversation,
  listConversations,
  listMessages,
  renameConversationFromFirstMessage,
} from '../db'
import { simulateAssistantStream } from '../simulator'

export const chatRoutes = new Hono()

chatRoutes.get('/conversations', (c) => {
  return c.json({ conversations: listConversations() })
})

chatRoutes.post('/conversations', async (c) => {
  let title: string | undefined
  try {
    const body = (await c.req.json().catch(() => ({}))) as { title?: unknown }
    if (typeof body.title === 'string' && body.title.trim()) {
      title = body.title.trim()
    }
  } catch {}
  const conversation = createConversation(title)
  return c.json({ conversation }, 201)
})

chatRoutes.get('/conversations/:id', (c) => {
  const id = c.req.param('id')
  const conversation = getConversation(id)
  if (!conversation) return c.json({ error: 'conversation not found' }, 404)
  return c.json({ conversation, messages: listMessages(id) })
})

chatRoutes.delete('/conversations/:id', (c) => {
  const id = c.req.param('id')
  const ok = deleteConversation(id)
  if (!ok) return c.json({ error: 'conversation not found' }, 404)
  return c.body(null, 204)
})

const buildChunk = (
  id: string,
  created: number,
  delta: { role?: 'assistant'; content?: string },
  finishReason: 'stop' | null = null
) => ({
  id,
  object: 'chat.completion.chunk',
  created,
  model: 'sim-gpt',
  choices: [
    {
      index: 0,
      delta,
      finish_reason: finishReason,
    },
  ],
})

chatRoutes.post('/conversations/:id/messages', async (c) => {
  const conversationId = c.req.param('id')
  const conversation = getConversation(conversationId)
  if (!conversation) return c.json({ error: 'conversation not found' }, 404)

  const body = (await c.req.json().catch(() => null)) as
    | { content?: unknown }
    | null
  const content =
    body && typeof body.content === 'string' ? body.content.trim() : ''
  if (!content) return c.json({ error: 'content is required' }, 400)

  const isFirstMessage = listMessages(conversationId).length === 0
  addMessage(conversationId, 'user', content)
  if (isFirstMessage) {
    renameConversationFromFirstMessage(conversationId, content)
  }

  return streamSSE(c, async (stream) => {
    const chunkId = `chatcmpl-${crypto.randomUUID()}`
    const created = Math.floor(Date.now() / 1000)
    const signal = c.req.raw.signal

    let assembled = ''
    let aborted = false

    await stream.writeSSE({
      data: JSON.stringify(buildChunk(chunkId, created, { role: 'assistant' })),
    })

    try {
      for await (const token of simulateAssistantStream(content, { signal })) {
        if (signal.aborted) {
          aborted = true
          break
        }
        assembled += token
        await stream.writeSSE({
          data: JSON.stringify(buildChunk(chunkId, created, { content: token })),
        })
      }
    } catch (err) {
      if ((err as { name?: string })?.name !== 'AbortError') {
        console.error('stream error:', err)
      }
      aborted = true
    }

    if (!aborted) {
      await stream.writeSSE({
        data: JSON.stringify(buildChunk(chunkId, created, {}, 'stop')),
      })
      await stream.writeSSE({ data: '[DONE]' })
    }

    if (assembled.length > 0) {
      addMessage(conversationId, 'assistant', assembled)
    }
  })
})
