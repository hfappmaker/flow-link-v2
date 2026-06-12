import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/session";
import { updateProjectStatus } from "@/lib/actions/projects";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonClasses } from "@/components/ui/button";
import { PROJECT_STATUS_LABELS, REMOTE_TYPE_LABELS } from "@/lib/constants";
import { formatRateRange, formatRelative, formatWeeklyDays } from "@/lib/format";

export const metadata: Metadata = { title: "案件管理" };

const statusTone = { DRAFT: "gray", OPEN: "green", CLOSED: "gray" } as const;

export default async function CompanyProjectsPage() {
  const { company } = await requireCompany();

  const projects = await prisma.project.findMany({
    where: { companyId: company.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { applications: true } } },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">案件管理</h1>
          <p className="mt-1 text-sm text-slate-500">掲載中の案件と応募状況を管理できます。</p>
        </div>
        <Link href="/company/projects/new" className={buttonClasses("primary")}>
          新規案件を掲載
        </Link>
      </div>

      <div className="mt-6 space-y-3">
        {projects.length === 0 ? (
          <EmptyState
            title="まだ案件がありません"
            description="最初の案件を掲載して、フリーランスエンジニアからの応募を受け付けましょう。"
            action={
              <Link href="/company/projects/new" className={buttonClasses()}>
                案件を掲載する
              </Link>
            }
          />
        ) : (
          projects.map((p) => (
            <div key={p.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={statusTone[p.status]}>{PROJECT_STATUS_LABELS[p.status]}</Badge>
                <span className="text-xs text-slate-400">
                  {p.publishedAt ? `${formatRelative(p.publishedAt)}に公開` : `${formatRelative(p.createdAt)}に作成`}
                </span>
                <span className="ml-auto text-sm text-slate-600">
                  応募 <span className="font-black text-slate-900">{p._count.applications}</span> 件
                </span>
              </div>

              <Link
                href={`/projects/${p.id}`}
                className="mt-2 block text-base font-bold text-slate-900 hover:text-blue-700"
              >
                {p.title}
              </Link>
              <p className="mt-1.5 text-sm text-slate-600">
                <span className="font-bold text-blue-700">{formatRateRange(p.rateMin, p.rateMax)}</span>
                <span className="mx-2 text-slate-300">|</span>
                {formatWeeklyDays(p.weeklyDaysMin, p.weeklyDaysMax)}
                <span className="mx-2 text-slate-300">|</span>
                {REMOTE_TYPE_LABELS[p.remoteType]}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Link
                  href={`/company/projects/${p.id}/applicants`}
                  className={buttonClasses("primary", "sm")}
                >
                  応募者を見る（{p._count.applications}）
                </Link>
                <Link href={`/company/projects/${p.id}/edit`} className={buttonClasses("outline", "sm")}>
                  編集
                </Link>
                {p.status === "OPEN" ? (
                  <form action={updateProjectStatus}>
                    <input type="hidden" name="projectId" value={p.id} />
                    <input type="hidden" name="status" value="CLOSED" />
                    <button type="submit" className={buttonClasses("danger", "sm")}>
                      募集を終了
                    </button>
                  </form>
                ) : p.status === "CLOSED" ? (
                  <form action={updateProjectStatus}>
                    <input type="hidden" name="projectId" value={p.id} />
                    <input type="hidden" name="status" value="OPEN" />
                    <button type="submit" className={buttonClasses("outline", "sm")}>
                      募集を再開
                    </button>
                  </form>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
