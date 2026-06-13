"use client";

import { useActionState, useId, useState } from "react";
import type { EngineerProfile, Skill, WorkHistory } from "@prisma/client";
import { Plus, X } from "lucide-react";
import { updateEngineerProfile } from "@/lib/actions/profile";
import { Button } from "@/components/ui/button";
import { FieldHint, Input, Label, Select, Textarea } from "@/components/ui/form";
import {
  JOB_CATEGORIES,
  PREFECTURES,
  REMOTE_TYPE_LABELS,
  SKILL_CATEGORY_LABELS,
  WEEKLY_DAYS_OPTIONS,
  WORK_STATUS_LABELS,
} from "@/lib/constants";

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
            placeholder={tags.length > 0 ? "追加するスキル" : "例: Remix, Prisma, Shopify Hydrogen"}
          />
        </div>
      </div>
      <FieldHint>カンマ、読点、Enterでタグ化できます。</FieldHint>
    </div>
  );
}

function JobTitleTagsInput({ initialTitles }: { initialTitles: string[] }) {
  const inputId = useId();
  const [inputValue, setInputValue] = useState("");
  const [titles, setTitles] = useState<string[]>(initialTitles);

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
    <div className="space-y-3 sm:col-span-2">
      <p className="text-sm font-medium text-slate-700">職種</p>
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

type WorkHistoryFormRow = {
  key: string;
  projectName: string;
  role: string;
  startYearMonth: string;
  endYearMonth: string;
  techStack: string;
  description: string;
};

function WorkHistoryFields({ histories }: { histories: WorkHistory[] }) {
  const [rows, setRows] = useState<WorkHistoryFormRow[]>(
    histories.length > 0
      ? histories.map((history) => ({
          key: history.id,
          projectName: history.projectName,
          role: history.role ?? "",
          startYearMonth: history.startYearMonth ?? "",
          endYearMonth: history.endYearMonth ?? "",
          techStack: history.techStack ?? "",
          description: history.description ?? "",
        }))
      : [],
  );

  const addRow = () => {
    setRows((current) => [
      ...current,
      {
        key: `new-${Date.now()}-${current.length}`,
        projectName: "",
        role: "",
        startYearMonth: "",
        endYearMonth: "",
        techStack: "",
        description: "",
      },
    ]);
  };

  const removeRow = (key: string) => {
    setRows((current) => current.filter((row) => row.key !== key));
  };

  const updateRow = (key: string, field: keyof Omit<WorkHistoryFormRow, "key">, value: string) => {
    setRows((current) => current.map((row) => (row.key === key ? { ...row, [field]: value } : row)));
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <h2 className="text-base font-bold text-slate-800">参画実績</h2>
        <button
          type="button"
          onClick={addRow}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
        >
          <Plus className="h-3.5 w-3.5" />
          追加
        </button>
      </div>
      <FieldHint>企業プロフィールに表示されます。案件名を入力した行だけ保存されます。</FieldHint>
      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 px-3 py-4 text-sm text-slate-500">
          参画実績はまだ登録されていません。
        </p>
      ) : (
        <div className="space-y-5">
          {rows.map((row, index) => (
            <div key={row.key} className="space-y-4 border-b border-slate-100 pb-5 last:border-b-0 last:pb-0">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-slate-700">実績 {index + 1}</p>
                <button
                  type="button"
                  onClick={() => removeRow(row.key)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
                  aria-label={`実績 ${index + 1} を削除`}
                  title="削除"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label htmlFor={`workHistoryProjectName-${row.key}`}>案件名</Label>
                  <Input
                    id={`workHistoryProjectName-${row.key}`}
                    name="workHistoryProjectName"
                    maxLength={100}
                    value={row.projectName}
                    onChange={(event) => updateRow(row.key, "projectName", event.currentTarget.value)}
                    placeholder="例: BtoB SaaSの新規開発"
                  />
                </div>
                <div>
                  <Label htmlFor={`workHistoryRole-${row.key}`}>役割</Label>
                  <Input
                    id={`workHistoryRole-${row.key}`}
                    name="workHistoryRole"
                    maxLength={100}
                    value={row.role}
                    onChange={(event) => updateRow(row.key, "role", event.currentTarget.value)}
                    placeholder="例: フロントエンドリード"
                  />
                </div>
                <div>
                  <Label htmlFor={`workHistoryTechStack-${row.key}`}>技術スタック</Label>
                  <Input
                    id={`workHistoryTechStack-${row.key}`}
                    name="workHistoryTechStack"
                    maxLength={200}
                    value={row.techStack}
                    onChange={(event) => updateRow(row.key, "techStack", event.currentTarget.value)}
                    placeholder="例: TypeScript, Next.js, AWS"
                  />
                </div>
                <div>
                  <Label htmlFor={`workHistoryStart-${row.key}`}>開始年月</Label>
                  <Input
                    id={`workHistoryStart-${row.key}`}
                    name="workHistoryStartYearMonth"
                    type="month"
                    value={row.startYearMonth}
                    onChange={(event) => updateRow(row.key, "startYearMonth", event.currentTarget.value)}
                  />
                </div>
                <div>
                  <Label htmlFor={`workHistoryEnd-${row.key}`}>終了年月</Label>
                  <Input
                    id={`workHistoryEnd-${row.key}`}
                    name="workHistoryEndYearMonth"
                    type="month"
                    value={row.endYearMonth}
                    onChange={(event) => updateRow(row.key, "endYearMonth", event.currentTarget.value)}
                  />
                  <FieldHint>現在も参画中の場合は空欄にしてください。</FieldHint>
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor={`workHistoryDescription-${row.key}`}>内容・成果</Label>
                  <Textarea
                    id={`workHistoryDescription-${row.key}`}
                    name="workHistoryDescription"
                    rows={4}
                    maxLength={1000}
                    value={row.description}
                    onChange={(event) => updateRow(row.key, "description", event.currentTarget.value)}
                    placeholder="担当範囲、成果、工夫した点など"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function EngineerProfileForm({
  emailNotificationsEnabled,
  profile,
  workHistories,
  skills,
  selectedSkillIds,
}: {
  emailNotificationsEnabled: boolean;
  profile: EngineerProfile;
  workHistories: WorkHistory[];
  skills: Skill[];
  selectedSkillIds: string[];
}) {
  const [state, action, pending] = useActionState(updateEngineerProfile, {});
  const [selectedWeeklyDays, setSelectedWeeklyDays] = useState<number[]>(profile.desiredWeeklyDays);

  const toggleWeeklyDay = (day: number, checked: boolean) => {
    setSelectedWeeklyDays((current) => {
      if (checked) return [...new Set([...current, day])].sort((a, b) => a - b);
      return current.filter((selectedDay) => selectedDay !== day);
    });
  };

  const grouped = new Map<string, Skill[]>();
  for (const skill of skills) {
    const key = SKILL_CATEGORY_LABELS[skill.category];
    grouped.set(key, [...(grouped.get(key) ?? []), skill]);
  }

  return (
    <form action={action} className="space-y-8">
      {state.error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          プロフィールを保存しました
        </p>
      ) : null}

      <section className="space-y-4">
        <h2 className="border-b border-slate-200 pb-2 text-base font-bold text-slate-800">基本情報</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="displayName" required>
              表示名
            </Label>
            <Input id="displayName" name="displayName" required maxLength={50} defaultValue={profile.displayName} />
          </div>
          <JobTitleTagsInput initialTitles={profile.title} />
          <div>
            <Label htmlFor="location">居住地</Label>
            <Select id="location" name="location" defaultValue={profile.location ?? ""}>
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
            <Input
              id="yearsOfExperience"
              name="yearsOfExperience"
              type="number"
              min={0}
              max={60}
              defaultValue={profile.yearsOfExperience ?? ""}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="bio">自己紹介・経歴サマリ</Label>
          <Textarea
            id="bio"
            name="bio"
            rows={6}
            maxLength={4000}
            defaultValue={profile.bio ?? ""}
            placeholder="これまでの経験、得意分野、稼働スタイルなどをご記入ください"
          />
          <FieldHint>企業がスカウト時に最も参考にする項目です。具体的な実績を書きましょう。</FieldHint>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="githubUrl">GitHub URL</Label>
            <Input
              id="githubUrl"
              name="githubUrl"
              type="url"
              defaultValue={profile.githubUrl ?? ""}
              placeholder="https://github.com/..."
            />
          </div>
          <div>
            <Label htmlFor="portfolioUrl">ポートフォリオURL</Label>
            <Input
              id="portfolioUrl"
              name="portfolioUrl"
              type="url"
              defaultValue={profile.portfolioUrl ?? ""}
              placeholder="https://..."
            />
          </div>
        </div>
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">
          GitHub URLとポートフォリオURLは、プロフィールを公開している場合に企業へ表示されます。
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="border-b border-slate-200 pb-2 text-base font-bold text-slate-800">スキル</h2>
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
                    defaultChecked={selectedSkillIds.includes(skill.id)}
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

      <WorkHistoryFields histories={workHistories} />

      <section className="space-y-4">
        <h2 className="border-b border-slate-200 pb-2 text-base font-bold text-slate-800">希望条件</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="desiredRateMin">希望単価 下限（円/月）</Label>
            <Input
              id="desiredRateMin"
              name="desiredRateMin"
              type="number"
              min={0}
              step={10000}
              defaultValue={profile.desiredRateMin ?? ""}
              placeholder="600000"
            />
          </div>
          <div>
            <Label htmlFor="desiredRateMax">希望単価 上限（円/月）</Label>
            <Input
              id="desiredRateMax"
              name="desiredRateMax"
              type="number"
              min={0}
              step={10000}
              defaultValue={profile.desiredRateMax ?? ""}
              placeholder="1000000"
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">希望稼働日数</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {WEEKLY_DAYS_OPTIONS.map((days) => (
                <label
                  key={days}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 transition-colors has-checked:border-blue-600 has-checked:bg-blue-50 has-checked:text-blue-700"
                >
                  <input
                    type="checkbox"
                    name="desiredWeeklyDays"
                    value={days}
                    checked={selectedWeeklyDays.includes(days)}
                    onChange={(event) => toggleWeeklyDay(days, event.currentTarget.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  週{days}日
                </label>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="remotePreference">希望リモート頻度</Label>
            <Select id="remotePreference" name="remotePreference" defaultValue={profile.remotePreference ?? ""}>
              <option value="">指定なし</option>
              {Object.entries(REMOTE_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="workStatus">稼働ステータス</Label>
            <Select id="workStatus" name="workStatus" defaultValue={profile.workStatus}>
              {Object.entries(WORK_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="border-b border-slate-200 pb-2 text-base font-bold text-slate-800">公開設定</h2>
        <label className="flex items-start gap-3 text-sm text-slate-700">
          <input
            type="checkbox"
            name="isPublic"
            defaultChecked={profile.isPublic}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <span>
            プロフィールを企業に公開し、スカウトを受け取る
            <span className="mt-0.5 block text-xs text-slate-500">
              オフにすると企業のエンジニア検索結果に表示されなくなります。
            </span>
          </span>
        </label>
      </section>

      <section className="space-y-3">
        <h2 className="border-b border-slate-200 pb-2 text-base font-bold text-slate-800">通知設定</h2>
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
              新しいスカウトやチャットメッセージが届いたときにメールで通知します。
            </span>
          </span>
        </label>
      </section>

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "保存中..." : "プロフィールを保存"}
      </Button>
    </form>
  );
}
