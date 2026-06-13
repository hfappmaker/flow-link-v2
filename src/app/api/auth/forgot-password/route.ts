import { NextResponse } from "next/server";
import { z } from "zod";
import { createAuthToken } from "@/lib/auth-tokens";
import { getAppUrl } from "@/lib/app-url";
import { sendPasswordResetEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  email: z.email(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "メールアドレスを入力してください" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });

  if (user?.passwordHash) {
    const token = await createAuthToken("password-reset", email, 60);
    const resetUrl = new URL(`/reset-password?token=${encodeURIComponent(token)}`, getAppUrl());
    await sendPasswordResetEmail(email, resetUrl.toString());
  }

  return NextResponse.json({ ok: true });
}
