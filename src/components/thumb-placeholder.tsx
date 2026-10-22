import { isChineseUi, thumbPlaceholderText } from "@/lib/contest-labels";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

/**
 * Neutral stand-in for a contest or work slot.
 * Chinese UI prints the title. English UI prints initials.
 * Not a work photo and not an organizer mark.
 */
export function ThumbPlaceholder({
  title,
  locale,
  className,
  textClassName,
}: {
  title: string;
  locale: Locale;
  className?: string;
  textClassName?: string;
}) {
  const text = thumbPlaceholderText(title, locale);
  const chinese = isChineseUi(locale);

  return (
    <div
      data-placeholder={chinese ? "title" : "initials"}
      className={cn(
        "flex items-center justify-center overflow-hidden rounded-[4px] bg-[#E8E4DC] px-1.5 text-center shadow-none",
        className,
      )}
    >
      <span
        className={cn(
          "font-serif text-[#8A8A8A]",
          chinese
            ? "line-clamp-3 text-[12px] leading-tight"
            : "text-sm font-medium tracking-wide",
          textClassName,
        )}
      >
        {text}
      </span>
    </div>
  );
}

/** List and closing-soon slot. Always the neutral title/initials block. */
export function ContestThumb({
  name,
  locale,
  className,
  width,
  height,
}: {
  name: string;
  locale: Locale;
  className?: string;
  width: number;
  height: number;
}) {
  const slot = cn("relative shrink-0 overflow-hidden rounded-[4px] bg-[#E8E4DC]", className);

  return (
    <div className={slot} data-thumb-slot={`${width}x${height}`}>
      <ThumbPlaceholder
        title={name}
        locale={locale}
        className="absolute inset-0 h-full w-full rounded-[4px] bg-[#E8E4DC] [container-type:size]"
        textClassName={
          isChineseUi(locale)
            ? "line-clamp-2 text-[length:30cqh] leading-none"
            : "text-[length:32cqh] font-medium leading-none tracking-wide"
        }
      />
    </div>
  );
}
