"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { FileText, Paperclip, SendHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MessageAttachmentPayload } from "@/lib/message-attachments";
import {
  MESSAGE_ATTACHMENT_ACCEPT,
  MESSAGE_ATTACHMENT_ALLOWED_LABEL,
  isAllowedMessageAttachmentFile,
} from "@/lib/message-attachment-rules";

type ChatMessage = {
  id: string;
  body: string;
  senderName: string;
  mine: boolean;
  createdAt: string;
  attachments: MessageAttachmentPayload[];
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const urlPattern = /https?:\/\/[^\s<>"']+/g;
const trailingUrlPunctuationPattern = /[).,!?;:、。）」』】]+$/;
const maxAttachmentCount = 5;
const maxAttachmentBytes = 10 * 1024 * 1024;

function splitTrailingPunctuation(value: string) {
  const match = value.match(trailingUrlPunctuationPattern);
  if (!match) return { href: value, trailing: "" };

  const trailing = match[0];
  return {
    href: value.slice(0, -trailing.length),
    trailing,
  };
}

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)}MB`;
  if (size >= 1024) return `${Math.ceil(size / 1024)}KB`;
  return `${size}B`;
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
}: {
  conversationId: string;
  currentUserId: string;
  isCompanyViewer: boolean;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data, mutate, isLoading } = useSWR<{ messages: ChatMessage[] }>(
    `/api/conversations/${conversationId}/messages`,
    fetcher,
    { refreshInterval: 4000 },
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
    refreshedConversationRef.current = null;
    void mutate();
  }, [conversationId, mutate]);

  function addFiles(files: FileList | null) {
    if (!files) return;
    setFileError(null);
    const nextFiles = [...selectedFiles];

    for (const file of Array.from(files)) {
      if (!isAllowedMessageAttachmentFile(file.name)) {
        setFileError(`添付できるファイル形式は${MESSAGE_ATTACHMENT_ALLOWED_LABEL}のみです`);
        continue;
      }
      if (file.size > maxAttachmentBytes) {
        setFileError("添付できるファイルサイズは1ファイル10MBまでです");
        continue;
      }
      if (nextFiles.length >= maxAttachmentCount) {
        setFileError("一度に添付できるファイルは5件までです");
        break;
      }
      nextFiles.push(file);
    }

    setSelectedFiles(nextFiles);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeFile(index: number) {
    setSelectedFiles((current) => current.filter((_, fileIndex) => fileIndex !== index));
  }

  async function send() {
    const body = draft.trim();
    if ((!body && selectedFiles.length === 0) || sending) return;
    setSending(true);
    setDraft("");
    const files = selectedFiles;
    setSelectedFiles([]);
    setFileError(null);
    try {
      const formData = new FormData();
      formData.set("body", body);
      for (const file of files) {
        formData.append("attachments", file, file.name);
      }

      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        body: formData,
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
      router.refresh();
    } catch {
      setDraft(body);
      setSelectedFiles(files);
      setFileError("送信できませんでした。時間をおいて再度お試しください。");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-1 space-y-4 overflow-x-hidden overflow-y-auto px-4 py-5">
        {isLoading && messages.length === 0 ? (
          <p className="text-center text-sm text-slate-400">読み込み中...</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-slate-400">まだメッセージはありません</p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={cn("flex min-w-0 flex-col gap-1", m.mine ? "items-end" : "items-start")}>
              <span className="max-w-full px-1 text-xs text-slate-400">
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
                  "min-w-0 max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere]",
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
                          "flex max-w-full min-w-0 items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold",
                          m.mine
                            ? "border-white/25 bg-white/10 text-white hover:bg-white/15"
                            : "border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700",
                        )}
                      >
                        <FileText className="h-4 w-4 shrink-0" />
                        <span className="shrink-0">{attachment.label}</span>
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
        {selectedFiles.length > 0 ? (
          <div className="mb-3 flex flex-wrap gap-2">
            {selectedFiles.map((file, index) => (
              <span
                key={`${file.name}-${file.lastModified}-${index}`}
                className="inline-flex max-w-full items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700"
              >
                <FileText className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                <span className="min-w-0 max-w-56 truncate font-semibold">{file.name}</span>
                <span className="shrink-0 text-slate-400">{formatFileSize(file.size)}</span>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                  aria-label={`${file.name}を削除`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
          </div>
        ) : null}
        {fileError ? <p className="mb-2 text-xs font-medium text-red-600">{fileError}</p> : null}
        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={MESSAGE_ATTACHMENT_ACCEPT}
            className="sr-only"
            onChange={(event) => addFiles(event.currentTarget.files)}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-300 text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
            aria-label="ファイルを添付"
            title="ファイルを添付"
          >
            <Paperclip className="h-4 w-4" />
          </button>
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
            placeholder="メッセージを入力"
            className="flex-1 resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
          <Button type="submit" disabled={sending || (draft.trim().length === 0 && selectedFiles.length === 0)}>
            <SendHorizontal className="h-4 w-4" />
            送信
          </Button>
        </form>
      </div>
    </div>
  );
}
