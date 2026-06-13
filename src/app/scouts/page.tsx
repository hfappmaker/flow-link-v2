import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireEngineer } from "@/lib/session";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonClasses } from "@/components/ui/button";
import { formatRelative } from "@/lib/format";

export const metadata: Metadata = { title: "スカウト" };

export default async function ScoutsPage() {
  const { user } = await requireEngineer();

  const scouts = await prisma.scout.findMany({
    where: { engineerUserId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      company: true,
      project: { select: { id: true, title: true, status: true } },
      conversation: { select: { id: true } },
    },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-black text-slate-900">受け取ったスカウト</h1>
      <p className="mt-1 text-sm text-slate-500">
        企業からのスカウトにチャットで直接返信できます。
      </p>

      <div className="mt-6 space-y-3">
        {scouts.length === 0 ? (
          <EmptyState
            title="まだスカウトは届いていません"
            description="プロフィールのスキルや希望条件を充実させると、企業の検索結果に表示されやすくなります。"
            action={
              <Link href="/settings/profile" className={buttonClasses()}>
                プロフィールを編集
              </Link>
            }
          />
        ) : (
          scouts.map((s) => (
            <div key={s.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-slate-400">{formatRelative(s.createdAt)}</span>
                <p className="text-sm font-bold text-slate-700">{s.company.name}</p>
              </div>

              {s.title ? <p className="mt-2 text-base font-bold text-slate-900">{s.title}</p> : null}
              <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed whitespace-pre-line text-slate-600">
                {s.message}
              </p>

              {s.project ? (
                <Link
                  href={`/projects/${s.project.id}`}
                  className="mt-3 block rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-blue-700 hover:underline"
                >
                  対象案件: {s.project.title}
                </Link>
              ) : null}

              <div className="mt-4 flex flex-wrap items-center gap-3">
                {s.conversation ? (
                  <Link href={`/messages/${s.conversation.id}`} className={buttonClasses("primary", "sm")}>
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
