import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { chatRoutes } from './routes/chat'

const app = new Hono()

app.use(
  '*',
  cors({
    origin: (origin) => origin ?? '*',
    allowMethods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type'],
    credentials: true,
  })
)

app.get('/ping', (c) => {
  return c.json({ message: 'pong' })
})

app.route('/chat', chatRoutes)

export default {
  port: Number(process.env.PORT ?? 4000),
  fetch: app.fetch,
}
