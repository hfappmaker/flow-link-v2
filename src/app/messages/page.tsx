import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatRelative } from "@/lib/format";

export const metadata: Metadata = { title: "メッセージ" };

export default async function MessagesPage() {
  const user = await requireUser();
  if (!user.engineerProfile && !user.companyMember) redirect("/onboarding");

  const isCompany = Boolean(user.companyMember);
  const where = isCompany
    ? { companyId: user.companyMember!.companyId }
    : { engineerUserId: user.id };

  const conversations = await prisma.conversation.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: {
      company: true,
      engineer: { include: { engineerProfile: true } },
      project: { select: { id: true, title: true } },
      scout: { select: { id: true } },
      application: { select: { id: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  const unreadCounts = await prisma.message.groupBy({
    by: ["conversationId"],
    where: {
      conversationId: { in: conversations.map((c) => c.id) },
      readAt: null,
      ...(isCompany ? { sender: { companyMember: null } } : { NOT: { senderId: user.id } }),
    },
    _count: { _all: true },
  });
  const unreadMap = new Map(unreadCounts.map((u) => [u.conversationId, u._count._all]));

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-black text-slate-900">メッセージ</h1>
      <p className="mt-1 text-sm text-slate-500">
        {isCompany
          ? "応募者・スカウトしたエンジニアとのやり取りを確認できます。"
          : "応募した案件・スカウトの担当者とやり取りできます。"}
      </p>

      <div className="mt-6 space-y-2">
        {conversations.length === 0 ? (
          <EmptyState
            title="メッセージはまだありません"
            description={
              isCompany
                ? "エンジニアからの応募、またはスカウト送信後にチャットを開始できます。"
                : "案件に応募すると、企業とのチャットが開始されます。"
            }
          />
        ) : (
          conversations.map((c) => {
            const counterpartName = isCompany
              ? (c.engineer.engineerProfile?.displayName ?? c.engineer.name ?? "エンジニア")
              : c.company.name;
            const last = c.messages[0];
            const unread = unreadMap.get(c.id) ?? 0;
            return (
              <Link
                key={c.id}
                href={`/messages/${c.id}`}
                className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50/30"
              >
                <Avatar name={counterpartName} image={isCompany ? null : c.company.logoUrl} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-bold text-slate-800">{counterpartName}</p>
                    {c.scout ? <Badge tone="amber">スカウト</Badge> : null}
                    {c.application ? <Badge tone="blue">応募</Badge> : null}
                  </div>
                  {c.project ? (
                    <p className="mt-0.5 truncate text-xs text-slate-500">{c.project.title}</p>
                  ) : null}
                  {last ? (
                    <p className="mt-1 truncate text-xs text-slate-400">{last.body}</p>
                  ) : null}
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className="text-xs text-slate-400">
                    {last ? formatRelative(last.createdAt) : formatRelative(c.createdAt)}
                  </span>
                  {unread > 0 ? (
                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white">
                      {unread}
                    </span>
                  ) : null}
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
