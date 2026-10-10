"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FEE_FILTERS,
  FEE_LABEL,
  HEALTH_LABEL,
  PLACE_FILTERS,
  RELEVANCE_FILTERS,
  RELEVANCE_LABEL,
  STATUS_FILTERS,
  STATUS_LABEL,
  formatContestDate,
  formatPlace,
  type FeeFilter,
  type PlaceFilter,
  type RelevanceFilter,
  type StatusFilter,
} from "@/lib/contest-labels";
import type { Contest } from "@/lib/contest-schema";

type Filters = {
  status: StatusFilter;
  relevance: RelevanceFilter;
  fee: FeeFilter;
  place: PlaceFilter;
};

const INITIAL_FILTERS: Filters = {
  status: "all",
  relevance: "all",
  fee: "all",
  place: "all",
};

function matches(contest: Contest, filters: Filters): boolean {
  if (filters.status !== "all" && contest.status !== filters.status) return false;
  if (
    filters.relevance !== "all" &&
    contest.street_photo_relevance !== filters.relevance
  ) {
    return false;
  }
  if (filters.fee !== "all" && contest.fee !== filters.fee) return false;
  if (filters.place === "online" && !contest.online) return false;
  if (filters.place === "offline" && contest.online) return false;
  return true;
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

export function ContestBrowser({ contests }: { contests: Contest[] }) {
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);

  const visible = useMemo(
    () => contests.filter((contest) => matches(contest, filters)),
    [contests, filters],
  );

  const filtersActive =
    filters.status !== "all" ||
    filters.relevance !== "all" ||
    filters.fee !== "all" ||
    filters.place !== "all";

  if (contests.length === 0) {
    return (
      <div className="border border-dashed border-border bg-card px-4 py-10 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">还没有赛事。</p>
        <p className="mt-2">
          在 <code className="font-mono">data/contests/</code> 放一份通过 schema 的 YAML，重新构建后就会出现在这里。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4 border border-border bg-card p-4">
        <FilterGroup
          legend="状态"
          options={STATUS_FILTERS}
          value={filters.status}
          onChange={(status) => setFilters((current) => ({ ...current, status }))}
        />
        <FilterGroup
          legend="街拍相关"
          options={RELEVANCE_FILTERS}
          value={filters.relevance}
          onChange={(relevance) =>
            setFilters((current) => ({ ...current, relevance }))
          }
        />
        <FilterGroup
          legend="费用"
          options={FEE_FILTERS}
          value={filters.fee}
          onChange={(fee) => setFilters((current) => ({ ...current, fee }))}
        />
        <FilterGroup
          legend="形式"
          options={PLACE_FILTERS}
          value={filters.place}
          onChange={(place) => setFilters((current) => ({ ...current, place }))}
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
            onClick={() => setFilters(INITIAL_FILTERS)}
          >
            清除筛选
          </Button>
        ) : null}
      </div>

      {visible.length === 0 ? (
        <div className="border border-dashed border-border px-4 py-10 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">没有符合当前筛选的赛事。</p>
          <p className="mt-2">放宽状态、相关度、费用或形式后再看一眼。</p>
        </div>
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {visible.map((contest) => (
            <li key={contest.id}>
              <Link
                href={`/contests/${contest.slug}`}
                className="block py-5 outline-none focus-visible:bg-muted"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={contest.status === "published" ? "default" : "outline"}>
                    {STATUS_LABEL[contest.status]}
                  </Badge>
                  <Badge variant="secondary">
                    {RELEVANCE_LABEL[contest.street_photo_relevance]}
                  </Badge>
                  <Badge variant="outline">{FEE_LABEL[contest.fee]}</Badge>
                  {contest.health !== "ok" ? (
                    <Badge
                      variant={contest.health === "dead" ? "destructive" : "outline"}
                      className={contest.health === "warn" ? "text-caution" : undefined}
                    >
                      {HEALTH_LABEL[contest.health]}
                    </Badge>
                  ) : null}
                </div>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
                  <h2 className="font-serif text-2xl leading-snug text-foreground">
                    {contest.name}
                  </h2>
                  <p className="shrink-0 text-sm text-muted-foreground">
                    {contest.edition ?? "届次未填"}
                  </p>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {formatPlace(contest)}
                  <span className="px-2 text-border">/</span>
                  <span className="text-caution">
                    截止{" "}
                    {contest.deadline_at
                      ? formatContestDate(contest.deadline_at)
                      : "未定"}
                  </span>
                  <span className="px-2 text-border">/</span>
                  {contest.gallery_urls.length > 0
                    ? `获奖廊 ${contest.gallery_urls.length} 条外链`
                    : "暂无获奖廊"}
                  <span className="px-2 text-border">/</span>
                  {contest.rights_tags.length > 0
                    ? `条款标签 ${contest.rights_tags.length}`
                    : "条款未评估"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
