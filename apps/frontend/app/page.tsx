"use client";

import type { FormEvent, KeyboardEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createConversation as apiCreateConversation,
  deleteConversation as apiDeleteConversation,
  getConversation as apiGetConversation,
  listConversations as apiListConversations,
  streamAssistantReply,
  type Conversation,
  type Message,
} from "./lib/chat-api";

const icons = {
  archive: (
    <>
      <path d="M4 7h16" />
      <path d="M6 7v11h12V7" />
      <path d="M9 11h6" />
      <path d="M7 4h10l1 3H6z" />
    </>
  ),
  arrowUp: (
    <>
      <path d="M12 19V5" />
      <path d="m5 12 7-7 7 7" />
    </>
  ),
  attach: (
    <path d="m21 11-8.4 8.4a5 5 0 0 1-7.1-7.1l9.2-9.2a3.5 3.5 0 0 1 5 5l-9.3 9.3a2 2 0 0 1-2.8-2.8L16 6.2" />
  ),
  chevronDown: <path d="m6 9 6 6 6-6" />,
  copy: (
    <>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </>
  ),
  edit: (
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a14 14 0 0 1 0 18" />
      <path d="M12 3a14 14 0 0 0 0 18" />
    </>
  ),
  library: (
    <>
      <path d="M6 4v16" />
      <path d="M10 4v16" />
      <path d="m14 5 4 14" />
    </>
  ),
  menu: (
    <>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </>
  ),
  mic: (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v3" />
    </>
  ),
  more: (
    <>
      <circle cx="5" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
    </>
  ),
  panel: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M9 4v16" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),
  rotate: (
    <>
      <path d="M21 12a9 9 0 1 1-2.6-6.4" />
      <path d="M21 4v6h-6" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.4-3.4" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1A2 2 0 1 1 4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.4 7A2 2 0 1 1 7.2 4.2l.1.1a1.7 1.7 0 0 0 1.9.3h.1a1.7 1.7 0 0 0 1-1.6V3a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 1 1.6h.1a1.7 1.7 0 0 0 1.9-.3l.1-.1A2 2 0 1 1 20 7.2l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.6 1H21a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.4.7Z" />
    </>
  ),
  spark: (
    <>
      <path d="m12 3 1.7 5.2L19 10l-5.3 1.8L12 17l-1.7-5.2L5 10l5.3-1.8Z" />
      <path d="m19 15 .7 2.1L22 18l-2.3.9L19 21l-.7-2.1L16 18l2.3-.9Z" />
    </>
  ),
  stop: <rect x="7" y="7" width="10" height="10" rx="1.5" />,
  thumb: (
    <>
      <path d="M7 10v10" />
      <path d="M11 10V5a3 3 0 0 1 3 3v2h4a2 2 0 0 1 2 2l-1 6a2 2 0 0 1-2 2H7" />
      <path d="M3 10h4v10H3z" />
    </>
  ),
  trash: (
    <>
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </>
  ),
};

type IconName = keyof typeof icons;

function Icon({
  name,
  className = "h-4 w-4",
}: {
  name: IconName;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      {icons[name]}
    </svg>
  );
}

function IconButton({
  label,
  icon,
  className = "",
  onClick,
}: {
  label: string;
  icon: IconName;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <button
      aria-label={label}
      className={`grid h-9 w-9 place-items-center rounded-md border border-[#dddcd2] bg-[#fbfaf5] text-[#555950] transition hover:border-[#c8c7bd] hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c7a58] ${className}`}
      title={label}
      type="button"
      onClick={onClick}
    >
      <Icon name={icon} />
    </button>
  );
}

function formatClock(date: Date) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatRelativeDay(timestamp: number) {
  const now = Date.now();
  const date = new Date(timestamp);
  const today = new Date(now);
  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  ).getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  if (timestamp >= startOfToday) return "Today";
  if (timestamp >= startOfToday - dayMs) return "Yesterday";
  if (timestamp >= startOfToday - 6 * dayMs) {
    return new Intl.DateTimeFormat(undefined, { weekday: "long" }).format(date);
  }
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(date);
}

type StreamingState = {
  conversationId: string;
  draftAssistantContent: string;
};

