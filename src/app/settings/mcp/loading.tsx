import type { ReactNode } from "react";
import { Bot, Clock3, KeyRound, ShieldCheck } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function McpSettingsLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-200">
            <Bot className="h-4 w-4" />
            MCP
          </div>
          <Skeleton className="mt-3 h-8 w-40 max-w-full" />
          <div className="mt-3 max-w-2xl space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </div>
        <Skeleton className="h-8 w-32 rounded-lg" />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <SummarySkeleton icon={<ShieldCheck className="h-5 w-5" />} />
        <SummarySkeleton icon={<KeyRound className="h-5 w-5" />} />
        <SummarySkeleton icon={<Clock3 className="h-5 w-5" />} />
      </div>

      <section className="mt-6 space-y-4">
        {[0, 1].map((item) => (
          <ConnectionCardSkeleton key={item} dense={item === 1} />
        ))}
      </section>
    </div>
  );
}

function SummarySkeleton({ icon }: { icon: ReactNode }) {
  return (
    <Card>
      <CardBody className="flex items-center gap-4 p-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-200">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-3 h-7 w-14" />
        </div>
      </CardBody>
    </Card>
  );
}

function ConnectionCardSkeleton({ dense = false }: { dense?: boolean }) {
  return (
    <Card>
      <CardHeader
        className="items-start gap-4"
        title={
          <div className="min-w-0 flex-1">
            <Skeleton className="h-5 w-44 max-w-full" />
            <Skeleton className="mt-2 h-3 w-72 max-w-full" />
          </div>
        }
        action={<Skeleton className="h-8 w-20 rounded-lg" />}
      />
      <CardBody className="p-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <InfoBlockSkeleton />
          <InfoBlockSkeleton />
          <InfoBlockSkeleton />
        </div>

        <div className="mt-5">
          <Skeleton className="h-3 w-24" />
          <div className="mt-3 flex flex-wrap gap-2">
            <Skeleton className="h-7 w-36 rounded-md" />
            <Skeleton className="h-7 w-44 rounded-md" />
            <Skeleton className="h-7 w-28 rounded-md" />
            {!dense ? <Skeleton className="h-7 w-32 rounded-md" /> : null}
          </div>
          <div className="mt-4 space-y-2">
            <Skeleton className="h-3 w-80 max-w-full" />
            <Skeleton className="h-3 w-96 max-w-full" />
            {!dense ? <Skeleton className="h-3 w-72 max-w-full" /> : null}
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <InfoBlockSkeleton lines={2} />
          <InfoBlockSkeleton lines={2} />
        </div>
      </CardBody>
    </Card>
  );
}

function InfoBlockSkeleton({ lines = 1 }: { lines?: 1 | 2 }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-4 w-36 max-w-full" />
      {lines === 2 ? <Skeleton className="mt-2 h-3 w-28 max-w-full" /> : null}
    </div>
  );
}
