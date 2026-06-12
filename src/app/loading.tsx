import { Skeleton } from "@/components/ui/skeleton";

function StatSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4 rounded" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="mt-3 h-8 w-14" />
    </div>
  );
}

function ProjectCardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Skeleton className="h-5 w-12 rounded-full" />
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <Skeleton className="mt-4 h-5 w-4/5" />
      <Skeleton className="mt-2 h-5 w-2/3" />
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      <Skeleton className="mt-4 h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-3/4" />
      <Skeleton className="mt-5 h-9 w-36 rounded-lg" />
    </div>
  );
}

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6" aria-live="polite" aria-busy="true">
      <span className="sr-only">読み込み中</span>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 flex-1">
          <Skeleton className="h-8 w-48 max-w-full" />
          <Skeleton className="mt-3 h-4 w-80 max-w-full" />
        </div>
        <Skeleton className="h-10 w-36 rounded-lg" />
      </div>

      <div className="mt-7 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <StatSkeleton key={index} />
        ))}
      </div>

      <div className="mt-8 flex flex-col gap-8 lg:flex-row">
        <aside className="w-full shrink-0 lg:w-72">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <Skeleton className="h-5 w-28" />
            <div className="mt-5 space-y-4">
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-7 w-16 rounded-full" />
                <Skeleton className="h-7 w-20 rounded-full" />
                <Skeleton className="h-7 w-14 rounded-full" />
              </div>
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-10 w-52 rounded-lg" />
          </div>
          <div className="mt-4 space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <ProjectCardSkeleton key={index} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
