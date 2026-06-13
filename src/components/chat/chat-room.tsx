"use client";

import { useEffect, useRef, useState } from "react";
import { Realtime } from "ably";
import useSWR from "swr";
import { SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CHAT_MESSAGE_CREATED_EVENT, getConversationChannelName } from "@/lib/chat-realtime";

type ChatMessage = {
  id: string;
  body: string;
  senderName: string;
  mine: boolean;
  createdAt: string;
};

type RealtimeChatMessage = Omit<ChatMessage, "mine"> & {
  senderId: string;
  senderIsCompany: boolean;
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const urlPattern = /https?:\/\/[^\s<>"']+/g;
const trailingUrlPunctuationPattern = /[).,!?;:、。）」』】]+$/;

function splitTrailingPunctuation(value: string) {
  const match = value.match(trailingUrlPunctuationPattern);
  if (!match) return { href: value, trailing: "" };

  const trailing = match[0];
  return {
    href: value.slice(0, -trailing.length),
    trailing,
  };
}

function MessageBody({ body, mine }: { body: string; mine: boolean }) {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  for (const match of body.matchAll(urlPattern)) {
    const rawUrl = match[0];
    const index = match.index ?? 0;
    if (index > lastIndex) parts.push(body.slice(lastIndex, index));

    const { href, trailing } = splitTrailingPunctuation(rawUrl);
    parts.push(
      <a
        key={`${href}-${index}`}
        href={href}
        target="_blank"
        rel="noreferrer"
        className={cn("break-all underline underline-offset-2", mine ? "text-white" : "text-blue-600")}
      >
        {href}
      </a>,
    );
    if (trailing) parts.push(trailing);

    lastIndex = index + rawUrl.length;
  }

  if (lastIndex < body.length) parts.push(body.slice(lastIndex));

  return <>{parts.length > 0 ? parts : body}</>;
}

export function ChatRoom({
  conversationId,
  currentUserId,
  isCompanyViewer,
}: {
  conversationId: string;
  currentUserId: string;
  isCompanyViewer: boolean;
}) {
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [realtimeUnavailable, setRealtimeUnavailable] = useState(false);
  const { data, mutate, isLoading } = useSWR<{ messages: ChatMessage[] }>(
    `/api/conversations/${conversationId}/messages`,
    fetcher,
    { refreshInterval: realtimeUnavailable ? 4000 : 0 },
  );
  const bottomRef = useRef<HTMLDivElement>(null);
  const messages = data?.messages ?? [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  useEffect(() => {
    setRealtimeUnavailable(false);

    const ably = new Realtime({
      authUrl: `/api/ably/auth?conversationId=${encodeURIComponent(conversationId)}`,
      authMethod: "GET",
    });
    const channel = ably.channels.get(getConversationChannelName(conversationId));
    let closed = false;

    void channel.subscribe(CHAT_MESSAGE_CREATED_EVENT, (message) => {
      const incoming = message.data as RealtimeChatMessage;
      const chatMessage: ChatMessage = {
        id: incoming.id,
        body: incoming.body,
        senderName: incoming.senderName,
        createdAt: incoming.createdAt,
        mine: isCompanyViewer ? incoming.senderIsCompany : incoming.senderId === currentUserId,
      };

      void mutate((current) => {
        const existing = current?.messages ?? [];
        if (existing.some((m) => m.id === chatMessage.id)) return current;
        return { messages: [...existing, chatMessage] };
      }, { revalidate: false });
    }).catch(() => {
      if (!closed) {
        setRealtimeUnavailable(true);
        void mutate();
      }
    });

    ably.connection.on("failed", () => {
      if (!closed) {
        setRealtimeUnavailable(true);
        void mutate();
      }
    });

    return () => {
      closed = true;
      channel.unsubscribe();
      ably.close();
    };
  }, [conversationId, currentUserId, isCompanyViewer, mutate]);

  async function send() {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setDraft("");
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (!response.ok) throw new Error("Failed to send message");
      const result = (await response.json()) as { message?: ChatMessage };
      if (result.message) {
        await mutate((current) => {
          const existing = current?.messages ?? [];
          if (existing.some((m) => m.id === result.message?.id)) return current;
          return { messages: [...existing, result.message as ChatMessage] };
        }, { revalidate: false });
      } else {
        await mutate();
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5">
        {isLoading && messages.length === 0 ? (
          <p className="text-center text-sm text-slate-400">読み込み中...</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-slate-400">まだメッセージはありません</p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={cn("flex flex-col gap-1", m.mine ? "items-end" : "items-start")}>
              <span className="px-1 text-xs text-slate-400">
                {m.senderName}・
                {new Date(m.createdAt).toLocaleString("ja-JP", {
                  month: "numeric",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
                  m.mine
                    ? "rounded-br-sm bg-blue-600 text-white"
                    : "rounded-bl-sm border border-slate-200 bg-white text-slate-800",
                )}
              >
                <MessageBody body={m.body} mine={m.mine} />
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-slate-200 bg-white p-3">
        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                void send();
              }
            }}
            rows={2}
            placeholder="メッセージを入力（Ctrl+Enterで送信）"
            className="flex-1 resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
          <Button type="submit" disabled={sending || draft.trim().length === 0}>
            <SendHorizontal className="h-4 w-4" />
            送信
          </Button>
        </form>
      </div>
    </div>
  );
}
