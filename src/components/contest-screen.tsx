import { Suspense } from "react";
import type { Metadata } from "next";
import { ContestDetail } from "@/components/contest-detail";
import { MissingContest } from "@/components/missing-contest";
import { displayName } from "@/lib/contest-labels";
import { loadContestBySlug } from "@/lib/contests";
import type { Locale } from "@/lib/locale";
import { copy } from "@/lib/messages";

type ContestParams = Promise<{ slug: string }>;

export async function contestMetadata(locale: Locale, params: ContestParams): Promise<Metadata> {
  const { slug } = await params;
  const contest = await loadContestBySlug(slug);
  const t = copy(locale);
  if (!contest) return { title: t.missingTitle };
  const name = displayName(contest, locale);
  return {
    title: name,
    description: t.contestDescription(name),
  };
}

export function ContestScreen({ locale, params }: { locale: Locale; params: ContestParams }) {
  const t = copy(locale);
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">{t.openingContest}</p>}>
      <ContestResolved locale={locale} params={params} />
    </Suspense>
  );
}

async function ContestResolved({ locale, params }: { locale: Locale; params: ContestParams }) {
  const { slug } = await params;
  const contest = await loadContestBySlug(slug);
  if (!contest) return <MissingContest slug={slug} locale={locale} />;
  return <ContestDetail contest={contest} asOf={new Date().toISOString()} locale={locale} />;
}
