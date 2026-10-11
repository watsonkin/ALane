import { Badge } from "@/components/ui/badge";
import { rightsChip, rightsChipLabel } from "@/lib/contest-labels";
import type { Contest } from "@/lib/contest-schema";
import type { Locale } from "@/lib/locale";

export function RightsChip({
  contest,
  locale,
}: {
  contest: Pick<Contest, "health" | "rights_tags">;
  locale: Locale;
}) {
  const kind = rightsChip(contest);
  return (
    <Badge
      variant="outline"
      className={
        kind === "caution"
          ? "border-caution text-caution"
          : kind === "trusted"
            ? "border-accent text-accent"
            : undefined
      }
    >
      {rightsChipLabel(kind, locale)}
    </Badge>
  );
}
