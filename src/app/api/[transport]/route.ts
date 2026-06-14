import { RemoteType } from "@prisma/client";
import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { getAppUrl } from "@/lib/app-url";
import { PREFECTURES, WEEKLY_DAYS_OPTIONS } from "@/lib/constants";
import {
  buildProjectOrderBy,
  buildProjectWhere,
  PAGE_SIZE,
  parseProjectSearch,
} from "@/lib/project-search";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const maxDuration = 60;

const remoteTypeValues = [
  RemoteType.FULL_REMOTE,
  RemoteType.REMOTE_MAIN,
  RemoteType.PARTIAL_REMOTE,
  RemoteType.ONSITE_MAIN,
] as const;

function projectUrl(projectId: string) {
  return new URL(`/projects/${projectId}`, getAppUrl()).toString();
}

function toIsoString(date: Date | null) {
  return date ? date.toISOString() : null;
}

function publicToolError(message = "FlowLink project data is temporarily unavailable.") {
  return {
    isError: true,
    content: [{ type: "text" as const, text: message }],
  };
}

type ProjectListItem = {
  id: string;
  title: string;
  summary: string | null;
  companyName: string;
  rateMin: number | null;
  rateMax: number | null;
  weeklyDaysMin: number;
  weeklyDaysMax: number;
  remoteType: RemoteType;
  prefecture: string | null;
  skills: string[];
  publishedAt: string | null;
  url: string;
};

function toProjectListItem(project: {
  id: string;
  title: string;
  summary: string | null;
  company: { name: string };
  rateMin: number | null;
  rateMax: number | null;
  weeklyDaysMin: number;
  weeklyDaysMax: number;
  remoteType: RemoteType;
  prefecture: string | null;
  publishedAt: Date | null;
  skills: { skill: { name: string } }[];
}): ProjectListItem {
  return {
    id: project.id,
    title: project.title,
    summary: project.summary,
    companyName: project.company.name,
    rateMin: project.rateMin,
    rateMax: project.rateMax,
    weeklyDaysMin: project.weeklyDaysMin,
    weeklyDaysMax: project.weeklyDaysMax,
    remoteType: project.remoteType,
    prefecture: project.prefecture,
    skills: project.skills.map(({ skill }) => skill.name),
    publishedAt: toIsoString(project.publishedAt),
    url: projectUrl(project.id),
  };
}

async function getProjects({
  q,
  jobText,
  skillText,
  prefecture,
  rateMin,
  rateMax,
  days,
  remote,
  features,
  sort,
  page,
}: {
  q?: string;
  jobText?: string[];
  skillText?: string[];
  prefecture?: string[];
  rateMin?: number;
  rateMax?: number;
  days?: number[];
  remote?: RemoteType[];
  features?: string[];
  sort?: "new" | "rate";
  page?: number;
}) {
  const parsed = parseProjectSearch({
    q,
    jobText,
    skillText,
    prefecture,
    rateMin: rateMin ? String(rateMin) : undefined,
    rateMax: rateMax ? String(rateMax) : undefined,
    days: days?.map(String),
    remote,
    features,
    sort,
    page: page ? String(page) : undefined,
  });
  const where = buildProjectWhere(parsed);
  const skip = (parsed.page - 1) * PAGE_SIZE;

  const [total, projects] = await Promise.all([
    prisma.project.count({ where }),
    prisma.project.findMany({
      where,
      orderBy: buildProjectOrderBy(parsed.sort),
      skip,
      take: PAGE_SIZE,
      include: {
        company: { select: { name: true } },
        skills: { include: { skill: { select: { name: true } } } },
      },
    }),
  ]);

  return {
    projects: projects.map(toProjectListItem),
    page: parsed.page,
    pageSize: PAGE_SIZE,
    total,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

const handler = createMcpHandler(
  (server) => {
    const weeklyDaysSchema = z
      .number()
      .int()
      .refine((value) => (WEEKLY_DAYS_OPTIONS as readonly number[]).includes(value), {
        message: "Unsupported weekly day value.",
      });

    server.registerTool(
      "search_projects",
      {
        title: "Search public projects",
        description: "Search FlowLink projects that are currently open to applications.",
        inputSchema: {
          q: z.string().trim().optional(),
          jobText: z.array(z.string().trim().min(1)).optional(),
          skillText: z.array(z.string().trim().min(1)).optional(),
          prefecture: z.array(z.enum(PREFECTURES)).optional(),
          rateMin: z.number().int().positive().optional(),
          rateMax: z.number().int().positive().optional(),
          days: z.array(weeklyDaysSchema).optional(),
          remote: z.array(z.enum(remoteTypeValues)).optional(),
          features: z.array(z.string().trim().min(1)).optional(),
          sort: z.enum(["new", "rate"]).optional(),
          page: z.number().int().positive().optional(),
        },
        annotations: {
          readOnlyHint: true,
          openWorldHint: true,
        },
      },
      async (input) => {
        try {
          const output = await getProjects(input);
          return {
            content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
            structuredContent: output,
          };
        } catch (error) {
          console.error("MCP search_projects failed", error);
          return publicToolError();
        }
      },
    );

    server.registerTool(
      "get_project",
      {
        title: "Get public project",
        description: "Get details for a single open FlowLink project.",
        inputSchema: {
          projectId: z.string().trim().min(1),
        },
        annotations: {
          readOnlyHint: true,
          openWorldHint: true,
        },
      },
      async ({ projectId }) => {
        try {
          const project = await prisma.project.findFirst({
            where: { id: projectId, status: "OPEN" },
            include: {
              company: {
                select: {
                  name: true,
                  description: true,
                  industry: true,
                  website: true,
                  location: true,
                },
              },
              skills: { include: { skill: { select: { name: true } } } },
            },
          });

          if (!project) {
            return publicToolError("Open project not found.");
          }

          const output = {
            ...toProjectListItem(project),
            jobCategory: project.jobCategory,
            location: project.location,
            contractType: project.contractType,
            industry: project.industry,
            merits: project.merits,
            background: project.background,
            description: project.description,
            requiredSkillsText: project.requiredSkillsText,
            preferredSkillsText: project.preferredSkillsText,
            idealCandidate: project.idealCandidate,
            devEnvironment: project.devEnvironment,
            features: project.features,
            company: project.company,
          };

          return {
            content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
            structuredContent: output,
          };
        } catch (error) {
          console.error("MCP get_project failed", error);
          return publicToolError();
        }
      },
    );

    server.registerTool(
      "list_project_filter_options",
      {
        title: "List project filter options",
        description: "List supported public project search filter values.",
        annotations: {
          readOnlyHint: true,
          openWorldHint: true,
        },
      },
      async () => {
        try {
          const skills = await prisma.skill.findMany({
            orderBy: { name: "asc" },
            select: { id: true, name: true, category: true },
          });
          const output = {
            prefectures: PREFECTURES,
            weeklyDays: WEEKLY_DAYS_OPTIONS,
            remoteTypes: remoteTypeValues,
            skills,
          };

          return {
            content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
            structuredContent: output,
          };
        } catch (error) {
          console.error("MCP list_project_filter_options failed", error);
          return publicToolError();
        }
      },
    );
  },
  {
    serverInfo: {
      name: "flow-link-public-projects",
      version: "0.1.0",
    },
    instructions:
      "Use this server for read-only access to public FlowLink project listings. It never exposes applications, scouts, conversations, messages, or private user data.",
  },
  {
    basePath: "/api",
    disableSse: true,
    maxDuration: 60,
  },
);

export { handler as GET, handler as POST };
