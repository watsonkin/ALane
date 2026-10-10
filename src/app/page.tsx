import { Suspense } from "react";
import { ContestBrowser } from "@/components/contest-browser";
import { loadContests } from "@/lib/contests";

export const dynamic = "force-static";

export default async function HomePage() {
  const contests = await loadContests();
  const asOf = new Date().toISOString();

  return (
    <div>
      <header className="mb-8 max-w-3xl">
        <p className="text-xs text-muted-foreground">赛事索引</p>
        <h1 className="mt-2 font-serif text-4xl leading-tight sm:text-5xl">
          街头摄影赛事
        </h1>
        <p className="mt-4 text-base leading-7 text-muted-foreground">
          把散落在各官网的征稿收成一份可校验的索引。真源是仓库里的 YAML。页面只链到官方和获奖廊，不保存作品图片。
        </p>
      </header>
      <p className="mb-8 border border-border bg-card px-4 py-3 text-sm leading-6">
        现在这 {contests.length} 条是人工收录的种子名单。标成「需留意」的条目，以及部分按往年节奏估算的日期，都还没有逐条核验，以官网为准。
      </p>
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
