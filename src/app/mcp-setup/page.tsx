import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Bot, Building2, Search, UserRound } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";

const mcpServers = [
  {
    key: "company",
    title: "企業向け MCP",
    url: "https://flowlink.flowtech.co.jp/api/mcp/company",
    icon: <Building2 className="h-5 w-5 text-emerald-600" />,
    description: "案件検索、エンジニア検索、企業プロフィール管理、案件下書き管理に使う企業向けツールです。",
    tools: [
      "search_projects",
      "get_project",
      "list_project_filter_options",
      "search_engineers",
      "get_engineer",
      "list_engineer_filter_options",
      "list_my_projects",
      "create_project_draft",
      "update_project_draft",
      "get_my_company_profile",
      "register_my_company_profile",
      "update_my_company_profile",
    ],
  },
  {
    key: "engineer",
    title: "エンジニア向け MCP",
    url: "https://flowlink.flowtech.co.jp/api/mcp/engineer",
    icon: <UserRound className="h-5 w-5 text-blue-600" />,
    description: "案件検索とエンジニアプロフィール管理に使うエンジニア向けツールです。",
    tools: [
      "search_projects",
      "get_project",
      "list_project_filter_options",
      "get_my_engineer_profile",
      "register_my_engineer_profile",
      "update_my_engineer_profile",
    ],
  },
];

export const metadata: Metadata = {
  title: "MCP設定",
  description: "FlowLink MCPのサーバーURLとツール一覧です。",
};

export default function McpSetupPage() {
  return (
    <div className="bg-slate-50">
      <section className="border-b border-slate-200 bg-gradient-to-b from-blue-50 via-white to-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <p className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-4 py-1.5 text-xs font-bold text-blue-700">
            <Bot className="h-4 w-4" />
            FlowLink MCP
          </p>
          <h1 className="mt-5 max-w-3xl text-3xl leading-tight font-black text-slate-900 sm:text-4xl">
            MCPサーバーURL
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-600 sm:text-base">
            FlowLink MCPは利用者別に接続先を分けています。用途に合うURLをMCPクライアントに設定してください。
          </p>

          <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-900">
            <p className="font-bold">利用にはFlowLinkへのログインが必要です。</p>
            <p className="mt-1">
              MCPクライアントにURLを設定すると、接続時にFlowLinkのOAuth認可画面が開きます。ログイン後、利用するツールに必要な権限を許可してください。
            </p>
          </div>

          <div className="mt-8 grid gap-3">
            {mcpServers.map((server) => (
              <div key={server.key} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-bold tracking-wide text-slate-500 uppercase">{server.title}</p>
                <code className="mt-2 block overflow-x-auto rounded-md border border-blue-100 bg-blue-50 px-3 py-3 text-sm font-semibold whitespace-nowrap text-blue-800">
                  {server.url}
                </code>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-5 lg:grid-cols-2">
          {mcpServers.map((server) => (
            <ToolGroup
              key={server.key}
              title={server.title}
              icon={server.icon}
              description={server.description}
              tools={server.tools}
            />
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/projects" className={buttonClasses("primary")}>
            <Search className="h-4 w-4" />
            案件を探す
          </Link>
        </div>
      </section>
    </div>
  );
}

function ToolGroup({
  title,
  icon,
  description,
  tools,
}: {
  title: string;
  icon: ReactNode;
  description: string;
  tools: string[];
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="flex items-center gap-2 text-lg font-black text-slate-900">
        {icon}
        {title}
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">{description}</p>
      <div className="mt-4 space-y-2">
        {tools.map((tool) => (
          <div key={tool} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-xs font-bold break-all text-slate-900">{tool}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
