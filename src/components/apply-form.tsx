"use client";

import { useActionState } from "react";
import { applyToProject } from "@/lib/actions/applications";
import { Button } from "@/components/ui/button";
import { Label, Textarea } from "@/components/ui/form";

export function ApplyForm({ projectId }: { projectId: string }) {
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

【自己紹介・経験】

【本案件で活かせる経験・スキル】

【稼働可能時期・稼働日数】
`}
        />
        <p className="mt-1 text-xs text-slate-500">
          応募後に企業とのチャットが開始されます。履歴書や職務経歴書などのファイルは、チャットで必要に応じて添付できます。
        </p>
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "送信中..." : "応募を確定する"}
      </Button>
    </form>
  );
}
