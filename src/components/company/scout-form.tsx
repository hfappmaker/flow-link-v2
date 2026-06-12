"use client";

import { useActionState } from "react";
import { sendScout } from "@/lib/actions/scouts";
import { Button } from "@/components/ui/button";
import { FieldHint, Input, Label, Select, Textarea } from "@/components/ui/form";

export function ScoutForm({
  engineerUserId,
  engineerName,
  projects,
}: {
  engineerUserId: string;
  engineerName: string;
  projects: { id: string; title: string }[];
}) {
  const [state, action, pending] = useActionState(sendScout, {});

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="engineerUserId" value={engineerUserId} />
      {state.error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {state.error}
        </p>
      ) : null}

      <div>
        <Label htmlFor="projectId">対象案件（任意）</Label>
        <Select id="projectId" name="projectId" defaultValue="">
          <option value="">案件を指定しない</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </Select>
        <FieldHint>案件を指定すると、スカウトに案件詳細へのリンクが表示されます。</FieldHint>
      </div>

      <div>
        <Label htmlFor="title" required>
          件名
        </Label>
        <Input
          id="title"
          name="title"
          required
          maxLength={200}
          placeholder={`例: ${engineerName}様のご経験を活かせる案件のご相談`}
        />
      </div>

      <div>
        <Label htmlFor="message" required>
          スカウトメッセージ
        </Label>
        <Textarea
          id="message"
          name="message"
          rows={8}
          required
          maxLength={4000}
          defaultValue={`${engineerName}様

はじめまして。プロフィールを拝見し、ぜひ弊社の案件についてお話しさせていただきたくご連絡いたしました。

【お声がけした理由】


【案件の概要】


ご興味をお持ちいただけましたら、ぜひチャットにてお気軽にご返信ください。`}
        />
        <FieldHint>送信と同時にチャットが開始され、エンジニアに通知されます。</FieldHint>
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "送信中..." : "スカウトを送信する"}
      </Button>
    </form>
  );
}
