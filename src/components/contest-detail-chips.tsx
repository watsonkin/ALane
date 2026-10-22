"use client";

import { ContestFactChips, type ContestChipSource } from "@/components/contest-fact-chips";
import { deadlineWindow } from "@/lib/contest-labels";
import type { Contest } from "@/lib/contest-schema";
import type { Locale } from "@/lib/locale";
import { useNow } from "@/lib/use-now";

/** Detail title-band chips. The window follows the hydrated clock; the rest of the page stays static. */
export function ContestDetailChips({
  contest,
  asOf,
  locale,
}: {
  contest: ContestChipSource & Pick<Contest, "deadline_at">;
  asOf: string;
  locale: Locale;
}) {
  const now = useNow(asOf);
  const window = deadlineWindow({ deadline_at: contest.deadline_at }, now);
  return <ContestFactChips contest={contest} window={window} locale={locale} divided showFee={false} />;
}
