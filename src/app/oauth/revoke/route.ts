import { NextResponse } from "next/server";
import { hashToken } from "@/lib/mcp-oauth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({}, { status: 200 });

  const token = stringValue(form, "token");
  const clientId = stringValue(form, "client_id");
  if (!token) return NextResponse.json({}, { status: 200 });

  const tokenHash = hashToken(token);
  const now = new Date();
  await prisma.oAuthRefreshToken.updateMany({
    where: {
      tokenHash,
      ...(clientId ? { clientId } : {}),
      revokedAt: null,
    },
    data: { revokedAt: now },
  });

  return NextResponse.json({}, { status: 200 });
}

function stringValue(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === "string" ? value : "";
}
