import { ExternalLink } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { ContestSocialLinks } from "@/components/contest-social-links";
import { ContestWindowChip } from "@/components/contest-window-chip";
import { RightsChip } from "@/components/rights-chip";
import { WinnerIndexCard } from "@/components/winner-index-card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  adapterLabel,
  displayEdition,
  displayName,
  galleryLinkText,
  feeLabel,
  formatContestDate,
  formatPlace,
  healthLabel,
  relevanceLabel,
  rightsTagLabel,
  statusLabel,
} from "@/lib/contest-labels";
import type { Contest, RightsTag } from "@/lib/contest-schema";
import { hrefFor, type Locale } from "@/lib/locale";
import { copy, type Copy } from "@/lib/messages";
import { cn } from "@/lib/utils";

function MetaItem({
  label,
  children,
  emphasize = false,
}: {
  label: string;
  children: ReactNode;
  emphasize?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border py-2 text-[13px]">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd
        className={
          emphasize
            ? "text-right text-sm font-medium text-caution"
            : "text-right text-ink"
        }
      >
        {children}
      </dd>
    </div>
  );
}

function rightsSummary(contest: Contest, locale: Locale, t: Copy): string {
  if (contest.rights_tags.length > 0) {
    return t.rightsSummaryTags(
      contest.rights_tags.map((tag) => rightsTagLabel(tag, locale)).join(t.tagSep),
    );
  }
  if (contest.health === "warn" || contest.health === "dead") return t.rightsSummaryCaution;
  if (contest.health === "ok") return t.rightsSummaryOk;
  return t.rightsSummaryUnknown;
}

function placeValue(contest: Contest, locale: Locale): string {
  const place = formatPlace(contest, locale);
  const extra = [contest.geo?.country, contest.geo?.city].filter(Boolean);
  if (extra.length === 0 || place.includes(extra.join(""))) return place;
  return locale === "en"
    ? `${place} (${extra.join(" · ")})`
    : `${place}（${extra.join(" · ")}）`;
}

