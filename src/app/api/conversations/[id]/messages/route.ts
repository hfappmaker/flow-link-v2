import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { getConversationForUser } from "@/lib/messages";

export type ChatMessage = {
  id: string;
  body: string;
  senderName: string;
  mine: boolean;
  createdAt: string;
};

async function loadContext(conversationId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };

  const conversation = await getConversationForUser(conversationId, user);
  if (!conversation) {
    return { error: NextResponse.json({ error: "not found" }, { status: 404 }) };
  }
  return { user, conversation };
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await loadContext(id);
  if ("error" in ctx) return ctx.error;
  const { user, conversation } = ctx;

  const isCompanyViewer = user.companyMember?.companyId === conversation.companyId;

  // 相手からの未読メッセージを既読にする
  await prisma.message.updateMany({
    where: {
      conversationId: conversation.id,
      readAt: null,
      ...(isCompanyViewer
        ? { sender: { companyMember: null } }
        : { NOT: { senderId: user.id } }),
    },
    data: { readAt: new Date() },
  });

  const messages = await prisma.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "asc" },
    include: { sender: { include: { companyMember: true, engineerProfile: true } } },
  });

  const payload: ChatMessage[] = messages.map((m) => {
    const senderIsCompany = m.sender.companyMember?.companyId === conversation.companyId;
    return {
      id: m.id,
      body: m.body,
      senderName: senderIsCompany
        ? conversation.company.name
        : (m.sender.engineerProfile?.displayName ?? m.sender.name ?? "ユーザー"),
      mine: isCompanyViewer ? senderIsCompany : m.senderId === user.id,
      createdAt: m.createdAt.toISOString(),
    };
  });

  return NextResponse.json({ messages: payload });
}

const postSchema = z.object({ body: z.string().min(1).max(4000) });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await loadContext(id);
  if ("error" in ctx) return ctx.error;
  const { user, conversation } = ctx;

  const json = await request.json().catch(() => null);
  const parsed = postSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "メッセージを入力してください" }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: user.id,
        body: parsed.data.body.trim(),
      },
    }),
    prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    }),
  ]);

  return NextResponse.json({ ok: true }, { status: 201 });
}
