# Chat App Monorepo

> ⚠️ **Test project.** This is a small demo built to simulate how ChatGPT works — specifically the streaming UX where the assistant's reply appears word-by-word as the server generates it. There is no real LLM behind it; the backend streams a canned response with small per-token delays so the experience feels identical to a real model.
>
> The architecture is the interesting part:
>
> - The **server streams the response** to the client over Server-Sent Events as soon as each "token" is produced.
> - The **client displays the response progressively** as chunks arrive, with a live typing/loading indicator and a Stop button — exactly like ChatGPT.

## Structure

- `apps/frontend` — Next.js + React 19 chat UI.
- `apps/backend` — Hono server running on Bun, with SQLite persistence (`bun:sqlite`).

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) installed.

### Installation

```bash
bun install
```

### Running the applications

Run frontend and backend together in development mode:

```bash
bun dev
```

Or run them individually:

```bash
bun --filter frontend dev   # Next.js on http://localhost:3000
bun --filter backend dev    # Hono   on http://localhost:4000
```

Then open http://localhost:3000.

## How the streaming works

1. The user types a message and submits it.
2. The frontend POSTs to `/chat/conversations/:id/messages` and reads the response body as a `ReadableStream`.
3. The backend writes Server-Sent Events in the OpenAI Chat Completions chunk format, one chunk per word, with 20–80 ms jitter between tokens.
4. The frontend parses each `data: …` frame as it arrives and appends the new text to the assistant bubble in real time.
5. While the stream is open, the UI shows a typing indicator, a blinking caret at the end of the streamed text, and a Stop button (which aborts the request).
6. When the stream ends (`data: [DONE]`), the assistant message is persisted in SQLite and the UI returns to the idle state.

The whole user message + assistant reply is also stored on the server so conversations survive a refresh or a server restart.

## Backend API

Base URL: `http://localhost:4000`

### Health
- `GET /ping` → `{ "message": "pong" }`

### Conversations (persisted in SQLite at `apps/backend/data/chat.db`)
- `POST /chat/conversations` — create. Optional body `{ "title": "..." }`. Returns `201 { conversation }`.
- `GET /chat/conversations` — list, newest-updated first.
- `GET /chat/conversations/:id` — returns `{ conversation, messages }`.
- `DELETE /chat/conversations/:id` — `204` on success, `404` if missing.

### Streaming chat
- `POST /chat/conversations/:id/messages` — body `{ "content": "..." }`.

  Responds with **Server-Sent Events** (`text/event-stream`) using OpenAI Chat Completions chunk format:
  ```
  data: {"id":"chatcmpl-...","object":"chat.completion.chunk","created":...,"model":"sim-gpt","choices":[{"index":0,"delta":{"role":"assistant"},"finish_reason":null}]}

  data: {"id":"...","choices":[{"index":0,"delta":{"content":"Hello "},"finish_reason":null}]}
  ...
  data: {"id":"...","choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}

  data: [DONE]
  ```
  Tokens (words) are emitted with 20–80 ms jitter to mimic ChatGPT. The user message is persisted before streaming; the assistant message is persisted on completion (or as a partial if the client disconnects).

  Example:
  ```bash
  CID=$(curl -s -X POST http://localhost:4000/chat/conversations | jq -r .conversation.id)
  curl -N -X POST http://localhost:4000/chat/conversations/$CID/messages \
    -H "Content-Type: application/json" \
    -d '{"content":"Hello"}'
  ```

## Configuration

- `NEXT_PUBLIC_BACKEND_URL` — frontend env var pointing at the backend. Defaults to `http://localhost:4000`.
- `PORT` — backend listen port. Defaults to `4000`.
- `CHAT_DB_PATH` — backend SQLite file path. Defaults to `apps/backend/data/chat.db`.