export function ContestDetail({
  contest,
  asOf,
  locale,
}: {
  contest: Contest;
  asOf: string;
  locale: Locale;
}) {
  const t = copy(locale);
  const name = displayName(contest, locale);
  const edition = displayEdition(contest, locale);

  return (
    <article className="max-w-[760px]">
      <p className="mb-4 text-sm">
        <Link href={hrefFor(locale, "/")} className="text-accent underline-offset-4 hover:underline">
          {t.backToAll}
        </Link>
      </p>

      <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-2">
            <ContestWindowChip deadlineAt={contest.deadline_at} asOf={asOf} locale={locale} />
            <Badge variant="secondary">
              {relevanceLabel(contest.street_photo_relevance, locale)}
            </Badge>
            <Badge variant="outline">{feeLabel(contest.fee, locale)}</Badge>
          </div>
          <h1 className="mt-2 font-serif text-[30px] font-semibold leading-tight text-ink">{name}</h1>
        </div>
        <a
          href={contest.official_url}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            buttonVariants({ size: "lg" }),
            "h-10 w-full shrink-0 px-4 text-sm md:w-auto",
          )}
        >
          {t.openOfficial}
          <ExternalLink aria-hidden="true" />
        </a>
      </header>
      {contest.health === "dead" ? (
        <p className="mt-2 text-sm text-caution">{t.linkMayBeDead}</p>
      ) : null}

      <div className="mt-3 grid grid-cols-1 gap-x-8 sm:grid-cols-2">
        <dl>
          <MetaItem label={t.deadline} emphasize>
            {contest.deadline_at ? formatContestDate(contest.deadline_at, locale) : t.dateTbd}
          </MetaItem>
          {contest.open_at ? (
            <MetaItem label={t.opens}>{formatContestDate(contest.open_at, locale)}</MetaItem>
          ) : null}
          {contest.announce_at ? (
            <MetaItem label={t.announced}>{formatContestDate(contest.announce_at, locale)}</MetaItem>
          ) : null}
          {contest.geo || contest.online ? (
            <MetaItem label={t.place}>
              {contest.geo ? placeValue(contest, locale) : formatPlace(contest, locale)}
            </MetaItem>
          ) : null}
          <MetaItem label={t.fee}>{feeLabel(contest.fee, locale)}</MetaItem>
        </dl>
        <dl>
          <MetaItem label={t.relevance}>
            {relevanceLabel(contest.street_photo_relevance, locale)}
          </MetaItem>
          {edition ? <MetaItem label={t.edition}>{edition}</MetaItem> : null}
          <MetaItem label={t.rights}>
            <RightsChip contest={contest} locale={locale} />
          </MetaItem>
        </dl>
      </div>

      {contest.rights_tags.length > 0 ? (
        <details className="group mt-4 text-sm leading-snug text-muted-foreground">
          <summary className="flex cursor-pointer list-none items-baseline gap-2 [&::-webkit-details-marker]:hidden">
            <span className="min-w-0 text-ink">{rightsSummary(contest, locale, t)}</span>
            <span className="shrink-0 text-accent group-open:hidden">{t.show}</span>
            <span className="hidden shrink-0 text-accent group-open:inline">{t.hide}</span>
          </summary>
          <ul className="mt-2 space-y-1">
            {contest.rights_tags.map((tag) => (
              <li key={tag}>
                {rightsTagLabel(tag, locale)}
                {locale === "en" ? ": " : "："}
                {t.rightsNotes[tag as RightsTag]}
              </li>
            ))}
            <li>{t.rightsDisclaimer}</li>
          </ul>
        </details>
      ) : null}

      <ContestSocialLinks contest={contest} locale={locale} />

      <section className="mt-4">
        <h2 className="text-base font-semibold text-ink">{t.winnerIndex}</h2>
        <p className="mt-1 text-sm leading-snug text-muted-foreground">{t.winnerHint}</p>
        {contest.gallery_works.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">{t.noWorks}</p>
        ) : (
          <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            {contest.gallery_works.map((work) => (
              <li key={work.source_page_url}>
                <WinnerIndexCard work={work} locale={locale} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-4">
        <h2 className="text-base font-semibold text-ink">{t.galleries}</h2>
        {contest.gallery_urls.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">{t.noGalleries}</p>
        ) : (
          <ul className="mt-1">
            {contest.gallery_urls.map((gallery) => (
              <li key={gallery.url} className="border-b border-border py-2 text-sm">
                <a
                  href={gallery.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent underline-offset-4 hover:underline"
                >
                  {galleryLinkText(gallery, locale, t.gallery)}
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      <details className="mt-4 border-t border-border pt-2">
        <summary className="cursor-pointer py-2 text-sm font-semibold text-ink">{t.technical}</summary>
        <dl className="pb-2 text-[13px]">
          {contest.open_at ? null : <MetaItem label={t.opens}>{t.notRecorded}</MetaItem>}
          {contest.announce_at ? null : <MetaItem label={t.announced}>{t.notRecorded}</MetaItem>}
          {contest.geo ? null : <MetaItem label={t.geo}>{t.notRecorded}</MetaItem>}
          {edition ? null : <MetaItem label={t.edition}>{t.notRecorded}</MetaItem>}
          <MetaItem label={t.publishStatus}>{statusLabel(contest.status, locale)}</MetaItem>
          <MetaItem label={t.health}>{healthLabel(contest.health, locale)}</MetaItem>
          <MetaItem label="slug">{contest.slug}</MetaItem>
          <MetaItem label={t.officialSite}>{contest.official_url}</MetaItem>
          <MetaItem label={t.sources}>
            {contest.source_adapters
              .map((adapter) => `${adapter.id} · ${adapterLabel(adapter.kind, locale)}`)
              .join(t.sourceSep) || t.sourcesEmpty}
          </MetaItem>
          <MetaItem label={t.lastFetch}>{contest.last_fetched_at ?? t.notFetched}</MetaItem>
          <MetaItem label={t.contentHash}>{contest.content_hash ?? t.none}</MetaItem>
        </dl>
      </details>
    </article>
  );
}
