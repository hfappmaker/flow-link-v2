"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export type ActionState = { error?: string; success?: boolean };

const engineerSchema = z.object({
  displayName: z.string().min(1, "表示名を入力してください").max(50),
  title: z.string().min(1, "職種を選択してください"),
  location: z.string().max(100).optional(),
  yearsOfExperience: z.coerce.number().int().min(0).max(60).optional(),
});

export async function completeEngineerOnboarding(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  if (user.engineerProfile || user.companyMember) redirect("/");

  const parsed = engineerSchema.safeParse({
    displayName: formData.get("displayName"),
    title: formData.get("title"),
    location: formData.get("location") || undefined,
    yearsOfExperience: formData.get("yearsOfExperience") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "入力内容に誤りがあります" };
  }

  const skillIds = formData.getAll("skills").map(String).filter(Boolean);

  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { role: "ENGINEER" } }),
    prisma.engineerProfile.create({
      data: {
        userId: user.id,
        displayName: parsed.data.displayName,
        title: parsed.data.title,
        location: parsed.data.location,
        yearsOfExperience: parsed.data.yearsOfExperience,
        skills: { create: skillIds.map((skillId) => ({ skillId })) },
      },
    }),
  ]);

  redirect("/dashboard");
}

const companySchema = z.object({
  companyName: z.string().min(1, "会社名を入力してください").max(100),
  industry: z.string().max(100).optional(),
  location: z.string().max(100).optional(),
  website: z.union([z.url("WebサイトURLの形式が正しくありません"), z.literal("")]).optional(),
  description: z.string().max(2000).optional(),
});

export async function completeCompanyOnboarding(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  if (user.engineerProfile || user.companyMember) redirect("/");

  const parsed = companySchema.safeParse({
    companyName: formData.get("companyName"),
    industry: formData.get("industry") || undefined,
    location: formData.get("location") || undefined,
    website: formData.get("website") || undefined,
    description: formData.get("description") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "入力内容に誤りがあります" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: user.id }, data: { role: "COMPANY" } });
    const company = await tx.company.create({
      data: {
        name: parsed.data.companyName,
        industry: parsed.data.industry,
        location: parsed.data.location,
        website: parsed.data.website || null,
        description: parsed.data.description,
      },
    });
    await tx.companyMember.create({
      data: { userId: user.id, companyId: company.id },
    });
  });

  redirect("/company");
}