export default function Home() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [messagesByConversation, setMessagesByConversation] = useState<
    Record<string, Message[]>
  >({});
  const [draft, setDraft] = useState("");
  const [streaming, setStreaming] = useState<StreamingState | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  const threadEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const activeConversation = useMemo(
    () =>
      conversations.find((c) => c.id === activeConversationId) ?? null,
    [conversations, activeConversationId],
  );
  const activeMessages = activeConversationId
    ? (messagesByConversation[activeConversationId] ?? [])
    : [];
  const isStreamingActive =
    streaming !== null && streaming.conversationId === activeConversationId;
  const canSend =
    draft.trim().length > 0 && !!activeConversationId && !isStreamingActive;

  const refreshConversations = useCallback(async () => {
    const list = await apiListConversations();
    setConversations(list);
    return list;
  }, []);

  const ensureMessagesLoaded = useCallback(
    async (conversationId: string) => {
      if (messagesByConversation[conversationId]) return;
      const data = await apiGetConversation(conversationId);
      setMessagesByConversation((prev) => ({
        ...prev,
        [conversationId]: data.messages,
      }));
    },
    [messagesByConversation],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await refreshConversations();
        if (cancelled) return;
        if (list.length === 0) {
          const created = await apiCreateConversation();
          if (cancelled) return;
          setConversations([created]);
          setActiveConversationId(created.id);
          setMessagesByConversation((prev) => ({ ...prev, [created.id]: [] }));
        } else {
          setActiveConversationId(list[0]!.id);
          await ensureMessagesLoaded(list[0]!.id);
        }
      } catch (err) {
        if (!cancelled) {
          setErrorMessage(
            err instanceof Error ? err.message : "Failed to load chats",
          );
        }
      } finally {
        if (!cancelled) setIsHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshConversations, ensureMessagesLoaded]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [activeMessages.length, streaming?.draftAssistantContent]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const handleSelectConversation = useCallback(
    async (id: string) => {
      if (id === activeConversationId) return;
      setActiveConversationId(id);
      try {
        await ensureMessagesLoaded(id);
      } catch (err) {
        setErrorMessage(
          err instanceof Error ? err.message : "Failed to load conversation",
        );
      }
    },
    [activeConversationId, ensureMessagesLoaded],
  );

  const handleNewChat = useCallback(async () => {
    if (streaming) return;
    try {
      const created = await apiCreateConversation();
      setConversations((prev) => [created, ...prev]);
      setMessagesByConversation((prev) => ({ ...prev, [created.id]: [] }));
      setActiveConversationId(created.id);
      setDraft("");
      setErrorMessage(null);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to create chat",
      );
    }
  }, [streaming]);

  const handleDeleteConversation = useCallback(
    async (id: string, event: React.MouseEvent) => {
      event.stopPropagation();
      if (streaming?.conversationId === id) {
        abortRef.current?.abort();
      }
      try {
        await apiDeleteConversation(id);
      } catch (err) {
        setErrorMessage(
          err instanceof Error ? err.message : "Failed to delete chat",
        );
        return;
      }
      setMessagesByConversation((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setConversations((prev) => {
        const next = prev.filter((c) => c.id !== id);
        if (id === activeConversationId) {
          setActiveConversationId(next[0]?.id ?? null);
        }
        return next;
      });
    },
    [activeConversationId, streaming],
  );

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const submitMessage = useCallback(async () => {
    const text = draft.trim();
    if (!text || !activeConversationId || streaming) return;

    const conversationId = activeConversationId;
    setDraft("");
    setErrorMessage(null);

    const optimisticUserMessage: Message = {
      id: `local-user-${Date.now()}`,
      conversationId,
      role: "user",
      content: text,
      createdAt: Date.now(),
    };
    setMessagesByConversation((prev) => ({
      ...prev,
      [conversationId]: [
        ...(prev[conversationId] ?? []),
        optimisticUserMessage,
      ],
    }));

    setStreaming({ conversationId, draftAssistantContent: "" });

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await streamAssistantReply(conversationId, text, {
        signal: controller.signal,
        onDelta: (chunk) => {
          setStreaming((prev) =>
            prev && prev.conversationId === conversationId
              ? {
                  ...prev,
                  draftAssistantContent: prev.draftAssistantContent + chunk,
                }
              : prev,
          );
        },
      });
    } catch (err) {
      const aborted =
        controller.signal.aborted ||
        (err instanceof DOMException && err.name === "AbortError");
      if (!aborted) {
        setErrorMessage(
          err instanceof Error ? err.message : "Streaming failed",
        );
      }
    } finally {
      try {
        const fresh = await apiGetConversation(conversationId);
        setMessagesByConversation((prev) => ({
          ...prev,
          [conversationId]: fresh.messages,
        }));
        setConversations((prev) => {
          const others = prev.filter((c) => c.id !== conversationId);
          return [fresh.conversation, ...others];
        });
      } catch {}
      setStreaming(null);
      if (abortRef.current === controller) abortRef.current = null;
    }
  }, [activeConversationId, draft, streaming]);

  const handleComposerSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submitMessage();
  };

  const handleComposerKeyDown = (
    event: KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submitMessage();
    }
  };

  const showEmptyThread =
    isHydrated &&
    !!activeConversationId &&
    activeMessages.length === 0 &&
    !isStreamingActive;

  return (
    <main className="h-[100svh] overflow-hidden bg-[#f6f5ef] text-[#20221f]">
      <div className="flex h-full min-h-0">
        <aside className="hidden w-72 shrink-0 flex-col border-r border-[#252922] bg-[#141712] text-[#f5f4ec] lg:flex">
          <div className="flex h-16 items-center gap-3 border-b border-white/10 px-4">
            <div className="grid h-9 w-9 place-items-center rounded-md bg-[#d9f2cf] text-sm font-bold text-[#18321d]">
              C
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">Chat App</p>
              <p className="text-xs text-[#a7aca2]">Personal workspace</p>
            </div>
          </div>

          <div className="space-y-2 p-3">
            <button
              className="flex h-10 w-full items-center gap-2 rounded-md bg-[#f1f0e8] px-3 text-sm font-semibold text-[#181b16] transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d9f2cf] disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
              onClick={() => void handleNewChat()}
              disabled={streaming !== null}
            >
              <Icon name="plus" />
              New chat
            </button>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: "search" as const, label: "Search" },
                { icon: "library" as const, label: "Library" },
              ].map((item) => (
                <button
                  className="flex h-10 items-center justify-center gap-2 rounded-md border border-white/10 bg-white/[0.04] text-sm text-[#d9dbd3] transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d9f2cf]"
                  key={item.label}
                  type="button"
                >
                  <Icon name={item.icon} />
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <nav
            aria-label="Conversation history"
            className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pb-4"
          >
            <p className="px-3 pb-2 pt-3 text-xs font-medium text-[#858b80]">
              Recent
            </p>
            {conversations.length === 0 ? (
              <p className="px-3 py-4 text-xs text-[#858b80]">
                {isHydrated ? "No conversations yet." : "Loading…"}
              </p>
            ) : null}
            {conversations.map((conversation) => {
              const isActive = conversation.id === activeConversationId;
              return (
                <div
                  key={conversation.id}
                  className={`group relative flex w-full items-start gap-2 rounded-md transition ${
                    isActive
                      ? "bg-[#f1f0e8] text-[#181b16]"
                      : "text-[#d6d8d0] hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <button
                    className="flex min-w-0 flex-1 items-start justify-between gap-3 rounded-md px-3 py-2 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d9f2cf]"
                    onClick={() => void handleSelectConversation(conversation.id)}
                    type="button"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">
                        {conversation.title}
                      </span>
                      <span
                        className={`mt-0.5 block text-xs ${
                          isActive ? "text-[#5f6559]" : "text-[#878d82]"
                        }`}
                      >
                        {formatRelativeDay(conversation.updatedAt)}
                      </span>
                    </span>
                    {isActive ? (
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#2c7a58]" />
                    ) : null}
                  </button>
                  <button
                    aria-label="Delete chat"
                    title="Delete chat"
                    type="button"
                    onClick={(event) =>
                      void handleDeleteConversation(conversation.id, event)
                    }
                    className={`mr-1 mt-1.5 grid h-7 w-7 shrink-0 place-items-center rounded-md text-current transition opacity-0 group-hover:opacity-100 hover:bg-black/10 focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d9f2cf] ${
                      isActive ? "text-[#5f6559]" : "text-[#a7aca2]"
                    }`}
                  >
                    <Icon name="trash" className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </nav>

          <div className="border-t border-white/10 p-3">
            <button
              className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d9f2cf]"
              type="button"
            >
              <div className="grid h-9 w-9 place-items-center rounded-md bg-[#f8c77e] text-sm font-bold text-[#3e2507]">
                J
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">Jacques</p>
                <p className="text-xs text-[#a7aca2]">Pro workspace</p>
              </div>
              <Icon name="settings" className="h-4 w-4 text-[#a7aca2]" />
            </button>
          </div>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <header className="flex h-16 shrink-0 items-center justify-between border-b border-[#dfded5] bg-[#fbfaf5]/95 px-3 backdrop-blur md:px-6">
            <div className="flex min-w-0 items-center gap-2">
              <IconButton
                className="lg:hidden"
                icon="menu"
                label="Open sidebar"
              />
              <button
                className="hidden h-9 items-center gap-2 rounded-md border border-[#dddcd2] bg-[#fbfaf5] px-3 text-sm font-semibold text-[#252822] transition hover:border-[#c8c7bd] hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c7a58] sm:flex"
                type="button"
              >
                Chat App
                <Icon name="chevronDown" className="h-3.5 w-3.5" />
              </button>
              <div className="min-w-0 px-1">
                <p className="truncate text-sm font-semibold text-[#242620]">
                  {activeConversation?.title ?? "Chat App"}
                </p>
                <p className="hidden text-xs text-[#74786f] sm:block">
                  {isStreamingActive ? "Streaming response…" : "Private thread"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <IconButton icon="panel" label="Toggle sidebar" />
              <button
                className="hidden h-9 items-center gap-2 rounded-md border border-[#dddcd2] bg-[#fbfaf5] px-3 text-sm font-semibold text-[#252822] transition hover:border-[#c8c7bd] hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c7a58] sm:flex"
                type="button"
              >
                <Icon name="spark" />
                Share
              </button>
              <button
                aria-label="Account"
                className="grid h-9 w-9 place-items-center rounded-md bg-[#1f251f] text-sm font-bold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c7a58]"
                title="Account"
                type="button"
              >
                J
              </button>
            </div>
          </header>

          <section className="min-h-0 flex-1 overflow-hidden">
            <div className="mx-auto flex h-full min-h-0 max-w-5xl flex-col px-4 md:px-8">
              <div className="min-h-0 flex-1 overflow-y-auto py-6 md:py-8">
                {errorMessage ? (
                  <div
                    role="alert"
                    className="mb-4 flex items-start justify-between gap-3 rounded-md border border-[#e6c2bd] bg-[#fbeae6] px-4 py-3 text-sm text-[#7a2c1f]"
                  >
                    <span>{errorMessage}</span>
                    <button
                      type="button"
                      className="text-xs font-semibold uppercase tracking-wide text-[#7a2c1f] hover:underline"
                      onClick={() => setErrorMessage(null)}
                    >
                      Dismiss
                    </button>
                  </div>
                ) : null}

                <div className="space-y-6">
                  {showEmptyThread ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center text-[#74786f]">
                      <span className="grid h-12 w-12 place-items-center rounded-md bg-[#d9f2cf] text-[#17391e]">
                        <Icon name="spark" className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-base font-semibold text-[#242620]">
                          Start a new conversation
                        </p>
                        <p className="text-sm">
                          Type your first message below and the response will
                          stream in.
                        </p>
                      </div>
                    </div>
                  ) : null}

                  {activeMessages.map((message) => (
                    <MessageRow key={message.id} message={message} />
                  ))}

                  {isStreamingActive ? (
                    <StreamingAssistantRow
                      content={streaming!.draftAssistantContent}
                    />
                  ) : null}

                  <div ref={threadEndRef} />
                </div>
              </div>

              <footer className="sticky bottom-0 z-10 shrink-0 bg-[#f6f5ef] pb-4 pt-3 md:pb-6">
                <form
                  className="rounded-lg border border-[#d8d7cd] bg-[#fffefa] shadow-[0_16px_40px_rgba(31,34,28,0.10)]"
                  onSubmit={handleComposerSubmit}
                >
                  <textarea
                    aria-label="Message"
                    className="min-h-24 w-full resize-none bg-transparent px-4 py-4 text-[15px] leading-6 text-[#242620] outline-none placeholder:text-[#8a8e84] disabled:opacity-60"
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={handleComposerKeyDown}
                    placeholder={
                      isStreamingActive
                        ? "Streaming response…"
                        : "Ask anything"
                    }
                    value={draft}
                    disabled={isStreamingActive || !activeConversationId}
                  />
                  <div className="flex items-center justify-between gap-3 border-t border-[#e6e4dc] px-3 py-3">
                    <div className="flex min-w-0 items-center gap-1.5">
                      {[
                        { icon: "attach" as const, label: "Attach" },
                        { icon: "globe" as const, label: "Browse" },
                        { icon: "mic" as const, label: "Voice" },
                      ].map((item) => (
                        <button
                          aria-label={item.label}
                          className="grid h-9 w-9 place-items-center rounded-md text-[#60655c] transition hover:bg-[#eeece3] hover:text-[#242620] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c7a58]"
                          key={item.label}
                          title={item.label}
                          type="button"
                        >
                          <Icon name={item.icon} />
                        </button>
                      ))}
                      <button
                        className="hidden h-9 items-center gap-2 rounded-md border border-[#dddcd2] px-3 text-sm font-medium text-[#555950] transition hover:bg-[#eeece3] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c7a58] sm:flex"
                        type="button"
                      >
                        <Icon name="spark" />
                        Deep think
                      </button>
                    </div>

                    {isStreamingActive ? (
                      <button
                        aria-label="Stop generating"
                        title="Stop generating"
                        type="button"
                        onClick={handleStop}
                        className="grid h-10 w-10 place-items-center rounded-md bg-[#1f251f] text-white shadow-sm transition hover:bg-[#2d352d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c7a58]"
                      >
                        <Icon name="stop" className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        aria-label="Send message"
                        className={`grid h-10 w-10 place-items-center rounded-md text-white shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c7a58] ${
                          canSend
                            ? "bg-[#1f251f] hover:bg-[#2d352d]"
                            : "cursor-not-allowed bg-[#9ea49b]"
                        }`}
                        disabled={!canSend}
                        title="Send message"
                        type="submit"
                      >
                        <Icon name="arrowUp" className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </form>
              </footer>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function MessageRow({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const meta = formatClock(new Date(message.createdAt));
  return (
    <article className={`flex gap-3 ${isUser ? "justify-end" : ""}`}>
      {!isUser ? (
        <div className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-md bg-[#d9f2cf] text-sm font-bold text-[#17391e]">
          C
        </div>
      ) : null}

      <div
        className={`max-w-[min(720px,100%)] ${
          isUser
            ? "rounded-lg bg-[#20251f] px-4 py-3 text-white shadow-sm"
            : "text-[#2d302a]"
        }`}
      >
        <div
          className={`mb-2 flex items-center gap-2 text-xs ${
            isUser ? "text-[#cfd6cc]" : "text-[#777c72]"
          }`}
        >
          <span className="font-semibold">{isUser ? "You" : "Chat app"}</span>
          <span>{meta}</span>
        </div>
        <p className="whitespace-pre-wrap text-[15px] leading-7">
          {message.content}
        </p>
      </div>

      {isUser ? (
        <div className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-md bg-[#f8c77e] text-sm font-bold text-[#3e2507]">
          J
        </div>
      ) : null}
    </article>
  );
}

function StreamingAssistantRow({ content }: { content: string }) {
  const hasContent = content.length > 0;
  return (
    <article className="flex gap-3" aria-live="polite" aria-busy="true">
      <div className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-md bg-[#d9f2cf] text-sm font-bold text-[#17391e]">
        C
      </div>
      <div className="max-w-[min(720px,100%)] text-[#2d302a]">
        <div className="mb-2 flex items-center gap-2 text-xs text-[#777c72]">
          <span className="font-semibold">Chat app</span>
          <span>typing…</span>
        </div>
        {hasContent ? (
          <p className="whitespace-pre-wrap text-[15px] leading-7">
            {content}
            <span
              aria-hidden="true"
              className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] animate-pulse bg-[#2c7a58] align-middle"
            />
          </p>
        ) : (
          <div
            role="status"
            aria-label="Assistant is preparing a reply"
            className="flex h-10 items-center gap-1 rounded-lg border border-[#dddcd2] bg-[#fbfaf5] px-4"
          >
            <span className="h-2 w-2 animate-typing-dot rounded-full bg-[#2c7a58] [animation-delay:0ms]" />
            <span className="h-2 w-2 animate-typing-dot rounded-full bg-[#2c7a58] [animation-delay:150ms]" />
            <span className="h-2 w-2 animate-typing-dot rounded-full bg-[#2c7a58] [animation-delay:300ms]" />
          </div>
        )}
      </div>
    </article>
  );
}
