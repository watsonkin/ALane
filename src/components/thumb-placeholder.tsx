"use client";

import { useState } from "react";
import Image from "next/image";
import { isChineseUi, thumbPlaceholderText } from "@/lib/contest-labels";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

/**
 * Gray stand-in when a card has no official thumbnail.
 * Chinese UI prints the title. English UI prints initials.
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

export function ContestThumb({
  name,
  locale,
  thumbPath,
  organizerIcon = null,
  className,
  width,
  height,
  grayscale = false,
}: {
  name: string;
  locale: Locale;
  thumbPath: string | null;
  organizerIcon?: string | null;
  className?: string;
  width: number;
  height: number;
  grayscale?: boolean;
}) {
  const [iconFailed, setIconFailed] = useState(false);
  const slot = cn("relative shrink-0 overflow-hidden rounded-[4px]", className);
  const slotSize = `${width}x${height}`;

  if (thumbPath) {
    return (
      <div className={slot} data-thumb-slot={slotSize}>
        <Image
          src={`/${thumbPath}`}
          alt=""
          fill
          sizes={`${width}px`}
          unoptimized
          className={cn("object-cover object-center", grayscale && "grayscale")}
        />
      </div>
    );
  }

  if (organizerIcon && !iconFailed) {
    const src = organizerIcon.startsWith("/") ? organizerIcon : `/${organizerIcon}`;
    return (
      <div className={cn(slot, "bg-[#F1EEE7]")} data-thumb-slot={slotSize}>
        <div
          data-thumb="organizer-icon"
          className="absolute inset-0 flex items-center justify-center"
        >
          <img
            src={src}
            alt=""
            className="max-h-[60%] max-w-[60%] object-contain"
            onError={() => setIconFailed(true)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={cn(slot, "bg-[#E8E4DC]")} data-thumb-slot={slotSize}>
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
