"use client";

import { useState } from "react";
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
  textClassName,
}: {
  title: string;
  locale?: string;
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
  thumbPath,
  organizerIcon = null,
  className,
  width,
  height,
  grayscale = false,
}: {
  name: string;
  thumbPath: string | null;
  organizerIcon?: string | null;
  className?: string;
  width: number;
  height: number;
  grayscale?: boolean;
}) {
  const [iconFailed, setIconFailed] = useState(false);

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

  if (organizerIcon && !iconFailed) {
    const src = organizerIcon.startsWith("/") ? organizerIcon : `/${organizerIcon}`;
    return (
      <div
        data-thumb="organizer-icon"
        className={cn(
          "flex items-center justify-center overflow-hidden rounded-[4px] bg-[#F1EEE7] shadow-none",
          className,
        )}
      >
        <img
          src={src}
          alt=""
          className="max-h-[60%] max-w-[60%] object-contain"
          onError={() => setIconFailed(true)}
        />
      </div>
    );
  }

  return (
    <ThumbPlaceholder
      title={name}
      className={cn("[container-type:size]", className)}
      textClassName={
        isChineseUi(SITE_UI_LOCALE)
          ? "line-clamp-2 text-[length:30cqh] leading-none"
          : "text-[length:32cqh] font-medium leading-none tracking-wide"
      }
    />
  );
}
