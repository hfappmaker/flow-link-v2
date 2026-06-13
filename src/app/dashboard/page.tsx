import type { Metadata } from "next";
import Link from "next/link";
import { Bookmark, FileText, Mail, MessageSquare } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireEngineer } from "@/lib/session";
import { getUnreadMessageCount } from "@/lib/messages";
import { ProjectCard } from "@/components/project-card";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ScoutStatusBadge } from "@/components/status-badges";
import { formatRelative } from "@/lib/format";

export const metadata: Metadata = { title: "マイページ" };

export default async function DashboardPage() {
  const { user, profile } = await requireEngineer();

  const skillIds = (
    await prisma.engineerSkill.findMany({
      where: { engineerProfileId: profile.id },
      select: { skillId: true },
    })
  ).map((s) => s.skillId);

  const activeApplications = await prisma.application.count({
    where: { engineerUserId: user.id, status: { in: ["APPLIED", "SCREENING", "INTERVIEW", "OFFERED"] } },
  });
  const pendingScouts = await prisma.scout.count({ where: { engineerUserId: user.id, status: "SENT" } });
  const savedCount = await prisma.savedProject.count({ where: { userId: user.id } });
  const unread = await getUnreadMessageCount(user);
  const recentScouts = await prisma.scout.findMany({
    where: { engineerUserId: user.id },
    orderBy: { createdAt: "desc" },
    take: 3,
    include: { company: true },
  });
  const recommended = await prisma.project.findMany({
    where: {
      status: "OPEN",
      ...(skillIds.length > 0 ? { skills: { some: { skillId: { in: skillIds } } } } : {}),
    },
    orderBy: { publishedAt: "desc" },
    take: 4,
    include: {
      company: { select: { name: true } },
      skills: { include: { skill: true } },
    },
  });

  const stats = [
    { label: "選考中の応募", value: activeApplications, href: "/applications", icon: FileText },
    { label: "未対応スカウト", value: pendingScouts, href: "/scouts", icon: Mail },
    { label: "未読メッセージ", value: unread, href: "/messages", icon: MessageSquare },
    { label: "保存した案件", value: savedCount, href: "/saved", icon: Bookmark },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-black text-slate-900">
        こんにちは、{profile.displayName}さん
      </h1>
      <p className="mt-1 text-sm text-slate-500">今日もFlowLinkで次の案件を見つけましょう。</p>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-blue-300"
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <s.icon className="h-4 w-4 text-blue-500" />
              {s.label}
            </div>
            <p className="mt-2 text-3xl font-black text-slate-900">{s.value}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">あなたのスキルに合う新着案件</h2>
            <Link href="/projects" className="text-sm font-semibold text-blue-600 hover:underline">
              すべて見る
            </Link>
          </div>
          <div className="mt-4 space-y-4">
            {recommended.length === 0 ? (
              <p className="text-sm text-slate-500">
                まだ案件がありません。
                <Link href="/settings/profile" className="text-blue-600 hover:underline">
                  プロフィールにスキルを登録
                </Link>
                するとおすすめが表示されます。
              </p>
            ) : (
              recommended.map((p) => <ProjectCard key={p.id} project={p} />)
            )}
          </div>
        </section>

        <aside className="space-y-6">
          <Card>
            <CardHeader
              title="最近のスカウト"
              action={
                <Link href="/scouts" className="text-xs font-semibold text-blue-600 hover:underline">
                  すべて見る
                </Link>
              }
            />
            <CardBody className="space-y-3">
              {recentScouts.length === 0 ? (
                <p className="text-sm text-slate-500">
                  まだスカウトはありません。プロフィールを充実させるとスカウト率が上がります。
                </p>
              ) : (
                recentScouts.map((s) => (
                  <Link
                    key={s.id}
                    href="/scouts"
                    className="block rounded-lg border border-slate-100 p-3 hover:bg-slate-50"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-bold text-slate-800">{s.company.name}</p>
                      <ScoutStatusBadge status={s.status} />
                    </div>
                    <p className="mt-1 truncate text-xs text-slate-500">{s.title ?? s.message}</p>
                    <p className="mt-1 text-xs text-slate-400">{formatRelative(s.createdAt)}</p>
                  </Link>
                ))
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="プロフィール" />
            <CardBody>
              <p className="text-sm text-slate-600">
                スキルや希望条件を最新に保つと、企業からのスカウトが届きやすくなります。
              </p>
              <Link
                href="/settings/profile"
                className="mt-3 inline-flex h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                プロフィールを編集
              </Link>
            </CardBody>
          </Card>
        </aside>
      </div>
    </div>
  );
}
