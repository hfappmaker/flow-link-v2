import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireCompany } from "@/lib/session";
import { ProjectForm } from "@/components/company/project-form";
import { Card, CardBody } from "@/components/ui/card";

export const metadata: Metadata = { title: "新規案件の掲載" };

export default async function NewProjectPage() {
  await requireCompany();
  const skills = await prisma.skill.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-black text-slate-900">新規案件の掲載</h1>
      <p className="mt-1 text-sm text-slate-500">
        条件や要件を具体的に書くほど、マッチするエンジニアからの応募が増えます。
      </p>

      <Card className="mt-6">
        <CardBody className="p-6">
          <ProjectForm skills={skills} />
        </CardBody>
      </Card>
    </div>
  );
}
