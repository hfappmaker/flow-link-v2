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
  { params }: { params: Promise<{ profileId: string; kind: string }> },
) {
  const { profileId, kind } = await params;
  if (kind !== "resume" && kind !== "work-history") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.engineerProfile.findUnique({
    where: { id: profileId },
    select: {
      id: true,
      userId: true,
      isPublic: true,
      resumeFileName: true,
      resumeFilePath: true,
      workHistoryFileName: true,
      workHistoryFilePath: true,
    },
  });
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwner = user.engineerProfile?.id === profile.id;
  const isCompanyViewer = Boolean(user.companyMember && profile.isPublic);
  if (!isOwner && !isCompanyViewer) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const document =
    kind === "resume"
      ? { fileName: profile.resumeFileName, filePath: profile.resumeFilePath }
      : { fileName: profile.workHistoryFileName, filePath: profile.workHistoryFilePath };

  if (!document.fileName || !document.filePath) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const file = await readProfileDocumentFile(document.filePath);
    if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const ext = path.extname(document.fileName).toLowerCase();
    return new Response(file, {
      headers: {
        "Content-Type": CONTENT_TYPES[ext] ?? "application/octet-stream",
        "Content-Disposition": encodeContentDisposition(document.fileName),
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
