import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { oauthProviderAvailability } from "@/auth";
import { getCurrentUser } from "@/lib/session";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { LoginForm } from "@/components/auth/login-form";
import { Card, CardBody } from "@/components/ui/card";

export const metadata: Metadata = { title: "ログイン" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string; verified?: string; reset?: string; email?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/post-login");

  const params = await searchParams;
  const notice =
    params.registered === "1"
      ? "registered"
      : params.verified === "1"
        ? "verified"
        : params.verified === "invalid"
          ? "invalid-verification"
          : params.reset === "1"
            ? "reset"
            : undefined;

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <h1 className="text-center text-2xl font-black text-slate-900">ログイン</h1>
      <p className="mt-2 text-center text-sm text-slate-500">
        FlowLinkへおかえりなさい
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
          <LoginForm notice={notice} initialEmail={params.email ?? ""} />
        </CardBody>
      </Card>

      <p className="mt-6 text-center text-sm text-slate-500">
        アカウントをお持ちでない方は{" "}
        <Link href="/register" className="font-semibold text-blue-600 hover:underline">
          無料登録
        </Link>
      </p>
    </div>
  );
}
