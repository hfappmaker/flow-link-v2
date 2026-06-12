"use client";

import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ChatMessage = {
  id: string;
  body: string;
  senderName: string;
  mine: boolean;
  createdAt: string;
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function ChatRoom({ conversationId }: { conversationId: string }) {
  const { data, mutate, isLoading } = useSWR<{ messages: ChatMessage[] }>(
    `/api/conversations/${conversationId}/messages`,
    fetcher,
    { refreshInterval: 4000 },
  );
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messages = data?.messages ?? [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  async function send() {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setDraft("");
    try {
      await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      await mutate();
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
                {m.body}
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
