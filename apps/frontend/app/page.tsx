"use client";

import type { FormEvent, KeyboardEvent, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

const conversations = [
  { title: "Launch narrative", meta: "Today", active: true },
  { title: "Landing page polish", meta: "Today" },
  { title: "Pricing objection map", meta: "Yesterday" },
  { title: "Support inbox summary", meta: "Monday" },
  { title: "Investor update draft", meta: "Apr 28" },
  { title: "Voice and tone audit", meta: "Apr 24" },
];

const messages: Array<{
  role: "assistant" | "user";
  name: string;
  meta: string;
  body: ReactNode;
}> = [
  {
    role: "user",
    name: "You",
    meta: "10:08",
    body: (
      <p>
        Help me sharpen the product launch narrative. The audience is busy,
        skeptical, and mostly wants to know why this matters now.
      </p>
    ),
  },
  {
    role: "assistant",
    name: "Chat app",
    meta: "10:09",
    body: (
      <>
        <p>
          I would make the story quieter and more specific. Lead with the cost
          of the current workflow, then show the product as the cleanest path
          out of that friction.
        </p>
        <div className="grid gap-2 sm:grid-cols-3">
          {["Current drag", "New behavior", "Measurable lift"].map((item) => (
            <div
              className="rounded-md border border-[#d9d8cf] bg-[#fbfaf5] p-3"
              key={item}
            >
              <p className="text-xs font-medium uppercase text-[#73776e]">
                Step
              </p>
              <p className="mt-1 text-sm font-semibold text-[#242620]">
                {item}
              </p>
            </div>
          ))}
        </div>
      </>
    ),
  },
  {
    role: "user",
    name: "You",
    meta: "10:13",
    body: <p>Can you make it feel more executive-ready and less campaigny?</p>,
  },
  {
    role: "assistant",
    name: "Chat app",
    meta: "10:14",
    body: (
      <>
        <p>
          Yes. Use less promise language and more operating language. The frame
          becomes: teams are losing signal in scattered work, and this gives
          leaders one reliable surface for decisions.
        </p>
        <blockquote className="border-l-2 border-[#2c7a58] pl-4 text-[#393c35]">
          The launch is not about adding another workspace. It is about giving
          teams a calmer way to turn fragmented conversations into decisions
          that hold up under pressure.
        </blockquote>
      </>
    ),
  },
];

type LocalMessage = {
  id: string;
  text: string;
  meta: string;
};

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
  thumb: (
    <>
      <path d="M7 10v10" />
      <path d="M11 10V5a3 3 0 0 1 3 3v2h4a2 2 0 0 1 2 2l-1 6a2 2 0 0 1-2 2H7" />
      <path d="M3 10h4v10H3z" />
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
}: {
  label: string;
  icon: IconName;
  className?: string;
}) {
  return (
    <button
      aria-label={label}
      className={`grid h-9 w-9 place-items-center rounded-md border border-[#dddcd2] bg-[#fbfaf5] text-[#555950] transition hover:border-[#c8c7bd] hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c7a58] ${className}`}
      title={label}
      type="button"
    >
      <Icon name={icon} />
    </button>
  );
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function Home() {
  const [draft, setDraft] = useState("");
  const [localMessages, setLocalMessages] = useState<LocalMessage[]>([]);
  const threadEndRef = useRef<HTMLDivElement>(null);
  const canSend = draft.trim().length > 0;

  useEffect(() => {
    if (localMessages.length === 0) {
      return;
    }

    threadEndRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [localMessages]);

  function submitMessage() {
    const text = draft.trim();

    if (!text) {
      return;
    }

    setLocalMessages((currentMessages) => [
      ...currentMessages,
      {
        id: `${Date.now()}-${currentMessages.length}`,
        text,
        meta: formatTime(new Date()),
      },
    ]);
    setDraft("");
  }

  function handleComposerSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submitMessage();
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submitMessage();
    }
  }

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
              className="flex h-10 w-full items-center gap-2 rounded-md bg-[#f1f0e8] px-3 text-sm font-semibold text-[#181b16] transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d9f2cf]"
              type="button"
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
            {conversations.map((conversation) => (
              <button
                className={`flex w-full items-start justify-between gap-3 rounded-md px-3 py-2 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d9f2cf] ${
                  conversation.active
                    ? "bg-[#f1f0e8] text-[#181b16]"
                    : "text-[#d6d8d0] hover:bg-white/10 hover:text-white"
                }`}
                key={conversation.title}
                type="button"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">
                    {conversation.title}
                  </span>
                  <span
                    className={`mt-0.5 block text-xs ${
                      conversation.active ? "text-[#5f6559]" : "text-[#878d82]"
                    }`}
                  >
                    {conversation.meta}
                  </span>
                </span>
                {conversation.active ? (
                  <span className="mt-1 h-2 w-2 rounded-full bg-[#2c7a58]" />
                ) : null}
              </button>
            ))}
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
                  Launch narrative
                </p>
                <p className="hidden text-xs text-[#74786f] sm:block">
                  Private thread
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
                <div className="mb-7 flex flex-col gap-4 border-b border-[#e2e0d7] pb-6 md:flex-row md:items-end md:justify-between">
                  <div>
                    <div className="mb-3 flex items-center gap-2 text-sm text-[#6f746b]">
                      <span className="grid h-7 w-7 place-items-center rounded-md bg-[#d9f2cf] text-[#17391e]">
                        <Icon name="spark" className="h-4 w-4" />
                      </span>
                      <span>Active conversation</span>
                    </div>
                    <h1 className="text-2xl font-semibold leading-8 text-[#1d201b] md:text-3xl md:leading-10">
                      Shape the launch story into a clear executive narrative.
                    </h1>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {["Focused", "Private", "Draft"].map((item) => (
                      <span
                        className="rounded-md border border-[#dddcd2] bg-[#fbfaf5] px-3 py-1.5 text-xs font-medium text-[#555950]"
                        key={item}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  {messages.map((message, index) => (
                    <article
                      className={`flex gap-3 ${
                        message.role === "user" ? "justify-end" : ""
                      }`}
                      key={`${message.name}-${index}`}
                    >
                      {message.role === "assistant" ? (
                        <div className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-md bg-[#d9f2cf] text-sm font-bold text-[#17391e]">
                          C
                        </div>
                      ) : null}

                      <div
                        className={`max-w-[min(720px,100%)] ${
                          message.role === "user"
                            ? "rounded-lg bg-[#20251f] px-4 py-3 text-white shadow-sm"
                            : "text-[#2d302a]"
                        }`}
                      >
                        <div
                          className={`mb-2 flex items-center gap-2 text-xs ${
                            message.role === "user"
                              ? "text-[#cfd6cc]"
                              : "text-[#777c72]"
                          }`}
                        >
                          <span className="font-semibold">{message.name}</span>
                          <span>{message.meta}</span>
                        </div>
                        <div className="space-y-4 text-[15px] leading-7">
                          {message.body}
                        </div>

                        {message.role === "assistant" ? (
                          <div className="mt-3 flex items-center gap-1.5 text-[#777c72]">
                            {[
                              { icon: "copy" as const, label: "Copy" },
                              { icon: "rotate" as const, label: "Regenerate" },
                              { icon: "thumb" as const, label: "Good response" },
                              { icon: "more" as const, label: "More" },
                            ].map((action) => (
                              <button
                                aria-label={action.label}
                                className="grid h-8 w-8 place-items-center rounded-md transition hover:bg-[#eeece3] hover:text-[#242620] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c7a58]"
                                key={action.label}
                                title={action.label}
                                type="button"
                              >
                                <Icon name={action.icon} className="h-3.5 w-3.5" />
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>

                      {message.role === "user" ? (
                        <div className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-md bg-[#f8c77e] text-sm font-bold text-[#3e2507]">
                          J
                        </div>
                      ) : null}
                    </article>
                  ))}

                  {localMessages.map((message) => (
                    <article className="flex justify-end gap-3" key={message.id}>
                      <div className="max-w-[min(720px,100%)] rounded-lg bg-[#20251f] px-4 py-3 text-white shadow-sm">
                        <div className="mb-2 flex items-center gap-2 text-xs text-[#cfd6cc]">
                          <span className="font-semibold">You</span>
                          <span>{message.meta}</span>
                        </div>
                        <p className="whitespace-pre-wrap text-[15px] leading-7">
                          {message.text}
                        </p>
                      </div>
                      <div className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-md bg-[#f8c77e] text-sm font-bold text-[#3e2507]">
                        J
                      </div>
                    </article>
                  ))}

                  {localMessages.length === 0 ? (
                    <article className="flex gap-3">
                      <div className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-md bg-[#d9f2cf] text-sm font-bold text-[#17391e]">
                        C
                      </div>
                      <div>
                        <div className="mb-2 flex items-center gap-2 text-xs text-[#777c72]">
                          <span className="font-semibold">Chat app</span>
                          <span>typing</span>
                        </div>
                        <div className="flex h-10 items-center gap-1 rounded-lg border border-[#dddcd2] bg-[#fbfaf5] px-4">
                          <span className="h-2 w-2 rounded-full bg-[#2c7a58]" />
                          <span className="h-2 w-2 rounded-full bg-[#8ab69b]" />
                          <span className="h-2 w-2 rounded-full bg-[#c7d8c5]" />
                        </div>
                      </div>
                    </article>
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
                    className="min-h-24 w-full resize-none bg-transparent px-4 py-4 text-[15px] leading-6 text-[#242620] outline-none placeholder:text-[#8a8e84]"
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={handleComposerKeyDown}
                    placeholder="Ask anything"
                    value={draft}
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
