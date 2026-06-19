import { Skeleton } from "@/components/ui/skeleton";
import type { ReactNode } from "react";

export function PageHeaderSkeleton({ action = false }: { action?: boolean }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0 flex-1">
        <Skeleton className="h-8 w-48 max-w-full" />
        <Skeleton className="mt-3 h-4 w-80 max-w-full" />
      </div>
      {action ? <Skeleton className="h-10 w-36 rounded-lg" /> : null}
    </div>
  );
}

export function StatGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="mt-3 h-8 w-14" />
        </div>
      ))}
    </div>
  );
}

export function SearchFilterSkeleton() {
  return (
    <aside className="w-full shrink-0 lg:w-72">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-20">
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
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </div>
    </aside>
  );
}

export function ProjectCardSkeleton() {
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

export function ProjectListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <ProjectCardSkeleton key={index} />
      ))}
    </div>
  );
}

function ProjectDetailInfoCardSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <Skeleton className="h-5 w-40" />
      <div className="mt-5 space-y-4">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="grid grid-cols-1 gap-2 border-b border-slate-100 pb-4 last:border-b-0 last:pb-0 sm:grid-cols-[10rem_1fr] sm:gap-4">
            <Skeleton className="h-4 w-24" />
            <div className="min-w-0">
              <Skeleton className="h-4 w-full" />
              {index === 1 || index === 2 ? <Skeleton className="mt-2 h-4 w-2/3" /> : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProjectDetailSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading</span>
      <div className="flex items-center gap-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-2 rounded-full" />
        <Skeleton className="h-3 w-24" />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Skeleton className="h-5 w-12 rounded-full" />
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <Skeleton className="mt-3 h-8 w-[42rem] max-w-full" />
      <Skeleton className="mt-3 h-4 w-[46rem] max-w-full" />
      <Skeleton className="mt-2 h-4 w-[34rem] max-w-full" />

      <div className="mt-6 flex flex-col gap-8 lg:flex-row">
        <div className="min-w-0 flex-1 space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <Skeleton className="h-5 w-48" />
            <div className="mt-5 space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Skeleton className="mt-0.5 h-4 w-4 shrink-0 rounded-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          </div>

          <ProjectDetailInfoCardSkeleton rows={8} />

          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <Skeleton className="h-5 w-36" />
              <div className="mt-5 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-11/12" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            </div>
          ))}

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <Skeleton className="h-5 w-28" />
            <div className="mt-5 flex items-start gap-3">
              <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="mt-2 h-3 w-56 max-w-full" />
                <Skeleton className="mt-4 h-4 w-full" />
                <Skeleton className="mt-2 h-4 w-3/4" />
              </div>
            </div>
          </div>
        </div>

        <aside className="w-full shrink-0 lg:w-72">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-20">
            <Skeleton className="mx-auto h-3 w-28" />
            <Skeleton className="mx-auto mt-4 h-7 w-36" />
            <Skeleton className="mt-5 h-12 w-full rounded-lg" />
            <Skeleton className="mt-3 h-10 w-full rounded-lg" />
            <Skeleton className="mx-auto mt-4 h-3 w-44 max-w-full" />
          </div>
        </aside>
      </div>
    </div>
  );
}

export function EngineerCardSkeleton() {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <Skeleton className="h-14 w-14 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="mt-2 h-3 w-4/5" />
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
          <Skeleton className="mt-3 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-2/3" />
          <Skeleton className="mt-4 h-8 w-40 rounded-lg" />
        </div>
      </div>
    </article>
  );
}

export function EngineerListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <EngineerCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading</span>
      <PageHeaderSkeleton />
      <div className="mt-6">
        <StatGridSkeleton />
      </div>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <section>
          <div className="flex items-center justify-between">
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="mt-4">
            <ProjectListSkeleton count={3} />
          </div>
        </section>
        <aside className="space-y-6">
          <PanelSkeleton rows={3} />
          <PanelSkeleton rows={4} />
        </aside>
      </div>
    </div>
  );
}

