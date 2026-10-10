"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FEE_FILTERS,
  FEE_LABEL,
  HEALTH_LABEL,
  REGION_FILTERS,
  RELEVANCE_FILTERS,
  RELEVANCE_LABEL,
  STATUS_FILTERS,
  STATUS_LABEL,
  WINDOW_FILTERS,
  deadlineWindow,
  formatContestDate,
  formatPlace,
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
  const windowFilter = pick<Exclude<WindowFilter, "all">>(
    searchParams.get("window"),
    WINDOW_FILTERS.filter((option) => option.value !== "all"),
  );
  const region = pick<Exclude<RegionFilter, "all">>(
    searchParams.get("region"),
    REGION_FILTERS.filter((option) => option.value !== "all"),
  );

  function write(key: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value === "all") next.delete(key);
    else next.set(key, value);
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  const visible = useMemo(
    () =>
      contests.filter((contest) => {
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
      }),
    [asOf, contests, fee, region, relevance, status, windowFilter],
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
          legend="开放窗口"
          options={WINDOW_FILTERS}
          value={windowFilter}
          onChange={(value) => write("window", value)}
        />
        <p className="max-w-3xl text-xs leading-5 text-muted-foreground">
          「开放中」只包含填写了截止时间、且截止不早于本次构建时刻的赛事。没有截止时间的归入「日期未定」，不会算作开放中。这次的判断时刻是{" "}
          {formatContestDate(asOf)}，重新部署后会更新。
        </p>
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
        <p className="max-w-3xl text-xs leading-5 text-muted-foreground">
          「含线上」包括纯线上和线上加实地的赛事。国家按种子里的国家代码分成中国、欧洲、美洲、大洋洲和其他地区；既线上又有国家的赛事，两边都会出现。
        </p>
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
