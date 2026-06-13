import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/session";
import { ProjectForm } from "@/components/company/project-form";
import { Card, CardBody } from "@/components/ui/card";

export const metadata: Metadata = { title: "案件の編集" };

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { company } = await requireCompany();

  const project = await prisma.project.findFirst({
    where: { id, companyId: company.id },
    include: { skills: true },
  });
  const skills = await prisma.skill.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] });
  if (!project) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-black text-slate-900">案件の編集</h1>

      <Card className="mt-6">
        <CardBody className="p-6">
          <ProjectForm skills={skills} project={project} />
        </CardBody>
      </Card>
    </div>
  );
}
