"use client";

import { Badge } from "@/components/ui/badge";
import { deadlineWindow, windowChipLabel } from "@/lib/contest-labels";
import type { Locale } from "@/lib/locale";
import { useNow } from "@/lib/use-now";

/** Title-band window chip. The rest of the detail page stays a server component. */
export function ContestWindowChip({
  deadlineAt,
  asOf,
  locale,
}: {
  deadlineAt: string | null;
  asOf: string;
  locale: Locale;
}) {
  const now = useNow(asOf);
  const window = deadlineWindow({ deadline_at: deadlineAt }, now);
  return (
    <Badge
      variant={window === "open" ? "default" : "outline"}
      className={window === "closed" ? "text-muted-foreground" : undefined}
    >
      {windowChipLabel(window, locale)}
    </Badge>
  );
}
