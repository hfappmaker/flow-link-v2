import type { ApplicationStatus, ScoutStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { APPLICATION_STATUS_LABELS, SCOUT_STATUS_LABELS } from "@/lib/constants";

const applicationTones: Record<ApplicationStatus, "blue" | "gray" | "green" | "amber" | "red"> = {
  APPLIED: "blue",
  SCREENING: "amber",
  INTERVIEW: "amber",
  OFFERED: "green",
  ACCEPTED: "green",
  REJECTED: "gray",
  WITHDRAWN: "gray",
};

export function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  return <Badge tone={applicationTones[status]}>{APPLICATION_STATUS_LABELS[status]}</Badge>;
}

const scoutTones: Record<ScoutStatus, "blue" | "gray" | "green" | "amber" | "red"> = {
  SENT: "amber",
  ACCEPTED: "green",
  DECLINED: "gray",
};

export function ScoutStatusBadge({ status }: { status: ScoutStatus }) {
  return <Badge tone={scoutTones[status]}>{SCOUT_STATUS_LABELS[status]}</Badge>;
}
