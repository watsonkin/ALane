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
      <p className="text-xs text-muted-foreground">A lane through awards</p>
      <h1 className="mt-2 font-serif text-4xl leading-tight">关于 ALane</h1>
      <div className="mt-6 space-y-4 text-base leading-7">
        <p>
          ALane 把街拍征稿的日期、地点、费用和权利标签收成一份索引。点进一场赛事，仍然回到主办方官网。对已核过的官方获奖页，站点可以留下最长边不超过 400 像素的索引缩略图，只用来认出作品。点击缩略图会在新标签直接打开源站上这一件作品的页面，中间没有站内中转页，也没有广告。站内不保存、不提供高清原图或可下载大图。
        </p>
        <p>
          当前名单是人工收录的种子赛事。需留意的条目仍会展示；Magnum 作为历史条目归档。日期窗口有的是按往年节奏估算的，以官网为准。
        </p>
        <h2 className="pt-4 font-serif text-2xl">勘误、缩略图下架与移除</h2>
        <p>
          日期、链接、作者或收录有误，希望删掉某一张缩略图，或者希望把一条赛事从索引里拿掉，请写信到{" "}
          <a
            href="mailto:wzhun2012@icloud.com"
            className="text-accent underline-offset-4 hover:underline"
          >
            wzhun2012@icloud.com
          </a>
          。邮件里写上赛事名称、作品在源站的页面地址，以及需要改正或删除的内容。收到下架请求后，会从仓库里删掉对应的缩略图文件和 YAML 记录，再重新部署。本站不就版权归属作判断；缩略图是产品上的索引，不是作品授权。
        </p>
        <h2 className="pt-4 font-serif text-2xl">日历</h2>
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
                  <span className="text-muted-foreground"> — {contest.reason}</span>
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
    </article>
  );
}
