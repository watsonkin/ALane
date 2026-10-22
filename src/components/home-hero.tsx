"use client";

import Link from "next/link";
import { RightsChip } from "@/components/rights-chip";
import { ContestThumb } from "@/components/thumb-placeholder";
import { Badge } from "@/components/ui/badge";
import {
  deadlineWindow,
  displayName,
  feeLabel,
  formatContestDate,
  selectClosingSoon,
  windowChipLabel,
} from "@/lib/contest-labels";
import type { Contest } from "@/lib/contest-schema";
import { hrefFor, type Locale } from "@/lib/locale";
import { copy } from "@/lib/messages";
import { useNow } from "@/lib/use-now";

export function HomeHero({
  contests,
  asOf,
  locale,
}: {
  contests: Contest[];
  asOf: string;
  locale: Locale;
}) {
  const now = useNow(asOf);
  const closing = selectClosingSoon(contests, now);
  const t = copy(locale);
  const home = hrefFor(locale, "/");

  return (
    <section className="mb-6 border-b border-border pb-6">
      <div>
        <h2 className="font-serif text-2xl">{t.closingTitle}</h2>
        {closing.contests.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            {t.closingEmpty}
            <Link
              href="#contest-list"
              className="ml-2 text-accent underline-offset-4 hover:underline"
            >
              {t.viewAll}
            </Link>
          </p>
        ) : (
          <>
            <ul className="mt-4 flex gap-3 overflow-x-auto pb-1">
              {closing.contests.map((contest) => {
                const name = displayName(contest, locale);
                const status = deadlineWindow(contest, now);
                return (
                  <li key={contest.id} className="flex w-56 shrink-0">
                    <Link
                      href={hrefFor(locale, `/contests/${contest.slug}`)}
                      className="flex h-full w-full flex-col rounded-[4px] border border-border bg-card p-3 outline-none focus-visible:bg-muted"
                    >
                      <ContestThumb
                        name={name}
                        locale={locale}
                        width={200}
                        height={64}
                        className="h-16 w-full shrink-0"
                      />
                      <p className="mt-3 line-clamp-2 font-serif text-lg leading-snug">{name}</p>
                      <p
                        className={
                          status === "open"
                            ? "mt-2 text-sm text-caution"
                            : "mt-2 text-sm text-muted-foreground"
                        }
                      >
                        {formatContestDate(contest.deadline_at ?? "", locale)}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <Badge
                          variant={status === "open" ? "default" : "outline"}
                          className={status === "closed" ? "text-muted-foreground" : undefined}
                        >
                          {windowChipLabel(status, locale)}
                        </Badge>
                        <Badge variant="outline">{feeLabel(contest.fee, locale)}</Badge>
                        <RightsChip contest={contest} locale={locale} />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
            {closing.truncated ? (
              <p className="mt-3 text-sm text-muted-foreground">
                <Link
                  href={`${home}?window=open#contest-list`}
                  className="text-accent underline-offset-4 hover:underline"
                >
                  {t.viewOpen}
                </Link>
              </p>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}
