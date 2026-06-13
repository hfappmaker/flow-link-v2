import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireEngineer } from "@/lib/session";
import { EngineerProfileForm } from "@/components/engineer-profile-form";
import { Card, CardBody } from "@/components/ui/card";

export const metadata: Metadata = { title: "プロフィール設定" };

export default async function ProfileSettingsPage() {
  const { user, profile } = await requireEngineer();

  const skills = await prisma.skill.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] });
  const selected = await prisma.engineerSkill.findMany({
    where: { engineerProfileId: profile.id },
    select: { skillId: true },
  });
  const workHistories = await prisma.workHistory.findMany({
    where: { engineerProfileId: profile.id },
    orderBy: { startYearMonth: "desc" },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-black text-slate-900">プロフィール設定</h1>
      <p className="mt-1 text-sm text-slate-500">
        プロフィールを充実させると、企業からのスカウトが届きやすくなります。
      </p>

      <Card className="mt-6">
        <CardBody className="p-6">
          <EngineerProfileForm
            emailNotificationsEnabled={user.emailNotificationsEnabled}
            profile={profile}
            workHistories={workHistories}
            skills={skills}
            selectedSkillIds={selected.map((s) => s.skillId)}
          />
        </CardBody>
      </Card>
    </div>
  );
}
