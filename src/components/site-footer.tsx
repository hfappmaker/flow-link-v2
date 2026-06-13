import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:px-6">
        <p className="font-bold text-slate-700">
          Flow<span className="text-blue-600">Link</span>
        </p>
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <Link href="/projects" className="hover:text-slate-700">
            案件検索
          </Link>
          <Link href="/register" className="hover:text-slate-700">
            エンジニア登録
          </Link>
          <Link href="/register?role=company" className="hover:text-slate-700">
            企業の方はこちら
          </Link>
          <Link href="/terms" className="hover:text-slate-700">
            利用規約
          </Link>
          <Link href="/privacy" className="hover:text-slate-700">
            プライバシーポリシー
          </Link>
        </nav>
        <p className="text-xs">© 2026 FlowLink</p>
      </div>
    </footer>
  );
}
