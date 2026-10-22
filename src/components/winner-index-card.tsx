import { ThumbPlaceholder } from "@/components/thumb-placeholder";
import type { GalleryWork } from "@/lib/contest-schema";
import type { Locale } from "@/lib/locale";
import { copy, type Copy } from "@/lib/messages";

function authorLabel(work: GalleryWork, locale: Locale): string | undefined {
  if (locale === "en") return work.author_name_en ?? work.author_name;
  return work.author_name;
}

function workSocialLinks(work: GalleryWork, t: Copy): { key: string; href: string; label: string }[] {
  const social = work.social;
  if (!social) return [];
  const links: { key: string; href: string; label: string }[] = [];
  if (social.instagram) {
    links.push({ key: "instagram", href: social.instagram, label: t.socialInstagram });
  }
  if (social.x) links.push({ key: "x", href: social.x, label: t.socialX });
  if (social.website) links.push({ key: "website", href: social.website, label: t.socialWebsite });
  return links;
}

export function WinnerIndexCard({ work, locale }: { work: GalleryWork; locale: Locale }) {
  const t = copy(locale);
  const authorName = authorLabel(work, locale);
  const title = work.title ?? authorName ?? work.source_site_label;
  const socialLinks = workSocialLinks(work, t);
  const sourceUrl = work.source_page_url.trim();

  return (
    <article className="flex h-full w-full flex-col overflow-hidden rounded-[4px] border border-border bg-card">
      <div className="relative h-36 w-full shrink-0 overflow-hidden bg-[#E8E4DC]">
        <ThumbPlaceholder
          title={title}
          locale={locale}
          className="absolute inset-0 h-full w-full rounded-none bg-[#E8E4DC]"
          textClassName="text-base text-[#8A8A8A]"
        />
      </div>
      <div className="space-y-1 px-3 pt-3">
        <p className="font-serif text-base leading-snug text-ink">{title}</p>
        <p className="text-xs leading-5 text-muted-foreground">
          {t.fromSource}
          {work.source_site_label ? ` · ${work.source_site_label}` : ""}
        </p>
        {sourceUrl ? (
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-xs text-accent underline-offset-4 hover:underline"
          >
            {t.visitSource}
          </a>
        ) : null}
      </div>
      {authorName ? (
        <p className={`px-3 pt-1 text-xs text-muted-foreground ${socialLinks.length === 0 ? "pb-3" : ""}`}>
          {work.author_homepage_url ? (
            <a
              href={work.author_homepage_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline-offset-4 hover:underline"
            >
              {authorName}
            </a>
          ) : (
            authorName
          )}
        </p>
      ) : null}
      {socialLinks.length > 0 ? (
        <p className="flex flex-wrap items-baseline gap-x-1.5 px-3 pt-1 pb-3 text-xs text-muted-foreground">
          <span>{t.socialPhotographer}</span>
          {socialLinks.map((link) => (
            <span key={link.key} className="inline-flex items-baseline gap-x-1.5">
              <span aria-hidden="true">·</span>
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent underline-offset-4 hover:underline"
              >
                {link.label}
              </a>
            </span>
          ))}
        </p>
      ) : authorName ? null : (
        <div className="pb-3" />
      )}
    </article>
  );
}
