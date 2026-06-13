import Link from "next/link";
import { Bookmark } from "lucide-react";
import { toggleSaveProject } from "@/lib/actions/saved";
import { cn } from "@/lib/utils";

export function SaveButton({
  projectId,
  saved,
  isEngineer,
  isLoggedIn,
}: {
  projectId: string;
  saved: boolean;
  isEngineer: boolean;
  isLoggedIn: boolean;
}) {
  const className = cn(
    "flex h-11 w-full items-center justify-center gap-2 rounded-lg border text-sm font-semibold transition-colors",
    saved
      ? "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
      : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50",
  );

  if (!isEngineer) {
    if (isLoggedIn) {
      return (
        <p className="rounded-lg bg-slate-100 px-3 py-2 text-center text-sm font-semibold text-slate-500">
          保存はエンジニアアカウントで利用できます
        </p>
      );
    }

    return (
      <Link href="/login" className={className}>
        <Bookmark className="h-4 w-4" />
        保存する
      </Link>
    );
  }

  return (
    <form action={toggleSaveProject}>
      <input type="hidden" name="projectId" value={projectId} />
      <button type="submit" className={className}>
        <Bookmark className={cn("h-4 w-4", saved && "fill-blue-600 text-blue-600")} />
        {saved ? "保存済み" : "保存する"}
      </button>
    </form>
  );
}
