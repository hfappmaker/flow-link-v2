"use client";

import { useActionState } from "react";
import { applyToProject } from "@/lib/actions/applications";
import { Button } from "@/components/ui/button";
import { Label, Textarea } from "@/components/ui/form";
import type { AvailableChatDocument } from "@/lib/message-attachments";

export function ApplyForm({
  projectId,
  availableDocuments,
}: {
  projectId: string;
  availableDocuments: AvailableChatDocument[];
}) {
  const [state, action, pending] = useActionState(applyToProject, {});

  return (
    <form action={action} className="space-y-4">
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
          defaultValue={`はじめまして。本案件に応募いたします。

【自己紹介・経歴】


【本案件で活かせる経験・スキル】


【稼働可能時期・稼働日数】
`}
        />
        <p className="mt-1 text-xs text-slate-500">
          応募と同時に企業とのチャットが開始され、このメッセージが最初のメッセージとして送信されます。
        </p>
      </div>
      {availableDocuments.length > 0 ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-sm font-bold text-slate-800">送信する書類</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            選択した書類だけが、この応募チャットの相手企業に共有されます。企業検索には表示されません。
          </p>
          <div className="mt-3 space-y-2">
            {availableDocuments.map((document) => (
              <label
                key={document.kind}
                className="flex cursor-pointer items-start gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  name="documentKinds"
                  value={document.kind}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="min-w-0">
                  <span className="block font-semibold text-slate-700">{document.label}</span>
                  <span className="block truncate text-xs text-slate-500">{document.fileName}</span>
                </span>
              </label>
            ))}
          </div>
        </div>
      ) : null}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "送信中..." : "応募を確定する"}
      </Button>
    </form>
  );
}
