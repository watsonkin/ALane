import { Badge } from "@/components/ui/badge";
import { rightsChip, rightsChipLabel } from "@/lib/contest-labels";
import type { Contest } from "@/lib/contest-schema";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

export function RightsChip({
  contest,
  locale,
  className,
}: {
  contest: Pick<Contest, "health" | "rights_tags">;
  locale: Locale;
  className?: string;
}) {
  const kind = rightsChip(contest);
  return (
    <Badge
      variant="outline"
      className={cn(kind === "caution" ? "border-caution text-caution" : undefined, className)}
    >
      {rightsChipLabel(kind, locale)}
    </Badge>
  );
}
