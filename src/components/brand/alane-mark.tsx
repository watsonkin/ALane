/**
 * Official ALane icon. Artwork is Watson's transparent PNG at public/brand/alane-mark.png.
 */
export function AlaneMark({ className }: { className?: string }) {
  return (
    <img
      src="/brand/alane-mark.png"
      alt=""
      aria-hidden="true"
      className={className}
    />
  );
}
