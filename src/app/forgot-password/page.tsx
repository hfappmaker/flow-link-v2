import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { Card, CardBody } from "@/components/ui/card";

export const metadata: Metadata = { title: "パスワード再設定" };

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <h1 className="text-center text-2xl font-black text-slate-900">パスワード再設定</h1>
      <p className="mt-2 text-center text-sm text-slate-500">
        登録済みのメールアドレスに再設定リンクを送信します。
      </p>

      <Card className="mt-8">
        <CardBody className="p-6">
          <ForgotPasswordForm />
        </CardBody>
      </Card>

      <p className="mt-6 text-center text-sm text-slate-500">
        思い出した方は{" "}
        <Link href="/login" className="font-semibold text-blue-600 hover:underline">
          ログイン
        </Link>
      </p>
    </div>
  );
}
