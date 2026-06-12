import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";

/** ログイン直後の振り分け先。プロフィール状態に応じて適切なページへ転送する。 */
export default async function PostLoginPage() {
  const user = await requireUser();

  if (user.companyMember) redirect("/company");
  if (user.engineerProfile) redirect("/dashboard");
  redirect("/onboarding");
}
