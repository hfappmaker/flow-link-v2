import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Bot, Building2, Search, UserRound, UsersRound } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";

const mcpServerUrl = "https://flowlink.flowtech.co.jp/api/mcp";

const searchTools = [
  { name: "search_projects", description: "公開案件をキーワード、単価、稼働日数、スキルなどで検索します。" },
  { name: "get_project", description: "公開案件の詳細情報を取得します。" },
  { name: "list_project_filter_options", description: "案件検索で使える絞り込み候補を取得します。" },
];

const engineerSearchTools = [
  { name: "search_engineers", description: "企業アカウントで公開中のエンジニアを検索します。" },
  { name: "get_engineer", description: "公開中のエンジニアプロフィール詳細を取得します。" },
  { name: "list_engineer_filter_options", description: "エンジニア検索で使える絞り込み候補を取得します。" },
];

const profileTools = [
  { name: "get_my_company_profile", description: "ログイン中の企業プロフィールを取得します。" },
  { name: "register_my_company_profile", description: "企業プロフィールを新規登録します。" },
  { name: "update_my_company_profile", description: "企業プロフィールを更新します。" },
  { name: "get_my_engineer_profile", description: "ログイン中のエンジニアプロフィールを取得します。" },
  { name: "register_my_engineer_profile", description: "エンジニアプロフィールを新規登録します。" },
  { name: "update_my_engineer_profile", description: "エンジニアプロフィールを更新します。" },
];

const projectTools = [
  { name: "list_my_projects", description: "企業アカウントの自社案件一覧を取得します。" },
  { name: "create_project_draft", description: "企業アカウントで案件の下書きを作成します。" },
  { name: "update_project_draft", description: "企業アカウントで案件の下書きを更新します。" },
];

export const metadata: Metadata = {
  title: "MCP接続設定",
  description: "MCP対応クライアントから利用できるFlowLinkのツール一覧です。",
};

export default function McpPage() {
  return (
    <div className="bg-slate-50">
      <section className="border-b border-slate-200 bg-gradient-to-b from-blue-50 via-white to-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <p className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-4 py-1.5 text-xs font-bold text-blue-700">
            <Bot className="h-4 w-4" />
            FlowLink MCP Server
          </p>
          <h1 className="mt-5 max-w-3xl text-3xl leading-tight font-black text-slate-900 sm:text-4xl">
            MCPツール一覧
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-600 sm:text-base">
            MCP対応クライアントから、FlowLinkの公開案件検索、プロフィール登録、
            企業向けエンジニア検索、企業案件の下書き作成・更新を利用できます。
          </p>

          <p className="mt-5 inline-flex rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
            MCPの利用にはFlowLinkアカウントの登録とログインが必要です。
          </p>

          <div className="mt-8 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold tracking-wide text-slate-500 uppercase">
              MCP Server URL
            </p>
            <code className="mt-2 block overflow-x-auto rounded-md border border-blue-100 bg-blue-50 px-3 py-3 text-sm font-semibold whitespace-nowrap text-blue-800">
              {mcpServerUrl}
            </code>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-5 lg:grid-cols-4">
          <ToolGroup
            title="公開案件検索"
            icon={<Search className="h-5 w-5 text-cyan-600" />}
            description="公開中の案件を探して、詳細や検索条件を参照できます。"
            tools={searchTools}
          />
          <ToolGroup
            title="エンジニア検索"
            icon={<UsersRound className="h-5 w-5 text-emerald-600" />}
            description="企業アカウントで公開中のエンジニアを探して、プロフィールを参照できます。"
            tools={engineerSearchTools}
          />
          <ToolGroup
            title="プロフィール"
            icon={<UserRound className="h-5 w-5 text-blue-600" />}
            description="企業またはエンジニアのプロフィールを取得・登録・更新できます。"
            tools={profileTools}
          />
          <ToolGroup
            title="企業案件"
            icon={<Building2 className="h-5 w-5 text-violet-600" />}
            description="企業アカウントで自社案件の一覧取得と下書き作成・更新ができます。"
            tools={projectTools}
          />
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/projects" className={buttonClasses("primary")}>
            <Search className="h-4 w-4" />
            公開案件を見る
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
  tools: Array<{ name: string; description: string }>;
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
          <div
            key={tool.name}
            className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2"
          >
            <p className="text-xs font-bold break-all text-slate-900">{tool.name}</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">{tool.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
