"use client";

import { useMemo } from "react";
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
  matchesRegion,
  type FeeFilter,
  type RegionFilter,
  type RelevanceFilter,
  type StatusFilter,
  type WindowFilter,
} from "@/lib/contest-labels";
import type { Contest } from "@/lib/contest-schema";

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
}: {
  legend: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-2 text-xs text-muted-foreground">{legend}</legend>
      <div className="flex flex-wrap gap-2">
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
}: {
  contests: Contest[];
  asOf: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const status = pick<Exclude<StatusFilter, "all">>(
    searchParams.get("status"),
    STATUS_FILTERS.filter((option) => option.value !== "all"),
  );
  const relevance = pick<Exclude<RelevanceFilter, "all">>(
    searchParams.get("relevance"),
    RELEVANCE_FILTERS.filter((option) => option.value !== "all"),
  );
  const fee = pick<Exclude<FeeFilter, "all">>(
    searchParams.get("fee"),
    FEE_FILTERS.filter((option) => option.value !== "all"),
  );
  const windowRaw = searchParams.get("window");
  const windowFilter: WindowFilter =
    windowRaw === null
      ? "open"
      : pick<Exclude<WindowFilter, "all">>(
          windowRaw,
          WINDOW_FILTERS.filter((option) => option.value !== "all"),
        );
  const region = pick<Exclude<RegionFilter, "all">>(
    searchParams.get("region"),
    REGION_FILTERS.filter((option) => option.value !== "all"),
  );

  function write(key: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (key === "window") {
      if (value === "open") next.delete("window");
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
          if (windowFilter !== "all" && deadlineWindow(contest, asOf) !== windowFilter) {
            return false;
          }
          if (!matchesRegion(contest, region)) return false;
          return true;
        })
        .sort((a, b) => compareByWindow(a, b, asOf)),
    [asOf, contests, fee, region, relevance, status, windowFilter],
  );

  const filtersActive =
    status !== "all" ||
    relevance !== "all" ||
    fee !== "all" ||
    windowFilter !== "open" ||
    region !== "all";

  if (contests.length === 0) {
    return (
      <div className="border border-dashed border-border bg-card px-4 py-10 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">还没有赛事。</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4 border border-border bg-card p-4">
        <FilterGroup
          legend="开放窗口"
          options={WINDOW_FILTERS}
          value={windowFilter}
          onChange={(value) => write("window", value)}
        />
        <FilterGroup
          legend="费用"
          options={FEE_FILTERS}
          value={fee}
          onChange={(value) => write("fee", value)}
        />
        <FilterGroup
          legend="地区"
          options={REGION_FILTERS}
          value={region}
          onChange={(value) => write("region", value)}
        />
        <FilterGroup
          legend="状态（辅助）"
          options={STATUS_FILTERS}
          value={status}
          onChange={(value) => write("status", value)}
        />
        <FilterGroup
          legend="街拍相关（辅助）"
          options={RELEVANCE_FILTERS}
          value={relevance}
          onChange={(value) => write("relevance", value)}
        />
      </div>

      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {contests.length} 场里显示 {visible.length} 场
        </p>
        {filtersActive ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => router.replace(pathname, { scroll: false })}
          >
            清除筛选
          </Button>
        ) : null}
      </div>

      {visible.length === 0 ? (
        <div className="border border-dashed border-border px-4 py-10 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">没有符合当前筛选的赛事。</p>
          <p className="mt-2">放宽开放窗口、费用、地区，或辅助的状态和相关度后再看一眼。</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {visible.map((contest) => (
            <ContestListCard key={contest.id} contest={contest} asOf={asOf} />
          ))}
        </ul>
      )}
    </div>
  );
}
