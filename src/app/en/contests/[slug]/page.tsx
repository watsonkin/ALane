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
  return contestMetadata("en", params);
}

export default function EnglishContestPage({ params }: ContestPageProps) {
  return <ContestScreen locale="en" params={params} />;
}
