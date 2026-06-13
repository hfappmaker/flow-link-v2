import type { Metadata } from "next";
import { requireCompany } from "@/lib/session";
import { AccountDeleteForm } from "@/components/account-delete-form";
import { CompanyProfileForm } from "@/components/company/company-profile-form";
import { Card, CardBody } from "@/components/ui/card";

export const metadata: Metadata = { title: "企業情報設定" };

export default async function CompanySettingsPage() {
  const { user, company } = await requireCompany();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-black text-slate-900">企業情報設定</h1>
      <p className="mt-1 text-sm text-slate-500">
        企業情報は案件詳細ページやスカウトでエンジニアに表示されます。
      </p>

      <Card className="mt-6">
        <CardBody className="p-6">
          <CompanyProfileForm emailNotificationsEnabled={user.emailNotificationsEnabled} company={company} />
        </CardBody>
      </Card>

      <Card className="mt-6 border-red-200">
        <CardBody className="p-6">
          <h2 className="text-base font-bold text-red-700">退会</h2>
          <div className="mt-4">
            <AccountDeleteForm accountLabel="企業" />
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
