import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { oauthProviderAvailability } from "@/auth";
import { getCurrentUser } from "@/lib/session";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { RegisterForm } from "@/components/auth/register-form";
import { Card, CardBody } from "@/components/ui/card";

export const metadata: Metadata = { title: "無料登録" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/post-login");

  const { role } = await searchParams;
  const defaultRole = role === "company" ? "COMPANY" : "ENGINEER";

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <h1 className="text-center text-2xl font-black text-slate-900">無料登録</h1>
      <p className="mt-2 text-center text-sm text-slate-500">
        登録は1分で完了します。ソーシャルアカウントの場合は登録後に利用目的を選択できます。
      </p>

      <Card className="mt-8">
        <CardBody className="p-6">
          <OAuthButtons
            availability={{
              google: oauthProviderAvailability.google,
              github: oauthProviderAvailability.github,
              microsoft: oauthProviderAvailability["microsoft-entra-id"],
            }}
          />
          <RegisterForm defaultRole={defaultRole} />
        </CardBody>
      </Card>

      <p className="mt-6 text-center text-sm text-slate-500">
        すでにアカウントをお持ちの方は{" "}
        <Link href="/login" className="font-semibold text-blue-600 hover:underline">
          ログイン
        </Link>
      </p>
    </div>
  );
}
