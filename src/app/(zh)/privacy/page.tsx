import type { Metadata } from "next";
import { PrivacyScreen } from "@/components/legal-screen";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "隐私政策",
  description:
    "ALane 本季不收集订阅邮箱或账号密码。站点部署于 Cloudflare Workers，语言偏好使用 alane_locale Cookie。",
};

export default function PrivacyPage() {
  return <PrivacyScreen locale="zh-CN" />;
}
