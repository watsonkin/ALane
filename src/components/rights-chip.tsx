import { Badge } from "@/components/ui/badge";
import {
  RIGHTS_CHIP_LABEL,
  rightsChip,
} from "@/lib/contest-labels";
import type { Contest } from "@/lib/contest-schema";

export function RightsChip({
  contest,
}: {
  contest: Pick<Contest, "health" | "rights_tags">;
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
      {RIGHTS_CHIP_LABEL[kind]}
    </Badge>
  );
}
