import Image from "next/image";
import {
  SITE_UI_LOCALE,
  isChineseUi,
  thumbPlaceholderText,
} from "@/lib/contest-labels";
import { cn } from "@/lib/utils";

/**
 * Gray stand-in when a card has no official thumbnail.
 * Chinese UI prints the title. English UI prints initials.
 */
export function ThumbPlaceholder({
  title,
  locale = SITE_UI_LOCALE,
  className,
}: {
  title: string;
  locale?: string;
  className?: string;
}) {
  const text = thumbPlaceholderText(title, locale);
  const chinese = isChineseUi(locale);

  return (
    <div
      data-placeholder={chinese ? "title" : "initials"}
      className={cn(
        "flex items-center justify-center overflow-hidden rounded-[4px] bg-[#d5d2cb] px-1.5 text-center shadow-none",
        className,
      )}
    >
      <span
        className={cn(
          "font-serif text-ink/75",
          chinese
            ? "line-clamp-3 text-[12px] leading-tight"
            : "text-sm font-medium tracking-wide",
        )}
      >
        {text}
      </span>
    </div>
  );
}

export function ContestThumb({
  name,
  thumbPath,
  className,
  width,
  height,
  grayscale = false,
}: {
  name: string;
  thumbPath: string | null;
  className?: string;
  width: number;
  height: number;
  grayscale?: boolean;
}) {
  if (thumbPath) {
    return (
      <Image
        src={`/${thumbPath}`}
        alt=""
        width={width}
        height={height}
        unoptimized
        className={cn(
          "rounded-[4px] object-cover shadow-none",
          grayscale && "grayscale",
          className,
        )}
      />
    );
  }

  return <ThumbPlaceholder title={name} className={className} />;
}
