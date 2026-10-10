import { Suspense } from "react";
import { ContestBrowser } from "@/components/contest-browser";
import { HomeHero } from "@/components/home-hero";
import { loadContests } from "@/lib/contests";

export const dynamic = "force-static";

export default async function HomePage() {
  const contests = await loadContests();
  const asOf = new Date().toISOString();

  return (
    <div>
      <HomeHero contests={contests} asOf={asOf} />
      <Suspense
        fallback={
          <p className="text-sm text-muted-foreground">正在读取筛选条件。</p>
        }
      >
        <ContestBrowser contests={contests} asOf={asOf} />
      </Suspense>
    </div>
  );
}