export function HomePageSkeleton() {
  return (
    <div aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading</span>
      <section className="border-b border-slate-200 bg-gradient-to-b from-blue-50 via-white to-white">
        <div className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6">
          <Skeleton className="mx-auto h-8 w-80 max-w-full rounded-full" />
          <Skeleton className="mx-auto mt-6 h-11 w-[42rem] max-w-full" />
          <Skeleton className="mx-auto mt-3 h-11 w-[34rem] max-w-full" />
          <div className="mx-auto mt-5 max-w-xl space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="mx-auto h-4 w-5/6" />
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Skeleton className="h-12 w-36 rounded-lg" />
            <Skeleton className="h-12 w-44 rounded-lg" />
          </div>
          <div className="mx-auto mt-12 grid max-w-2xl grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <Skeleton className="mx-auto h-9 w-16" />
                <Skeleton className="mx-auto mt-2 h-3 w-20 max-w-full" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-blue-50/70">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-10 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <Skeleton className="h-8 w-[34rem] max-w-full" />
            <Skeleton className="mt-3 h-4 w-[40rem] max-w-full" />
            <Skeleton className="mt-2 h-4 w-96 max-w-full" />
          </div>
          <Skeleton className="h-11 w-40 rounded-lg" />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-36" />
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <ProjectCardSkeleton key={index} />
          ))}
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <Skeleton className="mx-auto h-8 w-44" />
          <div className="mt-10 grid gap-10 lg:grid-cols-2">
            {Array.from({ length: 2 }).map((_, columnIndex) => (
              <div key={columnIndex}>
                <Skeleton className="h-5 w-52" />
                <div className="mt-4 space-y-4">
                  {Array.from({ length: 3 }).map((_, rowIndex) => (
                    <div key={rowIndex} className="flex gap-4 rounded-xl border border-slate-200 p-5">
                      <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
                      <div className="min-w-0 flex-1">
                        <Skeleton className="h-4 w-36" />
                        <Skeleton className="mt-2 h-4 w-full" />
                        <Skeleton className="mt-2 h-4 w-2/3" />
                      </div>
                    </div>
                  ))}
                </div>
                <Skeleton className="mt-5 h-10 w-48 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export function SearchPageSkeleton({ kind }: { kind: "project" | "engineer" }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading</span>
      <PageHeaderSkeleton />
      <div className="mt-6 flex flex-col gap-8 lg:flex-row">
        <SearchFilterSkeleton />
        <section className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Skeleton className="h-7 w-32" />
            {kind === "project" ? <Skeleton className="h-10 w-52 rounded-lg" /> : null}
          </div>
          <div className="mt-4">
            {kind === "project" ? <ProjectListSkeleton /> : <EngineerListSkeleton />}
          </div>
        </section>
      </div>
    </div>
  );
}

export function MessageListSkeleton() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading</span>
      <PageHeaderSkeleton />
      <div className="mt-6 space-y-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm">
            <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
              <Skeleton className="mt-2 h-3 w-4/5" />
              <Skeleton className="mt-2 h-3 w-2/3" />
            </div>
            <div className="flex flex-col items-end gap-2">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-5 w-5 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReceivedScoutCardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="mt-3 h-5 w-3/5" />
      <Skeleton className="mt-2 h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-4/5" />
      <Skeleton className="mt-3 h-10 w-full rounded-lg" />
      <Skeleton className="mt-4 h-8 w-28 rounded-lg" />
    </div>
  );
}

function SentScoutCardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="ml-auto h-3 w-20" />
          </div>
          <Skeleton className="mt-3 h-4 w-1/2" />
          <Skeleton className="mt-2 h-3 w-2/3" />
          <div className="mt-4 flex flex-wrap gap-2">
            <Skeleton className="h-8 w-28 rounded-lg" />
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ScoutListSkeleton({ variant = "received" }: { variant?: "received" | "sent" }) {
  const action = variant === "sent";
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading</span>
      <PageHeaderSkeleton action={action} />
      <div className="mt-6 space-y-3">
        {Array.from({ length: 4 }).map((_, index) =>
          variant === "sent" ? (
            <SentScoutCardSkeleton key={index} />
          ) : (
            <ReceivedScoutCardSkeleton key={index} />
          ),
        )}
      </div>
    </div>
  );
}

export function ConversationSkeleton() {
  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-3xl flex-col px-4 sm:px-6" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading</span>
      <div className="flex items-center gap-3 border-b border-slate-200 py-3">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="min-w-0 flex-1">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="mt-2 h-3 w-56 max-w-full" />
        </div>
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="flex-1 space-y-4 overflow-hidden px-4 py-5">
        <ChatBubbleSkeleton align="start" />
        <ChatBubbleSkeleton align="end" short />
        <ChatBubbleSkeleton align="start" withAttachment />
        <ChatBubbleSkeleton align="end" />
      </div>
      <div className="border-t border-slate-200 bg-white p-3">
        <div className="flex items-end gap-2">
          <Skeleton className="h-16 flex-1 rounded-lg" />
          <Skeleton className="h-10 w-20 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

function ChatBubbleSkeleton({
  align,
  short = false,
  withAttachment = false,
}: {
  align: "start" | "end";
  short?: boolean;
  withAttachment?: boolean;
}) {
  return (
    <div className={align === "end" ? "flex flex-col items-end gap-1" : "flex flex-col items-start gap-1"}>
      <Skeleton className="h-3 w-24" />
      <div className="w-[75%] max-w-md rounded-2xl border border-slate-200 bg-white px-4 py-3">
        <Skeleton className={short ? "h-4 w-2/3" : "h-4 w-full"} />
        {!short ? <Skeleton className="mt-2 h-4 w-4/5" /> : null}
        {withAttachment ? <Skeleton className="mt-3 h-10 w-full rounded-lg" /> : null}
      </div>
    </div>
  );
}

export function FormPageSkeleton({ columns = 2 }: { columns?: 1 | 2 }) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading</span>
      <PageHeaderSkeleton />
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className={columns === 2 ? "grid gap-4 sm:grid-cols-2" : "space-y-4"}>
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index}>
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-2 h-10 w-full rounded-lg" />
            </div>
          ))}
        </div>
        <Skeleton className="mt-5 h-24 w-full rounded-lg" />
        <div className="mt-5 flex justify-end">
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

