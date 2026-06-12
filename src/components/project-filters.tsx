import type { Skill } from "@prisma/client";
import Link from "next/link";
import { Input, Select } from "@/components/ui/form";
import {
  JOB_CATEGORIES,
  PROJECT_FEATURES,
  REMOTE_TYPE_LABELS,
  WEEKLY_DAYS_OPTIONS,
} from "@/lib/constants";
import type { ParsedProjectSearch } from "@/lib/project-search";

const RATE_OPTIONS = [
  { value: "400000", label: "40万円以上" },
  { value: "600000", label: "60万円以上" },
  { value: "800000", label: "80万円以上" },
  { value: "1000000", label: "100万円以上" },
  { value: "1200000", label: "120万円以上" },
];

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-slate-100 pb-4">
      <p className="mb-2 text-xs font-bold tracking-wide text-slate-500">{title}</p>
      {children}
    </div>
  );
}

export function ProjectFilters({
  languages,
  otherSkills,
  parsed,
  action = "/projects",
}: {
  languages: Skill[];
  otherSkills: Skill[];
  parsed: ParsedProjectSearch;
  action?: string;
}) {
  return (
    <form method="get" action={action} className="space-y-4">
      <FilterSection title="フリーワード">
        <Input name="q" defaultValue={parsed.q ?? ""} placeholder="キーワードで検索" />
      </FilterSection>

      <FilterSection title="募集職種">
        <Select name="job" defaultValue={parsed.job ?? ""}>
          <option value="">すべての職種</option>
          {JOB_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </FilterSection>

      <FilterSection title="開発言語">
        <Select name="lang" defaultValue={parsed.lang ?? ""}>
          <option value="">すべての言語</option>
          {languages.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
      </FilterSection>

      <FilterSection title="開発スキル">
        <Select name="skill" defaultValue={parsed.skill ?? ""}>
          <option value="">すべてのスキル</option>
          {otherSkills.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
      </FilterSection>

      <FilterSection title="単価目安（円/月）">
        <Select name="rateMin" defaultValue={parsed.rateMin ? String(parsed.rateMin) : ""}>
          <option value="">指定なし</option>
          {RATE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </FilterSection>

      <FilterSection title="稼働日数">
        <div className="space-y-1.5">
          {WEEKLY_DAYS_OPTIONS.map((d) => (
            <label key={d} className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name="days"
                value={d}
                defaultChecked={parsed.days.includes(d)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              週{d}日（{d * 8}時間）
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="リモート頻度">
        <div className="space-y-1.5">
          {Object.entries(REMOTE_TYPE_LABELS).map(([value, label]) => (
            <label key={value} className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name="remote"
                value={value}
                defaultChecked={(parsed.remote as string[]).includes(value)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              {label}
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="こだわり条件">
        <div className="space-y-1.5">
          {PROJECT_FEATURES.map((f) => (
            <label key={f} className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name="features"
                value={f}
                defaultChecked={parsed.features.includes(f)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              {f}
            </label>
          ))}
        </div>
      </FilterSection>

      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          className="h-10 flex-1 rounded-lg bg-blue-600 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        >
          この条件で検索
        </button>
        <Link href={action} className="text-xs text-slate-500 hover:text-slate-700 hover:underline">
          クリア
        </Link>
      </div>
    </form>
  );
}
