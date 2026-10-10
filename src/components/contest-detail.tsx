import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  ADAPTER_KIND_LABEL,
  FEE_LABEL,
  HEALTH_LABEL,
  RELEVANCE_LABEL,
  RIGHTS_TAG_LABEL,
  STATUS_LABEL,
  formatContestDate,
  formatPlace,
} from "@/lib/contest-labels";
import type { Contest } from "@/lib/contest-schema";
import { cn } from "@/lib/utils";

function DateLine({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="grid gap-1 border-b border-border py-3 sm:grid-cols-[8rem_minmax(0,1fr)]">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className={label === "截止" ? "text-caution" : undefined}>
        {value ? (
          <>
            <span>{formatContestDate(value)}</span>
            <span className="mt-1 block break-all font-mono text-xs text-muted-foreground">
              {value}
            </span>
          </>
        ) : (
          <span className="text-muted-foreground">未填写</span>
        )}
      </dd>
    </div>
  );
}

export function ContestDetail({ contest }: { contest: Contest }) {
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
          <Badge
            variant={contest.health === "dead" ? "destructive" : "outline"}
            className={contest.health === "warn" ? "text-caution" : undefined}
          >
            健康 · {HEALTH_LABEL[contest.health]}
          </Badge>
        </div>
        <h1 className="mt-4 font-serif text-4xl leading-tight text-foreground sm:text-5xl">
          {contest.name}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {contest.edition ? `届次 ${contest.edition}` : "届次未填"}
          <span className="px-2 text-border">/</span>
          {formatPlace(contest)}
          <span className="px-2 text-border">/</span>
          {FEE_LABEL[contest.fee]}
        </p>
      </header>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-10">
          <section>
            <h2 className="font-serif text-2xl">时间</h2>
            <dl className="mt-3">
              <DateLine label="开放" value={contest.open_at} />
              <DateLine label="截止" value={contest.deadline_at} />
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
            <h2 className="font-serif text-2xl">权利条款标签</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              空列表表示还没评估，不是“条款安全”。这些词只是种子里的手工标记，确认之前不要当成结论。
            </p>
            {contest.rights_tags.length === 0 ? (
              <p className="mt-4 text-sm">条款未评估</p>
            ) : (
              <ul className="mt-4 flex flex-wrap gap-2">
                {contest.rights_tags.map((tag) => (
                  <li key={tag}>
                    <Badge variant="outline">
                      {RIGHTS_TAG_LABEL[tag]}
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {tag}
                      </span>
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="font-serif text-2xl">获奖廊外链</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              只记录官方廊的地址。页面不嵌图片，也不提供下载。
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
                    <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                      {gallery.url}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="h-fit space-y-6 border border-border bg-card p-4 text-sm lg:sticky lg:top-6">
          <div>
            <h2 className="font-serif text-xl">官方页面</h2>
            <a
              href={contest.official_url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ size: "lg" }), "mt-3 w-full")}
            >
              打开官方页面
            </a>
            <p className="mt-3 break-all font-mono text-xs text-muted-foreground">
              {contest.official_url}
            </p>
            {contest.health === "dead" ? (
              <p className="mt-3 text-caution">
                健康状态是 dead：这条链接可能已经失效。M0 还不会自动探测。
              </p>
            ) : null}
          </div>

          <div>
            <h2 className="font-serif text-xl">采集</h2>
            <p className="mt-2 text-muted-foreground">
              适配器还没写。下面的 id 只是占位，这个站点不会去抓它们。
            </p>
            {contest.source_adapters.length === 0 ? (
              <p className="mt-3">未登记适配器。</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {contest.source_adapters.map((adapter) => (
                  <li key={adapter.id} className="font-mono text-xs">
                    {adapter.id}
                    <span className="mt-1 block font-sans text-muted-foreground">
                      {ADAPTER_KIND_LABEL[adapter.kind]}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <dl className="mt-4 space-y-2 text-xs text-muted-foreground">
              <div>
                <dt>last_fetched_at</dt>
                <dd className="font-mono text-foreground">
                  {contest.last_fetched_at ?? "尚未抓取"}
                </dd>
              </div>
              <div>
                <dt>content_hash</dt>
                <dd className="break-all font-mono text-foreground">
                  {contest.content_hash ?? "尚未计算"}
                </dd>
              </div>
              <div>
                <dt>id / slug</dt>
                <dd className="break-all font-mono text-foreground">
                  {contest.id} / {contest.slug}
                </dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </article>
  );
}
