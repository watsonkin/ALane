import { Suspense } from "react";
import type { Metadata } from "next";
import { ContestDetail } from "@/components/contest-detail";
import { MissingContest } from "@/components/missing-contest";
import { contestStaticParams, loadContestBySlug } from "@/lib/contests";

type ContestPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return contestStaticParams();
}

export async function generateMetadata({
  params,
}: ContestPageProps): Promise<Metadata> {
  const { slug } = await params;
  const contest = await loadContestBySlug(slug);
  if (!contest) {
    return { title: "没有这场赛事" };
  }
  return {
    title: contest.name,
    description: `${contest.name} 的报名窗口、地点与官方链接。外链索引，不含作品图片。`,
  };
}

export default function ContestPage({ params }: ContestPageProps) {
  return (
    <Suspense
      fallback={
        <p className="text-sm text-muted-foreground">正在打开这场赛事。</p>
      }
    >
      <ContestResolved params={params} />
    </Suspense>
  );
}

async function ContestResolved({ params }: ContestPageProps) {
  const { slug } = await params;
  const contest = await loadContestBySlug(slug);
  // Render the missing state instead of throwing notFound(). With Cache
  // Components, that throw becomes an empty error shell for unknown slugs.
  if (!contest) return <MissingContest slug={slug} />;
  return <ContestDetail contest={contest} />;
}
