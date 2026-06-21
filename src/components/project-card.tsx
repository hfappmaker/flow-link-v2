import Link from "next/link";
import { Building2, CalendarDays, MapPin } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { REMOTE_TYPE_LABELS } from "@/lib/constants";
import {
  formatDate,
  formatProjectLocation,
  formatRateRange,
  formatWeeklyDays,
  isNew,
} from "@/lib/format";

export type ProjectCardData = Prisma.ProjectGetPayload<{
  include: {
    company: { select: { name: true } };
    skills: { include: { skill: true } };
  };
}>;

export type ProjectSkillHighlight = {
  skillIds?: string[];
  skillTexts?: string[];
};

function includesText(name: string, texts: string[] | undefined) {
  if (!texts || texts.length === 0) return false;
  const normalizedName = name.toLowerCase();
  return texts.some((text) => normalizedName.includes(text.toLowerCase()));
}

function isProjectSkillMatched(
  skill: ProjectCardData["skills"][number]["skill"],
  highlight?: ProjectSkillHighlight,
) {
  if (!highlight) return false;
  if (highlight.skillIds?.includes(skill.id)) return true;
  return includesText(skill.name, highlight.skillTexts);
}

export function ProjectCard({
  project,
  skillHighlight,
}: {
  project: ProjectCardData;
  skillHighlight?: ProjectSkillHighlight;
}) {
  const locationLabel = formatProjectLocation(project.location, project.prefecture);

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
        {project.isSample ? <Badge tone="amber">サンプル案件</Badge> : null}
        {project.publishedAt && isNew(project.publishedAt) ? <Badge tone="red">NEW</Badge> : null}
        {project.publishedAt ? <span>{formatDate(project.publishedAt)} 掲載</span> : null}
        <Badge tone="outline">{project.jobCategory}</Badge>
        {project.status === "CLOSED" ? <Badge tone="gray">募集終了</Badge> : null}
      </div>

      <h3 className="mt-2 text-base leading-snug font-bold text-slate-900">
        <Link href={`/projects/${project.id}`} className="hover:text-blue-700">
          {project.title}
        </Link>
      </h3>

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm">
        <span className="text-lg font-black text-blue-700">
          {formatRateRange(project.rateMin, project.rateMax)}
        </span>
        <span className="inline-flex items-center gap-1 text-slate-600">
          <CalendarDays className="h-4 w-4 text-slate-400" />
          {formatWeeklyDays(project.weeklyDaysMin, project.weeklyDaysMax)}
        </span>
        <Badge tone="blue">{REMOTE_TYPE_LABELS[project.remoteType]}</Badge>
        {locationLabel ? (
          <span className="inline-flex items-center gap-1 text-slate-600">
            <MapPin className="h-4 w-4 text-slate-400" />
            {locationLabel}
          </span>
        ) : null}
        <span className="inline-flex items-center gap-1 text-slate-500">
          <Building2 className="h-4 w-4 text-slate-400" />
          {project.company.name}
        </span>
      </div>

      {project.skills.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {project.skills.map(({ skill }) => (
            <Badge key={skill.id} tone={isProjectSkillMatched(skill, skillHighlight) ? "blue" : "gray"}>
              {skill.name}
            </Badge>
          ))}
        </div>
      ) : null}

      {project.summary ? (
        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-600">{project.summary}</p>
      ) : null}

      {project.isSample ? (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">
          この案件はマッチング体験用のサンプルです。実際の募集案件ではありません。
        </p>
      ) : null}

      {project.features.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {project.features.map((f) => (
            <span key={f} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-500">
              {f}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-4">
        <Link
          href={`/projects/${project.id}`}
          className="inline-flex h-9 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        >
          案件の詳細を見る
        </Link>
      </div>
    </article>
  );
}
