import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * ログイン中ユーザーをプロフィール・所属企業つきで取得する。
 * React cache でリクエスト内は1クエリに抑える。
 */
export const getCurrentUser = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) return null;

  return prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      engineerProfile: true,
      companyMember: { include: { company: true } },
    },
  });
});

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

/** ログイン必須。未ログインなら /login へ。 */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** エンジニアとしてのプロフィール登録まで完了していることを要求する。 */
export async function requireEngineer() {
  const user = await requireUser();
  if (user.role !== "ENGINEER" || !user.engineerProfile) redirect("/onboarding");
  return { user, profile: user.engineerProfile };
}

/** 企業メンバーとしての登録まで完了していることを要求する。 */
export async function requireCompany() {
  const user = await requireUser();
  if (user.role !== "COMPANY" || !user.companyMember) redirect("/onboarding");
  return { user, company: user.companyMember.company };
}
