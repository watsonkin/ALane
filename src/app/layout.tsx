import type { Metadata } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import { SiteFrame } from "@/components/site-frame";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ALane",
    template: "%s · ALane",
  },
  description:
    "街头摄影赛事的元数据索引。外链获奖廊，不镜像高清作品。数据真源是仓库里的 YAML。",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="zh-CN"
      className={`${inter.variable} ${sourceSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SiteFrame>{children}</SiteFrame>
      </body>
    </html>
  );
}
