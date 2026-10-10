import { cn } from "@/lib/utils";

/** One empty-thumb treatment: neutral gray, optional tiny initial. */
export function ThumbPlaceholder({
  initial,
  className,
}: {
  initial?: string;
  className?: string;
}) {
  const letter = initial?.trim().slice(0, 1);

  return (
    <div
      aria-hidden="true"
      className={cn(
        "flex items-center justify-center rounded-[4px] bg-[#d5d2cb] shadow-none",
        className,
      )}
    >
      {letter ? (
        <span className="font-serif text-[11px] leading-none text-ink/55">
          {letter}
        </span>
      ) : null}
    </div>
  );
}
