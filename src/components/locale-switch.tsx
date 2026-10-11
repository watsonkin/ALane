"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { hrefFor, toEnPath, toZhPath, type Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

function switchHref(locale: Locale, nextPath: string): string {
  const next = locale === "en" ? toEnPath(nextPath) : toZhPath(nextPath);
  return `/locale?to=${locale}&next=${encodeURIComponent(next)}`;
}

export function LocaleSwitch({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const nextPath = search ? `${pathname}?${search}` : pathname;
  return <LocaleSwitchView locale={locale} nextPath={nextPath} />;
}

export function LocaleSwitchFallback({ locale }: { locale: Locale }) {
  return <LocaleSwitchView locale={locale} nextPath={hrefFor(locale, "/")} />;
}

function LocaleSwitchView({ locale, nextPath }: { locale: Locale; nextPath: string }) {
  const zhCurrent = locale === "zh-CN";
  return (
    <span
      data-locale-switch={locale}
      className="inline-flex shrink-0 items-center font-sans text-[13px] leading-none tracking-wide"
      role="group"
      aria-label={zhCurrent ? "语言" : "Language"}
    >
      <a
        href={switchHref("zh-CN", nextPath)}
        hrefLang="zh-CN"
        aria-current={zhCurrent ? "true" : undefined}
        className={cn(
          "inline-flex min-h-11 items-center px-2 sm:min-h-0",
          zhCurrent
            ? "font-semibold text-[#1A1A1A]"
            : "font-normal text-[#5C5C5C] hover:text-[#1A1A1A]",
        )}
      >
        中
      </a>
      <span aria-hidden="true" className="text-[#5C5C5C]">
        |
      </span>
      <a
        href={switchHref("en", nextPath)}
        hrefLang="en"
        aria-current={zhCurrent ? undefined : "true"}
        className={cn(
          "inline-flex min-h-11 items-center px-2 sm:min-h-0",
          zhCurrent
            ? "font-normal text-[#5C5C5C] hover:text-[#1A1A1A]"
            : "font-semibold text-[#1A1A1A]",
        )}
      >
        EN
      </a>
    </span>
  );
}
