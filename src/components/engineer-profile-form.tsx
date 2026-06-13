"use client";

import { useActionState, useId, useMemo, useState } from "react";
import type { EngineerProfile, Skill } from "@prisma/client";
import { FileSpreadsheet, FileText, FileType, Upload, X } from "lucide-react";
import { updateEngineerProfile } from "@/lib/actions/profile";
import { Button } from "@/components/ui/button";
import { FieldHint, Input, Label, Select, Textarea } from "@/components/ui/form";
import {
  JOB_CATEGORIES,
  PREFECTURES,
  REMOTE_TYPE_LABELS,
  SKILL_CATEGORY_LABELS,
  WORK_STATUS_LABELS,
} from "@/lib/constants";

function getDocumentKind(fileName: string | null | undefined) {
  const ext = fileName?.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return { label: "PDF", tone: "bg-red-50 text-red-700 border-red-200", icon: FileText };
  if (ext === "doc" || ext === "docx") {
    return { label: ext.toUpperCase(), tone: "bg-blue-50 text-blue-700 border-blue-200", icon: FileType };
  }
  if (ext === "xls" || ext === "xlsx") {
    return { label: ext.toUpperCase(), tone: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: FileSpreadsheet };
  }
  return { label: "FILE", tone: "bg-slate-100 text-slate-700 border-slate-200", icon: FileText };
}

function DocumentUploadField({
  label,
  inputName,
  removeName,
  existingFileName,
  downloadHref,
}: {
  label: string;
  inputName: string;
  removeName: string;
  existingFileName: string | null;
  downloadHref: string;
}) {
  const inputId = useId();
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [removeExisting, setRemoveExisting] = useState(false);
  const visibleFileName = selectedFileName ?? (removeExisting ? null : existingFileName);
  const documentKind = useMemo(() => getDocumentKind(visibleFileName), [visibleFileName]);
  const Icon = documentKind.icon;

  return (
    <div>
      <Label htmlFor={inputId}>{label}</Label>
      <input type="hidden" name={removeName} value={removeExisting ? "on" : ""} />
      <input
        id={inputId}
        name={inputName}
        type="file"
        accept=".pdf,.doc,.docx,.xls,.xlsx"
        className="sr-only"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          setSelectedFileName(file?.name ?? null);
          if (file) setRemoveExisting(false);
        }}
      />

      {visibleFileName ? (
        <div className="flex min-h-16 items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-3 shadow-sm">
          <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${documentKind.tone}`}>
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            {selectedFileName ? (
              <p className="truncate text-sm font-semibold text-slate-800">{visibleFileName}</p>
            ) : (
              <a href={downloadHref} className="block truncate text-sm font-semibold text-blue-700 hover:underline">
                {visibleFileName}
              </a>
            )}
            <p className="mt-0.5 text-xs font-medium text-slate-500">{documentKind.label}</p>
          </div>
          <button
            type="button"
            aria-label={`${label}を削除`}
            title="削除"
            onClick={() => {
              setSelectedFileName(null);
              setRemoveExisting(Boolean(existingFileName));
              const input = document.getElementById(inputId) as HTMLInputElement | null;
              if (input) input.value = "";
            }}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          className="flex min-h-16 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-600 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
        >
          <Upload className="h-4 w-4" />
          ファイルを選択
        </label>
      )}
      <FieldHint>PDF、DOC、DOCX、XLS、XLSX形式。5MBまで。</FieldHint>
    </div>
  );
}

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

export function EngineerProfileForm({
  profile,
  skills,
  selectedSkillIds,
}: {
  profile: EngineerProfile;
  skills: Skill[];
  selectedSkillIds: string[];
}) {
  const [state, action, pending] = useActionState(updateEngineerProfile, {});

  const grouped = new Map<string, Skill[]>();
  for (const skill of skills) {
    const key = SKILL_CATEGORY_LABELS[skill.category];
    grouped.set(key, [...(grouped.get(key) ?? []), skill]);
  }

  return (
    <form action={action} encType="multipart/form-data" className="space-y-8">
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
          <div>
            <Label htmlFor="title" required>
              職種
            </Label>
            <Select id="title" name="title" required defaultValue={profile.title ?? ""}>
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
            <Input id="githubUrl" name="githubUrl" type="url" defaultValue={profile.githubUrl ?? ""} placeholder="https://github.com/..." />
          </div>
          <div>
            <Label htmlFor="portfolioUrl">ポートフォリオURL</Label>
            <Input id="portfolioUrl" name="portfolioUrl" type="url" defaultValue={profile.portfolioUrl ?? ""} placeholder="https://..." />
          </div>
        </div>
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">
          GitHub URLとポートフォリオURLは、プロフィールを公開している場合に企業へ表示されます。
          リンク先に氏名、メールアドレス、勤務先、機密情報など公開したくない情報が含まれていないか確認してください。
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="border-b border-slate-200 pb-2 text-base font-bold text-slate-800">添付書類</h2>
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">
          履歴書・職務経歴書は、プロフィールを公開している場合に企業へ表示されます。氏名、連絡先、勤務先、機密情報など、開示したくない情報が含まれていないか確認してください。
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <DocumentUploadField
            label="履歴書"
            inputName="resumeFile"
            removeName="removeResumeFile"
            existingFileName={profile.resumeFileName}
            downloadHref={`/api/engineer-documents/${profile.id}/resume`}
          />
          <DocumentUploadField
            label="職務経歴書"
            inputName="workHistoryFile"
            removeName="removeWorkHistoryFile"
            existingFileName={profile.workHistoryFileName}
            downloadHref={`/api/engineer-documents/${profile.id}/work-history`}
          />
        </div>
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

      <section className="space-y-4">
        <h2 className="border-b border-slate-200 pb-2 text-base font-bold text-slate-800">希望条件</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="desiredRateMin">希望単価 下限（円/月）</Label>
            <Input id="desiredRateMin" name="desiredRateMin" type="number" min={0} step={10000} defaultValue={profile.desiredRateMin ?? ""} placeholder="600000" />
          </div>
          <div>
            <Label htmlFor="desiredRateMax">希望単価 上限（円/月）</Label>
            <Input id="desiredRateMax" name="desiredRateMax" type="number" min={0} step={10000} defaultValue={profile.desiredRateMax ?? ""} placeholder="1000000" />
          </div>
          <div>
            <Label htmlFor="desiredWeeklyDays">希望稼働日数</Label>
            <Select id="desiredWeeklyDays" name="desiredWeeklyDays" defaultValue={profile.desiredWeeklyDays ?? ""}>
              <option value="">指定なし</option>
              {[1, 2, 3, 4, 5].map((d) => (
                <option key={d} value={d}>
                  週{d}日
                </option>
              ))}
            </Select>
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

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "保存中..." : "プロフィールを保存"}
      </Button>
    </form>
  );
}
