"use client";

import { useActionState } from "react";
import { deleteAccount } from "@/lib/actions/profile";
import { Button } from "@/components/ui/button";

export function AccountDeleteForm({ accountLabel }: { accountLabel: "エンジニア" | "企業" }) {
  const [state, action, pending] = useActionState(deleteAccount, {});

  return (
    <form action={action} className="space-y-4">
      {state.error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {state.error}
        </p>
      ) : null}
      <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-sm leading-relaxed text-red-700">
        退会するとログインできなくなり、検索・スカウト・通知の対象外になります。過去の応募、スカウト、チャット履歴は相手側の履歴として残ります。
      </div>
      <label className="flex items-start gap-3 text-sm text-slate-700">
        <input
          type="checkbox"
          name="confirm"
          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
        />
        <span>{accountLabel}アカウントを退会することを理解しました</span>
      </label>
      <Button type="submit" variant="danger" disabled={pending}>
        {pending ? "退会処理中..." : "退会する"}
      </Button>
    </form>
  );
}
