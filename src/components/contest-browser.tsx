"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ContestListCard } from "@/components/contest-list-card";
import { Button } from "@/components/ui/button";
import {
  FEE_FILTERS,
  REGION_FILTERS,
  RELEVANCE_FILTERS,
  STATUS_FILTERS,
  WINDOW_FILTERS,
  compareByWindow,
  deadlineWindow,
  feeFilters,
  matchesRegion,
  regionFilters,
  relevanceFilters,
  statusFilters,
  windowFilters,
  type FeeFilter,
  type RegionFilter,
  type RelevanceFilter,
  type StatusFilter,
  type WindowFilter,
} from "@/lib/contest-labels";
import type { Contest } from "@/lib/contest-schema";
import type { Locale } from "@/lib/locale";
import { copy } from "@/lib/messages";
import { useNow } from "@/lib/use-now";

function subscribeHydration() {
  return () => {};
}

function hydratedOnClient() {
  return true;
}

function hydratedOnServer() {
  return false;
}

/** Search params differ from the static HTML. Apply them only after hydration. */
function useHydrated(): boolean {
  return useSyncExternalStore(subscribeHydration, hydratedOnClient, hydratedOnServer);
}

function pick<T extends string>(
  raw: string | null,
  allowed: readonly { value: T }[],
): T | "all" {
  if (raw && allowed.some((option) => option.value === raw)) return raw as T;
  return "all";
}

function FilterGroup<T extends string>({
  legend,
  options,
  value,
  onChange,
  nowrap = false,
}: {
  legend: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  nowrap?: boolean;
}) {
  return (
    <fieldset className={nowrap ? "shrink-0" : "min-w-0 max-w-full"}>
      <legend className="mb-2 text-[12px] leading-none text-muted-foreground">{legend}</legend>
      <div className={nowrap ? "flex flex-nowrap gap-2" : "flex flex-wrap gap-2"}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Button
              key={option.value}
              type="button"
              size="sm"
              variant={selected ? "default" : "outline"}
              aria-pressed={selected}
              onClick={() => onChange(option.value)}
            >
              {option.label}
            </Button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function ContestBrowser({
  contests,
  asOf,
  locale,
}: {
  contests: Contest[];
  asOf: string;
  locale: Locale;
}) {
  const t = copy(locale);
  const now = useNow(asOf);
  const hydrated = useHydrated();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [expanded, setExpanded] = useState(false);

  const status = hydrated
    ? pick<Exclude<StatusFilter, "all">>(
        searchParams.get("status"),
        STATUS_FILTERS.filter((option) => option.value !== "all"),
      )
    : "all";
  const relevance = hydrated
    ? pick<Exclude<RelevanceFilter, "all">>(
        searchParams.get("relevance"),
        RELEVANCE_FILTERS.filter((option) => option.value !== "all"),
      )
    : "all";
  const fee = hydrated
    ? pick<Exclude<FeeFilter, "all">>(
        searchParams.get("fee"),
        FEE_FILTERS.filter((option) => option.value !== "all"),
      )
    : "all";
  const windowRaw = hydrated ? searchParams.get("window") : null;
  const windowFilter: WindowFilter =
    windowRaw === null
      ? "all"
      : pick<Exclude<WindowFilter, "all">>(
          windowRaw,
          WINDOW_FILTERS.filter((option) => option.value !== "all"),
        );
  const region = hydrated
    ? pick<Exclude<RegionFilter, "all">>(
        searchParams.get("region"),
        REGION_FILTERS.filter((option) => option.value !== "all"),
      )
    : "all";

  function write(key: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (key === "window") {
      if (value === "all") next.delete("window");
      else next.set("window", value);
    } else if (value === "all") next.delete(key);
    else next.set(key, value);
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  const visible = useMemo(
    () =>
      contests
        .filter((contest) => {
          if (status !== "all" && contest.status !== status) return false;
          if (relevance !== "all" && contest.street_photo_relevance !== relevance) {
            return false;
          }
          if (fee !== "all" && contest.fee !== fee) return false;
          if (windowFilter !== "all" && deadlineWindow(contest, now) !== windowFilter) {
            return false;
          }
          if (!matchesRegion(contest, region)) return false;
          return true;
        })
        .sort((a, b) => compareByWindow(a, b, now, locale)),
    [contests, fee, locale, now, region, relevance, status, windowFilter],
  );

  const filtersActive =
    status !== "all" ||
    relevance !== "all" ||
    fee !== "all" ||
    windowFilter !== "all" ||
    region !== "all";

  if (contests.length === 0) {
    return (
      <div className="border border-dashed border-border bg-card px-4 py-10 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">{t.noContests}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="border border-border bg-card p-4">
        <div className="flex items-end gap-3">
          <div className="relative min-w-0 flex-1">
            <div className="contest-filter-scroller flex flex-nowrap items-end gap-3 overflow-x-auto pr-4">
              <FilterGroup
                nowrap
                legend={t.filterWindow}
                options={windowFilters(locale)}
                value={windowFilter}
                onChange={(value) => write("window", value)}
              />
              <FilterGroup
                nowrap
                legend={t.filterFee}
                options={feeFilters(locale)}
                value={fee}
                onChange={(value) => write("fee", value)}
              />
              <FilterGroup
                nowrap
                legend={t.filterRegion}
                options={regionFilters(locale)}
                value={region}
                onChange={(value) => write("region", value)}
              />
            </div>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-card to-transparent"
            />
          </div>
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls="contest-filter-panel"
            onClick={() => setExpanded((open) => !open)}
            className="inline-flex h-7 shrink-0 items-center gap-1 whitespace-nowrap rounded-sm px-1 text-[13px] leading-none text-[#5C5C5C] hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {expanded ? t.hideFilters : t.showFilters}
            <span aria-hidden="true">{expanded ? "▴" : "▾"}</span>
          </button>
        </div>
        <div
          id="contest-filter-panel"
          data-expanded={expanded ? "true" : "false"}
          inert={expanded ? undefined : true}
          aria-hidden={expanded ? undefined : true}
          className="contest-filter-panel"
        >
          <div className="contest-filter-panel-body flex flex-wrap items-start gap-x-3 gap-y-3">
            <FilterGroup
              legend={t.filterStatus}
              options={statusFilters(locale)}
              value={status}
              onChange={(value) => write("status", value)}
            />
            <FilterGroup
              legend={t.filterRelevance}
              options={relevanceFilters(locale)}
              value={relevance}
              onChange={(value) => write("relevance", value)}
            />
          </div>
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {t.showing(visible.length, contests.length)}
        </p>
        {filtersActive ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => router.replace(pathname, { scroll: false })}
          >
            {t.clearFilters}
          </Button>
        ) : null}
      </div>

      {visible.length === 0 ? (
        <div className="border border-dashed border-border px-4 py-10 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">{t.noMatches}</p>
          <p className="mt-2">{t.noMatchesHint}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {visible.map((contest) => (
            <ContestListCard key={contest.id} contest={contest} now={now} locale={locale} />
          ))}
        </ul>
      )}
    </div>
  );
}
