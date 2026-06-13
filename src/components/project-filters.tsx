"use client";

import type { Skill } from "@prisma/client";
import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { X } from "lucide-react";
import { FieldHint, Input, Label, Select } from "@/components/ui/form";
import {
  JOB_CATEGORIES,
  PREFECTURES,
  PROJECT_FEATURES,
  REMOTE_TYPE_LABELS,
  WEEKLY_DAYS_OPTIONS,
} from "@/lib/constants";
import type { ParsedProjectSearch } from "@/lib/project-search";

const RATE_OPTIONS = Array.from({ length: 20 }, (_, index) => {
  const unit = index + 1;
  const amount = unit * 100000;
  return { value: String(amount), label: `${unit * 10}万円` };
});

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-slate-100 pb-4">
      <p className="mb-2 text-xs font-bold tracking-wide text-slate-500">{title}</p>
      {children}
    </div>
  );
}

function CheckboxGroup({
  name,
  options,
  selected,
}: {
  name: string;
  options: { value: string; label: string }[];
  selected: string[];
}) {
  return (
    <div className="max-h-44 space-y-1.5 overflow-y-auto pr-1">
      {options.map((option) => (
        <label key={option.value} className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name={name}
            value={option.value}
            defaultChecked={selected.includes(option.value)}
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="min-w-0 flex-1 truncate">{option.label}</span>
        </label>
      ))}
    </div>
  );
}

function SearchTagInput({
  name,
  label,
  initialTags,
  placeholder,
}: {
  name: string;
  label: string;
  initialTags: string[];
  placeholder: string;
}) {
  const inputId = useId();
  const [inputValue, setInputValue] = useState("");
  const [tags, setTags] = useState(initialTags);
  const initialTagsKey = initialTags.join("\n");

  useEffect(() => {
    setTags(initialTags);
  }, [initialTagsKey, initialTags]);

  const addTags = (rawValue: string) => {
    const nextTags = rawValue
      .split(/[\n,、]/)
      .map((tag) => tag.trim().replace(/\s+/g, " "))
      .filter(Boolean);

    if (nextTags.length === 0) return;
    setTags((current) => [...new Set([...current, ...nextTags])]);
    setInputValue("");
  };

  const removeTag = (tag: string) => {
    setTags((current) => current.filter((item) => item !== tag));
  };

  return (
    <div>
      <Label htmlFor={inputId}>{label}</Label>
      {tags.map((tag) => (
        <input key={tag} type="hidden" name={name} value={tag} />
      ))}
      <div className="rounded-lg border border-slate-300 bg-white px-2 py-2 transition-colors focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
        <div className="flex min-h-10 flex-wrap items-center gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-sm font-semibold text-blue-700"
            >
              <span className="truncate">{tag}</span>
              <button
                type="button"
                aria-label={`${tag}を削除`}
                title="削除"
                onClick={() => removeTag(tag)}
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
                addTags(value);
              } else {
                setInputValue(value);
              }
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addTags(inputValue);
              }
              if (event.key === "Backspace" && inputValue === "") {
                setTags((current) => current.slice(0, -1));
              }
            }}
            onBlur={() => addTags(inputValue)}
            className="h-8 min-w-24 flex-1 border-0 bg-transparent px-1 text-sm text-slate-900 outline-none placeholder:text-slate-400"
            placeholder={tags.length > 0 ? "追加" : placeholder}
          />
        </div>
      </div>
      <FieldHint>カンマ、読点、Enterでタグ化できます。</FieldHint>
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
        <CheckboxGroup
          name="job"
          selected={parsed.job}
          options={JOB_CATEGORIES.map((category) => ({ value: category, label: category }))}
        />
      </FilterSection>

      <FilterSection title="開発言語">
        <div className="space-y-3">
          <SearchTagInput
            name="langText"
            label="手入力で検索"
            initialTags={parsed.langText}
            placeholder="例: TypeScript, Go"
          />
          <CheckboxGroup
            name="lang"
            selected={parsed.lang}
            options={languages.map((skill) => ({ value: skill.id, label: skill.name }))}
          />
        </div>
      </FilterSection>

      <FilterSection title="開発スキル">
        <div className="space-y-3">
          <SearchTagInput
            name="skillText"
            label="手入力で検索"
            initialTags={parsed.skillText}
            placeholder="例: GraphQL, BigQuery"
          />
          <CheckboxGroup
            name="skill"
            selected={parsed.skill}
            options={otherSkills.map((skill) => ({ value: skill.id, label: skill.name }))}
          />
        </div>
      </FilterSection>

      <FilterSection title="単価目安（円/月）">
        <div className="grid grid-cols-2 gap-2">
          <Select name="rateMin" defaultValue={parsed.rateMin ? String(parsed.rateMin) : ""}>
            <option value="">下限なし</option>
            {RATE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          <Select name="rateMax" defaultValue={parsed.rateMax ? String(parsed.rateMax) : ""}>
            <option value="">上限なし</option>
            {RATE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
      </FilterSection>

      <FilterSection title="都道府県">
        <CheckboxGroup
          name="prefecture"
          selected={parsed.prefecture}
          options={PREFECTURES.map((prefecture) => ({ value: prefecture, label: prefecture }))}
        />
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
              週{d}日
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
