import Link from "next/link";
import { RightsChip } from "@/components/rights-chip";
import { WinnerIndexCard } from "@/components/winner-index-card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  FEE_LABEL,
  RELEVANCE_LABEL,
  RIGHTS_TAG_LABEL,
  STATUS_LABEL,
  deadlineWindow,
  formatContestDate,
  formatPlace,
  windowChipLabel,
} from "@/lib/contest-labels";
import type { Contest } from "@/lib/contest-schema";
import { cn } from "@/lib/utils";

function DateLine({
  label,
  value,
  tone = "plain",
}: {
  label: string;
  value: string | null;
  tone?: "open" | "closed" | "plain";
}) {
  const toneClass =
    tone === "open" ? "text-caution" : tone === "closed" ? "text-muted-foreground" : undefined;
  return (
    <div className="grid gap-1 border-b border-border py-3 sm:grid-cols-[8rem_minmax(0,1fr)]">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className={toneClass}>
        {value ? (
          formatContestDate(value)
        ) : (
          <span className="text-muted-foreground">未填写</span>
        )}
      </dd>
    </div>
  );
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
    <article>
      <p className="mb-6 text-sm">
        <Link href="/" className="text-accent underline-offset-4 hover:underline">
          全部赛事
        </Link>
      </p>

      <header className="max-w-3xl">
        <div className="flex flex-wrap gap-2">
          <Badge variant={contest.status === "published" ? "default" : "outline"}>
            {STATUS_LABEL[contest.status]}
          </Badge>
          <Badge variant="secondary">
            {RELEVANCE_LABEL[contest.street_photo_relevance]}
          </Badge>
          <Badge variant="outline">{FEE_LABEL[contest.fee]}</Badge>
          <RightsChip contest={contest} />
        </div>
        <h1 className="mt-4 font-serif text-4xl leading-tight text-foreground sm:text-5xl">
          {contest.name}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {contest.edition ? `届次 ${contest.edition}` : "届次未填"}
          <span className="px-2 text-border">/</span>
          {formatPlace(contest)}
        </p>
        <a
          href={contest.official_url}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ size: "lg" }), "mt-6")}
        >
          打开官网
        </a>
        {contest.health === "dead" ? (
          <p className="mt-3 text-sm text-caution">官网链接可能已经失效。</p>
        ) : null}
      </header>

      <div className="mt-10 max-w-3xl space-y-10">
          <section>
            <h2 className="font-serif text-2xl">时间</h2>
            <dl className="mt-3">
              <DateLine label="开放" value={contest.open_at} />
              <DateLine
                label="截止"
                value={contest.deadline_at}
                tone={window === "open" ? "open" : window === "closed" ? "closed" : "plain"}
              />
              <div className="border-b border-border py-3">
                <Badge
                  variant={window === "open" ? "default" : "outline"}
                  className={window === "closed" ? "text-muted-foreground" : undefined}
                >
                  {windowChipLabel(window)}
                </Badge>
              </div>
              <DateLine label="公布" value={contest.announce_at} />
            </dl>
          </section>

          <section>
            <h2 className="font-serif text-2xl">地点</h2>
            <dl className="mt-3 text-sm">
              <div className="grid gap-1 border-b border-border py-3 sm:grid-cols-[8rem_minmax(0,1fr)]">
                <dt className="text-muted-foreground">形式</dt>
                <dd>{contest.online ? "包含线上投稿" : "线下 / 指定地点"}</dd>
              </div>
              <div className="grid gap-1 border-b border-border py-3 sm:grid-cols-[8rem_minmax(0,1fr)]">
                <dt className="text-muted-foreground">地理</dt>
                <dd>
                  {contest.geo ? (
                    <>
                      {contest.geo.label}
                      {contest.geo.city || contest.geo.country ? (
                        <span className="mt-1 block text-muted-foreground">
                          {[contest.geo.country, contest.geo.city]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      ) : null}
                    </>
                  ) : (
                    <span className="text-muted-foreground">无地理信息</span>
                  )}
                </dd>
              </div>
            </dl>
          </section>

          <section>
            <h2 className="font-serif text-2xl">权利</h2>
            <div className="mt-3">
              <RightsChip contest={contest} />
            </div>
            {contest.rights_tags.length > 0 ? (
              <ul className="mt-3 flex flex-wrap gap-2">
                {contest.rights_tags.map((tag) => (
                  <li key={tag}>
                    <Badge variant="outline">{RIGHTS_TAG_LABEL[tag]}</Badge>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>

          <section>
            <h2 className="font-serif text-2xl">获奖缩略索引</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              有小图时最长边不超过 400 像素。没有小图时用同一块灰底，作品名、来源和「前往源站」仍在卡片上。点卡片在新标签打开源站的这一件作品。
            </p>
            {contest.gallery_works.length === 0 ? (
              <div className="mt-4 space-y-3">
                <p className="text-sm text-muted-foreground">还没有单件作品页。</p>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={contest.official_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(buttonVariants())}
                  >
                    打开官网
                  </a>
                  {contest.gallery_urls.map((gallery) => (
                    <a
                      key={gallery.url}
                      href={gallery.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(buttonVariants({ variant: "outline" }))}
                    >
                      {gallery.label ?? "获奖列表"}
                      {gallery.edition ? ` · ${gallery.edition}` : ""}
                    </a>
                  ))}
                </div>
              </div>
            ) : (
              <ul className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {contest.gallery_works.map((work) => (
                  <li key={work.source_page_url}>
                    <WinnerIndexCard work={work} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="font-serif text-2xl">获奖廊外链</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              这些是整届获奖列表。缩略图不链到这里，只链到上面的单件作品页。
            </p>
            {contest.gallery_urls.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">还没有获奖廊链接。</p>
            ) : (
              <ul className="mt-4 divide-y divide-border border-y border-border">
                {contest.gallery_urls.map((gallery) => (
                  <li key={gallery.url} className="py-3">
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
      </div>
    </article>
  );
}
