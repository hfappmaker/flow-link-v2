import { redirect } from "next/navigation";
import { consumeAuthToken } from "@/lib/auth-tokens";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  if (!token) redirect("/login?verified=invalid");

  const email = await consumeAuthToken("email-verification", token);
  if (!email) redirect("/login?verified=invalid");

  await prisma.user.update({
    where: { email },
    data: { emailVerified: new Date() },
  });

  redirect("/login?verified=1");
}
