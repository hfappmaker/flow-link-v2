import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProjectCard } from "@/components/project-card";
import { ProjectFilters } from "@/components/project-filters";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import {
  buildProjectOrderBy,
  buildProjectWhere,
  buildSearchQueryString,
  parseProjectSearch,
  PAGE_SIZE,
  type ProjectSearchParams,
} from "@/lib/project-search";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "案件検索" };

const SORT_OPTIONS = [
  { value: "new", label: "新着順" },
  { value: "rate", label: "単価順" },
  { value: "popular", label: "人気順" },
];

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<ProjectSearchParams>;
}) {
  const params = await searchParams;
  const parsed = parseProjectSearch(params);
  const where = buildProjectWhere(parsed);

  const [total, projects, languages, otherSkills] = await Promise.all([
    prisma.project.count({ where }),
    prisma.project.findMany({
      where,
      orderBy: buildProjectOrderBy(parsed.sort),
      skip: (parsed.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        company: { select: { name: true } },
        skills: { include: { skill: true } },
      },
    }),
    prisma.skill.findMany({ where: { category: "LANGUAGE" }, orderBy: { name: "asc" } }),
    prisma.skill.findMany({ where: { category: { not: "LANGUAGE" } }, orderBy: { name: "asc" } }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const skillHighlight = {
    languageIds: parsed.lang,
    skillIds: parsed.skill,
    languageTexts: parsed.langText,
    skillTexts: parsed.skillText,
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-black text-slate-900">案件検索</h1>
      <p className="mt-1 text-sm text-slate-500">
        フリーランスエンジニア向けの業務委託案件を検索できます。
      </p>

      <div className="mt-6 flex flex-col gap-8 lg:flex-row">
        <aside className="w-full shrink-0 lg:w-72">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-20">
            <ProjectFilters languages={languages} otherSkills={otherSkills} parsed={parsed} />
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600">
              <span className="text-xl font-black text-slate-900">{total}</span> 件の案件
            </p>
            <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
              {SORT_OPTIONS.map((o) => (
                <Link
                  key={o.value}
                  href={`/projects${buildSearchQueryString(parsed, { sort: o.value })}`}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-semibold",
                    parsed.sort === o.value
                      ? "bg-blue-600 text-white"
                      : "text-slate-600 hover:bg-slate-100",
                  )}
                >
                  {o.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-4 space-y-4">
            {projects.length === 0 ? (
              <EmptyState
                title="条件に合う案件が見つかりませんでした"
                description="検索条件を変更してお試しください。"
              />
            ) : (
              projects.map((p) => <ProjectCard key={p.id} project={p} skillHighlight={skillHighlight} />)
            )}
          </div>

          <Pagination
            page={parsed.page}
            totalPages={totalPages}
            buildHref={(page) =>
              `/projects${buildSearchQueryString(parsed, { sort: parsed.sort, page })}`
            }
          />
        </section>
      </div>
    </div>
  );
}
