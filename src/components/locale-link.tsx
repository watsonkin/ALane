"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";
import { localizeHref } from "@/lib/locale";

type LocaleLinkProps = Omit<ComponentProps<typeof Link>, "href"> & { href: string };

/** Internal link that stays inside the current path locale (`/`, `/zh`, or `/en`). */
export function LocaleLink({ href, ...props }: LocaleLinkProps) {
  const pathname = usePathname() ?? "/";
  return <Link href={localizeHref(pathname, href)} {...props} />;
}

type LocaleAnchorProps = Omit<ComponentProps<"a">, "href"> & { href: string };

/** Same prefix rule for plain anchors, such as a calendar download. */
export function LocaleAnchor({ href, ...props }: LocaleAnchorProps) {
  const pathname = usePathname() ?? "/";
  return <a href={localizeHref(pathname, href)} {...props} />;
}
