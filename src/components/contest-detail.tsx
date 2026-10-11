import { ExternalLink } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { RightsChip } from "@/components/rights-chip";
import { WinnerIndexCard } from "@/components/winner-index-card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  ADAPTER_KIND_LABEL,
  FEE_LABEL,
  HEALTH_LABEL,
  RELEVANCE_LABEL,
  RIGHTS_TAG_LABEL,
  STATUS_LABEL,
  deadlineWindow,
  formatContestDate,
  formatPlace,
  windowChipLabel,
} from "@/lib/contest-labels";
import type { Contest, RightsTag } from "@/lib/contest-schema";
import { cn } from "@/lib/utils";

const RIGHTS_TAG_NOTE: Record<RightsTag, string> = {
  transfer_copyright: "条款里出现了版权转让。",
  exclusive: "条款里出现了独家使用。",
  no_payment: "使用作品可能不付酬。",
  moral_rights_waived: "条款里出现了放弃精神权利。",
};

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

function rightsSummary(contest: Contest): string {
  if (contest.rights_tags.length > 0) {
    return `需留意：${contest.rights_tags.map((tag) => RIGHTS_TAG_LABEL[tag]).join("、")}。`;
  }
  if (contest.health === "warn" || contest.health === "dead") {
    return "该条目标成需留意，条款以官网为准。";
  }
  if (contest.health === "ok") {
    return "未记录版权转让、独家、无报酬或放弃精神权利。";
  }
  return "权利尚未评估。";
}

function placeValue(contest: Contest): string {
  const place = formatPlace(contest);
  const extra = [contest.geo?.country, contest.geo?.city].filter(Boolean);
  if (extra.length === 0 || place.includes(extra.join(""))) return place;
  return `${place}（${extra.join(" · ")}）`;
}

export function ContestDetail({
  contest,
  asOf,
}: {
  contest: Contest;
  asOf: string;
}) {
  const window = deadlineWindow(contest, asOf);

  return (
    <article className="max-w-[760px]">
      <p className="mb-4 text-sm">
        <Link href="/" className="text-accent underline-offset-4 hover:underline">
          ← 全部赛事
        </Link>
      </p>

      <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={window === "open" ? "default" : "outline"}
              className={window === "closed" ? "text-muted-foreground" : undefined}
            >
              {windowChipLabel(window)}
            </Badge>
            <Badge variant="secondary">
              {RELEVANCE_LABEL[contest.street_photo_relevance]}
            </Badge>
            <Badge variant="outline">{FEE_LABEL[contest.fee]}</Badge>
          </div>
          <h1 className="mt-2 font-serif text-[30px] font-semibold leading-tight text-ink">
            {contest.name}
          </h1>
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
          打开官网
          <ExternalLink aria-hidden="true" />
        </a>
      </header>
      {contest.health === "dead" ? (
        <p className="mt-2 text-sm text-caution">官网链接可能已经失效。</p>
      ) : null}

      <div className="mt-3 grid grid-cols-1 gap-x-8 sm:grid-cols-2">
        <dl>
          <MetaItem label="截止" emphasize>
            {contest.deadline_at ? formatContestDate(contest.deadline_at) : "待定"}
          </MetaItem>
          {contest.open_at ? (
            <MetaItem label="开放">{formatContestDate(contest.open_at)}</MetaItem>
          ) : null}
          {contest.announce_at ? (
            <MetaItem label="公布">{formatContestDate(contest.announce_at)}</MetaItem>
          ) : null}
          {contest.geo || contest.online ? (
            <MetaItem label="地点">
              {contest.geo ? placeValue(contest) : "仅线上"}
            </MetaItem>
          ) : null}
          <MetaItem label="费用">{FEE_LABEL[contest.fee]}</MetaItem>
        </dl>
        <dl>
          <MetaItem label="相关度">
            {RELEVANCE_LABEL[contest.street_photo_relevance]}
          </MetaItem>
          {contest.edition ? <MetaItem label="届次">{contest.edition}</MetaItem> : null}
          <MetaItem label="权利">
            <RightsChip contest={contest} />
          </MetaItem>
        </dl>
      </div>

      {contest.rights_tags.length > 0 ? (
        <details className="group mt-4 text-sm leading-snug text-muted-foreground">
          <summary className="flex cursor-pointer list-none items-baseline gap-2 [&::-webkit-details-marker]:hidden">
            <span className="min-w-0 text-ink">{rightsSummary(contest)}</span>
            <span className="shrink-0 text-accent group-open:hidden">展开</span>
            <span className="hidden shrink-0 text-accent group-open:inline">收起</span>
          </summary>
          <ul className="mt-2 space-y-1">
            {contest.rights_tags.map((tag) => (
              <li key={tag}>
                {RIGHTS_TAG_LABEL[tag]}：{RIGHTS_TAG_NOTE[tag]}
              </li>
            ))}
            <li>权利标签仅供参考，以官方条款为准。</li>
          </ul>
        </details>
      ) : null}

      <section className="mt-4">
        <h2 className="text-base font-semibold text-ink">获奖缩略索引</h2>
        <p className="mt-1 text-sm leading-snug text-muted-foreground">
          点卡片在新标签打开源站的这一件作品。
        </p>
        {contest.gallery_works.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">还没有单件作品页。</p>
        ) : (
          <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            {contest.gallery_works.map((work) => (
              <li key={work.source_page_url}>
                <WinnerIndexCard work={work} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-4">
        <h2 className="text-base font-semibold text-ink">获奖廊外链</h2>
        {contest.gallery_urls.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">还没有获奖廊链接。</p>
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
                  {gallery.label ?? "获奖廊"}
                  {gallery.edition ? ` · ${gallery.edition}` : ""}
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      <details className="mt-4 border-t border-border pt-2">
        <summary className="cursor-pointer py-2 text-sm font-semibold text-ink">
          技术/采集信息
        </summary>
        <dl className="pb-2 text-[13px]">
          {contest.open_at ? null : <MetaItem label="开放">未填写</MetaItem>}
          {contest.announce_at ? null : <MetaItem label="公布">未填写</MetaItem>}
          {contest.geo ? null : <MetaItem label="地理">未填写</MetaItem>}
          {contest.edition ? null : <MetaItem label="届次">未填写</MetaItem>}
          <MetaItem label="发布状态">{STATUS_LABEL[contest.status]}</MetaItem>
          <MetaItem label="健康">{HEALTH_LABEL[contest.health]}</MetaItem>
          <MetaItem label="slug">{contest.slug}</MetaItem>
          <MetaItem label="官网">{contest.official_url}</MetaItem>
          <MetaItem label="采集">
            {contest.source_adapters
              .map((adapter) => `${adapter.id} · ${ADAPTER_KIND_LABEL[adapter.kind]}`)
              .join("；") || "未填"}
          </MetaItem>
          <MetaItem label="最近采集">
            {contest.last_fetched_at ?? "未采集"}
          </MetaItem>
          <MetaItem label="内容摘要">{contest.content_hash ?? "无"}</MetaItem>
        </dl>
      </details>
    </article>
  );
}
