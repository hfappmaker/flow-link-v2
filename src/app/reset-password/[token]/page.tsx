import type { Metadata } from "next";
import { ResetPasswordContent } from "@/components/auth/reset-password-content";

export const metadata: Metadata = { title: "新しいパスワードを設定" };

export default async function ResetPasswordTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <ResetPasswordContent token={decodeURIComponent(token)} />;
}
