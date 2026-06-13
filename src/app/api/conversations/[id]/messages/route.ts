import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { getConversationForUser } from "@/lib/messages";
import { getAblyRest } from "@/lib/ably";
import { CHAT_MESSAGE_CREATED_EVENT, getConversationChannelName } from "@/lib/chat-realtime";
import {
  CHAT_DOCUMENT_LABELS,
  getProfileDocumentsForMessage,
  isProfileMessageDocument,
  type ChatDocumentKind,
  type MessageAttachmentPayload,
} from "@/lib/message-attachments";

export type ChatMessage = {
  id: string;
  body: string;
  senderName: string;
  mine: boolean;
  createdAt: string;
  attachments: MessageAttachmentPayload[];
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

function toAttachmentPayload(attachment: { id: string; kind: string; fileName: string }) {
  const kind = attachment.kind as ChatDocumentKind;
  return {
    id: attachment.id,
    kind,
    label: CHAT_DOCUMENT_LABELS[kind] ?? "添付書類",
    fileName: attachment.fileName,
    downloadUrl: `/api/message-attachments/${attachment.id}`,
  };
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await loadContext(id);
  if ("error" in ctx) return ctx.error;
  const { user, conversation } = ctx;

  const isCompanyViewer = user.companyMember?.companyId === conversation.companyId;

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
    include: {
      attachments: { orderBy: { createdAt: "asc" } },
      sender: { include: { companyMember: true, engineerProfile: true } },
    },
  });

  const payload: ChatMessage[] = messages.map((message) => {
    const senderIsCompany = message.sender.companyMember?.companyId === conversation.companyId;
    return {
      id: message.id,
      body: message.body,
      attachments: message.attachments.map(toAttachmentPayload),
      senderName: senderIsCompany
        ? conversation.company.name
        : (message.sender.engineerProfile?.displayName ?? message.sender.name ?? "ユーザー"),
      mine: isCompanyViewer ? senderIsCompany : message.senderId === user.id,
      createdAt: message.createdAt.toISOString(),
    };
  });

  return NextResponse.json({ messages: payload });
}

const postSchema = z
  .object({
    body: z.string().max(4000).optional().default(""),
    documentKinds: z.array(z.enum(["resume", "work-history"])).max(2).optional().default([]),
  })
  .refine((value) => value.body.trim().length > 0 || value.documentKinds.length > 0);

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await loadContext(id);
  if ("error" in ctx) return ctx.error;
  const { user, conversation } = ctx;

  const json = await request.json().catch(() => null);
  const parsed = postSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "メッセージまたは書類を入力してください" }, { status: 400 });
  }
  if (parsed.data.documentKinds.length > 0 && user.id !== conversation.engineerUserId) {
    return NextResponse.json({ error: "書類を送信できるのはエンジニア本人のみです" }, { status: 403 });
  }

  const selectedDocuments = user.engineerProfile
    ? getProfileDocumentsForMessage(user.engineerProfile, parsed.data.documentKinds)
    : [];
  if (selectedDocuments.some((document) => !document)) {
    return NextResponse.json({ error: "選択した書類が見つかりません" }, { status: 400 });
  }
  const attachments = selectedDocuments.filter(isProfileMessageDocument);
  const body = parsed.data.body.trim() || "書類を送付しました。";

  const [message] = await prisma.$transaction([
    prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: user.id,
        body,
        attachments:
          attachments.length > 0
            ? {
                create: attachments.map((document) => ({
                  kind: document.kind,
                  fileName: document.fileName,
                  filePath: document.filePath,
                })),
              }
            : undefined,
      },
      include: { attachments: { orderBy: { createdAt: "asc" } } },
    }),
    prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    }),
  ]);

  const senderIsCompany = user.companyMember?.companyId === conversation.companyId;
  const payload: ChatMessage = {
    id: message.id,
    body: message.body,
    attachments: message.attachments.map(toAttachmentPayload),
    senderName: senderIsCompany
      ? conversation.company.name
      : (user.engineerProfile?.displayName ?? user.name ?? "ユーザー"),
    mine: true,
    createdAt: message.createdAt.toISOString(),
  };

  const ably = getAblyRest();
  if (ably) {
    const channel = ably.channels.get(getConversationChannelName(conversation.id));
    try {
      await channel.publish(CHAT_MESSAGE_CREATED_EVENT, {
        ...payload,
        senderId: user.id,
        senderIsCompany,
      });
    } catch (error) {
      console.error("Failed to publish chat message to Ably", error);
    }
  }

  return NextResponse.json({ message: payload }, { status: 201 });
}
