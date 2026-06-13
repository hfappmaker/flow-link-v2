"use server";

import { randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { RemoteType, WorkStatus, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireCompany, requireEngineer } from "@/lib/session";
import type { ActionState } from "@/lib/actions/onboarding";
import { PREFECTURES } from "@/lib/constants";
import { getProfileDocumentsRoot } from "@/lib/profile-documents";

const emptyToUndefined = (v: FormDataEntryValue | null) =>
  v === null || v === "" ? undefined : v;

const MAX_PROFILE_DOCUMENT_BYTES = 5 * 1024 * 1024;
const PROFILE_DOCUMENT_EXTENSIONS = new Map([
  [".pdf", "application/pdf"],
  [".doc", "application/msword"],
  [".docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  [".xls", "application/vnd.ms-excel"],
  [".xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
]);

type SavedProfileDocument = {
  fileName: string;
  filePath: string;
  uploadedAt: Date;
};

function isUploadedFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0;
}

function sanitizeFileName(fileName: string) {
  const baseName = path.basename(fileName).trim() || "document";
  return baseName.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_").slice(0, 120);
}

async function saveProfileDocument(
  profileId: string,
  kind: "resume" | "work-history",
  value: FormDataEntryValue | null,
): Promise<SavedProfileDocument | { error: string } | null> {
  if (!isUploadedFile(value)) return null;

  if (value.size > MAX_PROFILE_DOCUMENT_BYTES) {
    return { error: "アップロードできるファイルサイズは5MBまでです" };
  }

  const originalName = sanitizeFileName(value.name);
  const ext = path.extname(originalName).toLowerCase();
  const expectedType = PROFILE_DOCUMENT_EXTENSIONS.get(ext);
  if (!expectedType) {
    return { error: "アップロードできるファイル形式はPDF、DOC、DOCX、XLS、XLSXです" };
  }
  if (value.type && value.type !== expectedType && value.type !== "application/octet-stream") {
    return { error: "ファイル形式と拡張子が一致していません" };
  }

  const uploadDir = path.join(getProfileDocumentsRoot(), profileId);
  await mkdir(uploadDir, { recursive: true });
  const filePath = path.join(uploadDir, `${kind}-${Date.now()}-${randomUUID()}${ext}`);
  await writeFile(filePath, Buffer.from(await value.arrayBuffer()));

  return {
    fileName: originalName,
    filePath,
    uploadedAt: new Date(),
  };
}

async function removeStoredFile(filePath: string | null | undefined) {
  if (!filePath) return;
  await rm(filePath, { force: true });
}

function parseCustomSkillNames(value: string | undefined) {
  if (!value) return { names: [] as string[] };

  const names = [
    ...new Set(
      value
        .split(/[\n,、]/)
        .map((name) => name.trim().replace(/\s+/g, " "))
        .filter(Boolean),
    ),
  ];

  const tooLong = names.find((name) => name.length > 50);
  if (tooLong) {
    return { names: [] as string[], error: `スキル名は50文字以内で入力してください: ${tooLong}` };
  }
  if (names.length > 20) {
    return { names: [] as string[], error: "追加できるスキルは一度に20個までです" };
  }

  return { names };
}

const engineerProfileSchema = z.object({
  displayName: z.string().min(1, "表示名を入力してください").max(50),
  title: z.string().min(1, "職種を選択してください"),
  bio: z.string().max(4000).optional(),
  location: z.enum(PREFECTURES).optional(),
  yearsOfExperience: z.coerce.number().int().min(0).max(60).optional(),
  desiredRateMin: z.coerce.number().int().min(0).optional(),
  desiredRateMax: z.coerce.number().int().min(0).optional(),
  desiredWeeklyDays: z.coerce.number().int().min(1).max(5).optional(),
  remotePreference: z.enum(RemoteType).optional(),
  workStatus: z.enum(WorkStatus),
  githubUrl: z.union([z.url(), z.literal("")]).optional(),
  portfolioUrl: z.union([z.url(), z.literal("")]).optional(),
  customSkills: z.string().max(1000).optional(),
});

export async function updateEngineerProfile(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { profile } = await requireEngineer();

  const parsed = engineerProfileSchema.safeParse({
    displayName: formData.get("displayName"),
    title: formData.get("title"),
    bio: emptyToUndefined(formData.get("bio")),
    location: emptyToUndefined(formData.get("location")),
    yearsOfExperience: emptyToUndefined(formData.get("yearsOfExperience")),
    desiredRateMin: emptyToUndefined(formData.get("desiredRateMin")),
    desiredRateMax: emptyToUndefined(formData.get("desiredRateMax")),
    desiredWeeklyDays: emptyToUndefined(formData.get("desiredWeeklyDays")),
    remotePreference: emptyToUndefined(formData.get("remotePreference")),
    workStatus: formData.get("workStatus"),
    githubUrl: emptyToUndefined(formData.get("githubUrl")) ?? "",
    portfolioUrl: emptyToUndefined(formData.get("portfolioUrl")) ?? "",
    customSkills: emptyToUndefined(formData.get("customSkills")),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "入力内容に誤りがあります" };
  }

  const customSkills = parseCustomSkillNames(parsed.data.customSkills);
  if (customSkills.error) return { error: customSkills.error };

  const resumeDocument = await saveProfileDocument(profile.id, "resume", formData.get("resumeFile"));
  if (resumeDocument && "error" in resumeDocument) return { error: resumeDocument.error };
  const workHistoryDocument = await saveProfileDocument(profile.id, "work-history", formData.get("workHistoryFile"));
  if (workHistoryDocument && "error" in workHistoryDocument) {
    await removeStoredFile(resumeDocument?.filePath);
    return { error: workHistoryDocument.error };
  }

  const removeResumeFile = formData.get("removeResumeFile") === "on";
  const removeWorkHistoryFile = formData.get("removeWorkHistoryFile") === "on";
  const documentData: Prisma.EngineerProfileUpdateInput = {};

  if (resumeDocument) {
    documentData.resumeFileName = resumeDocument.fileName;
    documentData.resumeFilePath = resumeDocument.filePath;
    documentData.resumeUploadedAt = resumeDocument.uploadedAt;
  } else if (removeResumeFile) {
    documentData.resumeFileName = null;
    documentData.resumeFilePath = null;
    documentData.resumeUploadedAt = null;
  }

  if (workHistoryDocument) {
    documentData.workHistoryFileName = workHistoryDocument.fileName;
    documentData.workHistoryFilePath = workHistoryDocument.filePath;
    documentData.workHistoryUploadedAt = workHistoryDocument.uploadedAt;
  } else if (removeWorkHistoryFile) {
    documentData.workHistoryFileName = null;
    documentData.workHistoryFilePath = null;
    documentData.workHistoryUploadedAt = null;
  }

  const selectedSkillIds = [...new Set(formData.getAll("skills").map(String).filter(Boolean))];

  try {
    await prisma.$transaction(async (tx) => {
      const customSkillIds = await Promise.all(
        customSkills.names.map((name) =>
          tx.skill.upsert({
            where: { name },
            update: {},
            create: { name, category: "OTHER" },
            select: { id: true },
          }),
        ),
      );
      const skillIds = [...new Set([...selectedSkillIds, ...customSkillIds.map((skill) => skill.id)])];

      await tx.engineerProfile.update({
        where: { id: profile.id },
        data: {
          displayName: parsed.data.displayName,
          title: parsed.data.title,
          bio: parsed.data.bio ?? null,
          location: parsed.data.location ?? null,
          yearsOfExperience: parsed.data.yearsOfExperience ?? null,
          desiredRateMin: parsed.data.desiredRateMin ?? null,
          desiredRateMax: parsed.data.desiredRateMax ?? null,
          desiredWeeklyDays: parsed.data.desiredWeeklyDays ?? null,
          remotePreference: parsed.data.remotePreference ?? null,
          workStatus: parsed.data.workStatus,
          githubUrl: parsed.data.githubUrl || null,
          portfolioUrl: parsed.data.portfolioUrl || null,
          isPublic: formData.get("isPublic") === "on",
          ...documentData,
        },
      });
      await tx.engineerSkill.deleteMany({ where: { engineerProfileId: profile.id } });
      if (skillIds.length > 0) {
        await tx.engineerSkill.createMany({
          data: skillIds.map((skillId) => ({ engineerProfileId: profile.id, skillId })),
        });
      }
    });
  } catch (error) {
    await Promise.all([
      removeStoredFile(resumeDocument?.filePath),
      removeStoredFile(workHistoryDocument?.filePath),
    ]);
    throw error;
  }

  await Promise.all([
    resumeDocument || removeResumeFile ? removeStoredFile(profile.resumeFilePath) : Promise.resolve(),
    workHistoryDocument || removeWorkHistoryFile
      ? removeStoredFile(profile.workHistoryFilePath)
      : Promise.resolve(),
  ]);

  revalidatePath("/settings/profile");
  revalidatePath("/company/engineers");
  return { success: true };
}

const companyProfileSchema = z.object({
  name: z.string().min(1, "会社名を入力してください").max(100),
  industry: z.string().max(100).optional(),
  location: z.string().max(100).optional(),
  website: z.union([z.url("WebサイトURLの形式が正しくありません"), z.literal("")]).optional(),
  description: z.string().max(4000).optional(),
});

export async function updateCompanyProfile(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { company } = await requireCompany();

  const parsed = companyProfileSchema.safeParse({
    name: formData.get("name"),
    industry: emptyToUndefined(formData.get("industry")),
    location: emptyToUndefined(formData.get("location")),
    website: emptyToUndefined(formData.get("website")) ?? "",
    description: emptyToUndefined(formData.get("description")),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "入力内容に誤りがあります" };
  }

  await prisma.company.update({
    where: { id: company.id },
    data: {
      name: parsed.data.name,
      industry: parsed.data.industry ?? null,
      location: parsed.data.location ?? null,
      website: parsed.data.website || null,
      description: parsed.data.description ?? null,
    },
  });

  revalidatePath("/company/settings");
  return { success: true };
}
