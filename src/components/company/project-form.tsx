"use client";

import { useActionState, useId, useState } from "react";
import type { Prisma, Skill } from "@prisma/client";
import { X } from "lucide-react";
import { createProject, updateProject } from "@/lib/actions/projects";
import { Button } from "@/components/ui/button";
import { FieldHint, Input, Label, Select, Textarea } from "@/components/ui/form";
import {
  JOB_CATEGORIES,
  PREFECTURES,
  PROJECT_FEATURES,
  REMOTE_TYPE_LABELS,
  SKILL_CATEGORY_LABELS,
} from "@/lib/constants";

type ProjectWithSkills = Prisma.ProjectGetPayload<{ include: { skills: true } }>;

function CustomSkillTagsInput() {
  const inputId = useId();
  const [inputValue, setInputValue] = useState("");
  const [tags, setTags] = useState<string[]>([]);

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
      <Label htmlFor={inputId}>スキルを追加</Label>
      <input type="hidden" name="customSkills" value={tags.join("\n")} />
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
            className="h-8 min-w-36 flex-1 border-0 bg-transparent px-1 text-sm text-slate-900 outline-none placeholder:text-slate-400"
            placeholder={tags.length > 0 ? "追加するスキル" : "例: Go, GraphQL, BigQuery"}
          />
        </div>
      </div>
      <FieldHint>カンマ、読点、Enterでタグ化できます。</FieldHint>
    </div>
  );
}

