import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2, CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { SaveButton } from "@/components/save-button";
import { buttonClasses } from "@/components/ui/button";
import { REMOTE_TYPE_LABELS } from "@/lib/constants";
import {
  formatDate,
  formatRateRange,
  formatWeeklyDays,
  formatYen,
  hourlyFromMonthly,
  isNew,
} from "@/lib/format";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const project = await prisma.project.findUnique({ where: { id }, select: { title: true } });
  return { title: project?.title ?? "案件詳細" };
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-slate-100 py-3 last:border-b-0 sm:grid-cols-[10rem_1fr] sm:gap-4">
      <dt className="text-sm font-semibold text-slate-500">{label}</dt>
      <dd className="text-sm leading-relaxed text-slate-800">{children}</dd>
    </div>
  );
}

function BulletList({ text }: { text: string }) {
  const items = text
    .split("\n")
    .map((line) => line.replace(/^[-・]\s*/, "").trim())
    .filter(Boolean);
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-slate-700">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
          {item}
        </li>
      ))}
    </ul>
  );
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      company: true,
      skills: { include: { skill: true } },
    },
  });
  if (!project || project.status === "DRAFT") notFound();

  // 閲覧数をカウント（人気順ソートに使用）
  await prisma.project.update({ where: { id }, data: { viewCount: { increment: 1 } } });

  const isEngineer = Boolean(user?.engineerProfile);
  const [application, saved] = isEngineer
    ? await Promise.all([
        prisma.application.findUnique({
          where: { projectId_engineerUserId: { projectId: id, engineerUserId: user!.id } },
          include: { conversation: { select: { id: true } } },
        }),
        prisma.savedProject.findUnique({
          where: { userId_projectId: { userId: user!.id, projectId: id } },
        }),
      ])
    : [null, null];

  const isOpen = project.status === "OPEN";

  const applyArea = (
    <div className="space-y-3">
      <p className="text-center text-xs text-slate-500">{project.jobCategory}</p>
      <p className="text-center text-xl font-black text-blue-700">
        {formatRateRange(project.rateMin, project.rateMax)}
      </p>
      {!isOpen ? (
        <p className="rounded-lg bg-slate-100 px-3 py-2 text-center text-sm font-semibold text-slate-500">
          この案件は募集を終了しました
        </p>
      ) : application ? (
        <>
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-center text-sm font-semibold text-emerald-700">
            応募済みです
          </p>
          {application.conversation ? (
            <Link href={`/messages/${application.conversation.id}`} className={buttonClasses("primary", "lg", "w-full")}>
              チャットを開く
            </Link>
          ) : null}
        </>
      ) : (
        <Link
          href={user ? `/projects/${project.id}/apply` : `/login`}
          className={buttonClasses("primary", "lg", "w-full")}
        >
          この案件に応募する
        </Link>
      )}
      <SaveButton projectId={project.id} saved={Boolean(saved)} isEngineer={isEngineer} />
      {!user ? (
        <p className="text-center text-xs text-slate-400">応募にはログインが必要です</p>
      ) : null}
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <nav className="text-xs text-slate-400">
        <Link href="/projects" className="hover:text-slate-600 hover:underline">
          案件検索
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-slate-500">案件詳細</span>
      </nav>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {project.publishedAt && isNew(project.publishedAt) ? <Badge tone="red">NEW</Badge> : null}
        {project.publishedAt ? (
          <span className="text-xs text-slate-500">{formatDate(project.publishedAt)} 掲載</span>
        ) : null}
        {!isOpen ? <Badge tone="gray">募集終了</Badge> : null}
      </div>
      <h1 className="mt-2 text-2xl leading-snug font-black text-slate-900">{project.title}</h1>

      {project.summary ? (
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-600">{project.summary}</p>
      ) : null}

      <div className="mt-6 flex flex-col gap-8 lg:flex-row">
        <div className="min-w-0 flex-1 space-y-6">
          {project.merits ? (
            <Card>
              <CardHeader title="この案件の参画メリット" />
              <CardBody>
                <BulletList text={project.merits} />
              </CardBody>
            </Card>
          ) : null}

          <Card>
            <CardHeader title="案件情報" />
            <CardBody>
              <dl>
                <InfoRow label="単価目安（税別）">
                  <span className="font-bold text-slate-900">
                    {formatRateRange(project.rateMin, project.rateMax)}
                  </span>
                  {project.rateMax ? (
                    <span className="ml-2 text-xs text-slate-500">
                      （〜{formatYen(hourlyFromMonthly(project.rateMax))}円/1h換算）
                    </span>
                  ) : null}
                </InfoRow>
                <InfoRow label="職種">{project.jobCategory}</InfoRow>
                {project.skills.length > 0 ? (
                  <InfoRow label="求める言語・スキル">
                    <span className="flex flex-wrap gap-1.5">
                      {project.skills.map(({ skill }) => (
                        <Badge key={skill.id} tone="blue">
                          {skill.name}
                        </Badge>
                      ))}
                    </span>
                  </InfoRow>
                ) : null}
                <InfoRow label="稼働日数">
                  {formatWeeklyDays(project.weeklyDaysMin, project.weeklyDaysMax)}
                  <span className="ml-2 text-xs text-slate-500">
                    （週{project.weeklyDaysMin * 8}時間〜週{project.weeklyDaysMax * 8}時間）
                  </span>
                </InfoRow>
                <InfoRow label="リモート頻度">{REMOTE_TYPE_LABELS[project.remoteType]}</InfoRow>
                {project.location ? <InfoRow label="場所">{project.location}</InfoRow> : null}
                <InfoRow label="契約形態">{project.contractType}</InfoRow>
                {project.industry ? <InfoRow label="業界">{project.industry}</InfoRow> : null}
                {project.features.length > 0 ? (
                  <InfoRow label="こだわり条件">
                    <span className="flex flex-wrap gap-1.5">
                      {project.features.map((f) => (
                        <Badge key={f} tone="outline">
                          {f}
                        </Badge>
                      ))}
                    </span>
                  </InfoRow>
                ) : null}
                {project.devEnvironment ? (
                  <InfoRow label="開発環境">
                    <span className="whitespace-pre-line">{project.devEnvironment}</span>
                  </InfoRow>
                ) : null}
              </dl>
            </CardBody>
          </Card>

          {project.background ? (
            <Card>
              <CardHeader title="募集背景" />
              <CardBody>
                <p className="text-sm leading-relaxed whitespace-pre-line text-slate-700">
                  {project.background}
                </p>
              </CardBody>
            </Card>
          ) : null}

          <Card>
            <CardHeader title="業務内容" />
            <CardBody>
              <p className="text-sm leading-relaxed whitespace-pre-line text-slate-700">
                {project.description}
              </p>
            </CardBody>
          </Card>

          {project.requiredSkillsText || project.preferredSkillsText ? (
            <Card>
              <CardHeader title="必須要件と歓迎要件" />
              <CardBody>
                <div className="grid gap-6 sm:grid-cols-2">
                  {project.requiredSkillsText ? (
                    <div>
                      <p className="mb-3 inline-block rounded bg-red-50 px-2 py-0.5 text-xs font-bold text-red-600">
                        必須要件
                      </p>
                      <BulletList text={project.requiredSkillsText} />
                    </div>
                  ) : null}
                  {project.preferredSkillsText ? (
                    <div>
                      <p className="mb-3 inline-block rounded bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-600">
                        歓迎要件
                      </p>
                      <BulletList text={project.preferredSkillsText} />
                    </div>
                  ) : null}
                </div>
              </CardBody>
            </Card>
          ) : null}

          {project.idealCandidate ? (
            <Card>
              <CardHeader title="求める人物像" />
              <CardBody>
                <BulletList text={project.idealCandidate} />
              </CardBody>
            </Card>
          ) : null}

          <Card>
            <CardHeader title="企業情報" />
            <CardBody>
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                  <Building2 className="h-5 w-5 text-slate-400" />
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-800">{project.company.name}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {[project.company.industry, project.company.location].filter(Boolean).join(" / ")}
                  </p>
                  {project.company.description ? (
                    <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-slate-600">
                      {project.company.description}
                    </p>
                  ) : null}
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        <aside className="w-full shrink-0 lg:w-72">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-20">
            {applyArea}
          </div>
        </aside>
      </div>
    </div>
  );
}
