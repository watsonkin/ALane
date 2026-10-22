import type { ReactNode } from "react";
import { RightsChip } from "@/components/rights-chip";
import { Badge } from "@/components/ui/badge";
import {
  feeLabel,
  relevanceLabel,
  statusLabel,
  windowChipLabel,
  type WindowFilter,
} from "@/lib/contest-labels";
import type { Contest } from "@/lib/contest-schema";
import type { Locale } from "@/lib/locale";

const pill = "h-auto rounded-full px-2 py-0.5 text-[11px] font-medium leading-4";

export type ContestChipSource = Pick<
  Contest,
  "status" | "street_photo_relevance" | "fee" | "health" | "rights_tags"
>;

export function ContestFactChips({
  contest,
  window,
  locale,
  divided = false,
  showFee = true,
}: {
  contest: ContestChipSource;
  window: Exclude<WindowFilter, "all">;
  locale: Locale;
  divided?: boolean;
  showFee?: boolean;
}) {
  const chips: { key: string; node: ReactNode }[] = [
    {
      key: "window",
      node: (
        <Badge
          variant={window === "open" ? "default" : "outline"}
          className={window === "closed" ? `${pill} text-muted-foreground` : pill}
        >
          {windowChipLabel(window, locale)}
        </Badge>
      ),
    },
    {
      key: "status",
      node: (
        <Badge variant={contest.status === "published" ? "default" : "outline"} className={pill}>
          {statusLabel(contest.status, locale)}
        </Badge>
      ),
    },
    {
      key: "relevance",
      node: (
        <Badge variant="secondary" className={pill}>
          {relevanceLabel(contest.street_photo_relevance, locale)}
        </Badge>
      ),
    },
  ];

  if (showFee) {
    chips.push({
      key: "fee",
      node: (
        <Badge variant="outline" className={pill}>
          {feeLabel(contest.fee, locale)}
        </Badge>
      ),
    });
  }

  chips.push({
    key: "rights",
    node: <RightsChip contest={contest} locale={locale} className={pill} />,
  });

  if (divided) {
    return (
      <div className="flex flex-wrap items-center gap-y-2">
        {chips.map((chip, index) => (
          <span key={chip.key} className="inline-flex items-center">
            {index > 0 ? (
              <span aria-hidden="true" className="mx-2.5 text-line">
                |
              </span>
            ) : null}
            {chip.node}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {chips.map((chip) => (
        <span key={chip.key} className="inline-flex">
          {chip.node}
        </span>
      ))}
    </div>
  );
}
