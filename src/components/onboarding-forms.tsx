"use client";

import { useActionState, useId, useState } from "react";
import { X } from "lucide-react";
import {
  completeCompanyOnboarding,
  completeEngineerOnboarding,
  type ActionState,
} from "@/lib/actions/onboarding";
import { Button } from "@/components/ui/button";
import { FieldHint, Input, Label, Select, Textarea } from "@/components/ui/form";
import { JOB_CATEGORIES, PREFECTURES } from "@/lib/constants";
import { cn } from "@/lib/utils";

function ErrorMessage({ state }: { state: ActionState }) {
  if (!state.error) return null;
  return (
    <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
      {state.error}
    </p>
  );
}

function JobTitleTagsInput() {
  const inputId = useId();
  const [inputValue, setInputValue] = useState("");
  const [titles, setTitles] = useState<string[]>([]);

  const addTitles = (rawValue: string) => {
    const nextTitles = rawValue
      .split(/[\n,、]/)
      .map((title) => title.trim().replace(/\s+/g, " "))
      .filter(Boolean);

    if (nextTitles.length === 0) return;
    setTitles((current) => [...new Set([...current, ...nextTitles])]);
    setInputValue("");
  };

  const toggleTitle = (title: string, checked: boolean) => {
    setTitles((current) => {
      if (checked) return [...new Set([...current, title])];
      return current.filter((item) => item !== title);
    });
  };

  const removeTitle = (title: string) => {
    setTitles((current) => current.filter((item) => item !== title));
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-slate-700">
        職種 <span className="text-red-500">*</span>
      </p>
      {titles.map((title) => (
        <input key={title} type="hidden" name="title" value={title} />
      ))}
      <div className="flex flex-wrap gap-2">
        {JOB_CATEGORIES.map((category) => (
          <label
            key={category}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 transition-colors has-checked:border-blue-600 has-checked:bg-blue-50 has-checked:text-blue-700"
          >
            <input
              type="checkbox"
              checked={titles.includes(category)}
              onChange={(event) => toggleTitle(category, event.currentTarget.checked)}
              className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            {category}
          </label>
        ))}
      </div>
      <div className="rounded-lg border border-slate-300 bg-white px-2 py-2 transition-colors focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
        <div className="flex min-h-10 flex-wrap items-center gap-2">
          {titles
            .filter((title) => !(JOB_CATEGORIES as readonly string[]).includes(title))
            .map((title) => (
              <span
                key={title}
                className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-sm font-semibold text-blue-700"
              >
                <span className="truncate">{title}</span>
                <button
                  type="button"
                  aria-label={`${title}を削除`}
                  title="削除"
                  onClick={() => removeTitle(title)}
                  className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-blue-500 transition-colors hover:bg-blue-100 hover:text-blue-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          <input
            id={inputId}
            value={inputValue}
            onChange={(event) => {
              const value = event.currentTarget.value;
              if (/[,、\n]/.test(value)) {
                addTitles(value);
              } else {
                setInputValue(value);
              }
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addTitles(inputValue);
              }
              if (event.key === "Backspace" && inputValue === "") {
                setTitles((current) => current.slice(0, -1));
              }
            }}
            onBlur={() => addTitles(inputValue)}
            className="h-8 min-w-36 flex-1 border-0 bg-transparent px-1 text-sm text-slate-900 outline-none placeholder:text-slate-400"
            placeholder="例: エンジニアリングマネージャー"
          />
        </div>
      </div>
      <FieldHint>選択肢にない職種は、カンマ・読点・Enterでタグとして追加できます。</FieldHint>
    </div>
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
      <JobTitleTagsInput />
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="location">居住地</Label>
          <Select id="location" name="location" defaultValue="">
            <option value="">指定なし</option>
            {PREFECTURES.map((prefecture) => (
              <option key={prefecture} value={prefecture}>
                {prefecture}
              </option>
            ))}
          </Select>
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
