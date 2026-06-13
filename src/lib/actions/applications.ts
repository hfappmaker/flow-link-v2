"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ApplicationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireCompany, requireEngineer } from "@/lib/session";
import type { ActionState } from "@/lib/actions/onboarding";
import { sendOptionalNotificationEmail } from "@/lib/notification-email";

const applySchema = z.object({
  projectId: z.string().min(1),
  message: z.string().min(1, "応募メッセージを入力してください").max(4000),
});

export async function applyToProject(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { user } = await requireEngineer();

  const parsed = applySchema.safeParse({
    projectId: formData.get("projectId"),
    message: formData.get("message"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "入力内容に誤りがあります" };
  }

  const project = await prisma.project.findUnique({
    where: { id: parsed.data.projectId },
    include: {
      company: {
        include: {
          members: {
            include: {
              user: {
                select: { email: true, emailNotificationsEnabled: true, deletedAt: true },
              },
            },
          },
        },
      },
    },
  });
  if (!project || project.status !== "OPEN") {
    return { error: "この案件は現在応募を受け付けていません" };
  }

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
          },
        },
      },
    });
  });

  revalidatePath(`/projects/${project.id}`);
  revalidatePath("/applications");
  await sendOptionalNotificationEmail({
    recipients: project.company.members.map((member) => member.user),
    subject: "FlowLink 新しい応募が届きました",
    heading: "新しい応募が届きました",
    intro: `${project.title}に新しい応募がありました。応募内容はチャットで確認できます。`,
    path: `/messages/${conversation.id}`,
    actionLabel: "応募チャットを確認する",
  });
  redirect(`/messages/${conversation.id}`);
}

export async function withdrawApplication(formData: FormData) {
  await requireEngineer();
  void formData;
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
