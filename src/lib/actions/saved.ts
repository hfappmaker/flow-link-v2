"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireEngineer } from "@/lib/session";

export async function toggleSaveProject(formData: FormData) {
  const { user } = await requireEngineer();
  const projectId = String(formData.get("projectId") ?? "");
  if (!projectId) return;

  const key = { userId_projectId: { userId: user.id, projectId } };
  const existing = await prisma.savedProject.findUnique({ where: key });

  if (existing) {
    await prisma.savedProject.delete({ where: key });
  } else {
    await prisma.savedProject.create({ data: { userId: user.id, projectId } });
  }

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");
  revalidatePath("/saved");
}
