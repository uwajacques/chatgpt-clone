export type Role = "user" | "assistant" | "system";

export type Conversation = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
};

export type Message = {
  id: string;
  conversationId: string;
  role: Role;
  content: string;
  createdAt: number;
};

const BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") ??
  "http://localhost:4000";

async function jsonRequest<T>(
  path: string,
  init?: RequestInit & { json?: unknown },
): Promise<T> {
  const { json, headers, ...rest } = init ?? {};
  const response = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers: {
      ...(json !== undefined ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });
  if (!response.ok) {
    let message = `Request failed: ${response.status}`;
    try {
      const data = (await response.json()) as { error?: string };
      if (data.error) message = data.error;
    } catch {}
    throw new Error(message);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export async function listConversations(): Promise<Conversation[]> {
  const data = await jsonRequest<{ conversations: Conversation[] }>(
    "/chat/conversations",
  );
  return data.conversations;
}

export async function createConversation(
  title?: string,
): Promise<Conversation> {
  const data = await jsonRequest<{ conversation: Conversation }>(
    "/chat/conversations",
    { method: "POST", json: title ? { title } : {} },
  );
  return data.conversation;
}

export async function getConversation(
  id: string,
): Promise<{ conversation: Conversation; messages: Message[] }> {
  return jsonRequest("/chat/conversations/" + encodeURIComponent(id));
}

export async function deleteConversation(id: string): Promise<void> {
  await jsonRequest<void>("/chat/conversations/" + encodeURIComponent(id), {
    method: "DELETE",
  });
}

export type StreamHandlers = {
  onDelta: (chunk: string) => void;
  onDone?: () => void;
  signal?: AbortSignal;
};

type OpenAIChunk = {
  choices?: Array<{
    delta?: { content?: string; role?: Role };
    finish_reason?: string | null;
  }>;
};

/**
 * POSTs a user message and consumes the SSE stream, invoking onDelta for every
 * `delta.content` token. Handles backend's OpenAI-style chunks ending in
 * `data: [DONE]`. Caller-supplied AbortSignal cancels the request and stream.
 */
export async function streamAssistantReply(
  conversationId: string,
  content: string,
  handlers: StreamHandlers,
): Promise<void> {
  const response = await fetch(
    `${BASE_URL}/chat/conversations/${encodeURIComponent(conversationId)}/messages`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify({ content }),
      signal: handlers.signal,
    },
  );

  if (!response.ok || !response.body) {
    let message = `Stream failed: ${response.status}`;
    try {
      const data = (await response.json()) as { error?: string };
      if (data.error) message = data.error;
    } catch {}
    throw new Error(message);
  }

  const reader = response.body
    .pipeThrough(new TextDecoderStream())
    .getReader();

  // SSE frames are separated by a blank line ("\n\n"); a single frame may be
  // split across multiple network reads, so we accumulate in a buffer and only
  // process complete frames.
  let buffer = "";
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += value;

      let separatorIndex = buffer.indexOf("\n\n");
      while (separatorIndex !== -1) {
        const frame = buffer.slice(0, separatorIndex);
        buffer = buffer.slice(separatorIndex + 2);
        const finished = handleFrame(frame, handlers.onDelta);
        if (finished) {
          handlers.onDone?.();
          return;
        }
        separatorIndex = buffer.indexOf("\n\n");
      }
    }
    if (buffer.trim().length > 0) {
      handleFrame(buffer, handlers.onDelta);
    }
    handlers.onDone?.();
  } finally {
    reader.releaseLock();
  }
}

function handleFrame(
  frame: string,
  onDelta: (chunk: string) => void,
): boolean {
  const dataLines = frame
    .split(/\r?\n/)
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trimStart());
  if (dataLines.length === 0) return false;
  const payload = dataLines.join("\n");
  if (payload === "[DONE]") return true;
  try {
    const parsed = JSON.parse(payload) as OpenAIChunk;
    const delta = parsed.choices?.[0]?.delta?.content;
    if (typeof delta === "string" && delta.length > 0) {
      onDelta(delta);
    }
  } catch {}
  return false;
}
