import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  Bot,
  Building2,
  CheckCircle2,
  FileText,
  LockKeyhole,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { buttonClasses } from "@/components/ui/button";

const mcpServerUrl = "https://flowlink.flowtech.co.jp/api/mcp";

const searchTools = [
  { name: "search_projects", scope: "ログイン必須 / scope不要" },
  { name: "get_project", scope: "ログイン必須 / scope不要" },
  { name: "list_project_filter_options", scope: "ログイン必須 / scope不要" },
];

const profileTools = [
  { name: "get_my_company_profile", scope: "company_profile:read" },
  { name: "register_my_company_profile", scope: "company_profile:write" },
  { name: "update_my_company_profile", scope: "company_profile:write" },
  { name: "get_my_engineer_profile", scope: "engineer_profile:read" },
  { name: "register_my_engineer_profile", scope: "engineer_profile:write" },
  { name: "update_my_engineer_profile", scope: "engineer_profile:write" },
];

const projectTools = [
  { name: "list_my_projects", scope: "project:read" },
  { name: "create_project_draft", scope: "project:write" },
  { name: "update_project_draft", scope: "project:write" },
];

const scopes = [
  "company_profile:read",
  "company_profile:write",
  "engineer_profile:read",
  "engineer_profile:write",
  "project:read",
  "project:write",
];

export const metadata: Metadata = {
  title: "MCP接続設定",
  description:
    "ClaudeやChatGPTなどのMCP対応クライアントからFlowLinkの案件検索、プロフィール登録、案件下書き作成を利用するための接続設定です。",
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
            AIクライアントからFlowLinkを操作
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-600 sm:text-base">
            Claude、ChatGPT、CodexなどのMCP対応クライアントから、公開案件の検索、
            プロフィール登録、企業案件の下書き作成・更新を利用できます。公開案件検索は
            FlowLinkログイン必須、scope不要です。
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
        <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-lg font-black text-slate-900">
              <ShieldCheck className="h-5 w-5 text-blue-600" />
              接続手順
            </h2>
            <ol className="mt-5 space-y-3 text-sm leading-relaxed text-slate-700">
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-blue-50 text-xs font-black text-blue-700">
                  1
                </span>
                利用するMCPクライアントのコネクタ設定で、MCP Server URLを登録します。
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-blue-50 text-xs font-black text-blue-700">
                  2
                </span>
                認証が求められたらFlowLinkにログインし、利用したいscopeを選択します。
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-blue-50 text-xs font-black text-blue-700">
                  3
                </span>
                認可後、AIクライアントから許可した範囲のツールだけを実行できます。
              </li>
            </ol>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-lg font-black text-slate-900">
              <LockKeyhole className="h-5 w-5 text-cyan-600" />
              OAuth認可
            </h2>
            <ul className="mt-5 space-y-3 text-sm leading-relaxed text-slate-600">
              <li>公開案件検索ツールはFlowLinkログイン必須、scope不要で利用できます。</li>
              <li>プロフィール登録・更新、自社案件の操作は許可したscopeの範囲で実行できます。</li>
              <li>認可画面ではscopeを選択できます。アカウント種別に合わないscopeは選択できません。</li>
              <li>MCPから案件公開はできません。公開操作はFlowLinkのWeb画面で行います。</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          <ToolGroup
            title="公開検索"
            icon={<Search className="h-5 w-5 text-cyan-600" />}
            description="ログイン済みのMCPクライアントから公開案件を検索・参照できます。"
            tools={searchTools}
          />
          <ToolGroup
            title="プロフィール"
            icon={<UserRound className="h-5 w-5 text-blue-600" />}
            description="企業またはエンジニアの登録情報を取得・登録・更新できます。"
            tools={profileTools}
          />
          <ToolGroup
            title="企業案件"
            icon={<Building2 className="h-5 w-5 text-emerald-600" />}
            description="企業アカウントで自社案件の一覧取得と下書き作成・更新ができます。"
            tools={projectTools}
          />
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-lg font-black text-slate-900">
              <FileText className="h-5 w-5 text-slate-700" />
              利用可能なscope
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {scopes.map((scope) => (
                <span
                  key={scope}
                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {scope}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black text-slate-900">scopeの考え方</h2>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-slate-600">
              <li>
                企業情報は <code>company_profile:*</code>、エンジニア情報は{" "}
                <code>engineer_profile:*</code>、案件は <code>project:*</code>{" "}
                で分けています。
              </li>
              <li>
                <code>project:write</code> は下書きの作成・更新だけを許可します。公開済み・終了済み案件の更新や公開操作は含みません。
              </li>
              <li>
                ツール入力で <code>userId</code> や <code>companyId</code>{" "}
                は受け取りません。Bearer tokenのユーザーからサーバー側で判定します。
              </li>
            </ul>
          </div>
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
  tools: Array<{ name: string; scope: string }>;
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
            <p className="mt-1 text-xs font-semibold text-slate-500">{tool.scope}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
