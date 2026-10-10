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
          <p className="hidden text-xs text-muted-foreground sm:block">
            M0 骨架
          </p>
        </div>
      </header>
      <main id="content" className="mx-auto w-full max-w-5xl flex-1 px-5 py-8 sm:px-8 sm:py-12">
        {children}
      </main>
      <footer className="border-t border-border">
        <div className="mx-auto w-full max-w-5xl px-5 py-6 text-xs leading-5 text-muted-foreground sm:px-8">
          本站只做赛事信息聚合与外链索引，不托管、不镜像参赛作品。权利标签仅供参考，以官方条款为准。当前条目是示例种子，日期和链接都还没有核验。
        </div>
      </footer>
    </>
  );
}
