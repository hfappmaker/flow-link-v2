"use client";

import { SkillCategory, type Skill } from "@prisma/client";
import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { X } from "lucide-react";
import { FieldHint, Input, Label, Select } from "@/components/ui/form";
import {
  JOB_CATEGORIES,
  REMOTE_TYPE_LABELS,
  SKILL_CATEGORY_LABELS,
  WEEKLY_DAYS_OPTIONS,
} from "@/lib/constants";
import type { ParsedEngineerSearch } from "@/lib/engineer-search";

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

const SKILL_CATEGORY_ORDER = [
  SkillCategory.LANGUAGE,
  SkillCategory.FRAMEWORK,
  SkillCategory.INFRA,
  SkillCategory.DATABASE,
  SkillCategory.TOOL,
  SkillCategory.OTHER,
] as const;

function SkillCheckboxGroups({
  skills,
  selected,
}: {
  skills: Skill[];
  selected: string[];
}) {
  const groupedSkills = SKILL_CATEGORY_ORDER.map((category) => ({
    category,
    skills: skills
      .filter((skill) => skill.category === category)
      .sort((a, b) => {
        const aSelected = selected.includes(a.id);
        const bSelected = selected.includes(b.id);
        if (aSelected !== bSelected) return Number(bSelected) - Number(aSelected);
        return a.name.localeCompare(b.name, "ja");
      }),
  })).filter((group) => group.skills.length > 0);

  return (
    <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
      {groupedSkills.map(({ category, skills }) => (
        <div key={category} className="space-y-1.5">
          <p className="sticky top-0 z-10 bg-white py-1 text-[11px] font-bold tracking-wide text-slate-500">
            {SKILL_CATEGORY_LABELS[category]}
          </p>
          <div className="space-y-1.5">
            {skills.map((skill) => (
              <label key={skill.id} className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  name="skill"
                  value={skill.id}
                  defaultChecked={selected.includes(skill.id)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="min-w-0 flex-1 truncate">{skill.name}</span>
              </label>
            ))}
          </div>
        </div>
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
      <Label htmlFor={inputId} className="sr-only">
        {label}
      </Label>
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

export function EngineerFilters({
  skills,
  parsed,
  action = "/company/engineers",
}: {
  skills: Skill[];
  parsed: ParsedEngineerSearch;
  action?: string;
}) {
  const [searching, setSearching] = useState(false);
  const parsedKey = JSON.stringify(parsed);

  useEffect(() => {
    setSearching(false);
  }, [parsedKey]);

  return (
    <form
      method="get"
      action={action}
      onSubmit={() => setSearching(true)}
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-20"
    >
      <FilterSection title="フリーワード">
        <Input name="q" defaultValue={parsed.q ?? ""} placeholder="名前・スキル・経歴" />
      </FilterSection>

      <FilterSection title="職種">
        <div className="space-y-3">
          <SearchTagInput
            name="jobText"
            label="手入力で検索"
            initialTags={parsed.jobText}
            placeholder="例: テックリード, PdM"
          />
          <CheckboxGroup
            name="job"
            selected={parsed.job}
            options={JOB_CATEGORIES.map((category) => ({ value: category, label: category }))}
          />
        </div>
      </FilterSection>

      <FilterSection title="スキル">
        <div className="space-y-3">
          <SearchTagInput
            name="skillText"
            label="手入力で検索"
            initialTags={parsed.skillText}
            placeholder="例: TypeScript, GraphQL"
          />
          <SkillCheckboxGroups skills={skills} selected={parsed.skill} />
        </div>
      </FilterSection>

      <FilterSection title="稼働可能日数">
        <div className="space-y-1.5">
          {WEEKLY_DAYS_OPTIONS.map((day) => (
            <label key={day} className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name="days"
                value={day}
                defaultChecked={parsed.days.includes(day)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              週{day}日
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="希望単価（円/月）">
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
          <Select name="rateMin" defaultValue={parsed.rateMin ? String(parsed.rateMin) : ""}>
            <option value="">下限なし</option>
            {RATE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <span className="text-sm font-semibold text-slate-400">〜</span>
          <Select name="rateMax" defaultValue={parsed.rateMax ? String(parsed.rateMax) : ""}>
            <option value="">上限なし</option>
            {RATE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      </FilterSection>

      <FilterSection title="リモート希望">
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

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          name="availableOnly"
          defaultChecked={parsed.availableOnly}
          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        />
        稼働可能な人のみ
      </label>

      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={searching}
          aria-label={searching ? "検索中" : "この条件で検索"}
          className="h-10 flex-1 rounded-lg bg-blue-600 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-blue-300"
        >
          {searching ? "検索中..." : "この条件で検索"}
        </button>
        <Link href={action} className="text-xs text-slate-500 hover:text-slate-700 hover:underline">
          クリア
        </Link>
      </div>
    </form>
  );
}
