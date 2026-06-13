import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/session";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ScoutForm } from "@/components/company/scout-form";
import { ScoutStatusBadge } from "@/components/status-badges";
import { buttonClasses } from "@/components/ui/button";
import { REMOTE_TYPE_LABELS, WORK_STATUS_LABELS } from "@/lib/constants";
import { formatRateRange, formatRelative } from "@/lib/format";

export const metadata: Metadata = { title: "エンジニアプロフィール" };

export default async function EngineerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { company } = await requireCompany();

  const profile = await prisma.engineerProfile.findFirst({
    where: { id, isPublic: true },
    include: {
      skills: { include: { skill: true } },
      workHistories: { orderBy: { startYearMonth: "desc" } },
    },
  });
  if (!profile) notFound();

  const openProjects = await prisma.project.findMany({
    where: { companyId: company.id, status: "OPEN" },
    select: { id: true, title: true },
    orderBy: { publishedAt: "desc" },
  });
  const previousScouts = await prisma.scout.findMany({
    where: { companyId: company.id, engineerUserId: profile.userId },
    orderBy: { createdAt: "desc" },
    include: { conversation: { select: { id: true } } },
  });

  const conditions = [
    profile.desiredRateMin || profile.desiredRateMax
      ? `希望単価: ${formatRateRange(profile.desiredRateMin, profile.desiredRateMax)}`
      : null,
    profile.desiredWeeklyDays ? `希望稼働: 週${profile.desiredWeeklyDays}日` : null,
    profile.remotePreference ? `リモート: ${REMOTE_TYPE_LABELS[profile.remotePreference]}` : null,
  ].filter(Boolean);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <nav className="text-xs text-slate-400">
        <Link href="/company/engineers" className="hover:text-slate-600 hover:underline">
          エンジニア検索
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-slate-500">プロフィール</span>
      </nav>

      <div className="mt-4 flex flex-col gap-8 lg:flex-row">
        <div className="min-w-0 flex-1 space-y-6">
          <Card>
            <CardBody className="p-6">
              <div className="flex items-start gap-5">
                <Avatar name={profile.displayName} size="lg" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl font-black text-slate-900">{profile.displayName}</h1>
                    <Badge tone={profile.workStatus === "UNAVAILABLE" ? "gray" : "green"}>
                      {WORK_STATUS_LABELS[profile.workStatus]}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">
                    {[
                      profile.title,
                      profile.yearsOfExperience ? `実務${profile.yearsOfExperience}年` : null,
                      profile.location,
                    ]
                      .filter(Boolean)
                      .join(" / ")}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs">
                    {profile.githubUrl ? (
                      <a
                        href={profile.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                      >
                        GitHub <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : null}
                    {profile.portfolioUrl ? (
                      <a
                        href={profile.portfolioUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                      >
                        ポートフォリオ <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>

              {conditions.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {conditions.map((c) => (
                    <Badge key={c} tone="blue">
                      {c}
                    </Badge>
                  ))}
                </div>
              ) : null}

              {profile.skills.length > 0 ? (
                <div className="mt-4">
                  <p className="mb-2 text-xs font-bold tracking-wide text-slate-500">スキル</p>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.skills.map(({ skill }) => (
                      <Badge key={skill.id} tone="gray">
                        {skill.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}
            </CardBody>
          </Card>

          {profile.bio ? (
            <Card>
              <CardHeader title="自己紹介・経歴サマリ" />
              <CardBody>
                <p className="text-sm leading-relaxed whitespace-pre-line text-slate-700">{profile.bio}</p>
              </CardBody>
            </Card>
          ) : null}

          {profile.workHistories.length > 0 ? (
            <Card>
              <CardHeader title="参画実績" />
              <CardBody className="space-y-4">
                {profile.workHistories.map((w) => (
                  <div key={w.id} className="border-b border-slate-100 pb-4 last:border-b-0 last:pb-0">
                    <p className="text-sm font-bold text-slate-800">{w.projectName}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {[w.role, [w.startYearMonth, w.endYearMonth ?? "現在"].filter(Boolean).join(" 〜 ")]
                        .filter(Boolean)
                        .join(" / ")}
                    </p>
                    {w.description ? (
                      <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-line text-slate-600">
                        {w.description}
                      </p>
                    ) : null}
                    {w.techStack ? (
                      <p className="mt-1 text-xs text-slate-500">技術: {w.techStack}</p>
                    ) : null}
                  </div>
                ))}
              </CardBody>
            </Card>
          ) : null}

          {previousScouts.length > 0 ? (
            <Card>
              <CardHeader title="このエンジニアへのスカウト履歴" />
              <CardBody className="space-y-2">
                {previousScouts.map((s) => (
                  <div key={s.id} className="flex flex-wrap items-center gap-3 text-sm">
                    <ScoutStatusBadge status={s.status} />
                    <span className="min-w-0 flex-1 truncate text-slate-700">{s.title ?? s.message}</span>
                    <span className="text-xs text-slate-400">{formatRelative(s.createdAt)}</span>
                    {s.conversation ? (
                      <Link
                        href={`/messages/${s.conversation.id}`}
                        className={buttonClasses("outline", "sm")}
                      >
                        チャット
                      </Link>
                    ) : null}
                  </div>
                ))}
              </CardBody>
            </Card>
          ) : null}
        </div>

        <aside className="w-full shrink-0 lg:w-96">
          <Card className="lg:sticky lg:top-20">
            <CardHeader title="スカウトを送る" />
            <CardBody>
              <ScoutForm
                engineerUserId={profile.userId}
                engineerName={profile.displayName}
                projects={openProjects}
              />
            </CardBody>
          </Card>
        </aside>
      </div>
    </div>
  );
}
