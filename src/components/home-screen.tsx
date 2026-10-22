import { Suspense } from "react";
import { ContestBrowser } from "@/components/contest-browser";
import { HomeHero } from "@/components/home-hero";
import type { Contest } from "@/lib/contest-schema";
import { loadContests } from "@/lib/contests";
import type { Locale } from "@/lib/locale";
import { copy } from "@/lib/messages";

/** Client props stay free of work files and organizer marks. */
function presentContest(contest: Contest): Contest {
  const next: Contest = {
    ...contest,
    gallery_works: contest.gallery_works.map((work) => {
      const copy = { ...work };
      delete copy.thumb_path;
      return copy;
    }),
  };
  delete next.organizer_icon;
  return next;
}

export async function HomeScreen({ locale }: { locale: Locale }) {
  const contests = (await loadContests()).map(presentContest);
  // Build-time snapshot. HomeHero and ContestBrowser recompute after hydration.
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
