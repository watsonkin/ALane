import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "关于",
  description: "ALane 是街头摄影赛事的外链索引，不托管参赛作品。",
};

export default function AboutPage() {
  return (
    <article className="max-w-2xl">
      <p className="text-xs text-muted-foreground">A lane through awards</p>
      <h1 className="mt-2 font-serif text-4xl leading-tight">关于 ALane</h1>
      <div className="mt-6 space-y-4 text-base leading-7">
        <p>
          ALane 把街拍征稿的日期、地点、费用和权利标签收成一份索引。点进一场赛事，仍然回到主办方官网。站点不保存、不镜像参赛作品。
        </p>
        <p>
          当前名单是人工收录的种子赛事。需留意的条目仍会展示；Magnum 作为历史条目归档。日期窗口有的是按往年节奏估算的，以官网为准。
        </p>
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
