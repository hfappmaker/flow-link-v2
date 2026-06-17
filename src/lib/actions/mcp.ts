"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import type { ActionState } from "@/lib/actions/onboarding";

const disconnectMcpClientSchema = z.object({
  clientId: z.string().trim().min(1),
});

export async function disconnectMcpClient(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = disconnectMcpClientSchema.safeParse({
    clientId: formData.get("clientId"),
  });
  if (!parsed.success) {
    return { error: "連携を解除するMCPクライアントを選択してください。" };
  }

  const now = new Date();
  const [accessTokens, refreshTokens] = await prisma.$transaction([
    prisma.oAuthAccessToken.updateMany({
      where: {
        userId: user.id,
        clientId: parsed.data.clientId,
        revokedAt: null,
      },
      data: { revokedAt: now },
    }),
    prisma.oAuthRefreshToken.updateMany({
      where: {
        userId: user.id,
        clientId: parsed.data.clientId,
        revokedAt: null,
      },
      data: { revokedAt: now },
    }),
  ]);

  if (accessTokens.count + refreshTokens.count === 0) {
    return { error: "解除できるMCP連携が見つかりませんでした。" };
  }

  revalidatePath("/settings/mcp");
  return { success: true };
}
