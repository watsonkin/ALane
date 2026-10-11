import type { Metadata } from "next";
import Link from "next/link";
import { loadContests } from "@/lib/contests";
import {
  CALENDAR_ARCHIVED_NOTE,
  CALENDAR_NO_DEADLINE_NOTE,
  calendarOmitReason,
} from "@/lib/contest-ics";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "关于",
  description: "ALane 是街头摄影赛事的外链索引，不托管参赛作品。",
};

export default async function AboutPage() {
  const contests = await loadContests();
  const omitted = contests.flatMap((contest) => {
    const reason = calendarOmitReason(contest);
    return reason ? [{ id: contest.id, name: contest.name, reason }] : [];
  });

  return (
    <article className="max-w-2xl">
      <h1 className="font-serif text-4xl leading-tight">关于</h1>
      <div className="mt-6 space-y-4 text-base leading-7">
        <p>
          ALane 是街头摄影与纪实向摄影赛事的索引站。你在这里查看征稿是否仍开放、截止与费用，再点进主办方官网报名或看规则。我们不托管参赛作品，也不提供高清下载。
        </p>
        <p>
          对已核对的官方获奖页，站点可保留最长边不超过 400 像素的小图，方便认出作品；点击小图会新标签打开源站该作品页。权利标签与部分日期仅供参考，一律以官网为准。勘误、缩略图下架或希望移出索引，请邮件{" "}
          <a
            href="mailto:wzhun2012@icloud.com"
            className="text-accent underline-offset-4 hover:underline"
          >
            wzhun2012@icloud.com
          </a>
          。
        </p>
      </div>
      <details className="mt-8 border-t border-border pt-4 text-sm leading-6 text-muted-foreground">
        <summary className="cursor-pointer text-ink">日历订阅说明</summary>
        <div className="mt-3 space-y-3">
          <p>
            <a href="/calendar.ics" className="text-accent underline-offset-4 hover:underline">
              /calendar.ics
            </a>{" "}
            只写入至少有一个日期（开放、截止或公布）的赛事。已归档的条目如果仍有日期，事件说明会写「{CALENDAR_ARCHIVED_NOTE}」没有截止时间、但改用开放或公布日期占位的，说明会写「{CALENDAR_NO_DEADLINE_NOTE}」
          </p>
          {omitted.length === 0 ? (
            <p>当前名单里的赛事都至少有一个日期，日历没有省略条目。</p>
          ) : (
            <>
              <p>下面这些没有写入日历：</p>
              <ul className="list-disc space-y-2 pl-5">
                {omitted.map((contest) => (
                  <li key={contest.id}>
                    <span className="text-foreground">{contest.name}</span>
                    <span> — {contest.reason}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
          <p>
            <Link href="/" className="text-accent underline-offset-4 hover:underline">
              返回赛事列表
            </Link>
            <span aria-hidden="true"> · </span>
            <a href="/calendar.ics" className="text-accent underline-offset-4 hover:underline">
              下载日历
            </a>
          </p>
        </div>
      </details>
    </article>
  );
}
