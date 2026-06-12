import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { OnboardingForms } from "@/components/onboarding-forms";
import { Card, CardBody } from "@/components/ui/card";

export const metadata: Metadata = { title: "はじめる" };

export default async function OnboardingPage() {
  const user = await requireUser();
  if (user.engineerProfile || user.companyMember) redirect("/post-login");

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <h1 className="text-center text-2xl font-black text-slate-900">FlowLinkをはじめましょう</h1>
      <p className="mt-2 text-center text-sm text-slate-500">
        基本情報を入力してください。あとから設定画面で変更できます。
      </p>

      <Card className="mt-8">
        <CardBody className="p-6">
          <OnboardingForms
            initialRole={user.role}
            defaultName={user.name ?? ""}
          />
        </CardBody>
      </Card>
    </div>
  );
}
