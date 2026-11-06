import type { Metadata } from "next";
import { HomeScreen } from "@/components/home-screen";

export const dynamic = "force-static";

export const metadata: Metadata = {
  description: "街头摄影赛事索引。看截止日期，再打开官网。",
};

export default function ZhHomePage() {
  return <HomeScreen locale="zh-CN" />;
}
