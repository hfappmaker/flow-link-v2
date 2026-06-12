"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { RemoteType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/session";
import type { ActionState } from "@/lib/actions/onboarding";

const emptyToUndefined = (v: FormDataEntryValue | null) =>
  v === null || v === "" ? undefined : v;

const projectSchema = z
  .object({
    title: z.string().min(1, "案件タイトルを入力してください").max(200),
    summary: z.string().max(2000).optional(),
    jobCategory: z.string().min(1, "募集職種を選択してください"),
    rateMin: z.coerce.number().int().min(0).optional(),
    rateMax: z.coerce.number().int().min(0).optional(),
    weeklyDaysMin: z.coerce.number().int().min(1).max(5),
    weeklyDaysMax: z.coerce.number().int().min(1).max(5),
    remoteType: z.enum(RemoteType),
    location: z.string().max(100).optional(),
    industry: z.string().max(100).optional(),
    contractType: z.string().max(50).optional(),
    merits: z.string().max(4000).optional(),
    background: z.string().max(8000).optional(),
    description: z.string().min(1, "業務内容を入力してください").max(8000),
    requiredSkillsText: z.string().max(4000).optional(),
    preferredSkillsText: z.string().max(4000).optional(),
    idealCandidate: z.string().max(4000).optional(),
    devEnvironment: z.string().max(4000).optional(),
    publish: z.enum(["draft", "open"]),
  })
  .refine((d) => d.weeklyDaysMin <= d.weeklyDaysMax, {
    message: "稼働日数の下限は上限以下にしてください",
  })
  .refine((d) => !d.rateMin || !d.rateMax || d.rateMin <= d.rateMax, {
    message: "単価の下限は上限以下にしてください",
  });

function parseProjectForm(formData: FormData) {
  return projectSchema.safeParse({
    title: formData.get("title"),
    summary: emptyToUndefined(formData.get("summary")),
    jobCategory: formData.get("jobCategory"),
    rateMin: emptyToUndefined(formData.get("rateMin")),
    rateMax: emptyToUndefined(formData.get("rateMax")),
    weeklyDaysMin: formData.get("weeklyDaysMin"),
    weeklyDaysMax: formData.get("weeklyDaysMax"),
    remoteType: formData.get("remoteType"),
    location: emptyToUndefined(formData.get("location")),
    industry: emptyToUndefined(formData.get("industry")),
    contractType: emptyToUndefined(formData.get("contractType")),
    merits: emptyToUndefined(formData.get("merits")),
    background: emptyToUndefined(formData.get("background")),
    description: formData.get("description"),
    requiredSkillsText: emptyToUndefined(formData.get("requiredSkillsText")),
    preferredSkillsText: emptyToUndefined(formData.get("preferredSkillsText")),
    idealCandidate: emptyToUndefined(formData.get("idealCandidate")),
    devEnvironment: emptyToUndefined(formData.get("devEnvironment")),
    publish: formData.get("publish") ?? "open",
  });
}

export async function createProject(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { company } = await requireCompany();

  const parsed = parseProjectForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "入力内容に誤りがあります" };
  }

  const skillIds = [...new Set(formData.getAll("skills").map(String).filter(Boolean))];
  const features = formData.getAll("features").map(String).filter(Boolean);
  const { publish, ...data } = parsed.data;

  const project = await prisma.project.create({
    data: {
      ...data,
      contractType: data.contractType ?? "業務委託",
      companyId: company.id,
      status: publish === "open" ? "OPEN" : "DRAFT",
      publishedAt: publish === "open" ? new Date() : null,
      features,
      skills: { create: skillIds.map((skillId) => ({ skillId })) },
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

  const skillIds = [...new Set(formData.getAll("skills").map(String).filter(Boolean))];
  const features = formData.getAll("features").map(String).filter(Boolean);
  const { publish, ...data } = parsed.data;

  const becomesOpen = publish === "open";

  await prisma.$transaction([
    prisma.projectSkill.deleteMany({ where: { projectId } }),
    prisma.project.update({
      where: { id: projectId },
      data: {
        ...data,
        contractType: data.contractType ?? "業務委託",
        status: becomesOpen ? "OPEN" : existing.status === "CLOSED" ? "CLOSED" : "DRAFT",
        publishedAt: becomesOpen ? (existing.publishedAt ?? new Date()) : existing.publishedAt,
        features,
        skills: { create: skillIds.map((skillId) => ({ skillId })) },
      },
    }),
  ]);

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
