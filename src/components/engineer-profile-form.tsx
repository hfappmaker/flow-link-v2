"use client";

import { useActionState } from "react";
import type { EngineerProfile, Skill } from "@prisma/client";
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
