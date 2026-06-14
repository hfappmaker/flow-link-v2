import Link from "next/link";
import { Bot, Building2, CheckCircle2, MessageSquare, Search, Send, UserCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { ProjectCard } from "@/components/project-card";
import { buttonClasses } from "@/components/ui/button";

export default async function HomePage() {
  const user = await getCurrentUser();
  const latestProjects = await prisma.project.findMany({
    where: { status: "OPEN" },
    orderBy: { publishedAt: "desc" },
    take: 4,
    include: {
      company: { select: { name: true } },
      skills: { include: { skill: true } },
    },
  });
  const projectCount = await prisma.project.count({ where: { status: "OPEN" } });
  const engineerCount = await prisma.engineerProfile.count({
    where: {
      user: { deletedAt: null },
    },
  });
  const companyCount = await prisma.company.count({
    where: {
      members: {
        some: {
          user: { deletedAt: null },
        },
      },
    },
  });

  const engineerSteps = [
    { icon: Search, title: "案件を探す", body: "スキル・単価・稼働日数・リモート頻度などの条件で、あなたに合う案件を検索。" },
    { icon: Send, title: "応募する", body: "気になる案件にメッセージ付きで応募。応募と同時に企業とのチャットが始まります。" },
    { icon: MessageSquare, title: "チャットで商談", body: "条件のすり合わせから参画決定まで、すべてプラットフォーム上で完結します。" },
  ];

  const companySteps = [
    { icon: Building2, title: "案件を掲載", body: "単価・稼働条件・必須要件を入力して案件を公開。下書き保存にも対応。" },
    { icon: UserCheck, title: "スカウトを送る", body: "スキルや希望条件でエンジニアを検索し、ピンポイントでスカウト。" },
    { icon: MessageSquare, title: "応募者と直接やり取り", body: "応募・スカウトともにチャットで直接コミュニケーション。選考ステータスも一元管理。" },
  ];

  return (
    <div>
      {/* ヒーロー */}
      <section className="border-b border-slate-200 bg-gradient-to-b from-blue-50 via-white to-white">
        <div className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6">
          <p className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-bold text-blue-700">
            フリーランスエンジニアと企業のマッチングプラットフォーム
          </p>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl leading-tight font-black text-slate-900 sm:text-5xl">
            あなたの技術を、
            <br className="sm:hidden" />
            <span className="text-blue-600">次の案件</span>へつなぐ。
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-600">
            案件検索から応募、企業とのチャット、スカウトまでワンストップ。
            週2日〜フルリモートまで、働き方に合わせた案件が見つかります。
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link href="/projects" className={buttonClasses("primary", "lg")}>
              <Search className="h-4 w-4" />
              案件を探す
            </Link>
            {!user ? (
              <Link href="/register?role=company" className={buttonClasses("outline", "lg")}>
                <Building2 className="h-4 w-4" />
                企業として利用する
              </Link>
            ) : null}
          </div>

          <dl className="mx-auto mt-12 grid max-w-2xl grid-cols-3 gap-4">
            {[
              ["募集中の案件", projectCount],
              ["登録エンジニア", engineerCount],
              ["利用企業", companyCount],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <dd className="text-3xl font-black text-blue-700">{value}</dd>
                <dt className="mt-1 text-xs font-semibold text-slate-500">{label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* MCP接続案内 */}
      <section className="border-b border-slate-200 bg-slate-950 text-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-1.5 text-xs font-bold text-cyan-100">
                <Bot className="h-4 w-4" />
                MCP Server
              </p>
              <h2 className="mt-5 max-w-2xl text-2xl leading-tight font-black text-white sm:text-3xl">
                AIクライアントからFlowLinkの公開案件を検索
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-300">
                ClaudeやChatGPTなどのMCP対応クライアントにFlowLink MCPサーバーを追加すると、
                公開中の案件検索、案件詳細取得、検索条件の確認ができます。
                応募・メッセージ・非公開情報にはアクセスしません。
              </p>

              <div className="mt-6 rounded-lg border border-white/15 bg-white/8 p-4">
                <p className="text-xs font-bold tracking-wide text-slate-400 uppercase">MCP Server URL</p>
                <code className="mt-2 block overflow-x-auto rounded-md bg-black/35 px-3 py-3 text-sm font-semibold whitespace-nowrap text-cyan-100">
                  https://flowlink.flowtech.co.jp/api/mcp
                </code>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-white/15 bg-white/8 p-5">
                <p className="text-sm font-black text-white">Claudeで使う</p>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">
                  Claudeの Connectors から Add custom connector を選び、
                  MCPサーバーURLを追加してください。認証設定は不要です。
                </p>
              </div>
              <div className="rounded-lg border border-white/15 bg-white/8 p-5">
                <p className="text-sm font-black text-white">ChatGPTで使う</p>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">
                  ChatGPTの Apps / Developer Mode でカスタムMCPアプリを作成し、
                  MCPサーバーURLを登録してください。利用可否はプランとワークスペース設定に依存します。
                </p>
              </div>
              <div className="rounded-lg border border-white/15 bg-white/8 p-5 md:col-span-2">
                <p className="text-sm font-black text-white">利用できるツール</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {["search_projects", "get_project", "list_project_filter_options"].map((tool) => (
                    <span
                      key={tool}
                      className="inline-flex items-center gap-1.5 rounded-md border border-cyan-300/25 bg-cyan-300/10 px-2.5 py-1.5 text-xs font-semibold text-cyan-100"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {tool}
                    </span>
                  ))}
                </div>
                <p className="mt-4 text-xs leading-relaxed text-slate-400">
                  公開案件検索のみ利用できます。利用できるメニュー名や権限は、各AIクライアントのプラン・ワークスペース設定により異なります。
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 新着案件 */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-slate-900">新着案件</h2>
          <Link href="/projects" className="text-sm font-semibold text-blue-600 hover:underline">
            すべての案件を見る →
          </Link>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {latestProjects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      </section>

      {/* 使い方 */}
      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <h2 className="text-center text-2xl font-black text-slate-900">Flow Linkの使い方</h2>

          <div className="mt-10 grid gap-10 lg:grid-cols-2">
            <div>
              <h3 className="text-base font-bold text-blue-700">フリーランスエンジニアの方</h3>
              <div className="mt-4 space-y-4">
                {engineerSteps.map((s, i) => (
                  <div key={s.title} className="flex gap-4 rounded-xl border border-slate-200 p-5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                      <s.icon className="h-5 w-5 text-blue-600" />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        STEP {i + 1}. {s.title}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-slate-600">{s.body}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/register" className={buttonClasses("primary", "md", "mt-5")}>
                エンジニアとして無料登録
              </Link>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-700">企業・採用担当の方</h3>
              <div className="mt-4 space-y-4">
                {companySteps.map((s, i) => (
                  <div key={s.title} className="flex gap-4 rounded-xl border border-slate-200 p-5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                      <s.icon className="h-5 w-5 text-slate-600" />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        STEP {i + 1}. {s.title}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-slate-600">{s.body}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/register?role=company" className={buttonClasses("secondary", "md", "mt-5")}>
                企業として無料登録
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
