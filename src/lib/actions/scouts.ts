"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireCompany, requireEngineer } from "@/lib/session";
import type { ActionState } from "@/lib/actions/onboarding";

const scoutSchema = z.object({
  engineerUserId: z.string().min(1),
  projectId: z.string().optional(),
  title: z.string().min(1, "件名を入力してください").max(200),
  message: z.string().min(1, "スカウトメッセージを入力してください").max(4000),
});

export async function sendScout(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { user, company } = await requireCompany();

  const parsed = scoutSchema.safeParse({
    engineerUserId: formData.get("engineerUserId"),
    projectId: formData.get("projectId") || undefined,
    title: formData.get("title"),
    message: formData.get("message"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "入力内容に誤りがあります" };
  }

  const engineer = await prisma.engineerProfile.findFirst({
    where: { userId: parsed.data.engineerUserId, isPublic: true },
  });
  if (!engineer) {
    return { error: "このエンジニアにはスカウトを送信できません" };
  }

  if (parsed.data.projectId) {
    const project = await prisma.project.findFirst({
      where: { id: parsed.data.projectId, companyId: company.id },
    });
    if (!project) return { error: "案件の指定が正しくありません" };
  }

  const conversation = await prisma.$transaction(async (tx) => {
    const scout = await tx.scout.create({
      data: {
        companyId: company.id,
        projectId: parsed.data.projectId ?? null,
        engineerUserId: parsed.data.engineerUserId,
        senderUserId: user.id,
        title: parsed.data.title,
        message: parsed.data.message,
      },
    });
    return tx.conversation.create({
      data: {
        companyId: company.id,
        engineerUserId: parsed.data.engineerUserId,
        projectId: parsed.data.projectId ?? null,
        scoutId: scout.id,
        messages: {
          create: { senderId: user.id, body: parsed.data.message },
        },
      },
    });
  });

  revalidatePath("/company/scouts");
  redirect(`/messages/${conversation.id}`);
}

const respondSchema = z.object({
  scoutId: z.string().min(1),
  response: z.enum(["ACCEPTED", "DECLINED"]),
});

export async function respondToScout(formData: FormData) {
  const { user } = await requireEngineer();

  const parsed = respondSchema.safeParse({
    scoutId: formData.get("scoutId"),
    response: formData.get("response"),
  });
  if (!parsed.success) return;

  await prisma.scout.updateMany({
    where: { id: parsed.data.scoutId, engineerUserId: user.id, status: "SENT" },
    data: { status: parsed.data.response },
  });

  revalidatePath("/scouts");
  revalidatePath("/company/scouts");
}
