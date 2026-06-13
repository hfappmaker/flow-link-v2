"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ApplicationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireCompany, requireEngineer } from "@/lib/session";
import type { ActionState } from "@/lib/actions/onboarding";
import {
  getProfileDocumentsForMessage,
  isChatDocumentKind,
  isProfileMessageDocument,
  type ChatDocumentKind,
} from "@/lib/message-attachments";

const applySchema = z.object({
  projectId: z.string().min(1),
  message: z.string().min(1, "応募メッセージを入力してください").max(4000),
  documentKinds: z.array(z.enum(["resume", "work-history"])).default([]),
});

export async function applyToProject(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { user, profile } = await requireEngineer();
  const documentKinds = formData
    .getAll("documentKinds")
    .filter(isChatDocumentKind) as ChatDocumentKind[];

  const parsed = applySchema.safeParse({
    projectId: formData.get("projectId"),
    message: formData.get("message"),
    documentKinds,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "入力内容に誤りがあります" };
  }

  const project = await prisma.project.findUnique({
    where: { id: parsed.data.projectId },
  });
  if (!project || project.status !== "OPEN") {
    return { error: "この案件は現在応募を受け付けていません" };
  }

  const selectedDocuments = getProfileDocumentsForMessage(profile, parsed.data.documentKinds);
  if (selectedDocuments.some((document) => !document)) {
    return { error: "選択した書類が見つかりません。プロフィール設定を確認してください" };
  }
  const attachments = selectedDocuments.filter(isProfileMessageDocument);

  const existing = await prisma.application.findUnique({
    where: {
      projectId_engineerUserId: {
        projectId: project.id,
        engineerUserId: user.id,
      },
    },
    include: { conversation: true },
  });
  if (existing) {
    if (existing.conversation) redirect(`/messages/${existing.conversation.id}`);
    return { error: "この案件には既に応募しています" };
  }

  const conversation = await prisma.$transaction(async (tx) => {
    const application = await tx.application.create({
      data: {
        projectId: project.id,
        engineerUserId: user.id,
        message: parsed.data.message,
      },
    });
    return tx.conversation.create({
      data: {
        companyId: project.companyId,
        engineerUserId: user.id,
        projectId: project.id,
        applicationId: application.id,
        messages: {
          create: {
            senderId: user.id,
            body: parsed.data.message,
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
        },
      },
    });
  });

  revalidatePath(`/projects/${project.id}`);
  revalidatePath("/applications");
  redirect(`/messages/${conversation.id}`);
}

export async function withdrawApplication(formData: FormData) {
  const { user } = await requireEngineer();
  const applicationId = String(formData.get("applicationId") ?? "");

  await prisma.application.updateMany({
    where: {
      id: applicationId,
      engineerUserId: user.id,
      status: { notIn: ["ACCEPTED", "REJECTED", "WITHDRAWN"] },
    },
    data: { status: "WITHDRAWN" },
  });

  revalidatePath("/applications");
}

export async function updateApplicationStatus(formData: FormData) {
  const { company } = await requireCompany();
  const applicationId = String(formData.get("applicationId") ?? "");
  const statusValue = String(formData.get("status") ?? "");

  if (!(Object.values(ApplicationStatus) as string[]).includes(statusValue)) return;

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { project: { select: { id: true, companyId: true } } },
  });
  if (!application || application.project.companyId !== company.id) return;

  await prisma.application.update({
    where: { id: applicationId },
    data: { status: statusValue as ApplicationStatus },
  });

  revalidatePath(`/company/projects/${application.project.id}/applicants`);
  revalidatePath("/applications");
}
