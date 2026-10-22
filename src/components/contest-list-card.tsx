import Link from "next/link";
import { RightsChip } from "@/components/rights-chip";
import { ContestThumb } from "@/components/thumb-placeholder";
import { Badge } from "@/components/ui/badge";
import {
  deadlineWindow,
  displayEdition,
  displayName,
  feeLabel,
  formatContestDate,
  relevanceLabel,
  statusLabel,
  windowChipLabel,
} from "@/lib/contest-labels";
import type { Contest } from "@/lib/contest-schema";
import { hrefFor, type Locale } from "@/lib/locale";
import { copy } from "@/lib/messages";

export function ContestListCard({
  contest,
  now,
  locale,
}: {
  contest: Contest;
  now: string;
  locale: Locale;
}) {
  const window = deadlineWindow(contest, now);
  const name = displayName(contest, locale);
  const t = copy(locale);

  return (
    <li className="border border-border bg-card">
      <Link
        href={hrefFor(locale, `/contests/${contest.slug}`)}
        className="flex gap-3 p-3 outline-none focus-visible:bg-muted sm:gap-4 sm:p-4"
      >
        <ContestThumb
          name={name}
          locale={locale}
          width={96}
          height={72}
          className="h-[72px] w-24 shrink-0"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-1.5">
            <Badge
              variant={window === "open" ? "default" : "outline"}
              className={window === "closed" ? "text-muted-foreground" : undefined}
            >
              {windowChipLabel(window, locale)}
            </Badge>
            <Badge variant={contest.status === "published" ? "default" : "outline"}>
              {statusLabel(contest.status, locale)}
            </Badge>
            <Badge variant="secondary">
              {relevanceLabel(contest.street_photo_relevance, locale)}
            </Badge>
            <Badge variant="outline">{feeLabel(contest.fee, locale)}</Badge>
            <RightsChip contest={contest} locale={locale} />
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-3">
            <h2 className="font-serif text-xl leading-snug text-foreground sm:text-2xl">{name}</h2>
            <p className="shrink-0 text-sm text-muted-foreground">
              {displayEdition(contest, locale) ?? t.editionMissing}
            </p>
          </div>
          <p
            className={
              window === "open"
                ? "mt-1 text-sm text-caution"
                : "mt-1 text-sm text-muted-foreground"
            }
          >
            {t.deadline}{" "}
            {contest.deadline_at ? formatContestDate(contest.deadline_at, locale) : t.dateUnset}
          </p>
        </div>
      </Link>
    </li>
  );
}
