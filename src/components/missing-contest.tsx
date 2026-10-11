"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { hrefFor, localeFromPathname, type Locale } from "@/lib/locale";
import { copy } from "@/lib/messages";
import { cn } from "@/lib/utils";

export function MissingContest({ slug, locale }: { slug?: string; locale?: Locale }) {
  const pathname = usePathname() ?? "/";
  const active = locale ?? localeFromPathname(pathname);
  const t = copy(active);

  return (
    <div className="max-w-xl py-10">
      <p className="text-xs text-muted-foreground">404</p>
      <h1 className="mt-2 font-serif text-4xl">{t.missingTitle}</h1>
      <p className="mt-4 text-sm leading-6 text-muted-foreground">
        {slug ? (
          active === "en" ? (
            <>
              No YAML for slug <code className="font-mono">{slug}</code>.
            </>
          ) : (
            <>
              没有 slug 为 <code className="font-mono">{slug}</code> 的 YAML。
            </>
          )
        ) : (
          t.missingGeneric
        )}{" "}
        {active === "en" ? (
          <>
            The link may be wrong, or the entry is not in{" "}
            <code className="font-mono">data/contests</code> yet.
          </>
        ) : (
          <>
            可能是链接写错了，或者这条还没放进{" "}
            <code className="font-mono">data/contests</code>。
          </>
        )}
      </p>
      <Link href={hrefFor(active, "/")} className={cn(buttonVariants({ size: "lg" }), "mt-6")}>
        {t.backToIndex}
      </Link>
    </div>
  );
}
