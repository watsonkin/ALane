import { Calendar, ExternalLink } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { ContestDetailChips } from "@/components/contest-detail-chips";
import { ContestSocialLinks } from "@/components/contest-social-links";
import { WinnerIndexRow } from "@/components/winner-index-card";
import {
  adapterLabel,
  displayEdition,
  displayName,
  galleryLinkText,
  feeLabel,
  formatContestDate,
  formatPlace,
  healthLabel,
  rightsTagLabel,
  statusLabel,
} from "@/lib/contest-labels";
import { calendarOmitReason } from "@/lib/contest-ics";
import type { Contest, RightsTag } from "@/lib/contest-schema";
import { hrefFor, type Locale } from "@/lib/locale";
import { copy, type Copy } from "@/lib/messages";

const textLinkClass =
  "inline-flex items-center gap-1.5 text-[15px] text-accent underline decoration-line underline-offset-4 outline-none hover:decoration-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

function MetaItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border py-2 text-[13px]">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="text-right text-ink">{children}</dd>
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

function detailMeta(contest: Contest, locale: Locale, t: Copy): string | null {
  const parts: string[] = [t.officialSite, feeLabel(contest.fee, locale)];
  if (contest.open_at) parts.push(`${t.opens} ${formatContestDate(contest.open_at, locale)}`);
  if (contest.announce_at) {
    parts.push(`${t.announced} ${formatContestDate(contest.announce_at, locale)}`);
  }
  if (contest.geo || contest.online) parts.push(placeValue(contest, locale));
  const edition = displayEdition(contest, locale);
  if (edition) parts.push(edition);
  const line = parts.map((part) => part.trim()).filter(Boolean).join(" · ");
  return line || null;
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
  const meta = detailMeta(contest, locale, t);
  const officialUrl = contest.official_url.trim();
  const calendarHref = calendarOmitReason(contest)
    ? null
    : hrefFor(locale, `/contests/${contest.slug}/calendar`);
  const dated = Boolean(contest.deadline_at);

  return (
    <article className="max-w-[760px]">
      <p className="mb-4 text-sm">
        <Link href={hrefFor(locale, "/")} className="text-accent underline-offset-4 hover:underline">
          {t.backToAll}
        </Link>
      </p>

      <header className="border-b border-line pb-6">
        <ContestDetailChips
          contest={{
            deadline_at: contest.deadline_at,
            status: contest.status,
            street_photo_relevance: contest.street_photo_relevance,
            fee: contest.fee,
            health: contest.health,
            rights_tags: contest.rights_tags,
          }}
          asOf={asOf}
          locale={locale}
        />
        <h1 className="mt-2 font-serif text-[28px] font-semibold leading-tight text-ink sm:text-[32px]">
          {name}
        </h1>
        <p
          className={
            dated
              ? "mt-3 flex items-center gap-1.5 text-[15px] leading-6 text-caution"
              : "mt-3 flex items-center gap-1.5 text-[15px] leading-6 text-soft"
          }
        >
          <Calendar aria-hidden="true" className="size-4 shrink-0" />
          <span>
            {t.deadline}{" "}
            {contest.deadline_at ? formatContestDate(contest.deadline_at, locale) : t.dateTbd}
          </span>
        </p>
        {meta ? <p className="mt-2 text-[13px] leading-5 text-soft">{meta}</p> : null}
        {contest.health === "dead" ? (
          <p className="mt-2 text-sm text-caution">{t.linkMayBeDead}</p>
        ) : null}
        {officialUrl || calendarHref ? (
          <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
            {officialUrl ? (
              <a
                href={officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={textLinkClass}
              >
                {t.openOfficial}
                <ExternalLink aria-hidden="true" className="size-3.5" />
              </a>
            ) : null}
            {officialUrl && calendarHref ? (
              <span aria-hidden="true" className="text-line">
                |
              </span>
            ) : null}
            {calendarHref ? (
              <a href={calendarHref} download={`${contest.slug}.ics`} className={textLinkClass}>
                {t.addToCalendar}
                <Calendar aria-hidden="true" className="size-3.5" />
              </a>
            ) : null}
          </p>
        ) : null}
      </header>

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

      <section className="mt-8">
        <h2 className="font-serif text-xl text-ink">{t.winnerIndex}</h2>
        <p className="mt-1 text-sm leading-snug text-soft">{t.winnerHint}</p>
        {contest.gallery_works.length === 0 ? (
          <p className="mt-3 text-sm text-soft">{t.noWorks}</p>
        ) : (
          <ul className="mt-4 border-t border-line">
            {contest.gallery_works.map((work, index) => (
              <li key={work.source_page_url || work.title || String(index)}>
                <WinnerIndexRow work={work} locale={locale} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h2 className="font-serif text-xl text-ink">{t.galleries}</h2>
        {contest.gallery_urls.length === 0 ? (
          <p className="mt-3 text-sm text-soft">{t.noGalleries}</p>
        ) : (
          <ul className="mt-4 border-t border-line">
            {contest.gallery_urls.map((gallery) => {
              const label = galleryLinkText(gallery, locale, t.gallery);
              const sourceUrl = gallery.url.trim();
              return (
                <li key={gallery.url} className="border-b border-line py-3">
                  {sourceUrl ? (
                    <a
                      href={sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-serif text-lg text-accent underline decoration-line underline-offset-4 outline-none hover:decoration-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    >
                      {label}
                      <ExternalLink aria-hidden="true" className="size-3.5" />
                    </a>
                  ) : (
                    <p className="font-serif text-lg leading-snug text-ink">{label}</p>
                  )}
                  <p className="mt-1 text-xs leading-5 text-soft">{t.fromSource}</p>
                </li>
              );
            })}
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
