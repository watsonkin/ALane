import type { Metadata } from "next";
import { PrivacyScreen } from "@/components/legal-screen";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "隐私政策",
  description:
    "ALane 提供可选邮件提醒。验证通过后保存邮箱与语种等最小字段，经 Resend 发送摘要；未验证不进入发送列表。",
};

export default function PrivacyPage() {
  return <PrivacyScreen locale="zh-CN" />;
}
