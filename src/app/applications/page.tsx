import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireEngineer } from "@/lib/session";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonClasses } from "@/components/ui/button";
import { REMOTE_TYPE_LABELS } from "@/lib/constants";
import { formatRateRange, formatRelative, formatWeeklyDays } from "@/lib/format";

export const metadata: Metadata = { title: "応募管理" };

export default async function ApplicationsPage() {
  const { user } = await requireEngineer();

  const applications = await prisma.application.findMany({
    where: { engineerUserId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      project: { include: { company: { select: { name: true } } } },
      conversation: { select: { id: true } },
    },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-black text-slate-900">応募管理</h1>
      <p className="mt-1 text-sm text-slate-500">応募した案件と企業とのチャットを確認できます。</p>

      <div className="mt-6 space-y-3">
        {applications.length === 0 ? (
          <EmptyState
            title="まだ応募した案件はありません"
            description="気になる案件を見つけて応募してみましょう。"
            action={
              <Link href="/projects" className={buttonClasses()}>
                案件を探す
              </Link>
            }
          />
        ) : (
          applications.map((a) => (
            <div key={a.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-slate-400">{formatRelative(a.createdAt)}に応募</span>
                <p className="text-xs text-slate-500">{a.project.company.name}</p>
              </div>
              <Link
                href={`/projects/${a.project.id}`}
                className="mt-2 block text-base font-bold text-slate-900 hover:text-blue-700"
              >
                {a.project.title}
              </Link>
              <p className="mt-1.5 text-sm text-slate-600">
                <span className="font-bold text-blue-700">
                  {formatRateRange(a.project.rateMin, a.project.rateMax)}
                </span>
                <span className="mx-2 text-slate-300">|</span>
                {formatWeeklyDays(a.project.weeklyDaysMin, a.project.weeklyDaysMax)}
                <span className="mx-2 text-slate-300">|</span>
                {REMOTE_TYPE_LABELS[a.project.remoteType]}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                {a.conversation ? (
                  <Link href={`/messages/${a.conversation.id}`} className={buttonClasses("primary", "sm")}>
                    チャットを開く
                  </Link>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
