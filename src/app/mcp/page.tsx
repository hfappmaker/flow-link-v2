import type { Metadata } from "next";
import Link from "next/link";
import { Bot, CheckCircle2, Search } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";

const mcpServerUrl = "https://flowlink.flowtech.co.jp/api/mcp";
const tools = ["search_projects", "get_project", "list_project_filter_options"];

export const metadata: Metadata = {
  title: "MCP接続設定",
  description:
    "ClaudeやChatGPTなどのMCP対応クライアントからFlowLinkの公開案件を検索するための接続設定です。",
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
            AIクライアントからFlowLinkの公開案件を検索
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-600 sm:text-base">
            ClaudeやChatGPTなどのMCP対応クライアントにFlowLink MCPサーバーを追加すると、
            公開中の案件検索、案件詳細取得、検索条件の確認ができます。
            応募・メッセージ・非公開情報にはアクセスしません。
          </p>

          <div className="mt-8 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold tracking-wide text-slate-500 uppercase">MCP Server URL</p>
            <code className="mt-2 block overflow-x-auto rounded-md bg-slate-950 px-3 py-3 text-sm font-semibold whitespace-nowrap text-cyan-100">
              {mcpServerUrl}
            </code>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black text-slate-900">Claudeで使う</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Claudeの Connectors から Add custom connector を選び、
              MCPサーバーURLを追加してください。認証設定は不要です。
            </p>
            <ol className="mt-5 space-y-3 text-sm leading-relaxed text-slate-700">
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-cyan-50 text-xs font-black text-cyan-700">
                  1
                </span>
                Settings から Connectors を開きます。
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-cyan-50 text-xs font-black text-cyan-700">
                  2
                </span>
                Add custom connector を選択します。
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-cyan-50 text-xs font-black text-cyan-700">
                  3
                </span>
                MCP Server URL に {mcpServerUrl} を登録します。
              </li>
            </ol>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black text-slate-900">ChatGPTで使う</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              ChatGPTの Apps / Developer Mode でカスタムMCPアプリを作成し、
              MCPサーバーURLを登録してください。利用可否はプランとワークスペース設定に依存します。
            </p>
            <ol className="mt-5 space-y-3 text-sm leading-relaxed text-slate-700">
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-blue-50 text-xs font-black text-blue-700">
                  1
                </span>
                Apps または Workspace settings から Create を開きます。
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-blue-50 text-xs font-black text-blue-700">
                  2
                </span>
                カスタムMCPアプリとして新規作成します。
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-blue-50 text-xs font-black text-blue-700">
                  3
                </span>
                MCP Server URL に {mcpServerUrl} を登録します。
              </li>
            </ol>
          </div>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black text-slate-900">利用できるツール</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {tools.map((tool) => (
                <span
                  key={tool}
                  className="inline-flex items-center gap-1.5 rounded-md border border-cyan-200 bg-cyan-50 px-2.5 py-1.5 text-xs font-semibold text-cyan-800"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {tool}
                </span>
              ))}
            </div>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              公開案件検索のみ利用できます。応募、保存、メッセージ、スカウト、非公開プロフィールにはアクセスしません。
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black text-slate-900">注意事項</h2>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-slate-600">
              <li>利用できるメニュー名や権限は、各AIクライアントのプラン・ワークスペース設定により異なります。</li>
              <li>FlowLink MCPサーバーは認証不要の公開読み取り専用サーバーです。</li>
              <li>AIクライアント側でツール実行の確認が表示される場合は、内容を確認してから許可してください。</li>
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
