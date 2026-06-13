"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";
import { cn } from "@/lib/utils";

export function RegisterForm({
  defaultRole,
  agreedToTerms,
}: {
  defaultRole: "ENGINEER" | "COMPANY";
  agreedToTerms: boolean;
}) {
  const router = useRouter();
  const [role, setRole] = useState<"ENGINEER" | "COMPANY">(defaultRole);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const payload = {
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
      role,
      agreedToTerms,
    };

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "登録に失敗しました。時間をおいて再度お試しください。");
      setPending(false);
      return;
    }

    router.push(`/login?registered=1&email=${encodeURIComponent(payload.email)}`);
  }

  const tab = (value: "ENGINEER" | "COMPANY", label: string, description: string) => (
    <button
      type="button"
      onClick={() => setRole(value)}
      className={cn(
        "flex-1 rounded-lg border px-3 py-3 text-left transition-colors",
        role === value
          ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600"
          : "border-slate-300 bg-white hover:bg-slate-50",
      )}
    >
      <span className={cn("block text-sm font-bold", role === value ? "text-blue-700" : "text-slate-700")}>
        {label}
      </span>
      <span className="mt-0.5 block text-xs text-slate-500">{description}</span>
    </button>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-3">
        {tab("ENGINEER", "エンジニアとして登録", "案件を探して応募する")}
        {tab("COMPANY", "企業として登録", "案件を掲載して採用する")}
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      ) : null}

      <div>
        <Label htmlFor="name">{role === "COMPANY" ? "ご担当者名" : "お名前"}</Label>
        <Input id="name" name="name" required maxLength={100} placeholder="山田 太郎" />
      </div>
      <div>
        <Label htmlFor="email">メールアドレス</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
      </div>
      <div>
        <Label htmlFor="password">パスワード</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="8文字以上"
        />
      </div>
      <Button type="submit" className="w-full" disabled={pending || !agreedToTerms}>
        {pending ? "登録中..." : "無料で登録する"}
      </Button>
    </form>
  );
}
