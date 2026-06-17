"use client";

import { useActionState } from "react";
import { disconnectMcpClient } from "@/lib/actions/mcp";
import { Button } from "@/components/ui/button";

export function DisconnectMcpClientForm({ clientId }: { clientId: string }) {
  const [state, action, pending] = useActionState(disconnectMcpClient, {});

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="clientId" value={clientId} />
      {state.error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" variant="danger" size="sm" disabled={pending}>
        {pending ? "解除中..." : "接続解除"}
      </Button>
    </form>
  );
}
