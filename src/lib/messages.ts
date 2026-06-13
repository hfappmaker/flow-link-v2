import { prisma } from "@/lib/prisma";
import type { CurrentUser } from "@/lib/session";

/** 未読メッセージ数（自分宛て）を数える */
export async function getUnreadMessageCount(user: CurrentUser): Promise<number> {
  if (user.role === "ENGINEER") {
    return prisma.message.count({
      where: {
        readAt: null,
        conversation: { engineerUserId: user.id },
        NOT: { senderId: user.id },
      },
    });
  }
  if (user.role === "COMPANY" && user.companyMember) {
    return prisma.message.count({
      where: {
        readAt: null,
        conversation: { companyId: user.companyMember.companyId },
        // 企業メンバー以外（=エンジニア）からのメッセージのみ未読対象
        sender: { companyMember: null },
      },
    });
  }
  return 0;
}

/** 会話への参加権限チェック。参加していれば会話を返す。 */
export async function getConversationForUser(conversationId: string, user: CurrentUser) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      company: {
        include: {
          members: {
            include: {
              user: {
                select: { email: true, emailNotificationsEnabled: true },
              },
            },
          },
        },
      },
      engineer: { include: { engineerProfile: true } },
      project: { select: { id: true, title: true, status: true } },
      application: { select: { id: true, status: true } },
      scout: { select: { id: true, status: true } },
    },
  });
  if (!conversation) return null;

  const isEngineer = conversation.engineerUserId === user.id;
  const isCompanyMember = user.companyMember?.companyId === conversation.companyId;
  if (!isEngineer && !isCompanyMember) return null;

  return conversation;
}
