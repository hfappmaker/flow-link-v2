"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Realtime } from "ably";
import useSWR from "swr";
import { FileText, SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CHAT_MESSAGE_CREATED_EVENT, getConversationChannelName } from "@/lib/chat-realtime";
import type {
  AvailableChatDocument,
  ChatDocumentKind,
  MessageAttachmentPayload,
} from "@/lib/message-attachments";

type ChatMessage = {
  id: string;
  body: string;
  senderName: string;
  mine: boolean;
  createdAt: string;
  attachments: MessageAttachmentPayload[];
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
  availableDocuments,
}: {
  conversationId: string;
  currentUserId: string;
  isCompanyViewer: boolean;
  availableDocuments: AvailableChatDocument[];
}) {
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const [selectedDocumentKinds, setSelectedDocumentKinds] = useState<ChatDocumentKind[]>([]);
  const [sending, setSending] = useState(false);
  const [realtimeUnavailable, setRealtimeUnavailable] = useState(false);
  const { data, mutate, isLoading } = useSWR<{ messages: ChatMessage[] }>(
    `/api/conversations/${conversationId}/messages`,
    fetcher,
    { refreshInterval: realtimeUnavailable ? 4000 : 0 },
  );
  const bottomRef = useRef<HTMLDivElement>(null);
  const refreshedConversationRef = useRef<string | null>(null);
  const messages = data?.messages ?? [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  useEffect(() => {
    if (isLoading || !data) return;
    if (refreshedConversationRef.current === conversationId) return;

    refreshedConversationRef.current = conversationId;
    router.refresh();
  }, [conversationId, data, isLoading, router]);

  useEffect(() => {
    setRealtimeUnavailable(false);
    refreshedConversationRef.current = null;

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
        attachments: incoming.attachments ?? [],
        senderName: incoming.senderName,
        createdAt: incoming.createdAt,
        mine: isCompanyViewer ? incoming.senderIsCompany : incoming.senderId === currentUserId,
      };

      void mutate((current) => {
        const existing = current?.messages ?? [];
        if (existing.some((m) => m.id === chatMessage.id)) return current;
        return { messages: [...existing, chatMessage] };
      }, { revalidate: false });

      if (!chatMessage.mine) {
        void mutate().then(() => {
          router.refresh();
        });
      }
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
  }, [conversationId, currentUserId, isCompanyViewer, mutate, router]);

  async function send() {
    const body = draft.trim();
    if ((!body && selectedDocumentKinds.length === 0) || sending) return;
    setSending(true);
    setDraft("");
    const documentKinds = selectedDocumentKinds;
    setSelectedDocumentKinds([]);
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, documentKinds }),
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

  function toggleDocument(kind: ChatDocumentKind) {
    setSelectedDocumentKinds((current) =>
      current.includes(kind) ? current.filter((value) => value !== kind) : [...current, kind],
    );
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
                {m.attachments.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {m.attachments.map((attachment) => (
                      <a
                        key={attachment.id}
                        href={attachment.downloadUrl}
                        className={cn(
                          "flex max-w-full items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold",
                          m.mine
                            ? "border-white/25 bg-white/10 text-white hover:bg-white/15"
                            : "border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700",
                        )}
                      >
                        <FileText className="h-4 w-4 shrink-0" />
                        <span>{attachment.label}</span>
                        <span className={cn("min-w-0 truncate", m.mine ? "text-blue-50" : "text-slate-500")}>
                          {attachment.fileName}
                        </span>
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-slate-200 bg-white p-3">
        {!isCompanyViewer && availableDocuments.length > 0 ? (
          <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs font-bold text-amber-900">このメッセージに添付する書類</p>
            <p className="mt-1 text-xs leading-relaxed text-amber-800">
              選択した書類だけが、このチャット相手の企業に共有されます。
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {availableDocuments.map((document) => {
                const checked = selectedDocumentKinds.includes(document.kind);
                return (
                  <button
                    key={document.kind}
                    type="button"
                    onClick={() => toggleDocument(document.kind)}
                    className={cn(
                      "inline-flex max-w-full items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-semibold",
                      checked
                        ? "border-blue-500 bg-blue-600 text-white"
                        : "border-amber-200 bg-white text-amber-900 hover:border-blue-300 hover:text-blue-700",
                    )}
                  >
                    <FileText className="h-3.5 w-3.5 shrink-0" />
                    <span>{document.label}</span>
                    <span className={cn("min-w-0 max-w-40 truncate", checked ? "text-blue-50" : "text-amber-700")}>
                      {document.fileName}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
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
          <Button type="submit" disabled={sending || (draft.trim().length === 0 && selectedDocumentKinds.length === 0)}>
            <SendHorizontal className="h-4 w-4" />
            送信
          </Button>
        </form>
      </div>
    </div>
  );
}
