"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { disconnectMcpClient } from "@/lib/actions/mcp";
import { Button } from "@/components/ui/button";

export function DisconnectMcpClientForm({ clientId, clientName }: { clientId: string; clientName: string }) {
  const [state, action, pending] = useActionState(disconnectMcpClient, {});
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!state.success) return;
    setOpen(false);
    router.refresh();
  }, [router, state.success]);

  return (
    <div className="space-y-2">
      {state.error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
          {state.error}
        </p>
      ) : null}
      <Button type="button" variant="danger" size="sm" disabled={pending} onClick={() => setOpen(true)}>
        接続解除
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`disconnect-mcp-client-${clientId}`}
            className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl"
          >
            <h2 id={`disconnect-mcp-client-${clientId}`} className="text-base font-bold text-slate-900">
              MCP連携を解除しますか？
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {clientName} の access token、refresh token、authorization codeを無効化します。
              解除後に再利用するには、MCPクライアントからもう一度認証してください。
            </p>
            <form action={action} className="mt-5 flex justify-end gap-3">
              <input type="hidden" name="clientId" value={clientId} />
              <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => setOpen(false)}>
                キャンセル
              </Button>
              <Button type="submit" variant="danger" size="sm" disabled={pending}>
                {pending ? "解除中..." : "解除する"}
              </Button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
