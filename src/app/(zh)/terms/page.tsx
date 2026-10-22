import type { Metadata } from "next";
import { TermsScreen } from "@/components/legal-screen";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "使用条款",
  description:
    "ALane 仅提供摄影赛事信息的索引与链接，不举办赛事，与主办方无合作、授权或隶属关系，不保存参赛作品。",
};

export default function TermsPage() {
  return <TermsScreen locale="zh-CN" />;
}
