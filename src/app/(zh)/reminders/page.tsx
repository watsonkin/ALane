import type { Metadata } from "next";
import { RemindersRoute } from "@/components/reminders-route";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "邮件提醒",
  description: "验证邮箱后，在有新赛开幕、临近截止或获奖公布时收到摘要。不替代日历订阅。",
};

export default function RemindersPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  return <RemindersRoute locale="zh-CN" searchParams={searchParams} />;
}
