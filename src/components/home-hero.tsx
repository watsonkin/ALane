"use client";

import Link from "next/link";
import { ContestMasthead } from "@/components/contest-list-card";
import { selectClosingSoon } from "@/lib/contest-labels";
import type { Contest } from "@/lib/contest-schema";
import { hrefFor, type Locale } from "@/lib/locale";
import { copy } from "@/lib/messages";
import { useNow } from "@/lib/use-now";

const closingCardClass =
  "flex h-full w-full flex-col rounded-[8px] border border-line px-4 py-4 outline-none transition-colors hover:bg-paper-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

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
            <ul className="mt-4 flex gap-3 overflow-x-auto py-1">
              {closing.contests.map((contest) => (
                <li key={contest.id} className="flex w-72 shrink-0">
                  <Link
                    href={hrefFor(locale, `/contests/${contest.slug}`)}
                    className={closingCardClass}
                  >
                    <ContestMasthead contest={contest} now={now} locale={locale} heading="h3" />
                  </Link>
                </li>
              ))}
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
