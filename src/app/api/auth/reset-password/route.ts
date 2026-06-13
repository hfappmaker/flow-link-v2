import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { consumeAuthToken } from "@/lib/auth-tokens";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "パスワードは8文字以上で入力してください").max(100),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "入力内容に誤りがあります" },
      { status: 400 },
    );
  }

  const email = await consumeAuthToken("password-reset", parsed.data.token);
  if (!email) {
    return NextResponse.json(
      { error: "リンクが無効、または有効期限が切れています" },
      { status: 400 },
    );
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await prisma.user.update({
    where: { email },
    data: {
      passwordHash,
      emailVerified: new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}
