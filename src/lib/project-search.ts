import type { Prisma } from "@prisma/client";
import { RemoteType } from "@prisma/client";
import { PAGE_SIZE, PREFECTURES, WEEKLY_DAYS_OPTIONS } from "@/lib/constants";

export type ProjectSearchParams = {
  q?: string;
  job?: string | string[];
  jobText?: string | string[];
  lang?: string | string[];
  langText?: string | string[];
  skill?: string | string[];
  skillText?: string | string[];
  prefecture?: string | string[];
  rateMin?: string;
  rateMax?: string;
  days?: string | string[];
  remote?: string | string[];
  features?: string | string[];
  sort?: string;
  page?: string;
};

export type ParsedProjectSearch = ReturnType<typeof parseProjectSearch>;

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

export function parseProjectSearch(params: ProjectSearchParams) {
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const sort = ["new", "rate"].includes(params.sort ?? "") ? params.sort! : "new";
  const days = toArray(params.days)
    .map((d) => Number.parseInt(d, 10))
    .filter((d) => (WEEKLY_DAYS_OPTIONS as readonly number[]).includes(d));
  const remote = toArray(params.remote).filter((r): r is RemoteType =>
    (Object.values(RemoteType) as string[]).includes(r),
  );
  const features = toArray(params.features).filter(Boolean);
  const prefecture = toArray(params.prefecture).filter((p): p is (typeof PREFECTURES)[number] =>
    (PREFECTURES as readonly string[]).includes(p),
  );
  const rateMin = Number.parseInt(params.rateMin ?? "", 10) || undefined;
  const rateMax = Number.parseInt(params.rateMax ?? "", 10) || undefined;

  return {
    q: params.q?.trim() || undefined,
    job: toArray(params.job).filter(Boolean),
    jobText: toTagArray(params.jobText),
    skill: [...new Set([...toArray(params.lang), ...toArray(params.skill)].filter(Boolean))],
    skillText: toTagArray([...toArray(params.langText), ...toArray(params.skillText)]),
    prefecture,
    rateMin,
    rateMax,
    days,
    remote,
    features,
    sort,
    page,
  };
}

export function buildProjectWhere(parsed: ParsedProjectSearch): Prisma.ProjectWhereInput {
  const where: Prisma.ProjectWhereInput = { status: "OPEN" };
  const and: Prisma.ProjectWhereInput[] = [];

  if (parsed.q) {
    and.push({
      OR: [
        { title: { contains: parsed.q, mode: "insensitive" } },
        { summary: { contains: parsed.q, mode: "insensitive" } },
        { description: { contains: parsed.q, mode: "insensitive" } },
        { skills: { some: { skill: { name: { contains: parsed.q, mode: "insensitive" } } } } },
      ],
    });
  }
  const jobFilters: Prisma.ProjectWhereInput[] = [];
  if (parsed.job.length > 0) jobFilters.push({ jobCategory: { in: parsed.job } });
  for (const jobText of parsed.jobText) {
    jobFilters.push({ jobCategory: { contains: jobText, mode: "insensitive" } });
  }
  if (jobFilters.length > 0) and.push({ OR: jobFilters });

  const skillFilters: Prisma.ProjectWhereInput[] = [];
  if (parsed.skill.length > 0) {
    skillFilters.push({ skills: { some: { skillId: { in: parsed.skill } } } });
  }
  for (const skillText of parsed.skillText) {
    skillFilters.push({
      skills: {
        some: {
          skill: {
            name: { contains: skillText, mode: "insensitive" },
          },
        },
      },
    });
  }
  if (skillFilters.length > 0) and.push({ OR: skillFilters });

  if (parsed.prefecture.length > 0) and.push({ prefecture: { in: parsed.prefecture } });
  if (parsed.rateMin) and.push({ OR: [{ rateMax: null }, { rateMax: { gte: parsed.rateMin } }] });
  if (parsed.rateMax) and.push({ OR: [{ rateMin: null }, { rateMin: { lte: parsed.rateMax } }] });
  if (parsed.days.length > 0) {
    and.push({
      OR: parsed.days.map((d) => ({
        weeklyDaysMin: { lte: d },
        weeklyDaysMax: { gte: d },
      })),
    });
  }
  if (parsed.remote.length > 0) and.push({ remoteType: { in: parsed.remote } });
  if (parsed.features.length > 0) and.push({ features: { hasEvery: parsed.features } });

  if (and.length > 0) where.AND = and;
  return where;
}

export function buildProjectOrderBy(
  sort: string,
): Prisma.ProjectOrderByWithRelationInput[] {
  if (sort === "rate") {
    return [{ rateMax: { sort: "desc", nulls: "last" } }, { publishedAt: "desc" }];
  }
  return [{ publishedAt: "desc" }];
}

export function buildSearchQueryString(
  parsed: ParsedProjectSearch,
  overrides: Partial<{ sort: string; page: number }> = {},
): string {
  const sp = new URLSearchParams();
  if (parsed.q) sp.set("q", parsed.q);
  for (const job of parsed.job) sp.append("job", job);
  for (const jobText of parsed.jobText) sp.append("jobText", jobText);
  for (const skill of parsed.skill) sp.append("skill", skill);
  for (const skillText of parsed.skillText) sp.append("skillText", skillText);
  for (const prefecture of parsed.prefecture) sp.append("prefecture", prefecture);
  if (parsed.rateMin) sp.set("rateMin", String(parsed.rateMin));
  if (parsed.rateMax) sp.set("rateMax", String(parsed.rateMax));
  for (const d of parsed.days) sp.append("days", String(d));
  for (const r of parsed.remote) sp.append("remote", r);
  for (const f of parsed.features) sp.append("features", f);

  const sort = overrides.sort ?? parsed.sort;
  if (sort !== "new") sp.set("sort", sort);
  const page = overrides.page ?? 1;
  if (page > 1) sp.set("page", String(page));

  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export { PAGE_SIZE };
