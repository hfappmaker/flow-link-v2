import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/session";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { ScoutStatusBadge } from "@/components/status-badges";
import { buttonClasses } from "@/components/ui/button";
import { formatRelative } from "@/lib/format";

export const metadata: Metadata = { title: "スカウト管理" };

export default async function CompanyScoutsPage() {
  const { company } = await requireCompany();

  const scouts = await prisma.scout.findMany({
    where: { companyId: company.id },
    orderBy: { createdAt: "desc" },
    include: {
      engineer: { include: { engineerProfile: true } },
      project: { select: { id: true, title: true } },
      conversation: { select: { id: true } },
    },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">スカウト管理</h1>
          <p className="mt-1 text-sm text-slate-500">送信したスカウトの返答状況を確認できます。</p>
        </div>
        <Link href="/company/engineers" className={buttonClasses("primary")}>
          エンジニアを探す
        </Link>
      </div>

      <div className="mt-6 space-y-3">
        {scouts.length === 0 ? (
          <EmptyState
            title="まだスカウトを送信していません"
            description="エンジニア検索から条件に合う人材を見つけて、スカウトを送りましょう。"
            action={
              <Link href="/company/engineers" className={buttonClasses()}>
                エンジニアを探す
              </Link>
            }
          />
        ) : (
          scouts.map((s) => {
            const profile = s.engineer.engineerProfile;
            return (
              <div key={s.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start gap-4">
                  <Avatar name={profile?.displayName ?? s.engineer.name} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-slate-800">
                        {profile?.displayName ?? s.engineer.name ?? "エンジニア"}
                      </p>
                      <span className="text-xs text-slate-500">{profile?.title}</span>
                      <ScoutStatusBadge status={s.status} />
                      <span className="ml-auto text-xs text-slate-400">
                        {formatRelative(s.createdAt)}に送信
                      </span>
                    </div>
                    {s.title ? <p className="mt-1.5 text-sm font-semibold text-slate-700">{s.title}</p> : null}
                    {s.project ? (
                      <p className="mt-1 text-xs text-slate-500">対象案件: {s.project.title}</p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {s.conversation ? (
                        <Link href={`/messages/${s.conversation.id}`} className={buttonClasses("primary", "sm")}>
                          チャットを開く
                        </Link>
                      ) : null}
                      {profile ? (
                        <Link href={`/company/engineers/${profile.id}`} className={buttonClasses("outline", "sm")}>
                          プロフィール
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
