"use client";

import { useActionState } from "react";
import type { Company } from "@prisma/client";
import { updateCompanyProfile } from "@/lib/actions/profile";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/form";

export function CompanyProfileForm({
  emailNotificationsEnabled,
  company,
}: {
  emailNotificationsEnabled: boolean;
  company: Company;
}) {
  const [state, action, pending] = useActionState(updateCompanyProfile, {});

  return (
    <form action={action} className="space-y-4">
      {state.error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          企業情報を保存しました
        </p>
      ) : null}

      <div>
        <Label htmlFor="name" required>
          会社名
        </Label>
        <Input id="name" name="name" required maxLength={100} defaultValue={company.name} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="industry">業界</Label>
          <Input id="industry" name="industry" maxLength={100} defaultValue={company.industry ?? ""} />
        </div>
        <div>
          <Label htmlFor="location">所在地</Label>
          <Input id="location" name="location" maxLength={100} defaultValue={company.location ?? ""} />
        </div>
      </div>
      <div>
        <Label htmlFor="website">Webサイト</Label>
        <Input id="website" name="website" type="url" defaultValue={company.website ?? ""} placeholder="https://example.com" />
      </div>
      <div>
        <Label htmlFor="description">会社紹介</Label>
        <Textarea
          id="description"
          name="description"
          rows={6}
          maxLength={4000}
          defaultValue={company.description ?? ""}
          placeholder="事業内容、開発組織、技術スタックなどをご記入ください。案件詳細ページにも表示されます。"
        />
      </div>
      <section className="space-y-3 border-t border-slate-200 pt-4">
        <p className="text-base font-bold text-slate-800">通知設定</p>
        <label className="flex items-start gap-3 text-sm text-slate-700">
          <input
            type="checkbox"
            name="emailNotificationsEnabled"
            defaultChecked={emailNotificationsEnabled}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <span>
            新着通知をメールで受け取る
            <span className="mt-0.5 block text-xs text-slate-500">
              新しい応募やチャットメッセージが届いたときにメールで通知します。
            </span>
          </span>
        </label>
      </section>
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "保存中..." : "企業情報を保存"}
      </Button>
    </form>
  );
}
