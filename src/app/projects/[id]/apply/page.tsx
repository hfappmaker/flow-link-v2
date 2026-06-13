import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireEngineer } from "@/lib/session";
import { ApplyForm } from "@/components/apply-form";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { REMOTE_TYPE_LABELS } from "@/lib/constants";
import { formatRateRange, formatWeeklyDays } from "@/lib/format";
import { getAvailableChatDocuments } from "@/lib/message-attachments";

export const metadata: Metadata = { title: "案件に応募" };

export default async function ApplyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, profile } = await requireEngineer();

  const project = await prisma.project.findUnique({
    where: { id },
    include: { company: { select: { name: true } } },
  });
  if (!project || project.status !== "OPEN") notFound();

  const existing = await prisma.application.findUnique({
    where: { projectId_engineerUserId: { projectId: id, engineerUserId: user.id } },
    include: { conversation: { select: { id: true } } },
  });
  if (existing?.conversation) redirect(`/messages/${existing.conversation.id}`);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-black text-slate-900">案件に応募する</h1>

      <Card className="mt-6">
        <CardBody className="space-y-2">
          <p className="text-xs text-slate-500">{project.company.name}</p>
          <Link
            href={`/projects/${project.id}`}
            className="block text-base font-bold text-slate-900 hover:text-blue-700"
          >
            {project.title}
          </Link>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="font-black text-blue-700">
              {formatRateRange(project.rateMin, project.rateMax)}
            </span>
            <span className="text-slate-600">
              {formatWeeklyDays(project.weeklyDaysMin, project.weeklyDaysMax)}
            </span>
            <Badge tone="blue">{REMOTE_TYPE_LABELS[project.remoteType]}</Badge>
          </div>
        </CardBody>
      </Card>

      <Card className="mt-6">
        <CardHeader title="応募メッセージの作成" />
        <CardBody>
          <ApplyForm projectId={project.id} availableDocuments={getAvailableChatDocuments(profile)} />
        </CardBody>
      </Card>
    </div>
  );
}
