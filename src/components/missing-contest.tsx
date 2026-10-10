import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function MissingContest({ slug }: { slug?: string }) {
  return (
    <div className="max-w-xl py-10">
      <p className="text-xs text-muted-foreground">404</p>
      <h1 className="mt-2 font-serif text-4xl">没有这场赛事</h1>
      <p className="mt-4 text-sm leading-6 text-muted-foreground">
        {slug ? (
          <>
            没有 slug 为 <code className="font-mono">{slug}</code> 的 YAML。
          </>
        ) : (
          <>这个地址对不上任何赛事。</>
        )}
        可能是链接写错了，或者这条还没放进{" "}
        <code className="font-mono">data/contests</code>。
      </p>
      <Link href="/" className={cn(buttonVariants({ size: "lg" }), "mt-6")}>
        返回索引
      </Link>
    </div>
  );
}
