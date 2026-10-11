/**
 * Official ALane icon: viewfinder corners and a flat-top trophy.
 * Paths match public/brand/alane-mark.svg. The trophy group is shifted
 * up 4 units so the cup sits in the brackets instead of crowding the base.
 */
export function AlaneMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <g
        stroke="var(--mark-gold)"
        strokeWidth="2.5"
        strokeLinecap="square"
        strokeLinejoin="miter"
      >
        <path d="M20 32V16h16M100 32V16H84M20 88v16h16M100 88v16H84" />
        <g transform="translate(0 -4)">
          <path d="M42 36h36M46 36v18c0 14 8 20 14 20s14-6 14-20V36" />
          <path d="M46 44H36c-4 0-6 6-2 12M74 44h10c4 0 6 6 2 12" />
          <path d="M60 74v10M48 84h24M44 90h32M40 96h40" />
        </g>
      </g>
    </svg>
  );
}
