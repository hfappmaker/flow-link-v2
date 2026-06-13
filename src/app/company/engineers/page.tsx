import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/session";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { buttonClasses } from "@/components/ui/button";
import { EngineerFilters } from "@/components/company/engineer-filters";
import { REMOTE_TYPE_LABELS, WORK_STATUS_LABELS } from "@/lib/constants";
import {
  buildEngineerSearchQueryString,
  buildEngineerWhere,
  parseEngineerSearch,
  PAGE_SIZE,
  type EngineerSearchParams,
} from "@/lib/engineer-search";
import { formatDesiredWeeklyDays, formatEngineerTitles, formatRateRange } from "@/lib/format";

export const metadata: Metadata = { title: "エンジニア検索" };

function includesSearchText(name: string, texts: string[]) {
  if (texts.length === 0) return false;
  const normalizedName = name.toLowerCase();
  return texts.some((text) => normalizedName.includes(text.toLowerCase()));
}

function isEngineerSkillMatched(
  skill: { id: string; name: string },
  selectedSkillIds: string[],
  skillTexts: string[],
) {
  return selectedSkillIds.includes(skill.id) || includesSearchText(skill.name, skillTexts);
}

export default async function EngineerSearchPage({
  searchParams,
}: {
  searchParams: Promise<EngineerSearchParams>;
}) {
  await requireCompany();
  const params = await searchParams;
  const parsed = parseEngineerSearch(params);
  const where = buildEngineerWhere(parsed);

  const total = await prisma.engineerProfile.count({ where });
  const engineers = await prisma.engineerProfile.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    skip: (parsed.page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    include: { skills: { include: { skill: true } } },
  });
  const skills = await prisma.skill.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] });

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-black text-slate-900">エンジニア検索</h1>
      <p className="mt-1 text-sm text-slate-500">
        条件に合うフリーランスエンジニアを探して、スカウトを送りましょう。
      </p>

      <div className="mt-6 flex flex-col gap-8 lg:flex-row">
        <aside className="w-full shrink-0 lg:w-72">
          <EngineerFilters skills={skills} parsed={parsed} />
        </aside>

        <section className="min-w-0 flex-1">
          <p className="text-sm text-slate-600">
            <span className="text-xl font-black text-slate-900">{total}</span> 名のエンジニア
          </p>

          <div className="mt-4 space-y-4">
            {engineers.length === 0 ? (
              <EmptyState
                title="条件に合うエンジニアが見つかりませんでした"
                description="検索条件を緩めてお試しください。"
              />
            ) : (
              engineers.map((e) => (
                <article
                  key={e.id}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start gap-4">
                    <Avatar name={e.displayName} size="lg" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">
                          <Link href={`/company/engineers/${e.id}`} className="hover:text-blue-700">
                            {e.displayName}
                          </Link>
                        </h3>
                        {formatEngineerTitles(e.title) ? <Badge tone="outline">{formatEngineerTitles(e.title)}</Badge> : null}
                        <Badge tone={e.workStatus === "UNAVAILABLE" ? "gray" : "green"}>
                          {WORK_STATUS_LABELS[e.workStatus]}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {[
                          e.yearsOfExperience ? `実務${e.yearsOfExperience}年` : null,
                          e.location,
                          formatDesiredWeeklyDays(e.desiredWeeklyDays)
                            ? `${formatDesiredWeeklyDays(e.desiredWeeklyDays)}希望`
                            : null,
                          e.remotePreference ? REMOTE_TYPE_LABELS[e.remotePreference] : null,
                          e.desiredRateMin || e.desiredRateMax
                            ? `希望単価 ${formatRateRange(e.desiredRateMin, e.desiredRateMax)}`
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" / ")}
                      </p>
                      {e.skills.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {[...e.skills]
                            .sort((a, b) => {
                              const aMatched = isEngineerSkillMatched(a.skill, parsed.skill, parsed.skillText);
                              const bMatched = isEngineerSkillMatched(b.skill, parsed.skill, parsed.skillText);
                              return Number(bMatched) - Number(aMatched);
                            })
                            .slice(0, 10)
                            .map(({ skill }) => (
                              <Badge
                                key={skill.id}
                                tone={isEngineerSkillMatched(skill, parsed.skill, parsed.skillText) ? "blue" : "gray"}
                              >
                                {skill.name}
                              </Badge>
                            ))}
                        </div>
                      ) : null}
                      {e.bio ? (
                        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-600">{e.bio}</p>
                      ) : null}
                      <div className="mt-3">
                        <Link href={`/company/engineers/${e.id}`} className={buttonClasses("primary", "sm")}>
                          プロフィールを見てスカウト
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>

          <Pagination
            page={parsed.page}
            totalPages={totalPages}
            buildHref={(page) =>
              `/company/engineers${buildEngineerSearchQueryString(parsed, { page })}`
            }
          />
        </section>
      </div>
    </div>
  );
}
