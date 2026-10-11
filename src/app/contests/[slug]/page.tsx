import { ContestScreen, contestMetadata } from "@/components/contest-screen";
import { contestStaticParams } from "@/lib/contests";

type ContestPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return contestStaticParams();
}

export function generateMetadata({ params }: ContestPageProps) {
  return contestMetadata("zh-CN", params);
}

export default function ContestPage({ params }: ContestPageProps) {
  return <ContestScreen locale="zh-CN" params={params} />;
}
