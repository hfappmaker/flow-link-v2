import { RemoteType, type Prisma } from "@prisma/client";
import { z } from "zod";
import { PREFECTURES, WEEKLY_DAYS_OPTIONS } from "@/lib/constants";

export const emptyToUndefined = (value: FormDataEntryValue | null) =>
  value === null || value === "" ? undefined : value;

export const projectInputSchema = z
  .object({
    title: z.string().trim().min(1, "Project title is required.").max(200),
    summary: z.string().trim().max(2000).optional(),
    jobCategory: z.string().trim().min(1, "Job category is required."),
    rateMin: z.coerce.number().int().min(0).optional(),
    rateMax: z.coerce.number().int().min(0).optional(),
    weeklyDaysMin: z.coerce
      .number()
      .int()
      .min(1)
      .max(WEEKLY_DAYS_OPTIONS.at(-1) ?? 7),
    weeklyDaysMax: z.coerce
      .number()
      .int()
      .min(1)
      .max(WEEKLY_DAYS_OPTIONS.at(-1) ?? 7),
    remoteType: z.enum(RemoteType),
    location: z.string().trim().max(100).optional(),
    prefecture: z.enum(PREFECTURES).optional(),
    industry: z.string().trim().max(100).optional(),
    contractType: z.string().trim().max(50).optional(),
    merits: z.string().trim().max(4000).optional(),
    background: z.string().trim().max(8000).optional(),
    description: z.string().trim().min(1, "Description is required.").max(8000),
    requiredSkillsText: z.string().trim().max(4000).optional(),
    preferredSkillsText: z.string().trim().max(4000).optional(),
    idealCandidate: z.string().trim().max(4000).optional(),
    devEnvironment: z.string().trim().max(4000).optional(),
  })
  .refine((data) => data.weeklyDaysMin <= data.weeklyDaysMax, {
    message: "weeklyDaysMin must be less than or equal to weeklyDaysMax.",
  })
  .refine((data) => data.rateMin === undefined || data.rateMax === undefined || data.rateMin <= data.rateMax, {
    message: "rateMin must be less than or equal to rateMax.",
  });

export const projectFormSchema = projectInputSchema.extend({
  customSkills: z.string().trim().max(1000).optional(),
  publish: z.enum(["draft", "open"]),
});

export type ProjectInput = z.infer<typeof projectInputSchema>;
export type ProjectFormInput = z.infer<typeof projectFormSchema>;

export function parseProjectForm(formData: FormData) {
  return projectFormSchema.safeParse({
    title: formData.get("title"),
    summary: emptyToUndefined(formData.get("summary")),
    jobCategory: formData.get("jobCategory"),
    rateMin: emptyToUndefined(formData.get("rateMin")),
    rateMax: emptyToUndefined(formData.get("rateMax")),
    weeklyDaysMin: formData.get("weeklyDaysMin"),
    weeklyDaysMax: formData.get("weeklyDaysMax"),
    remoteType: formData.get("remoteType"),
    location: emptyToUndefined(formData.get("location")),
    prefecture: emptyToUndefined(formData.get("prefecture")),
    industry: emptyToUndefined(formData.get("industry")),
    contractType: emptyToUndefined(formData.get("contractType")),
    merits: emptyToUndefined(formData.get("merits")),
    background: emptyToUndefined(formData.get("background")),
    description: formData.get("description"),
    requiredSkillsText: emptyToUndefined(formData.get("requiredSkillsText")),
    preferredSkillsText: emptyToUndefined(formData.get("preferredSkillsText")),
    idealCandidate: emptyToUndefined(formData.get("idealCandidate")),
    devEnvironment: emptyToUndefined(formData.get("devEnvironment")),
    customSkills: emptyToUndefined(formData.get("customSkills")),
    publish: formData.get("publish") ?? "open",
  });
}

export function parseCustomSkillNames(value: string | undefined) {
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
    return { names: [] as string[], error: `Skill names must be 50 characters or fewer: ${tooLong}` };
  }
  if (names.length > 20) {
    return { names: [] as string[], error: "You can add up to 20 custom skills at once." };
  }

  return { names };
}

type SkillWriter = Pick<Prisma.TransactionClient, "skill">;

export async function resolveProjectSkillIds({
  db,
  skillIds,
  skillNames,
}: {
  db: SkillWriter;
  skillIds?: string[];
  skillNames?: string[];
}) {
  const cleanSkillIds = [...new Set((skillIds ?? []).map((id) => id.trim()).filter(Boolean))];
  const customSkills = parseCustomSkillNames((skillNames ?? []).join("\n"));
  if (customSkills.error) return { skillIds: [] as string[], error: customSkills.error };

  const customSkillIds = await Promise.all(
    customSkills.names.map((name) =>
      db.skill.upsert({
        where: { name },
        update: {},
        create: { name, category: "OTHER" },
        select: { id: true },
      }),
    ),
  );

  return {
    skillIds: [...new Set([...cleanSkillIds, ...customSkillIds.map((skill) => skill.id)])],
  };
}
