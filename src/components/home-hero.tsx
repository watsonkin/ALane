import Image from "next/image";
import Link from "next/link";
import { RightsChip } from "@/components/rights-chip";
import { ContestThumb } from "@/components/thumb-placeholder";
import { Badge } from "@/components/ui/badge";
import {
  FEE_LABEL,
  compareByWindow,
  contestThumbPath,
  deadlineWindow,
  formatContestDate,
  windowChipLabel,
} from "@/lib/contest-labels";
import type { Contest } from "@/lib/contest-schema";

export function HomeHero({
  contests,
  asOf,
}: {
  contests: Contest[];
  asOf: string;
}) {
  const featured = [...contests].sort((a, b) => compareByWindow(a, b, asOf));

  return (
    <section className="mb-10 space-y-10">
      <div className="grid items-center gap-8 lg:grid-cols-2">
        <div>
          <p className="text-xs text-muted-foreground">赛事索引</p>
          <h1 className="mt-2 font-serif text-4xl leading-tight sm:text-5xl">
            街头摄影赛事
          </h1>
          <p className="mt-4 max-w-md text-base leading-7 text-muted-foreground">
            正在征稿的街拍比赛。点进一场，看截止日期和官网。
          </p>
        </div>
        <Image
          src="/hero-street.jpg"
          alt="黑白街头摄影"
          width={800}
          height={542}
          unoptimized
          priority
          className="aspect-[4/3] w-full rounded-[4px] object-cover shadow-none"
        />
      </div>

      <div>
        <h2 className="font-serif text-2xl">即将截止</h2>
        {featured.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">还没有赛事。</p>
        ) : (
          <ul className="mt-4 flex gap-3 overflow-x-auto pb-1">
            {featured.map((contest) => {
              const window = deadlineWindow(contest, asOf);
              return (
                <li key={contest.id} className="w-56 shrink-0">
                  <Link
                    href={`/contests/${contest.slug}`}
                    className="block rounded-[4px] border border-border bg-card p-3 outline-none focus-visible:bg-muted"
                  >
                    <ContestThumb
                      name={contest.name}
                      thumbPath={contestThumbPath(contest)}
                      width={192}
                      height={112}
                      className="h-16 w-full"
                    />
                    <p className="mt-3 line-clamp-2 font-serif text-lg leading-snug">
                      {contest.name}
                    </p>
                    <p
                      className={
                        window === "open"
                          ? "mt-2 text-sm text-caution"
                          : "mt-2 text-sm text-muted-foreground"
                      }
                    >
                      {contest.deadline_at
                        ? formatContestDate(contest.deadline_at)
                        : "待定"}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Badge
                        variant={window === "open" ? "default" : "outline"}
                        className={
                          window === "closed" ? "text-muted-foreground" : undefined
                        }
                      >
                        {windowChipLabel(window)}
                      </Badge>
                      <Badge variant="outline">{FEE_LABEL[contest.fee]}</Badge>
                      <RightsChip contest={contest} />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
