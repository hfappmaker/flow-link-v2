import Link from "next/link";
import { cn } from "@/lib/utils";

export function Pagination({
  page,
  totalPages,
  buildHref,
}: {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  const pages: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  for (let p = start; p <= end; p++) pages.push(p);

  const item = "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-3 text-sm";

  return (
    <nav className="mt-8 flex items-center justify-center gap-2" aria-label="ページネーション">
      {page > 1 ? (
        <Link href={buildHref(page - 1)} className={cn(item, "border-slate-300 bg-white text-slate-600 hover:bg-slate-50")}>
          前へ
        </Link>
      ) : null}
      {pages.map((p) => (
        <Link
          key={p}
          href={buildHref(p)}
          className={cn(
            item,
            p === page
              ? "border-blue-600 bg-blue-600 font-bold text-white"
              : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50",
          )}
        >
          {p}
        </Link>
      ))}
      {page < totalPages ? (
        <Link href={buildHref(page + 1)} className={cn(item, "border-slate-300 bg-white text-slate-600 hover:bg-slate-50")}>
          次へ
        </Link>
      ) : null}
    </nav>
  );
}
