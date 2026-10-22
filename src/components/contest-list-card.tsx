import { Calendar } from "lucide-react";
import Link from "next/link";
import { ContestFactChips } from "@/components/contest-fact-chips";
import {
  contestYear,
  deadlineWindow,
  displayName,
  formatContestDate,
} from "@/lib/contest-labels";
import type { Contest } from "@/lib/contest-schema";
import { hrefFor, type Locale } from "@/lib/locale";
import { copy } from "@/lib/messages";

export function ContestMasthead({
  contest,
  now,
  locale,
  heading = "h2",
}: {
  contest: Contest;
  now: string;
  locale: Locale;
  heading?: "h2" | "h3";
}) {
  const window = deadlineWindow(contest, now);
  const name = displayName(contest, locale);
  const t = copy(locale);
  const year = contestYear(contest, locale);
  const dated = Boolean(contest.deadline_at);
  const Title = heading;

  return (
    <div className="min-w-0">
      <ContestFactChips contest={contest} window={window} locale={locale} />
      <Title className="mt-2 line-clamp-2 font-serif text-[19px] font-semibold leading-snug text-ink">
        {name}
      </Title>
      <div className="mt-2 flex items-baseline justify-between gap-3">
        <p
          className={
            dated
              ? "flex min-w-0 items-center gap-1.5 text-[13px] leading-5 text-caution"
              : "flex min-w-0 items-center gap-1.5 text-[13px] leading-5 text-soft"
          }
        >
          <Calendar aria-hidden="true" className="size-3.5 shrink-0" />
          <span>
            {t.deadline}{" "}
            {contest.deadline_at ? formatContestDate(contest.deadline_at, locale) : t.dateTbd}
          </span>
        </p>
        {year ? (
          <p className="shrink-0 font-serif text-[17px] leading-none text-soft">{year}</p>
        ) : null}
      </div>
    </div>
  );
}

const listRowClass =
  "block border-b border-line px-4 py-4 outline-none transition-colors hover:bg-paper-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:px-5";

export function ContestListCard({
  contest,
  now,
  locale,
}: {
  contest: Contest;
  now: string;
  locale: Locale;
}) {
  return (
    <li>
      <Link href={hrefFor(locale, `/contests/${contest.slug}`)} className={listRowClass}>
        <ContestMasthead contest={contest} now={now} locale={locale} />
      </Link>
    </li>
  );
}
