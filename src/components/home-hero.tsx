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
    <section className="mb-6 border-b border-border pb-6">
      <p className="max-w-[40ch] text-[15px] leading-snug text-muted-foreground">
        正在征稿的街拍比赛。点进一场，看截止日期和官网。
      </p>

      <div className="mt-6">
        <h2 className="font-serif text-2xl">以下赛事正在征稿，即将截止</h2>
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
                <li key={contest.id} className="flex w-56 shrink-0">
                  <Link
                    href={`/contests/${contest.slug}`}
                    className="flex h-full w-full flex-col rounded-[4px] border border-border bg-card p-3 outline-none focus-visible:bg-muted"
                  >
                    <ContestThumb
                      name={contest.name}
                      thumbPath={contestThumbPath(contest)}
                      organizerIcon={contest.organizer_icon}
                      width={200}
                      height={64}
                      className="h-16 w-full shrink-0"
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
