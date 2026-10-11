"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlaneLockup } from "@/components/brand/alane-lockup";
import { HtmlLang } from "@/components/html-lang";
import { LocaleSwitch, LocaleSwitchFallback } from "@/components/locale-switch";
import { hrefFor, localeFromPathname } from "@/lib/locale";
import { copy } from "@/lib/messages";

export function SiteFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";
  const locale = localeFromPathname(pathname);
  const t = copy(locale);
  const home = hrefFor(locale, "/");
  const about = hrefFor(locale, "/about");

  return (
    <>
      <HtmlLang locale={locale} />
      <a
        href="#content"
        className="absolute left-4 top-4 z-10 -translate-y-20 bg-primary px-3 py-2 text-sm text-primary-foreground focus:translate-y-0"
      >
        {t.skip}
      </a>
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-5xl items-start justify-between gap-3 px-5 py-4 sm:items-center sm:px-8">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-3 sm:flex-nowrap">
            <Link
              href={home}
              className="shrink-0 rounded-sm outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              <AlaneLockup />
            </Link>
            <Link
              href={home}
              className="flex min-w-0 basis-full items-center gap-4 rounded-sm outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent sm:basis-auto sm:flex-1"
            >
              <span aria-hidden="true" className="hidden h-12 w-px shrink-0 bg-border sm:block" />
              <span className="min-w-0">
                <span className="block font-serif text-[1.35rem] leading-tight text-ink sm:text-[1.5rem]">
                  {t.title}
                </span>
                <span className="mt-1 block text-[13px] leading-snug text-[#5C5C5C]">
                  {t.subtitle}
                </span>
              </span>
            </Link>
          </div>
          <nav className="flex shrink-0 items-center gap-4 pt-2 text-xs text-muted-foreground sm:pt-0">
            <Suspense fallback={<LocaleSwitchFallback locale={locale} />}>
              <LocaleSwitch locale={locale} />
            </Suspense>
            <details className="relative sm:hidden">
              <summary className="cursor-pointer list-none hover:text-ink [&::-webkit-details-marker]:hidden">
                {t.menu}
              </summary>
              <div className="absolute right-0 z-20 mt-2 border border-border bg-card px-3 py-2">
                <a href="/calendar.ics" className="whitespace-nowrap hover:text-ink">
                  {t.calendar}
                </a>
              </div>
            </details>
            <Link href={about} className="hover:text-ink">
              {t.about}
            </Link>
            <a href="/calendar.ics" className="hidden hover:text-ink sm:inline">
              {t.calendar}
            </a>
          </nav>
        </div>
      </header>
      <main id="content" className="mx-auto w-full max-w-5xl flex-1 px-5 py-8 sm:px-8 sm:py-12">
        {children}
      </main>
      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-4 text-xs text-muted-foreground sm:px-8">
          <p>© 2026 ALane</p>
          <Link href={about} className="hover:text-ink">
            {t.about}
          </Link>
        </div>
      </footer>
    </>
  );
}
