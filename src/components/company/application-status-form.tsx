"use client";

import { useFormStatus } from "react-dom";
import type { ApplicationStatus } from "@prisma/client";
import { buttonClasses } from "@/components/ui/button";
import { APPLICATION_STATUS_LABELS } from "@/lib/constants";

function StatusFields({ status }: { status: ApplicationStatus }) {
  const { pending } = useFormStatus();

  return (
    <>
      <select
        name="status"
        defaultValue={status}
        disabled={pending}
        className="h-8 rounded-lg border border-slate-300 bg-white px-2 text-xs text-slate-700 focus:border-blue-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400"
      >
        {Object.entries(APPLICATION_STATUS_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <button type="submit" className={buttonClasses("secondary", "sm")} disabled={pending}>
        {pending ? "更新中..." : "ステータス更新"}
      </button>
    </>
  );
}

export function ApplicationStatusForm({
  action,
  applicationId,
  status,
}: {
  action: (formData: FormData) => void | Promise<void>;
  applicationId: string;
  status: ApplicationStatus;
}) {
  return (
    <form action={action} className="ml-auto flex items-center gap-2">
      <input type="hidden" name="applicationId" value={applicationId} />
      <StatusFields status={status} />
    </form>
  );
}
