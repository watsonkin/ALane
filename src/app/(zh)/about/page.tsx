import type { Metadata } from "next";
import { AboutScreen } from "@/components/about-screen";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "关于",
  description: "ALane 是街头摄影赛事索引。本站不保存参赛作品，仅链接主办方官网。",
};

export default function AboutPage() {
  return <AboutScreen locale="zh-CN" />;
}
