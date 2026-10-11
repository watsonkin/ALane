/**
 * Official ALane icon: black focus brackets around a gold loving cup.
 * Paths match public/brand/alane-mark.svg. Stroke only — no fills.
 */
export function AlaneMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M18 44V14H48M72 14H102V44M18 76V106H48M72 106H102V76"
        stroke="var(--mark-frame)"
        strokeWidth="4.25"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      <g
        fill="none"
        stroke="var(--mark-gold)"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M40 33A20 6 0 0 1 80 33" />
        <path d="M40 35C37 50 44 64 54 69C57.5 71 62.5 71 66 69C76 64 83 50 80 35" />
        <path d="M42 38C24 34 22 56 44 60" />
        <path d="M78 38C96 34 98 56 76 60" />
        <path d="M60 70V76" />
        <path d="M50 76H70V82H50Z" />
        <path d="M43 82H77V88H43Z" />
        <path d="M34 88H86V97H34Z" />
        <path
          fill="none"
          d="M60 39.5L63.1 47.8L71.9 48.1L64.9 53.6L67.3 62.1L60 57.2L52.7 62.1L55.1 53.6L48.1 48.1L56.9 47.8Z"
        />
      </g>
    </svg>
  );
}
