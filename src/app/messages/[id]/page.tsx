import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/session";
import { getConversationForUser } from "@/lib/messages";
import { ChatRoom } from "@/components/chat/chat-room";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { APPLICATION_STATUS_LABELS, SCOUT_STATUS_LABELS } from "@/lib/constants";

export const metadata: Metadata = { title: "メッセージ" };

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  if (!user.engineerProfile && !user.companyMember) redirect("/onboarding");

  const conversation = await getConversationForUser(id, user);
  if (!conversation) notFound();

  const isCompany = user.companyMember?.companyId === conversation.companyId;
  const counterpartName = isCompany
    ? (conversation.engineer.engineerProfile?.displayName ?? conversation.engineer.name ?? "エンジニア")
    : conversation.company.name;

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-3xl flex-col px-4 sm:px-6">
      <div className="flex items-center gap-3 border-b border-slate-200 py-3">
        <Link
          href="/messages"
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          aria-label="メッセージ一覧へ戻る"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <Avatar name={counterpartName} image={isCompany ? null : conversation.company.logoUrl} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-bold text-slate-800">{counterpartName}</p>
            {conversation.application ? (
              <Badge tone="blue">応募: {APPLICATION_STATUS_LABELS[conversation.application.status]}</Badge>
            ) : null}
            {conversation.scout ? (
              <Badge tone="amber">スカウト: {SCOUT_STATUS_LABELS[conversation.scout.status]}</Badge>
            ) : null}
          </div>
          {conversation.project ? (
            <Link
              href={`/projects/${conversation.project.id}`}
              className="block truncate text-xs text-blue-600 hover:underline"
            >
              {conversation.project.title}
            </Link>
          ) : null}
        </div>
        {isCompany && conversation.engineer.engineerProfile ? (
          <Link
            href={`/company/engineers/${conversation.engineer.engineerProfile.id}`}
            className="text-xs font-medium text-blue-600 hover:underline"
          >
            プロフィールを見る
          </Link>
        ) : null}
      </div>

      <div className="min-h-0 flex-1">
        <ChatRoom conversationId={conversation.id} currentUserId={user.id} isCompanyViewer={isCompany} />
      </div>
    </div>
  );
}
