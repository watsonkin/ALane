import type { Metadata } from "next";
import { RemindersScreen } from "@/components/reminders-screen";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "邮件提醒",
  description:
    "输入邮箱并验证后，在有新赛开幕、临近截止或获奖公布时收到摘要。不替代日历订阅；可随时退订。",
};

export default function ZhRemindersPage() {
  return <RemindersScreen locale="zh-CN" />;
}
