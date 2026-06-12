import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/session";
import { updateApplicationStatus } from "@/lib/actions/applications";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonClasses } from "@/components/ui/button";
import { ApplicationStatusBadge } from "@/components/status-badges";
import { APPLICATION_STATUS_LABELS } from "@/lib/constants";
import { formatRelative } from "@/lib/format";

export const metadata: Metadata = { title: "応募者管理" };

export default async function ApplicantsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { company } = await requireCompany();

  const project = await prisma.project.findFirst({
    where: { id, companyId: company.id },
    include: {
      applications: {
        orderBy: { createdAt: "desc" },
        include: {
          engineer: {
            include: {
              engineerProfile: { include: { skills: { include: { skill: true } } } },
            },
          },
          conversation: { select: { id: true } },
        },
      },
    },
  });
  if (!project) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <nav className="text-xs text-slate-400">
        <Link href="/company/projects" className="hover:text-slate-600 hover:underline">
          案件管理
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-slate-500">応募者管理</span>
      </nav>
      <h1 className="mt-2 text-2xl font-black text-slate-900">応募者管理</h1>
      <p className="mt-1 text-sm text-slate-600">{project.title}</p>

      <div className="mt-6 space-y-3">
        {project.applications.length === 0 ? (
          <EmptyState
            title="まだ応募はありません"
            description="エンジニア検索からスカウトを送って、候補者にアプローチすることもできます。"
            action={
              <Link href="/company/engineers" className={buttonClasses()}>
                エンジニアを探す
              </Link>
            }
          />
        ) : (
          project.applications.map((a) => {
            const profile = a.engineer.engineerProfile;
            return (
              <div key={a.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start gap-4">
                  <Avatar name={profile?.displayName ?? a.engineer.name} image={a.engineer.image} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-slate-800">
                        {profile?.displayName ?? a.engineer.name ?? "エンジニア"}
                      </p>
                      <span className="text-xs text-slate-500">{profile?.title}</span>
                      <ApplicationStatusBadge status={a.status} />
                      <span className="ml-auto text-xs text-slate-400">
                        {formatRelative(a.createdAt)}に応募
                      </span>
                    </div>
                    {profile && profile.skills.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {profile.skills.slice(0, 8).map(({ skill }) => (
                          <Badge key={skill.id} tone="gray">
                            {skill.name}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                    {a.message ? (
                      <p className="mt-3 line-clamp-3 rounded-lg bg-slate-50 px-3 py-2 text-sm leading-relaxed whitespace-pre-line text-slate-600">
                        {a.message}
                      </p>
                    ) : null}

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      {profile ? (
                        <Link
                          href={`/company/engineers/${profile.id}`}
                          className={buttonClasses("outline", "sm")}
                        >
                          プロフィールを見る
                        </Link>
                      ) : null}
                      {a.conversation ? (
                        <Link
                          href={`/messages/${a.conversation.id}`}
                          className={buttonClasses("primary", "sm")}
                        >
                          チャットを開く
                        </Link>
                      ) : null}
                      <form action={updateApplicationStatus} className="ml-auto flex items-center gap-2">
                        <input type="hidden" name="applicationId" value={a.id} />
                        <select
                          name="status"
                          defaultValue={a.status}
                          className="h-8 rounded-lg border border-slate-300 bg-white px-2 text-xs text-slate-700 focus:border-blue-500 focus:outline-none"
                        >
                          {Object.entries(APPLICATION_STATUS_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                        <button type="submit" className={buttonClasses("secondary", "sm")}>
                          ステータス更新
                        </button>
                      </form>
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
