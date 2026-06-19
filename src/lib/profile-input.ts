import { RemoteType, WorkStatus } from "@prisma/client";
import { z } from "zod";
import { PREFECTURES, WEEKLY_DAYS_OPTIONS } from "@/lib/constants";
import { parseCustomSkillNames } from "@/lib/project-input";

export const companyProfileInputSchema = z.object({
  name: z.string().trim().min(1, "Company name is required.").max(100),
  industry: z.string().trim().max(100).optional(),
  location: z.string().trim().max(100).optional(),
  website: z.union([z.url("Website URL is invalid."), z.literal("")]).optional(),
  description: z.string().trim().max(4000).optional(),
  emailNotificationsEnabled: z.boolean().optional(),
});

export const workHistoryInputSchema = z.object({
  projectName: z.string().trim().min(1, "Work history project name is required.").max(100),
  role: z.string().trim().max(100).optional(),
  startYearMonth: z.string().trim().max(20).optional(),
  endYearMonth: z.string().trim().max(20).optional(),
  techStack: z.string().trim().max(200).optional(),
  description: z.string().trim().max(1000).optional(),
});

export const engineerProfileInputSchema = z
  .object({
    displayName: z.string().trim().min(1, "Display name is required.").max(50),
    title: z
      .array(z.string().trim().min(1).max(50))
      .min(1, "At least one title is required.")
      .max(20, "You can set up to 20 titles.")
      .transform((titles) => [...new Set(titles.map((title) => title.replace(/\s+/g, " ")))].sort()),
    bio: z.string().trim().max(4000).optional(),
    location: z.enum(PREFECTURES).optional(),
    yearsOfExperience: z.coerce.number().int().min(0).max(60).optional(),
    desiredRateMin: z.coerce.number().int().min(0).optional(),
    desiredRateMax: z.coerce.number().int().min(0).optional(),
    desiredWeeklyDays: z
      .array(z.coerce.number().int().min(1).max(7))
      .max(WEEKLY_DAYS_OPTIONS.length)
      .transform((days) => [...new Set(days)].sort((a, b) => a - b))
      .default([]),
    remotePreference: z.enum(RemoteType).optional(),
    workStatus: z.enum(WorkStatus).default(WorkStatus.OPEN_TO_OFFERS),
    githubUrl: z.union([z.url("GitHub URL is invalid."), z.literal("")]).optional(),
    portfolioUrl: z.union([z.url("Portfolio URL is invalid."), z.literal("")]).optional(),
    isPublic: z.boolean().optional(),
    emailNotificationsEnabled: z.boolean().optional(),
    workHistories: z.array(workHistoryInputSchema).max(20).optional(),
  })
  .refine(
    (data) =>
      data.desiredRateMin === undefined ||
      data.desiredRateMax === undefined ||
      data.desiredRateMin <= data.desiredRateMax,
    {
      message: "desiredRateMin must be less than or equal to desiredRateMax.",
    },
  );

export type CompanyProfileInput = z.infer<typeof companyProfileInputSchema>;
export type EngineerProfileInput = z.infer<typeof engineerProfileInputSchema>;
export type WorkHistoryInput = z.infer<typeof workHistoryInputSchema>;

export function parseWorkHistories(formData: FormData) {
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

  const histories: WorkHistoryInput[] = [];
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

    const parsed = workHistoryInputSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        histories: [] as WorkHistoryInput[],
        error: parsed.error.issues[0]?.message ?? "Work history input is invalid.",
      };
    }
    histories.push(parsed.data);
  }

  if (histories.length > 20) {
    return { histories: [] as WorkHistoryInput[], error: "You can add up to 20 work histories." };
  }

  return { histories };
}

export async function resolveProfileSkillIds({
  skillIds,
  skillNames,
}: {
  skillIds?: string[];
  skillNames?: string[];
}) {
  const cleanSkillIds = [...new Set((skillIds ?? []).map((id) => id.trim()).filter(Boolean))];
  const customSkills = parseCustomSkillNames((skillNames ?? []).join("\n"));
  if (customSkills.error) return { skillIds: [] as string[], customSkillNames: [] as string[], error: customSkills.error };

  return {
    skillIds: cleanSkillIds,
    customSkillNames: customSkills.names,
  };
}
