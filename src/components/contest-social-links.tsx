import type { ReactNode } from "react";
import type { Contest } from "@/lib/contest-schema";
import type { Locale } from "@/lib/locale";
import { copy } from "@/lib/messages";

function ExternalSocialLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-accent underline-offset-4 hover:underline"
    >
      {label}
    </a>
  );
}

/**
 * Organizer social, P2, after rights and before the winner index.
 * No platform icons. A WeChat name is text only; the QR image waits for a later pass.
 * An empty or missing social object renders nothing.
 */
export function ContestSocialLinks({
  contest,
  locale,
}: {
  contest: Contest;
  locale: Locale;
}) {
  const social = contest.social;
  if (!social) return null;

  const t = copy(locale);
  const items: { key: string; node: ReactNode }[] = [];

  if (social.instagram) {
    items.push({
      key: "instagram",
      node: <ExternalSocialLink href={social.instagram} label={t.socialInstagram} />,
    });
  }
  if (social.x) {
    items.push({
      key: "x",
      node: <ExternalSocialLink href={social.x} label={t.socialX} />,
    });
  }
  if (social.wechat_oa) {
    items.push({
      key: "wechat",
      node: <span>{t.socialWechatName(social.wechat_oa.name)}</span>,
    });
  }

  if (items.length === 0) return null;

  return (
    <p className="mt-4 text-sm leading-snug text-muted-foreground">
      <span className="text-ink">{t.socialOrganizer}</span>
      {items.map((item, index) => (
        <span key={item.key}>
          <span aria-hidden="true">{index === 0 ? " " : " · "}</span>
          {item.node}
        </span>
      ))}
    </p>
  );
}
