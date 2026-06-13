"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";

export function ForgotPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: String(form.get("email") ?? "") }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "送信に失敗しました。時間をおいて再度お試しください。");
      setPending(false);
      return;
    }

    setSent(true);
    setPending(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {sent ? (
        <p className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm leading-relaxed text-blue-700">
          入力されたメールアドレスにアカウントがある場合、パスワード再設定メールを送信しました。
        </p>
      ) : null}
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      ) : null}
      <div>
        <Label htmlFor="email">メールアドレス</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "送信中..." : "再設定メールを送信"}
      </Button>
    </form>
  );
}
