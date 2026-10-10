import Image from "next/image";
import type { GalleryWork } from "@/lib/contest-schema";

export function WinnerIndexCard({ work }: { work: GalleryWork }) {
  return (
    <article className="max-w-[200px]">
      <a
        href={work.source_page_url}
        target="_blank"
        rel="noopener noreferrer"
        className="block rounded-[4px] outline-none focus-visible:bg-muted"
      >
        {work.thumb_path ? (
          <Image
            src={`/${work.thumb_path}`}
            alt={work.title ?? work.source_site_label}
            width={200}
            height={150}
            unoptimized
            className="h-36 w-full rounded-[4px] object-cover shadow-none"
          />
        ) : (
          <div
            className="h-36 w-full rounded-[4px] bg-[#d5d2cb]"
            aria-hidden="true"
          />
        )}
        <p className="mt-2 text-sm leading-5 text-foreground">
          {work.title ?? "未命名作品"}
        </p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          来源 · {work.source_site_label}
        </p>
        <p className="mt-1 text-xs text-accent">前往源站</p>
      </a>
      {work.author_name ? (
        <p className="mt-1 text-xs text-muted-foreground">
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
      ) : null}
    </article>
  );
}
