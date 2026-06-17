"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";

type LoginNotice = "registered" | "verified" | "invalid-verification" | "reset";

export function LoginForm({
  notice,
  initialEmail = "",
  redirectTo = "/post-login",
}: {
  notice?: LoginNotice;
  initialEmail?: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(
    notice === "registered"
      ? "登録を受け付けました。メールに届いたリンクから認証を完了してください。"
      : notice === "verified"
        ? "メール認証が完了しました。ログインできます。"
        : notice === "invalid-verification"
          ? "認証リンクが無効、または有効期限が切れています。必要に応じて認証メールを再送してください。"
          : notice === "reset"
            ? "パスワードを更新しました。新しいパスワードでログインしてください。"
            : null,
  );
  const [pending, setPending] = useState(false);
  const [resendPending, setResendPending] = useState(false);
  const [lastEmail, setLastEmail] = useState(initialEmail);

  async function resendVerification(email: string) {
    setResendPending(true);
    setError(null);
    setInfo(null);

    const res = await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "認証メールの送信に失敗しました。時間をおいて再度お試しください。");
      setResendPending(false);
      return;
    }

    setInfo("認証メールを送信しました。メールボックスを確認してください。");
    setResendPending(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setInfo(null);

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "");
    setLastEmail(email);
    const result = await signIn("credentials", {
      email,
      password: String(form.get("password") ?? ""),
      redirect: false,
    });

    if (result?.error) {
      setError("メールアドレスまたはパスワードが正しくありません");
      setPending(false);
      return;
    }
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {info ? (
        <p className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
          {info}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      ) : null}
      <div>
        <Label htmlFor="email">メールアドレス</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          defaultValue={initialEmail}
        />
      </div>
      <div>
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="password">パスワード</Label>
          <Link href="/forgot-password" className="mb-1.5 text-xs font-semibold text-blue-600 hover:underline">
            パスワードを忘れた方
          </Link>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
        />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "ログイン中..." : "ログイン"}
      </Button>
      {lastEmail ? (
        <button
          type="button"
          className="w-full text-center text-xs font-semibold text-slate-500 hover:text-blue-600"
          onClick={() => resendVerification(lastEmail)}
          disabled={resendPending}
        >
          {resendPending ? "認証メールを送信中..." : "認証メールを再送する"}
        </button>
      ) : null}
    </form>
  );
}