function FormSectionSkeleton({
  titleWidth = "w-28",
  children,
}: {
  titleWidth?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="border-b border-slate-200 pb-2">
        <Skeleton className={`h-5 ${titleWidth}`} />
      </div>
      {children}
    </section>
  );
}

function FieldSkeleton({ wide = false }: { wide?: boolean }) {
  return (
    <div>
      <Skeleton className="h-3 w-24" />
      <Skeleton className={wide ? "mt-2 h-11 w-full rounded-lg" : "mt-2 h-10 w-full rounded-lg"} />
    </div>
  );
}

function ChipRowSkeleton({ count = 8 }: { count?: number }) {
  const widths = ["w-20", "w-24", "w-16", "w-28", "w-20", "w-24", "w-20", "w-16"];
  return (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={index} className={`h-8 rounded-full ${widths[index % widths.length]}`} />
      ))}
    </div>
  );
}

export function EngineerProfileSettingsSkeleton() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading</span>
      <Skeleton className="h-8 w-56 max-w-full" />
      <Skeleton className="mt-3 h-4 w-[34rem] max-w-full" />

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-8">
          <FormSectionSkeleton>
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldSkeleton />
              <div>
                <Skeleton className="h-3 w-20" />
                <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50/60 px-2 py-2">
                  <div className="flex flex-wrap gap-2">
                    <Skeleton className="h-7 w-24 rounded-full" />
                    <Skeleton className="h-7 w-28 rounded-full" />
                    <Skeleton className="h-7 w-20 rounded-full" />
                  </div>
                </div>
              </div>
              <FieldSkeleton />
              <FieldSkeleton />
            </div>
            <div>
              <Skeleton className="h-3 w-36" />
              <Skeleton className="mt-2 h-32 w-full rounded-lg" />
              <Skeleton className="mt-2 h-3 w-[30rem] max-w-full" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldSkeleton />
              <FieldSkeleton />
            </div>
            <Skeleton className="h-12 w-full rounded-lg bg-amber-100/80" />
          </FormSectionSkeleton>

          <FormSectionSkeleton titleWidth="w-16">
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index}>
                  <Skeleton className="mb-2 h-3 w-24" />
                  <ChipRowSkeleton count={index === 1 ? 7 : 5} />
                </div>
              ))}
            </div>
            <div>
              <Skeleton className="h-3 w-24" />
              <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50/60 px-2 py-2">
                <ChipRowSkeleton count={3} />
              </div>
            </div>
          </FormSectionSkeleton>

          <FormSectionSkeleton titleWidth="w-24">
            <div className="rounded-lg border border-dashed border-slate-200 px-3 py-4">
              <Skeleton className="h-4 w-64 max-w-full" />
              <Skeleton className="mt-2 h-3 w-80 max-w-full" />
            </div>
          </FormSectionSkeleton>

          <FormSectionSkeleton>
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldSkeleton />
              <FieldSkeleton />
              <div>
                <Skeleton className="mb-2 h-3 w-24" />
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className="h-10 rounded-lg" />
                  ))}
                </div>
              </div>
              <FieldSkeleton />
              <FieldSkeleton />
            </div>
          </FormSectionSkeleton>

          {Array.from({ length: 2 }).map((_, index) => (
            <FormSectionSkeleton key={index} titleWidth={index === 0 ? "w-20" : "w-24"}>
              <div className="flex items-start gap-3">
                <Skeleton className="mt-0.5 h-4 w-4 shrink-0 rounded" />
                <div className="min-w-0 flex-1">
                  <Skeleton className="h-4 w-72 max-w-full" />
                  <Skeleton className="mt-2 h-3 w-[30rem] max-w-full" />
                </div>
              </div>
            </FormSectionSkeleton>
          ))}

          <Skeleton className="h-11 w-44 rounded-lg" />
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-red-200 bg-white p-6 shadow-sm">
        <Skeleton className="h-5 w-16 bg-red-100" />
        <div className="mt-4 rounded-lg border border-red-100 bg-red-50/50 p-4">
          <Skeleton className="h-4 w-80 max-w-full bg-red-100" />
          <Skeleton className="mt-3 h-10 w-36 rounded-lg bg-red-100" />
        </div>
      </div>
    </div>
  );
}

export function PanelSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <Skeleton className="h-5 w-36" />
      <div className="mt-4 space-y-3">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1">
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="mt-2 h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ListPageSkeleton({ variant = "panel" }: { variant?: "panel" | "project" }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading</span>
      <PageHeaderSkeleton action={variant === "panel"} />
      <div className="mt-6">
        {variant === "project" ? (
          <ProjectListSkeleton count={4} />
        ) : (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Skeleton className="h-5 w-48 max-w-full" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                    <Skeleton className="mt-3 h-4 w-4/5" />
                    <Skeleton className="mt-2 h-4 w-2/3" />
                  </div>
                  <Skeleton className="h-9 w-28 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
