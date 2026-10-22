import { ExternalLink } from "lucide-react";
import type { GalleryWork } from "@/lib/contest-schema";
import type { Locale } from "@/lib/locale";
import { copy, type Copy } from "@/lib/messages";

const sourceLinkClass =
  "inline-flex items-center gap-1.5 text-[15px] text-accent underline decoration-line underline-offset-4 outline-none hover:decoration-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

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

export function WinnerIndexRow({ work, locale }: { work: GalleryWork; locale: Locale }) {
  const t = copy(locale);
  const authorName = authorLabel(work, locale);
  const titled = work.title?.trim() || "";
  const heading = titled || authorName || work.source_site_label;
  const socialLinks = workSocialLinks(work, t);
  const sourceUrl = work.source_page_url.trim();
  const showAuthor = Boolean(authorName && titled);

  return (
    <article className="border-b border-line py-4">
      <h3 className="font-serif text-[20px] leading-snug text-ink">{heading}</h3>
      <div aria-hidden="true" className="mt-3 h-px w-12 bg-line" />
      <p className="mt-3 text-xs leading-5 text-soft">
        {t.fromSource}
        {work.source_site_label ? ` · ${work.source_site_label}` : ""}
      </p>
      {sourceUrl ? (
        <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className={`mt-3 ${sourceLinkClass}`}>
          {t.visitSource}
          <ExternalLink aria-hidden="true" className="size-3.5" />
        </a>
      ) : null}
      {showAuthor && authorName ? (
        <p className="mt-3 text-sm text-soft">
          {t.artist}
          {locale === "en" ? ": " : "："}
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
        <p className="mt-1 flex flex-wrap items-baseline gap-x-1.5 text-xs text-soft">
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
      ) : null}
    </article>
  );
}
