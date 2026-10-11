import type { Metadata } from "next";
import { AboutScreen } from "@/components/about-screen";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "关于",
  description: "ALane 是街头摄影赛事的外链索引，不托管参赛作品。",
};

export default function AboutPage() {
  return <AboutScreen locale="zh-CN" />;
}
