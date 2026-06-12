import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type Tone = "blue" | "gray" | "green" | "red" | "amber" | "outline";

const toneClasses: Record<Tone, string> = {
  blue: "bg-blue-50 text-blue-700 border border-blue-200",
  gray: "bg-slate-100 text-slate-600 border border-slate-200",
  green: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  red: "bg-red-50 text-red-600 border border-red-200",
  amber: "bg-amber-50 text-amber-700 border border-amber-200",
  outline: "bg-white text-slate-600 border border-slate-300",
};

export function Badge({
  tone = "gray",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
