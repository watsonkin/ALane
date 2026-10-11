import { Suspense } from "react";
import { ContestBrowser } from "@/components/contest-browser";
import { HomeHero } from "@/components/home-hero";
import { loadContests } from "@/lib/contests";
import type { Locale } from "@/lib/locale";
import { copy } from "@/lib/messages";

export async function HomeScreen({ locale }: { locale: Locale }) {
  const contests = await loadContests();
  const asOf = new Date().toISOString();
  const t = copy(locale);

  return (
    <div>
      <HomeHero contests={contests} asOf={asOf} locale={locale} />
      <Suspense
        fallback={
          <p id="contest-list" className="text-sm text-muted-foreground">
            {t.loadingFilters}
          </p>
        }
      >
        <div id="contest-list">
          <ContestBrowser contests={contests} asOf={asOf} locale={locale} />
        </div>
      </Suspense>
    </div>
  );
}
