import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { getConversationForUser } from "@/lib/messages";
import { getAblyRest } from "@/lib/ably";
import { CHAT_MESSAGE_CREATED_EVENT, getConversationChannelName } from "@/lib/chat-realtime";
import { getAttachmentLabel, type MessageAttachmentPayload } from "@/lib/message-attachments";
import {
  MESSAGE_ATTACHMENT_MAX_BYTES,
  MESSAGE_ATTACHMENT_MAX_COUNT,
  removeStoredFile,
  sanitizeUploadFileName,
  saveMessageAttachmentFile,
} from "@/lib/uploaded-files";

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
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const conversation = await getConversationForUser(conversationId, user);
  if (!conversation) {
    return { error: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  }
  return { user, conversation };
}

function toAttachmentPayload(attachment: { id: string; kind: string; fileName: string }) {
  return {
    id: attachment.id,
    kind: attachment.kind,
    label: getAttachmentLabel(),
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
    attachmentCount: z.number().int().min(0).max(MESSAGE_ATTACHMENT_MAX_COUNT).default(0),
  })
  .refine((value) => value.body.trim().length > 0 || value.attachmentCount > 0);

function isUploadedFile(value: FormDataEntryValue): value is File {
  return value instanceof File && value.size > 0;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await loadContext(id);
  if ("error" in ctx) return ctx.error;
  const { user, conversation } = ctx;

  const contentType = request.headers.get("content-type") ?? "";
  const formData = contentType.includes("multipart/form-data")
    ? await request.formData().catch(() => null)
    : null;
  const json = formData ? null : await request.json().catch(() => null);
  const uploadedFiles = formData
    ? formData.getAll("attachments").filter(isUploadedFile)
    : [];

  const parsed = postSchema.safeParse({
    body: formData ? formData.get("body") : json?.body,
    attachmentCount: uploadedFiles.length,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "メッセージまたは添付ファイルを入力してください" },
      { status: 400 },
    );
  }

  const oversized = uploadedFiles.find((file) => file.size > MESSAGE_ATTACHMENT_MAX_BYTES);
  if (oversized) {
    return NextResponse.json(
      { error: "添付できるファイルサイズは1ファイル10MBまでです" },
      { status: 400 },
    );
  }

  const savedAttachments: Array<{ fileName: string; filePath: string }> = [];
  try {
    for (const file of uploadedFiles) {
      const fileName = sanitizeUploadFileName(file.name);
      const filePath = await saveMessageAttachmentFile({
        conversationId: conversation.id,
        file,
        fileName,
      });
      savedAttachments.push({ fileName, filePath });
    }

    const body = parsed.data.body.trim() || "ファイルを添付しました。";
    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: user.id,
          body,
          attachments:
            savedAttachments.length > 0
              ? {
                  create: savedAttachments.map((attachment) => ({
                    kind: "file",
                    fileName: attachment.fileName,
                    filePath: attachment.filePath,
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
  } catch (error) {
    await Promise.all(savedAttachments.map((attachment) => removeStoredFile(attachment.filePath)));
    throw error;
  }
}
