import Image from "next/image";
import Link from "next/link";
import { RightsChip } from "@/components/rights-chip";
import { ThumbPlaceholder } from "@/components/thumb-placeholder";
import { Badge } from "@/components/ui/badge";
import {
  FEE_LABEL,
  RELEVANCE_LABEL,
  STATUS_LABEL,
  contestThumbPath,
  deadlineWindow,
  formatContestDate,
  windowChipLabel,
} from "@/lib/contest-labels";
import type { Contest } from "@/lib/contest-schema";

export function ContestListCard({
  contest,
  asOf,
}: {
  contest: Contest;
  asOf: string;
}) {
  const thumb = contestThumbPath(contest);
  const initial = contest.name.trim().slice(0, 1) || "·";
  const window = deadlineWindow(contest, asOf);

  return (
    <li className="border border-border bg-card">
      <Link
        href={`/contests/${contest.slug}`}
        className="flex gap-3 p-3 outline-none focus-visible:bg-muted sm:gap-4 sm:p-4"
      >
        {thumb ? (
          <Image
            src={`/${thumb}`}
            alt=""
            width={96}
            height={72}
            unoptimized
            className="h-[72px] w-24 shrink-0 rounded-[4px] object-cover grayscale shadow-none"
          />
        ) : (
          <ThumbPlaceholder
            initial={initial}
            className="h-[72px] w-24 shrink-0"
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-1.5">
            <Badge
              variant={window === "open" ? "default" : "outline"}
              className={window === "closed" ? "text-muted-foreground" : undefined}
            >
              {windowChipLabel(window)}
            </Badge>
            <Badge variant={contest.status === "published" ? "default" : "outline"}>
              {STATUS_LABEL[contest.status]}
            </Badge>
            <Badge variant="secondary">
              {RELEVANCE_LABEL[contest.street_photo_relevance]}
            </Badge>
            <Badge variant="outline">{FEE_LABEL[contest.fee]}</Badge>
            <RightsChip contest={contest} />
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-3">
            <h2 className="font-serif text-xl leading-snug text-foreground sm:text-2xl">
              {contest.name}
            </h2>
            <p className="shrink-0 text-sm text-muted-foreground">
              {contest.edition ?? "届次未填"}
            </p>
          </div>
          <p
            className={
              window === "open"
                ? "mt-1 text-sm text-caution"
                : "mt-1 text-sm text-muted-foreground"
            }
          >
            截止{" "}
            {contest.deadline_at ? formatContestDate(contest.deadline_at) : "未定"}
          </p>
        </div>
      </Link>
    </li>
  );
}
