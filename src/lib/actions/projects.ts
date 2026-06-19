"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionState } from "@/lib/actions/onboarding";
import { parseCustomSkillNames, parseProjectForm } from "@/lib/project-input";
import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/session";

const DEFAULT_CONTRACT_TYPE = "業務委託";

export async function createProject(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { company } = await requireCompany();

  const parsed = parseProjectForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "入力内容に誤りがあります" };
  }

  const customSkills = parseCustomSkillNames(parsed.data.customSkills);
  if (customSkills.error) return { error: customSkills.error };

  const skillIds = [...new Set(formData.getAll("skills").map(String).filter(Boolean))];
  const features = formData.getAll("features").map(String).filter(Boolean);
  const { publish, ...data } = parsed.data;
  delete data.customSkills;

  const customSkillIds = await Promise.all(
    customSkills.names.map((name) =>
      prisma.skill.upsert({
        where: { name },
        update: {},
        create: { name, category: "OTHER" },
        select: { id: true },
      }),
    ),
  );
  const projectSkillIds = [...new Set([...skillIds, ...customSkillIds.map((skill) => skill.id)])];

  const project = await prisma.project.create({
    data: {
      ...data,
      contractType: data.contractType ?? DEFAULT_CONTRACT_TYPE,
      companyId: company.id,
      status: publish === "open" ? "OPEN" : "DRAFT",
      publishedAt: publish === "open" ? new Date() : null,
      features,
      skills: { create: projectSkillIds.map((skillId) => ({ skillId })) },
    },
  });

  revalidatePath("/company/projects");
  revalidatePath("/projects");
  redirect(`/company/projects?created=${project.id}`);
}

export async function updateProject(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { company } = await requireCompany();
  const projectId = String(formData.get("projectId") ?? "");

  const existing = await prisma.project.findFirst({
    where: { id: projectId, companyId: company.id },
  });
  if (!existing) return { error: "案件が見つかりません" };

  const parsed = parseProjectForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "入力内容に誤りがあります" };
  }

  const customSkills = parseCustomSkillNames(parsed.data.customSkills);
  if (customSkills.error) return { error: customSkills.error };

  const skillIds = [...new Set(formData.getAll("skills").map(String).filter(Boolean))];
  const features = formData.getAll("features").map(String).filter(Boolean);
  const { publish, ...data } = parsed.data;
  delete data.customSkills;

  const becomesOpen = publish === "open";

  await prisma.$transaction(async (tx) => {
    const customSkillIds = await Promise.all(
      customSkills.names.map((name) =>
        tx.skill.upsert({
          where: { name },
          update: {},
          create: { name, category: "OTHER" },
          select: { id: true },
        }),
      ),
    );
    const projectSkillIds = [...new Set([...skillIds, ...customSkillIds.map((skill) => skill.id)])];

    await tx.projectSkill.deleteMany({ where: { projectId } });
    await tx.project.update({
      where: { id: projectId },
      data: {
        ...data,
        contractType: data.contractType ?? DEFAULT_CONTRACT_TYPE,
        status: becomesOpen ? "OPEN" : existing.status === "CLOSED" ? "CLOSED" : "DRAFT",
        publishedAt: becomesOpen ? (existing.publishedAt ?? new Date()) : existing.publishedAt,
        features,
        skills: { create: projectSkillIds.map((skillId) => ({ skillId })) },
      },
    });
  });

  revalidatePath("/company/projects");
  revalidatePath(`/projects/${projectId}`);
  redirect("/company/projects");
}

export async function updateProjectStatus(formData: FormData) {
  const { company } = await requireCompany();
  const projectId = String(formData.get("projectId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!["OPEN", "CLOSED"].includes(status)) return;

  const existing = await prisma.project.findFirst({
    where: { id: projectId, companyId: company.id },
  });
  if (!existing) return;

  await prisma.project.update({
    where: { id: projectId },
    data: {
      status: status as "OPEN" | "CLOSED",
      publishedAt: status === "OPEN" ? (existing.publishedAt ?? new Date()) : existing.publishedAt,
    },
  });

  revalidatePath("/company/projects");
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");
}
