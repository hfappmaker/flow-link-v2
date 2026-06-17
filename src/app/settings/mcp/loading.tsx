import { Card, CardBody } from "@/components/ui/card";

export default function McpSettingsLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="h-8 w-48 animate-pulse rounded-md bg-slate-200" />
      <div className="mt-2 h-5 w-96 max-w-full animate-pulse rounded-md bg-slate-200" />
      <div className="mt-6 grid gap-4">
        {[0, 1].map((item) => (
          <Card key={item}>
            <CardBody className="p-6">
              <div className="h-5 w-40 animate-pulse rounded-md bg-slate-200" />
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="h-16 animate-pulse rounded-md bg-slate-100" />
                <div className="h-16 animate-pulse rounded-md bg-slate-100" />
                <div className="h-16 animate-pulse rounded-md bg-slate-100" />
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
