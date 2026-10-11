import Image from "next/image";
import Link from "next/link";
import { RightsChip } from "@/components/rights-chip";
import { ContestThumb } from "@/components/thumb-placeholder";
import { Badge } from "@/components/ui/badge";
import {
  FEE_LABEL,
  contestThumbPath,
  formatContestDate,
  selectClosingSoon,
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
  const closing = selectClosingSoon(contests, asOf);

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
        {closing.contests.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            未来 60 天内没有即将截稿的赛事。
            <Link
              href="#contest-list"
              className="ml-2 text-accent underline-offset-4 hover:underline"
            >
              查看全部赛事
            </Link>
          </p>
        ) : (
          <>
            <ul className="mt-4 flex gap-3 overflow-x-auto pb-1">
              {closing.contests.map((contest) => (
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
                    <p className="mt-2 text-sm text-caution">
                      {formatContestDate(contest.deadline_at ?? "")}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Badge>{windowChipLabel("open")}</Badge>
                      <Badge variant="outline">{FEE_LABEL[contest.fee]}</Badge>
                      <RightsChip contest={contest} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
            {closing.truncated ? (
              <p className="mt-3 text-sm text-muted-foreground">
                <Link
                  href="/?window=open#contest-list"
                  className="text-accent underline-offset-4 hover:underline"
                >
                  查看全部开放中
                </Link>
              </p>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}
