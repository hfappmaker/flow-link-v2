"use client";

import { useActionState, useState } from "react";
import {
  completeCompanyOnboarding,
  completeEngineerOnboarding,
  type ActionState,
} from "@/lib/actions/onboarding";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/form";
import { JOB_CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

function ErrorMessage({ state }: { state: ActionState }) {
  if (!state.error) return null;
  return (
    <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
      {state.error}
    </p>
  );
}

function EngineerForm({ defaultName }: { defaultName: string }) {
  const [state, action, pending] = useActionState(completeEngineerOnboarding, {});
  return (
    <form action={action} className="space-y-4">
      <ErrorMessage state={state} />
      <div>
        <Label htmlFor="displayName" required>
          表示名
        </Label>
        <Input id="displayName" name="displayName" required maxLength={50} defaultValue={defaultName} />
      </div>
      <div>
        <Label htmlFor="title" required>
          職種
        </Label>
        <Select id="title" name="title" required defaultValue="">
          <option value="" disabled>
            選択してください
          </option>
          {JOB_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="location">居住地</Label>
          <Input id="location" name="location" placeholder="東京都" maxLength={100} />
        </div>
        <div>
          <Label htmlFor="yearsOfExperience">実務経験年数</Label>
          <Input id="yearsOfExperience" name="yearsOfExperience" type="number" min={0} max={60} placeholder="5" />
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "登録中..." : "エンジニアとして始める"}
      </Button>
    </form>
  );
}

function CompanyForm() {
  const [state, action, pending] = useActionState(completeCompanyOnboarding, {});
  return (
    <form action={action} className="space-y-4">
      <ErrorMessage state={state} />
      <div>
        <Label htmlFor="companyName" required>
          会社名
        </Label>
        <Input id="companyName" name="companyName" required maxLength={100} placeholder="株式会社サンプル" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="industry">業界</Label>
          <Input id="industry" name="industry" placeholder="ITサービス" maxLength={100} />
        </div>
        <div>
          <Label htmlFor="location">所在地</Label>
          <Input id="location" name="location" placeholder="東京都渋谷区" maxLength={100} />
        </div>
      </div>
      <div>
        <Label htmlFor="website">Webサイト</Label>
        <Input id="website" name="website" type="url" placeholder="https://example.com" />
      </div>
      <div>
        <Label htmlFor="description">会社紹介</Label>
        <Textarea
          id="description"
          name="description"
          rows={4}
          maxLength={2000}
          placeholder="事業内容や開発組織についてご記入ください"
        />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "登録中..." : "企業として始める"}
      </Button>
    </form>
  );
}

export function OnboardingForms({
  initialRole,
  defaultName,
}: {
  initialRole: "ENGINEER" | "COMPANY" | null;
  defaultName: string;
}) {
  const [role, setRole] = useState<"ENGINEER" | "COMPANY">(initialRole ?? "ENGINEER");
  const showTabs = initialRole === null;

  return (
    <div className="space-y-6">
      {showTabs ? (
        <div className="flex gap-3">
          {(
            [
              ["ENGINEER", "フリーランスエンジニア", "案件を探して応募する"],
              ["COMPANY", "企業・採用担当", "案件を掲載して採用する"],
            ] as const
          ).map(([value, label, description]) => (
            <button
              key={value}
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
          ))}
        </div>
      ) : null}

      {role === "ENGINEER" ? <EngineerForm defaultName={defaultName} /> : <CompanyForm />}
    </div>
  );
}
