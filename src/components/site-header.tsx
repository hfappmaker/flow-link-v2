import Link from "next/link";
import { MessageSquare, Zap } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { getUnreadMessageCount } from "@/lib/messages";
import { signOut } from "@/auth";
import { Avatar } from "@/components/ui/avatar";
import { buttonClasses } from "@/components/ui/button";

const engineerNav = [
  { href: "/dashboard", label: "マイページ" },
  { href: "/projects", label: "案件検索" },
  { href: "/applications", label: "応募管理" },
  { href: "/scouts", label: "スカウト" },
];

const companyNav = [
  { href: "/company", label: "ダッシュボード" },
  { href: "/company/projects", label: "案件管理" },
  { href: "/company/engineers", label: "エンジニア検索" },
  { href: "/company/scouts", label: "スカウト管理" },
];

export async function SiteHeader() {
  const user = await getCurrentUser();
  const unread = user ? await getUnreadMessageCount(user) : 0;

  const nav =
    user?.role === "COMPANY" && user.companyMember
      ? companyNav
      : user?.role === "ENGINEER" && user.engineerProfile
        ? engineerNav
        : [];

  const displayName =
    user?.role === "COMPANY"
      ? user.companyMember?.company.name
      : user?.engineerProfile?.displayName;

  const settingsHref = user?.role === "COMPANY" ? "/company/settings" : "/settings/profile";

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-1.5 text-xl font-black tracking-tight text-slate-900">
          <Zap className="h-5 w-5 fill-blue-600 text-blue-600" />
          Flow<span className="text-blue-600">Link</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {user ? (
            <>
              <Link
                href="/messages"
                className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100"
                aria-label="メッセージ"
              >
                <MessageSquare className="h-5 w-5" />
                {unread > 0 ? (
                  <span className="absolute -top-0.5 -right-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {unread > 99 ? "99+" : unread}
                  </span>
                ) : null}
              </Link>

              <details className="group relative">
                <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100">
                  <Avatar name={displayName ?? user.name} image={user.image} size="sm" />
                  <span className="hidden max-w-32 truncate text-sm font-medium text-slate-700 sm:block">
                    {displayName ?? user.name ?? "ユーザー"}
                  </span>
                </summary>
                <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
                  <p className="truncate px-3 py-2 text-xs text-slate-500">{user.email}</p>
                  {nav.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 md:hidden"
                    >
                      {item.label}
                    </Link>
                  ))}
                  <Link
                    href={settingsHref}
                    className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                  >
                    {user.role === "COMPANY" ? "企業情報設定" : "プロフィール設定"}
                  </Link>
                  <form
                    action={async () => {
                      "use server";
                      await signOut({ redirectTo: "/" });
                    }}
                  >
                    <button
                      type="submit"
                      className="block w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                    >
                      ログアウト
                    </button>
                  </form>
                </div>
              </details>
            </>
          ) : (
            <>
              <Link
                href="/projects"
                className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 sm:block"
              >
                案件を探す
              </Link>
              <Link href="/login" className={buttonClasses("outline", "sm")}>
                ログイン
              </Link>
              <Link href="/register" className={buttonClasses("primary", "sm")}>
                無料登録
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
