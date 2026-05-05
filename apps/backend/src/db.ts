import { Database } from 'bun:sqlite'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

const DB_PATH = process.env.CHAT_DB_PATH ?? `${import.meta.dir}/../data/chat.db`

mkdirSync(dirname(DB_PATH), { recursive: true })

export const db = new Database(DB_PATH)
db.exec('PRAGMA journal_mode = WAL;')
db.exec('PRAGMA foreign_keys = ON;')

db.exec(`
  CREATE TABLE IF NOT EXISTS conversations (
    id          TEXT PRIMARY KEY,
    title       TEXT NOT NULL DEFAULT 'New chat',
    created_at  INTEGER NOT NULL,
    updated_at  INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS messages (
    id              TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role            TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content         TEXT NOT NULL,
    created_at      INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_messages_conversation
    ON messages(conversation_id, created_at);
`)

export type ConversationRow = {
  id: string
  title: string
  created_at: number
  updated_at: number
}

export type MessageRow = {
  id: string
  conversation_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at: number
}

export type Conversation = {
  id: string
  title: string
  createdAt: number
  updatedAt: number
}

export type Message = {
  id: string
  conversationId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: number
}

const toConversation = (row: ConversationRow): Conversation => ({
  id: row.id,
  title: row.title,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

const toMessage = (row: MessageRow): Message => ({
  id: row.id,
  conversationId: row.conversation_id,
  role: row.role,
  content: row.content,
  createdAt: row.created_at,
})

const insertConversationStmt = db.prepare<
  void,
  [string, string, number, number]
>('INSERT INTO conversations (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)')

const listConversationsStmt = db.prepare<ConversationRow, []>(
  'SELECT id, title, created_at, updated_at FROM conversations ORDER BY updated_at DESC'
)

const getConversationStmt = db.prepare<ConversationRow, [string]>(
  'SELECT id, title, created_at, updated_at FROM conversations WHERE id = ?'
)

const deleteConversationStmt = db.prepare<void, [string]>(
  'DELETE FROM conversations WHERE id = ?'
)

const updateConversationTouchStmt = db.prepare<void, [number, string]>(
  'UPDATE conversations SET updated_at = ? WHERE id = ?'
)

const updateConversationTitleStmt = db.prepare<void, [string, number, string]>(
  'UPDATE conversations SET title = ?, updated_at = ? WHERE id = ?'
)

const insertMessageStmt = db.prepare<
  void,
  [string, string, 'user' | 'assistant' | 'system', string, number]
>(
  'INSERT INTO messages (id, conversation_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)'
)

const listMessagesStmt = db.prepare<MessageRow, [string]>(
  'SELECT id, conversation_id, role, content, created_at FROM messages WHERE conversation_id = ? ORDER BY created_at ASC, id ASC'
)

export const createConversation = (title = 'New chat'): Conversation => {
  const id = crypto.randomUUID()
  const now = Date.now()
  insertConversationStmt.run(id, title, now, now)
  return { id, title, createdAt: now, updatedAt: now }
}

export const listConversations = (): Conversation[] =>
  listConversationsStmt.all().map(toConversation)

export const getConversation = (id: string): Conversation | null => {
  const row = getConversationStmt.get(id)
  return row ? toConversation(row) : null
}

export const deleteConversation = (id: string): boolean => {
  const result = deleteConversationStmt.run(id)
  return result.changes > 0
}

export const listMessages = (conversationId: string): Message[] =>
  listMessagesStmt.all(conversationId).map(toMessage)

export const addMessage = (
  conversationId: string,
  role: 'user' | 'assistant' | 'system',
  content: string
): Message => {
  const id = crypto.randomUUID()
  const now = Date.now()
  insertMessageStmt.run(id, conversationId, role, content, now)
  updateConversationTouchStmt.run(now, conversationId)
  return { id, conversationId, role, content, createdAt: now }
}

export const renameConversationFromFirstMessage = (
  conversationId: string,
  firstUserMessage: string
): void => {
  const trimmed = firstUserMessage.trim().replace(/\s+/g, ' ')
  if (!trimmed) return
  const title = trimmed.length > 60 ? `${trimmed.slice(0, 57)}...` : trimmed
  updateConversationTitleStmt.run(title, Date.now(), conversationId)
}
