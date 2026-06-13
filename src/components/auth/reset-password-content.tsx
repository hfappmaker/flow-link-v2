import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Card, CardBody } from "@/components/ui/card";

export function ResetPasswordContent({ token }: { token?: string }) {
  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <h1 className="text-center text-2xl font-black text-slate-900">新しいパスワードを設定</h1>
      <p className="mt-2 text-center text-sm text-slate-500">
        メールに届いたリンクから、新しいパスワードを設定してください。
      </p>

      <Card className="mt-8">
        <CardBody className="p-6">
          {token ? (
            <ResetPasswordForm token={token} />
          ) : (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              リセットリンクが無効です。もう一度メールを送信してください。
            </p>
          )}
        </CardBody>
      </Card>

      <p className="mt-6 text-center text-sm text-slate-500">
        再設定メールが必要な方は{" "}
        <Link href="/forgot-password" className="font-semibold text-blue-600 hover:underline">
          こちら
        </Link>
      </p>
    </div>
  );
}