export function ProjectForm({
  skills,
  project,
}: {
  skills: Skill[];
  project?: ProjectWithSkills;
}) {
  const [state, action, pending] = useActionState(project ? updateProject : createProject, {});
  const selectedSkillIds = new Set(project?.skills.map((s) => s.skillId) ?? []);
  const selectedFeatures = new Set(project?.features ?? []);

  const grouped = new Map<string, Skill[]>();
  for (const skill of skills) {
    const key = SKILL_CATEGORY_LABELS[skill.category];
    grouped.set(key, [...(grouped.get(key) ?? []), skill]);
  }

  return (
    <form action={action} className="space-y-8">
      {project ? <input type="hidden" name="projectId" value={project.id} /> : null}
      {state.error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {state.error}
        </p>
      ) : null}

      <section className="space-y-4">
        <h2 className="border-b border-slate-200 pb-2 text-base font-bold text-slate-800">基本情報</h2>
        <div>
          <Label htmlFor="title" required>
            案件タイトル
          </Label>
          <Input
            id="title"
            name="title"
            required
            maxLength={200}
            defaultValue={project?.title ?? ""}
            placeholder="例: 【週3-5日/フルリモート/TypeScript】フルスタックエンジニア - SaaSのMVP開発"
          />
        </div>
        <div>
          <Label htmlFor="summary">概要（リード文）</Label>
          <Textarea
            id="summary"
            name="summary"
            rows={3}
            maxLength={2000}
            defaultValue={project?.summary ?? ""}
            placeholder="案件の概要を2〜3文でご記入ください。検索結果のカードにも表示されます。"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="jobCategory" required>
              募集職種
            </Label>
            <Select id="jobCategory" name="jobCategory" required defaultValue={project?.jobCategory ?? ""}>
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
          <div>
            <Label htmlFor="industry">業界</Label>
            <Input id="industry" name="industry" maxLength={100} defaultValue={project?.industry ?? ""} placeholder="例: ITサービス系 / FinTech" />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="border-b border-slate-200 pb-2 text-base font-bold text-slate-800">条件</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="rateMin">単価 下限（円/月）</Label>
            <Input id="rateMin" name="rateMin" type="number" min={0} step={10000} defaultValue={project?.rateMin ?? ""} placeholder="600000" />
          </div>
          <div>
            <Label htmlFor="rateMax">単価 上限（円/月）</Label>
            <Input id="rateMax" name="rateMax" type="number" min={0} step={10000} defaultValue={project?.rateMax ?? ""} placeholder="1000000" />
            <FieldHint>上限のみの入力で「〜100万円/月」のように表示されます。</FieldHint>
          </div>
          <div>
            <Label htmlFor="weeklyDaysMin" required>
              稼働日数 下限
            </Label>
            <Select id="weeklyDaysMin" name="weeklyDaysMin" required defaultValue={project?.weeklyDaysMin ?? 3}>
              {[1, 2, 3, 4, 5].map((d) => (
                <option key={d} value={d}>
                  週{d}日
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="weeklyDaysMax" required>
              稼働日数 上限
            </Label>
            <Select id="weeklyDaysMax" name="weeklyDaysMax" required defaultValue={project?.weeklyDaysMax ?? 5}>
              {[1, 2, 3, 4, 5].map((d) => (
                <option key={d} value={d}>
                  週{d}日
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="remoteType" required>
              リモート頻度
            </Label>
            <Select id="remoteType" name="remoteType" required defaultValue={project?.remoteType ?? "FULL_REMOTE"}>
              {Object.entries(REMOTE_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="location">場所</Label>
            <Input id="location" name="location" maxLength={100} defaultValue={project?.location ?? ""} placeholder="例: 渋谷 / 六本木 / フルリモート補足" />
          </div>
          <div>
            <Label htmlFor="prefecture">都道府県</Label>
            <Select id="prefecture" name="prefecture" defaultValue={project?.prefecture ?? ""}>
              <option value="">選択しない</option>
              {PREFECTURES.map((prefecture) => (
                <option key={prefecture} value={prefecture}>
                  {prefecture}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="contractType">契約形態</Label>
            <Input id="contractType" name="contractType" maxLength={50} defaultValue={project?.contractType ?? "業務委託"} />
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-slate-700">こだわり条件タグ</p>
          <div className="flex flex-wrap gap-2">
            {PROJECT_FEATURES.map((f) => (
              <label
                key={f}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 transition-colors has-checked:border-blue-600 has-checked:bg-blue-50 has-checked:text-blue-700"
              >
                <input
                  type="checkbox"
                  name="features"
                  value={f}
                  defaultChecked={selectedFeatures.has(f)}
                  className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                {f}
              </label>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="border-b border-slate-200 pb-2 text-base font-bold text-slate-800">
          求める言語・スキル
        </h2>
        {[...grouped.entries()].map(([categoryLabel, categorySkills]) => (
          <div key={categoryLabel}>
            <p className="mb-2 text-xs font-bold tracking-wide text-slate-500">{categoryLabel}</p>
            <div className="flex flex-wrap gap-2">
              {categorySkills.map((skill) => (
                <label
                  key={skill.id}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 transition-colors has-checked:border-blue-600 has-checked:bg-blue-50 has-checked:text-blue-700"
                >
                  <input
                    type="checkbox"
                    name="skills"
                    value={skill.id}
                    defaultChecked={selectedSkillIds.has(skill.id)}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  {skill.name}
                </label>
              ))}
            </div>
          </div>
        ))}
        <CustomSkillTagsInput />
      </section>

      <section className="space-y-4">
        <h2 className="border-b border-slate-200 pb-2 text-base font-bold text-slate-800">詳細情報</h2>
        <div>
          <Label htmlFor="description" required>
            業務内容
          </Label>
          <Textarea id="description" name="description" rows={6} required maxLength={8000} defaultValue={project?.description ?? ""} />
        </div>
        <div>
          <Label htmlFor="background">募集背景</Label>
          <Textarea id="background" name="background" rows={4} maxLength={8000} defaultValue={project?.background ?? ""} />
        </div>
        <div>
          <Label htmlFor="merits">参画メリット</Label>
          <Textarea
            id="merits"
            name="merits"
            rows={4}
            maxLength={4000}
            defaultValue={project?.merits ?? ""}
            placeholder={"1行につき1項目で入力してください\n例: 新規プロダクトの0→1開発に携わることができます"}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="requiredSkillsText">必須要件</Label>
            <Textarea
              id="requiredSkillsText"
              name="requiredSkillsText"
              rows={5}
              maxLength={4000}
              defaultValue={project?.requiredSkillsText ?? ""}
              placeholder={"1行につき1項目\n例: TypeScriptを用いた開発経験3年以上"}
            />
          </div>
          <div>
            <Label htmlFor="preferredSkillsText">歓迎要件</Label>
            <Textarea
              id="preferredSkillsText"
              name="preferredSkillsText"
              rows={5}
              maxLength={4000}
              defaultValue={project?.preferredSkillsText ?? ""}
              placeholder={"1行につき1項目\n例: チームリードのご経験"}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="idealCandidate">求める人物像</Label>
          <Textarea id="idealCandidate" name="idealCandidate" rows={3} maxLength={4000} defaultValue={project?.idealCandidate ?? ""} />
        </div>
        <div>
          <Label htmlFor="devEnvironment">開発環境</Label>
          <Textarea
            id="devEnvironment"
            name="devEnvironment"
            rows={3}
            maxLength={4000}
            defaultValue={project?.devEnvironment ?? ""}
            placeholder={"例:\n開発手法: スクラム\nAIツール: GitHub Copilot利用可"}
          />
        </div>
      </section>

      <section className="flex flex-wrap items-center gap-4 border-t border-slate-200 pt-6">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="radio"
            name="publish"
            value="open"
            defaultChecked={(project?.status ?? "OPEN") !== "DRAFT"}
            className="h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          公開する
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="radio"
            name="publish"
            value="draft"
            defaultChecked={project?.status === "DRAFT"}
            className="h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          下書きとして保存
        </label>
        <Button type="submit" size="lg" disabled={pending} className="ml-auto">
          {pending ? "保存中..." : project ? "案件を更新する" : "案件を作成する"}
        </Button>
      </section>
    </form>
  );
}
