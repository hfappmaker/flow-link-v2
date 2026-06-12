import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { RemoteType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/session";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/form";
import { Pagination } from "@/components/ui/pagination";
import { buttonClasses } from "@/components/ui/button";
import {
  JOB_CATEGORIES,
  PAGE_SIZE,
  REMOTE_TYPE_LABELS,
  WORK_STATUS_LABELS,
} from "@/lib/constants";
import { formatRateRange } from "@/lib/format";

export const metadata: Metadata = { title: "エンジニア検索" };

type SearchParams = {
  q?: string;
  job?: string;
  skill?: string;
  days?: string;
  remote?: string;
  availableOnly?: string;
  page?: string;
};

export default async function EngineerSearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireCompany();
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const where: Prisma.EngineerProfileWhereInput = { isPublic: true };
  const and: Prisma.EngineerProfileWhereInput[] = [];

  if (params.q?.trim()) {
    const q = params.q.trim();
    and.push({
      OR: [
        { displayName: { contains: q, mode: "insensitive" } },
        { bio: { contains: q, mode: "insensitive" } },
        { skills: { some: { skill: { name: { contains: q, mode: "insensitive" } } } } },
      ],
    });
  }
  if (params.job) and.push({ title: params.job });
  if (params.skill) and.push({ skills: { some: { skillId: params.skill } } });
  const days = Number.parseInt(params.days ?? "", 10);
  if (days >= 1 && days <= 5) {
    and.push({ OR: [{ desiredWeeklyDays: null }, { desiredWeeklyDays: { gte: days } }] });
  }
  if (params.remote && (Object.values(RemoteType) as string[]).includes(params.remote)) {
    and.push({ remotePreference: params.remote as RemoteType });
  }
  if (params.availableOnly === "on") {
    and.push({ workStatus: { in: ["AVAILABLE", "OPEN_TO_OFFERS"] } });
  }
  if (and.length > 0) where.AND = and;

  const [total, engineers, skills] = await Promise.all([
    prisma.engineerProfile.count({ where }),
    prisma.engineerProfile.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { skills: { include: { skill: true } } },
    }),
    prisma.skill.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const buildHref = (p: number) => {
    const sp = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value && key !== "page") sp.set(key, value);
    }
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return `/company/engineers${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-black text-slate-900">エンジニア検索</h1>
      <p className="mt-1 text-sm text-slate-500">
        条件に合うフリーランスエンジニアを探して、スカウトを送りましょう。
      </p>

      <div className="mt-6 flex flex-col gap-8 lg:flex-row">
        <aside className="w-full shrink-0 lg:w-72">
          <form
            method="get"
            action="/company/engineers"
            className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-20"
          >
            <div>
              <p className="mb-2 text-xs font-bold tracking-wide text-slate-500">フリーワード</p>
              <Input name="q" defaultValue={params.q ?? ""} placeholder="名前・スキル・経歴" />
            </div>
            <div>
              <p className="mb-2 text-xs font-bold tracking-wide text-slate-500">職種</p>
              <Select name="job" defaultValue={params.job ?? ""}>
                <option value="">すべての職種</option>
                {JOB_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <p className="mb-2 text-xs font-bold tracking-wide text-slate-500">スキル</p>
              <Select name="skill" defaultValue={params.skill ?? ""}>
                <option value="">すべてのスキル</option>
                {skills.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <p className="mb-2 text-xs font-bold tracking-wide text-slate-500">稼働可能日数</p>
              <Select name="days" defaultValue={params.days ?? ""}>
                <option value="">指定なし</option>
                {[1, 2, 3, 4, 5].map((d) => (
                  <option key={d} value={d}>
                    週{d}日以上
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <p className="mb-2 text-xs font-bold tracking-wide text-slate-500">リモート希望</p>
              <Select name="remote" defaultValue={params.remote ?? ""}>
                <option value="">指定なし</option>
                {Object.entries(REMOTE_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name="availableOnly"
                defaultChecked={params.availableOnly === "on"}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              稼働可能な人のみ
            </label>
            <button
              type="submit"
              className="h-10 w-full rounded-lg bg-blue-600 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              この条件で検索
            </button>
          </form>
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
                        {e.title ? <Badge tone="outline">{e.title}</Badge> : null}
                        <Badge tone={e.workStatus === "UNAVAILABLE" ? "gray" : "green"}>
                          {WORK_STATUS_LABELS[e.workStatus]}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {[
                          e.yearsOfExperience ? `実務${e.yearsOfExperience}年` : null,
                          e.location,
                          e.desiredWeeklyDays ? `週${e.desiredWeeklyDays}日希望` : null,
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
                          {e.skills.slice(0, 10).map(({ skill }) => (
                            <Badge key={skill.id} tone="gray">
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

          <Pagination page={page} totalPages={totalPages} buildHref={buildHref} />
        </section>
      </div>
    </div>
  );
}
