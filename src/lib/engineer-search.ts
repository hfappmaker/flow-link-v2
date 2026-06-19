import type { Prisma } from "@prisma/client";
import { RemoteType } from "@prisma/client";
import { PAGE_SIZE, WEEKLY_DAYS_OPTIONS } from "@/lib/constants";

export type EngineerSearchParams = {
  q?: string;
  job?: string | string[];
  jobText?: string | string[];
  skill?: string | string[];
  skillText?: string | string[];
  days?: string | string[];
  rateMin?: string;
  rateMax?: string;
  remote?: string | string[];
  availableOnly?: string;
  page?: string;
};

export type ParsedEngineerSearch = ReturnType<typeof parseEngineerSearch>;

const toArray = (v: string | string[] | undefined): string[] =>
  v === undefined ? [] : Array.isArray(v) ? v : [v];

const toTagArray = (v: string | string[] | undefined): string[] => [
  ...new Set(
    toArray(v)
      .flatMap((value) => value.split(/[\n,、]/))
      .map((value) => value.trim().replace(/\s+/g, " "))
      .filter(Boolean),
  ),
];

export function parseEngineerSearch(params: EngineerSearchParams) {
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const days = [
    ...new Set(
      toArray(params.days)
        .map((d) => Number.parseInt(d, 10))
        .filter((d) => (WEEKLY_DAYS_OPTIONS as readonly number[]).includes(d)),
    ),
  ];
  const remote = toArray(params.remote).filter((r): r is RemoteType =>
    (Object.values(RemoteType) as string[]).includes(r),
  );
  const rateMin = Number.parseInt(params.rateMin ?? "", 10) || undefined;
  const rateMax = Number.parseInt(params.rateMax ?? "", 10) || undefined;

  return {
    q: params.q?.trim() || undefined,
    job: toArray(params.job).filter(Boolean),
    jobText: toTagArray(params.jobText),
    skill: toArray(params.skill).filter(Boolean),
    skillText: toTagArray(params.skillText),
    days,
    rateMin,
    rateMax,
    remote,
    availableOnly: params.availableOnly === "on",
    page,
  };
}

export function buildEngineerWhere(parsed: ParsedEngineerSearch): Prisma.EngineerProfileWhereInput {
  const where: Prisma.EngineerProfileWhereInput = { isPublic: true };
  const and: Prisma.EngineerProfileWhereInput[] = [];

  if (parsed.q) {
    and.push({
      OR: [
        { displayName: { contains: parsed.q, mode: "insensitive" } },
        { bio: { contains: parsed.q, mode: "insensitive" } },
        { title: { has: parsed.q } },
        { customSkillNames: { has: parsed.q } },
        { skills: { some: { skill: { name: { contains: parsed.q, mode: "insensitive" } } } } },
      ],
    });
  }

  const jobFilters: Prisma.EngineerProfileWhereInput[] = [];
  const jobTitles = [...new Set([...parsed.job, ...parsed.jobText])];
  if (jobTitles.length > 0) jobFilters.push({ title: { hasSome: jobTitles } });
  if (jobFilters.length > 0) and.push({ OR: jobFilters });

  const skillFilters: Prisma.EngineerProfileWhereInput[] = [];
  if (parsed.skill.length > 0) {
    skillFilters.push({ skills: { some: { skillId: { in: parsed.skill } } } });
  }
  for (const skillText of parsed.skillText) {
    skillFilters.push({
      skills: {
        some: {
          skill: { name: { contains: skillText, mode: "insensitive" } },
        },
      },
    });
    skillFilters.push({ customSkillNames: { has: skillText } });
  }
  if (skillFilters.length > 0) and.push({ OR: skillFilters });

  if (parsed.days.length > 0) {
    and.push({ desiredWeeklyDays: { hasSome: parsed.days } });
  }
  if (parsed.rateMin) and.push({ OR: [{ desiredRateMax: null }, { desiredRateMax: { gte: parsed.rateMin } }] });
  if (parsed.rateMax) and.push({ OR: [{ desiredRateMin: null }, { desiredRateMin: { lte: parsed.rateMax } }] });
  if (parsed.remote.length > 0) and.push({ remotePreference: { in: parsed.remote } });
  if (parsed.availableOnly) and.push({ workStatus: { in: ["AVAILABLE", "OPEN_TO_OFFERS"] } });

  if (and.length > 0) where.AND = and;
  return where;
}

export function buildEngineerSearchQueryString(
  parsed: ParsedEngineerSearch,
  overrides: Partial<{ page: number }> = {},
): string {
  const sp = new URLSearchParams();
  if (parsed.q) sp.set("q", parsed.q);
  for (const job of parsed.job) sp.append("job", job);
  for (const jobText of parsed.jobText) sp.append("jobText", jobText);
  for (const skill of parsed.skill) sp.append("skill", skill);
  for (const skillText of parsed.skillText) sp.append("skillText", skillText);
  for (const day of parsed.days) sp.append("days", String(day));
  if (parsed.rateMin) sp.set("rateMin", String(parsed.rateMin));
  if (parsed.rateMax) sp.set("rateMax", String(parsed.rateMax));
  for (const remote of parsed.remote) sp.append("remote", remote);
  if (parsed.availableOnly) sp.set("availableOnly", "on");

  const page = overrides.page ?? 1;
  if (page > 1) sp.set("page", String(page));

  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export { PAGE_SIZE };
