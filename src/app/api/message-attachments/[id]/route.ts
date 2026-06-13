import path from "node:path";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { readProfileDocumentFile } from "@/lib/profile-documents";

const CONTENT_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

function encodeContentDisposition(fileName: string) {
  return `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const attachment = await prisma.messageAttachment.findUnique({
    where: { id },
    include: {
      message: {
        select: {
          conversation: {
            select: { companyId: true, engineerUserId: true },
          },
        },
      },
    },
  });
  if (!attachment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const conversation = attachment.message.conversation;
  const isEngineer = conversation.engineerUserId === user.id;
  const isCompanyMember = user.companyMember?.companyId === conversation.companyId;
  if (!isEngineer && !isCompanyMember) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const file = await readProfileDocumentFile(attachment.filePath);
    if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const ext = path.extname(attachment.fileName).toLowerCase();
    return new Response(file, {
      headers: {
        "Content-Type": CONTENT_TYPES[ext] ?? "application/octet-stream",
        "Content-Disposition": encodeContentDisposition(attachment.fileName),
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
