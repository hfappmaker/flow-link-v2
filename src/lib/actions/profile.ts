"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { RemoteType, WorkStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireCompany, requireEngineer } from "@/lib/session";
import type { ActionState } from "@/lib/actions/onboarding";
import { PREFECTURES, WEEKLY_DAYS_OPTIONS } from "@/lib/constants";

const emptyToUndefined = (v: FormDataEntryValue | null) =>
  v === null || v === "" ? undefined : v;

function parseCustomSkillNames(value: string | undefined) {
  if (!value) return { names: [] as string[] };

  const names = [
    ...new Set(
      value
        .split(/[\n,、]/)
        .map((name) => name.trim().replace(/\s+/g, " "))
        .filter(Boolean),
    ),
  ];

  const tooLong = names.find((name) => name.length > 50);
  if (tooLong) {
    return { names: [] as string[], error: `スキル名は50文字以内で入力してください: ${tooLong}` };
  }
  if (names.length > 20) {
    return { names: [] as string[], error: "追加できるスキルは一度に20個までです" };
  }

  return { names };
}

const engineerProfileSchema = z.object({
  displayName: z.string().min(1, "表示名を入力してください").max(50),
  title: z
    .array(z.string().trim().min(1).max(50))
    .min(1, "職種を1つ以上選択または入力してください")
    .max(20, "職種は20個まで選択できます")
    .transform((titles) => [...new Set(titles.map((title) => title.replace(/\s+/g, " ")))].sort()),
  bio: z.string().max(4000).optional(),
  location: z.enum(PREFECTURES).optional(),
  yearsOfExperience: z.coerce.number().int().min(0).max(60).optional(),
  desiredRateMin: z.coerce.number().int().min(0).optional(),
  desiredRateMax: z.coerce.number().int().min(0).optional(),
  desiredWeeklyDays: z
    .array(z.coerce.number().int().min(1).max(7))
    .max(WEEKLY_DAYS_OPTIONS.length)
    .transform((days) => [...new Set(days)].sort((a, b) => a - b)),
  remotePreference: z.enum(RemoteType).optional(),
  workStatus: z.enum(WorkStatus),
  githubUrl: z.union([z.url(), z.literal("")]).optional(),
  portfolioUrl: z.union([z.url(), z.literal("")]).optional(),
  customSkills: z.string().max(1000).optional(),
});

export async function updateEngineerProfile(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { profile } = await requireEngineer();

  const parsed = engineerProfileSchema.safeParse({
    displayName: formData.get("displayName"),
    title: formData.getAll("title"),
    bio: emptyToUndefined(formData.get("bio")),
    location: emptyToUndefined(formData.get("location")),
    yearsOfExperience: emptyToUndefined(formData.get("yearsOfExperience")),
    desiredRateMin: emptyToUndefined(formData.get("desiredRateMin")),
    desiredRateMax: emptyToUndefined(formData.get("desiredRateMax")),
    desiredWeeklyDays: formData.getAll("desiredWeeklyDays"),
    remotePreference: emptyToUndefined(formData.get("remotePreference")),
    workStatus: formData.get("workStatus"),
    githubUrl: emptyToUndefined(formData.get("githubUrl")) ?? "",
    portfolioUrl: emptyToUndefined(formData.get("portfolioUrl")) ?? "",
    customSkills: emptyToUndefined(formData.get("customSkills")),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "入力内容に誤りがあります" };
  }

  const customSkills = parseCustomSkillNames(parsed.data.customSkills);
  if (customSkills.error) return { error: customSkills.error };

  const selectedSkillIds = [...new Set(formData.getAll("skills").map(String).filter(Boolean))];

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
    const skillIds = [...new Set([...selectedSkillIds, ...customSkillIds.map((skill) => skill.id)])];

    await tx.engineerProfile.update({
      where: { id: profile.id },
      data: {
        displayName: parsed.data.displayName,
        title: parsed.data.title,
        bio: parsed.data.bio ?? null,
        location: parsed.data.location ?? null,
        yearsOfExperience: parsed.data.yearsOfExperience ?? null,
        desiredRateMin: parsed.data.desiredRateMin ?? null,
        desiredRateMax: parsed.data.desiredRateMax ?? null,
        desiredWeeklyDays: parsed.data.desiredWeeklyDays,
        remotePreference: parsed.data.remotePreference ?? null,
        workStatus: parsed.data.workStatus,
        githubUrl: parsed.data.githubUrl || null,
        portfolioUrl: parsed.data.portfolioUrl || null,
        isPublic: formData.get("isPublic") === "on",
      },
    });
    await tx.engineerSkill.deleteMany({ where: { engineerProfileId: profile.id } });
    if (skillIds.length > 0) {
      await tx.engineerSkill.createMany({
        data: skillIds.map((skillId) => ({ engineerProfileId: profile.id, skillId })),
      });
    }
  });

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
