"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { RemoteType, WorkStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireCompany, requireEngineer } from "@/lib/session";
import type { ActionState } from "@/lib/actions/onboarding";
import { PREFECTURES } from "@/lib/constants";

const emptyToUndefined = (v: FormDataEntryValue | null) =>
  v === null || v === "" ? undefined : v;

const engineerProfileSchema = z.object({
  displayName: z.string().min(1, "表示名を入力してください").max(50),
  title: z.string().min(1, "職種を選択してください"),
  bio: z.string().max(4000).optional(),
  location: z.enum(PREFECTURES).optional(),
  yearsOfExperience: z.coerce.number().int().min(0).max(60).optional(),
  desiredRateMin: z.coerce.number().int().min(0).optional(),
  desiredRateMax: z.coerce.number().int().min(0).optional(),
  desiredWeeklyDays: z.coerce.number().int().min(1).max(5).optional(),
  remotePreference: z.enum(RemoteType).optional(),
  workStatus: z.enum(WorkStatus),
  githubUrl: z.union([z.url(), z.literal("")]).optional(),
  portfolioUrl: z.union([z.url(), z.literal("")]).optional(),
});

export async function updateEngineerProfile(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { profile } = await requireEngineer();

  const parsed = engineerProfileSchema.safeParse({
    displayName: formData.get("displayName"),
    title: formData.get("title"),
    bio: emptyToUndefined(formData.get("bio")),
    location: emptyToUndefined(formData.get("location")),
    yearsOfExperience: emptyToUndefined(formData.get("yearsOfExperience")),
    desiredRateMin: emptyToUndefined(formData.get("desiredRateMin")),
    desiredRateMax: emptyToUndefined(formData.get("desiredRateMax")),
    desiredWeeklyDays: emptyToUndefined(formData.get("desiredWeeklyDays")),
    remotePreference: emptyToUndefined(formData.get("remotePreference")),
    workStatus: formData.get("workStatus"),
    githubUrl: emptyToUndefined(formData.get("githubUrl")) ?? "",
    portfolioUrl: emptyToUndefined(formData.get("portfolioUrl")) ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "入力内容に誤りがあります" };
  }

  const skillIds = [...new Set(formData.getAll("skills").map(String).filter(Boolean))];

  await prisma.$transaction([
    prisma.engineerProfile.update({
      where: { id: profile.id },
      data: {
        displayName: parsed.data.displayName,
        title: parsed.data.title,
        bio: parsed.data.bio ?? null,
        location: parsed.data.location ?? null,
        yearsOfExperience: parsed.data.yearsOfExperience ?? null,
        desiredRateMin: parsed.data.desiredRateMin ?? null,
        desiredRateMax: parsed.data.desiredRateMax ?? null,
        desiredWeeklyDays: parsed.data.desiredWeeklyDays ?? null,
        remotePreference: parsed.data.remotePreference ?? null,
        workStatus: parsed.data.workStatus,
        githubUrl: parsed.data.githubUrl || null,
        portfolioUrl: parsed.data.portfolioUrl || null,
        isPublic: formData.get("isPublic") === "on",
      },
    }),
    prisma.engineerSkill.deleteMany({ where: { engineerProfileId: profile.id } }),
    prisma.engineerSkill.createMany({
      data: skillIds.map((skillId) => ({ engineerProfileId: profile.id, skillId })),
    }),
  ]);

  revalidatePath("/settings/profile");
  revalidatePath("/company/engineers");
  return { success: true };
}

const companyProfileSchema = z.object({
  name: z.string().min(1, "会社名を入力してください").max(100),
  industry: z.string().max(100).optional(),
  location: z.string().max(100).optional(),
  website: z.union([z.url("WebサイトURLの形式が正しくありません"), z.literal("")]).optional(),
  description: z.string().max(4000).optional(),
});

export async function updateCompanyProfile(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { company } = await requireCompany();

  const parsed = companyProfileSchema.safeParse({
    name: formData.get("name"),
    industry: emptyToUndefined(formData.get("industry")),
    location: emptyToUndefined(formData.get("location")),
    website: emptyToUndefined(formData.get("website")) ?? "",
    description: emptyToUndefined(formData.get("description")),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "入力内容に誤りがあります" };
  }

  await prisma.company.update({
    where: { id: company.id },
    data: {
      name: parsed.data.name,
      industry: parsed.data.industry ?? null,
      location: parsed.data.location ?? null,
      website: parsed.data.website || null,
      description: parsed.data.description ?? null,
    },
  });

  revalidatePath("/company/settings");
  return { success: true };
}
