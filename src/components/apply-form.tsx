"use client";

import { useRef, useState, useActionState } from "react";
import { AlertTriangle } from "lucide-react";
import { applyToProject } from "@/lib/actions/applications";
import { Button } from "@/components/ui/button";
import { Label, Textarea } from "@/components/ui/form";

const DEFAULT_MESSAGE = `はじめまして。本案件に応募いたします。

【自己紹介・経歴】

【本案件で活かせる経験・スキル】

【稼働可能時期・稼働日数】
`;

export function ApplyForm({ projectId }: { projectId: string }) {
  const [state, action, pending] = useActionState(applyToProject, {});
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const confirmedRef = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (confirmedRef.current) {
      confirmedRef.current = false;
      return;
    }

    e.preventDefault();
    setConfirmOpen(true);
  }

  function submitConfirmed() {
    confirmedRef.current = true;
    setConfirmOpen(false);
    formRef.current?.requestSubmit();
  }

  return (
    <>
      <form ref={formRef} action={action} onSubmit={handleSubmit} className="space-y-4">
        <input type="hidden" name="projectId" value={projectId} />
        {state.error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {state.error}
          </p>
        ) : null}
        <div>
          <Label htmlFor="message" required>
            応募メッセージ
          </Label>
          <Textarea
            id="message"
            name="message"
            rows={10}
            required
            maxLength={4000}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <p className="mt-1 text-xs text-slate-500">
            応募後に企業とのチャットが開始され、このメッセージが最初のメッセージとして送信されます。
          </p>
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={pending || message.trim().length === 0}>
          {pending ? "送信中..." : "応募内容を確認する"}
        </Button>
      </form>

      {confirmOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="apply-confirm-title"
        >
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-5 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 id="apply-confirm-title" className="text-lg font-black text-slate-900">
                  この内容で応募しますか？
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">
                  応募すると企業に通知され、チャットが作成されます。送信後は応募メッセージとして相手に表示されます。
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-bold text-slate-500">送信されるメッセージ</p>
              <p className="mt-2 max-h-48 overflow-y-auto whitespace-pre-line text-sm leading-relaxed text-slate-700">
                {message.trim()}
              </p>
            </div>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)} disabled={pending}>
                戻って編集する
              </Button>
              <Button type="button" onClick={submitConfirmed} disabled={pending || message.trim().length === 0}>
                応募を確定する
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
