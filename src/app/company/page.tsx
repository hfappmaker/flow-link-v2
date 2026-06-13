import type { Metadata } from "next";
import Link from "next/link";
import { FileText, MessageSquare, Send, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/session";
import { getUnreadMessageCount } from "@/lib/messages";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ApplicationStatusBadge } from "@/components/status-badges";
import { buttonClasses } from "@/components/ui/button";
import { formatEngineerTitles, formatRelative } from "@/lib/format";

export const metadata: Metadata = { title: "採用ダッシュボード" };

export default async function CompanyDashboardPage() {
  const { user, company } = await requireCompany();

  const openProjects = await prisma.project.count({ where: { companyId: company.id, status: "OPEN" } });
  const newApplications = await prisma.application.count({
    where: { project: { companyId: company.id }, status: "APPLIED" },
  });
  const pendingScouts = await prisma.scout.count({ where: { companyId: company.id, status: "SENT" } });
  const unread = await getUnreadMessageCount(user);
  const recentApplications = await prisma.application.findMany({
    where: { project: { companyId: company.id } },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      engineer: { include: { engineerProfile: true } },
      project: { select: { id: true, title: true } },
      conversation: { select: { id: true } },
    },
  });

  const stats = [
    { label: "公開中の案件", value: openProjects, href: "/company/projects", icon: FileText },
    { label: "新規応募（未対応）", value: newApplications, href: "/company/projects", icon: Users },
    { label: "返答待ちスカウト", value: pendingScouts, href: "/company/scouts", icon: Send },
    { label: "未読メッセージ", value: unread, href: "/messages", icon: MessageSquare },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">{company.name} 採用ダッシュボード</h1>
          <p className="mt-1 text-sm text-slate-500">応募状況とスカウトの進捗を確認できます。</p>
        </div>
        <div className="flex gap-3">
          <Link href="/company/engineers" className={buttonClasses("outline")}>
            エンジニアを探す
          </Link>
          <Link href="/company/projects/new" className={buttonClasses("primary")}>
            案件を掲載する
          </Link>
        </div>
      </div>

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

      <Card className="mt-8">
        <CardHeader title="最近の応募" />
        <CardBody>
          {recentApplications.length === 0 ? (
            <p className="text-sm text-slate-500">
              まだ応募はありません。案件を公開するか、エンジニア検索からスカウトを送ってみましょう。
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentApplications.map((a) => (
                <div key={a.id} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-800">
                      {a.engineer.engineerProfile?.displayName ?? a.engineer.name}
                      <span className="ml-2 text-xs font-normal text-slate-500">
                        {formatEngineerTitles(a.engineer.engineerProfile?.title)}
                      </span>
                    </p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">{a.project.title}</p>
                  </div>
                  <ApplicationStatusBadge status={a.status} />
                  <span className="text-xs text-slate-400">{formatRelative(a.createdAt)}</span>
                  <div className="flex gap-2">
                    <Link
                      href={`/company/projects/${a.project.id}/applicants`}
                      className={buttonClasses("outline", "sm")}
                    >
                      応募者管理
                    </Link>
                    {a.conversation ? (
                      <Link href={`/messages/${a.conversation.id}`} className={buttonClasses("primary", "sm")}>
                        チャット
                      </Link>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
