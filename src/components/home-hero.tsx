"use client";

import { ContestMasthead } from "@/components/contest-list-card";
import { LocaleLink } from "@/components/locale-link";
import { selectClosingSoon } from "@/lib/contest-labels";
import type { Contest } from "@/lib/contest-schema";
import type { Locale } from "@/lib/locale";
import { copy } from "@/lib/messages";
import { reminderCopy } from "@/lib/reminders/copy";
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

  return (
    <section className="mb-6 border-b border-border pb-6">
      <div>
        <h2 className="font-serif text-2xl">{t.closingTitle}</h2>
        {closing.contests.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            {t.closingEmpty}
            <LocaleLink
              href="#contest-list"
              className="ml-2 text-accent underline-offset-4 hover:underline"
            >
              {t.viewAll}
            </LocaleLink>
          </p>
        ) : (
          <>
            <ul className="mt-4 flex gap-3 overflow-x-auto py-1">
              {closing.contests.map((contest) => (
                <li key={contest.id} className="flex w-72 shrink-0">
                  <LocaleLink
                    href={`/contests/${contest.slug}`}
                    className={closingCardClass}
                  >
                    <ContestMasthead contest={contest} now={now} locale={locale} heading="h3" />
                  </LocaleLink>
                </li>
              ))}
            </ul>
            {closing.truncated ? (
              <p className="mt-3 text-sm text-muted-foreground">
                <LocaleLink
                  href="/?window=open#contest-list"
                  className="text-accent underline-offset-4 hover:underline"
                >
                  {t.viewOpen}
                </LocaleLink>
              </p>
            ) : null}
          </>
        )}
        <p className="mt-4 text-xs text-muted-foreground">
          <LocaleLink href="/reminders" className="hover:text-ink">
            {reminderCopy(locale).link}
          </LocaleLink>
        </p>
      </div>
    </section>
  );
}
