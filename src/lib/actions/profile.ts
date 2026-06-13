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

const workHistorySchema = z.object({
  projectName: z.string().trim().min(1, "参画実績の案件名を入力してください").max(100),
  role: z.string().trim().max(100).optional(),
  startYearMonth: z.string().trim().max(20).optional(),
  endYearMonth: z.string().trim().max(20).optional(),
  techStack: z.string().trim().max(200).optional(),
  description: z.string().trim().max(1000).optional(),
});

function parseWorkHistories(formData: FormData) {
  const projectNames = formData.getAll("workHistoryProjectName").map(String);
  const roles = formData.getAll("workHistoryRole").map(String);
  const starts = formData.getAll("workHistoryStartYearMonth").map(String);
  const ends = formData.getAll("workHistoryEndYearMonth").map(String);
  const techStacks = formData.getAll("workHistoryTechStack").map(String);
  const descriptions = formData.getAll("workHistoryDescription").map(String);
  const count = Math.max(
    projectNames.length,
    roles.length,
    starts.length,
    ends.length,
    techStacks.length,
    descriptions.length,
  );

  const histories = [];
  for (let index = 0; index < count; index += 1) {
    const raw = {
      projectName: projectNames[index]?.trim() ?? "",
      role: roles[index]?.trim() || undefined,
      startYearMonth: starts[index]?.trim() || undefined,
      endYearMonth: ends[index]?.trim() || undefined,
      techStack: techStacks[index]?.trim() || undefined,
      description: descriptions[index]?.trim() || undefined,
    };
    const hasAnyValue = Object.values(raw).some(Boolean);
    if (!hasAnyValue) continue;

    const parsed = workHistorySchema.safeParse(raw);
    if (!parsed.success) {
      return {
        histories: [] as z.infer<typeof workHistorySchema>[],
        error: parsed.error.issues[0]?.message ?? "参画実績の入力内容に誤りがあります",
      };
    }
    histories.push(parsed.data);
  }

  if (histories.length > 20) {
    return { histories: [] as z.infer<typeof workHistorySchema>[], error: "参画実績は20件まで登録できます" };
  }

  return { histories };
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
  const workHistories = parseWorkHistories(formData);
  if (workHistories.error) return { error: workHistories.error };

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
    await tx.workHistory.deleteMany({ where: { engineerProfileId: profile.id } });
    if (workHistories.histories.length > 0) {
      await tx.workHistory.createMany({
        data: workHistories.histories.map((history) => ({
          engineerProfileId: profile.id,
          projectName: history.projectName,
          role: history.role || null,
          startYearMonth: history.startYearMonth || null,
          endYearMonth: history.endYearMonth || null,
          techStack: history.techStack || null,
          description: history.description || null,
        })),
      });
    }
  });

  revalidatePath("/settings/profile");
  revalidatePath("/company/engineers");
  revalidatePath(`/company/engineers/${profile.id}`);
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
