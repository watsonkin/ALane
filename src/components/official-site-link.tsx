"use client";

import type { ReactNode } from "react";
import { reportOfficialSiteOutbound } from "@/lib/ops-analytics";

/** Contest-detail control for the organizer site. The count stores no URL. */
export function OfficialSiteLink({
  href,
  className,
  children,
}: {
  href: string;
  className: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={reportOfficialSiteOutbound}
    >
      {children}
    </a>
  );
}
