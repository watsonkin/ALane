import Link from "next/link";
import { AlaneLockup } from "@/components/brand/alane-lockup";

export function SiteFrame({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#content"
        className="absolute left-4 top-4 z-10 -translate-y-20 bg-primary px-3 py-2 text-sm text-primary-foreground focus:translate-y-0"
      >
        跳到内容
      </a>
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link
            href="/"
            className="min-w-0 rounded-sm outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            <AlaneLockup />
          </Link>
          <nav className="flex shrink-0 items-center gap-4 text-xs text-muted-foreground">
            <Link href="/about" className="hover:text-ink">
              关于
            </Link>
            <a href="/calendar.ics" className="hover:text-ink">
              日历
            </a>
          </nav>
        </div>
      </header>
      <main id="content" className="mx-auto w-full max-w-5xl flex-1 px-5 py-8 sm:px-8 sm:py-12">
        {children}
      </main>
      <footer className="border-t border-border">
        <div className="mx-auto w-full max-w-5xl px-5 py-6 text-xs leading-5 text-muted-foreground sm:px-8">
          本站做赛事索引。获奖缩略图最长边不超过 400 像素，点击直接去源站的单件作品页，不提供高清下载。权利标签仅供参考，以官方条款为准。部分日期按往年节奏估算，标成需留意的条目请先看官网。下架与勘误见关于页。
        </div>
      </footer>
    </>
  );
}
