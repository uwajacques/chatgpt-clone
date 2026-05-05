const RESPONSES = [
  "That's a great question. Let me think about it step by step. First, it helps to clarify what we actually mean by the terms involved, because a lot of confusion in this area comes from people using the same words to mean slightly different things. Once we have shared definitions, the underlying problem usually becomes much more tractable, and we can start sketching out a concrete approach instead of going in circles. From there, the next move is to identify which constraints are hard and which are merely conventions, so we can focus our effort where it actually matters.",
  "Sure, here's how I'd approach it. The core idea is to break the work into small, independent steps so that each one is easy to verify on its own. Start by writing down the inputs you have and the output you want, then look for the simplest transformation that gets you closer to the goal. If you can't see one immediately, try working backwards from the desired result. Most problems that look intimidating up front turn out to be a short chain of small, boring steps once you commit to writing them down.",
  "Good question. There are a few common patterns people use for this. The most straightforward is to keep state on the server and stream incremental updates to the client over a long-lived connection, which is exactly what tools like ChatGPT do. The trade-off is that you need to think carefully about reconnection, backpressure, and what happens when the client disappears halfway through a response. For a small project, plain server-sent events are usually plenty; you only need anything fancier once you start running into real-world load.",
  "Happy to help. I'd start by sanity-checking the assumption baked into the question, because the framing already implies a particular shape of answer. If we widen the lens a bit, several alternatives appear that might fit your situation better. Of course, the right pick depends on constraints you haven't told me about yet, like how much traffic you expect, whether you care about real-time updates, and how comfortable you are operating the resulting system in production over the long haul.",
  "Absolutely. Think of it like cooking a new dish for the first time: you read the recipe end to end before you start, you lay out all the ingredients, and you make sure you actually have the pan you need. Software is the same. A few minutes of planning up front saves hours of painful refactoring later, and it tends to surface the questions you didn't know you needed to answer. Once the plan exists, the actual implementation is usually the easy part.",
]

export type StreamOptions = {
  signal?: AbortSignal
  minDelayMs?: number
  maxDelayMs?: number
  responseIndex?: number
}

const sleep = (ms: number, signal?: AbortSignal): Promise<void> =>
  new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'))
      return
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    const onAbort = () => {
      clearTimeout(timer)
      reject(new DOMException('Aborted', 'AbortError'))
    }
    signal?.addEventListener('abort', onAbort, { once: true })
  })

const pickResponse = (userPrompt: string, pinned?: number): string => {
  if (pinned !== undefined) {
    return RESPONSES[((pinned % RESPONSES.length) + RESPONSES.length) % RESPONSES.length]!
  }
  // Deterministic-ish pick based on prompt length so identical prompts feel
  // consistent, but different prompts vary.
  const idx = (userPrompt.length + Math.floor(Math.random() * RESPONSES.length)) % RESPONSES.length
  return RESPONSES[idx]!
}

/**
 * Splits text into word+trailing-whitespace tokens so concatenating every
 * yielded chunk reproduces the original string exactly (preserves spacing).
 */
const tokenize = (text: string): string[] => {
  const tokens = text.match(/\S+\s*/g)
  return tokens ?? []
}

export async function* simulateAssistantStream(
  userPrompt: string,
  opts: StreamOptions = {}
): AsyncGenerator<string, void, void> {
  const { signal, minDelayMs = 20, maxDelayMs = 80, responseIndex } = opts
  const text = pickResponse(userPrompt, responseIndex)
  const tokens = tokenize(text)

  for (const token of tokens) {
    if (signal?.aborted) return
    yield token
    const delay = minDelayMs + Math.random() * (maxDelayMs - minDelayMs)
    try {
      await sleep(delay, signal)
    } catch {
      return
    }
  }
}
