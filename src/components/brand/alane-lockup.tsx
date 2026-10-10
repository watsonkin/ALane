import { AlaneMark } from "@/components/brand/alane-mark";
import { cn } from "@/lib/utils";

/** Open chevron A: capital form, no crossbar. */
function OpenA() {
  return (
    <svg
      viewBox="0 0 48 56"
      aria-hidden="true"
      className="h-[0.92em] w-[0.72em] shrink-0"
    >
      <path
        d="M4 52 L24 4 L44 52"
        fill="none"
        stroke="currentColor"
        strokeWidth="4.25"
        strokeLinecap="butt"
        strokeLinejoin="miter"
      />
    </svg>
  );
}

export function AlaneLockup({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2.5 text-ink sm:gap-3", className)}>
      <AlaneMark className="size-9 shrink-0 sm:size-11" />
      <span className="min-w-0">
        <span className="sr-only">ALane</span>
        <span
          aria-hidden="true"
          className="flex items-end gap-[0.08em] font-serif text-[1.65rem] font-semibold leading-none tracking-[-0.03em] sm:text-[1.85rem]"
        >
          <OpenA />
          <span className="translate-y-[0.02em]">Lane</span>
        </span>
        <span className="mt-1.5 hidden items-center gap-2 font-sans text-[10px] uppercase leading-none tracking-[0.22em] sm:flex">
          <span aria-hidden="true" className="h-px w-5 bg-current" />
          A lane through awards
          <span aria-hidden="true" className="h-px w-5 bg-current" />
        </span>
      </span>
    </span>
  );
}
