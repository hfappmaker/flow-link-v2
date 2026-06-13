import { NextResponse } from "next/server";
import { z } from "zod";
import { createAuthToken } from "@/lib/auth-tokens";
import { getAppUrl } from "@/lib/app-url";
import { sendVerificationEmail } from "@/lib/email";
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
  if (!user || user.emailVerified) {
    return NextResponse.json({ ok: true });
  }

  const token = await createAuthToken("email-verification", email, 24 * 60);
  const verifyUrl = new URL(`/verify-email?token=${encodeURIComponent(token)}`, getAppUrl());
  await sendVerificationEmail(email, verifyUrl.toString());

  return NextResponse.json({ ok: true });
}
