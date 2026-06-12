import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireEngineer } from "@/lib/session";
import { ProjectCard } from "@/components/project-card";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonClasses } from "@/components/ui/button";

export const metadata: Metadata = { title: "保存した案件" };

export default async function SavedProjectsPage() {
  const { user } = await requireEngineer();

  const saved = await prisma.savedProject.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      project: {
        include: {
          company: { select: { name: true } },
          skills: { include: { skill: true } },
        },
      },
    },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-black text-slate-900">保存した案件</h1>
      <p className="mt-1 text-sm text-slate-500">あとで検討したい案件のリストです。</p>

      <div className="mt-6 space-y-4">
        {saved.length === 0 ? (
          <EmptyState
            title="保存した案件はありません"
            description="案件詳細ページの「保存する」ボタンから追加できます。"
            action={
              <Link href="/projects" className={buttonClasses()}>
                案件を探す
              </Link>
            }
          />
        ) : (
          saved.map(({ project }) => <ProjectCard key={project.id} project={project} />)
        )}
      </div>
    </div>
  );
}
