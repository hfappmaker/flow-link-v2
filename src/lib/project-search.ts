import type { Prisma } from "@prisma/client";
import { RemoteType } from "@prisma/client";
import { PAGE_SIZE } from "@/lib/constants";

export type ProjectSearchParams = {
  q?: string;
  job?: string;
  lang?: string;
  skill?: string;
  rateMin?: string;
  days?: string | string[];
  remote?: string | string[];
  features?: string | string[];
  sort?: string;
  page?: string;
};

export type ParsedProjectSearch = ReturnType<typeof parseProjectSearch>;

const toArray = (v: string | string[] | undefined): string[] =>
  v === undefined ? [] : Array.isArray(v) ? v : [v];

export function parseProjectSearch(params: ProjectSearchParams) {
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const sort = ["new", "rate", "popular"].includes(params.sort ?? "") ? params.sort! : "new";
  const days = toArray(params.days)
    .map((d) => Number.parseInt(d, 10))
    .filter((d) => d >= 1 && d <= 5);
  const remote = toArray(params.remote).filter((r): r is RemoteType =>
    (Object.values(RemoteType) as string[]).includes(r),
  );
  const features = toArray(params.features).filter(Boolean);
  const rateMin = Number.parseInt(params.rateMin ?? "", 10) || undefined;

  return {
    q: params.q?.trim() || undefined,
    job: params.job || undefined,
    lang: params.lang || undefined,
    skill: params.skill || undefined,
    rateMin,
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
  if (parsed.job) and.push({ jobCategory: parsed.job });
  if (parsed.lang) and.push({ skills: { some: { skillId: parsed.lang } } });
  if (parsed.skill) and.push({ skills: { some: { skillId: parsed.skill } } });
  if (parsed.rateMin) and.push({ rateMax: { gte: parsed.rateMin } });
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
  if (sort === "popular") {
    return [{ viewCount: "desc" }, { publishedAt: "desc" }];
  }
  return [{ publishedAt: "desc" }];
}

export function buildSearchQueryString(
  parsed: ParsedProjectSearch,
  overrides: Partial<{ sort: string; page: number }> = {},
): string {
  const sp = new URLSearchParams();
  if (parsed.q) sp.set("q", parsed.q);
  if (parsed.job) sp.set("job", parsed.job);
  if (parsed.lang) sp.set("lang", parsed.lang);
  if (parsed.skill) sp.set("skill", parsed.skill);
  if (parsed.rateMin) sp.set("rateMin", String(parsed.rateMin));
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
