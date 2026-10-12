import type { Metadata } from "next";
import { SiteFrame } from "@/components/site-frame";
import { fontClassName } from "@/app/fonts";
import "../globals.css";

export const metadata: Metadata = {
  title: {
    default: "ALane",
    template: "%s · ALane",
  },
  description: "街头摄影赛事索引。看截止日期，再打开官网。",
};

export default function ChineseLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className={fontClassName}>
      <body className="min-h-full flex flex-col">
        <SiteFrame>{children}</SiteFrame>
      </body>
    </html>
  );
}
