import Image from "next/image";
import { ThumbPlaceholder } from "@/components/thumb-placeholder";
import type { GalleryWork } from "@/lib/contest-schema";

export function WinnerIndexCard({ work }: { work: GalleryWork }) {
  const title = work.title ?? work.author_name ?? work.source_site_label;

  return (
    <article className="flex h-full w-full flex-col overflow-hidden rounded-[4px] border border-border bg-card">
      <a
        href={work.source_page_url}
        target="_blank"
        rel="noopener noreferrer"
        className="block outline-none focus-visible:bg-muted"
      >
        <div className="relative h-36 w-full shrink-0 overflow-hidden bg-[#E8E4DC]">
          {work.thumb_path ? (
            <Image
              src={`/${work.thumb_path}`}
              alt={title}
              fill
              sizes="240px"
              unoptimized
              className="object-cover object-center"
            />
          ) : (
            <ThumbPlaceholder
              title={title}
              className="absolute inset-0 h-full w-full rounded-none bg-[#E8E4DC]"
              textClassName="text-base text-[#8A8A8A]"
            />
          )}
        </div>
        <div className="space-y-1 px-3 pt-3">
          <p className="font-serif text-base leading-snug text-ink">{title}</p>
          <p className="text-xs leading-5 text-muted-foreground">
            来源 · {work.source_site_label}
          </p>
          <p className="text-xs text-accent">前往源站</p>
        </div>
      </a>
      {work.author_name ? (
        <p className="px-3 pt-1 pb-3 text-xs text-muted-foreground">
          {work.author_homepage_url ? (
            <a
              href={work.author_homepage_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline-offset-4 hover:underline"
            >
              {work.author_name}
            </a>
          ) : (
            work.author_name
          )}
        </p>
      ) : (
        <div className="pb-3" />
      )}
    </article>
  );
}
