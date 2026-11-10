import { deadlineWindow, deadlineWithinDays, displayName } from "@/lib/contest-labels";
import type { Contest } from "@/lib/contest-schema";
import { DIGEST_CLOSING_DAYS, DIGEST_ITEM_CAP } from "@/lib/reminders/constants";

export type SeenSets = {
  initialized: boolean;
  open: Set<string>;
  closing: Set<string>;
  gallery: Set<string>;
};

export type DigestItem =
  | { kind: "open"; key: string; contest: Contest }
  | { kind: "closing"; key: string; contest: Contest }
  | { kind: "gallery"; key: string; contest: Contest; url: string };

export type DigestPlan =
  | { kind: "baseline"; seen: SeenSets }
  | {
      kind: "diff";
      items: DigestItem[];
      overflow: boolean;
      nextSeen: SeenSets;
      retainSeen: SeenSets;
    };

export function emptySeen(): SeenSets {
  return { initialized: false, open: new Set(), closing: new Set(), gallery: new Set() };
}

function openKey(contest: Contest): string {
  return `${contest.id}|${contest.edition ?? ""}`;
}

function isOpenCall(contest: Contest, asOfIso: string): boolean {
  if (contest.status !== "published") return false;
  if (contest.open_at) {
    const openMs = Date.parse(contest.open_at);
    const asOfMs = Date.parse(asOfIso);
    if (Number.isFinite(openMs) && Number.isFinite(asOfMs) && openMs > asOfMs) return false;
  }
  return deadlineWindow(contest, asOfIso) === "open";
}

function intersect(left: Set<string>, right: Set<string>): Set<string> {
  const next = new Set<string>();
  for (const key of left) {
    if (right.has(key)) next.add(key);
  }
  return next;
}

function byName(left: Contest, right: Contest): number {
  return displayName(left, "zh-CN").localeCompare(displayName(right, "zh-CN"), "zh");
}

/**
 * Diff published contests against the last snapshot.
 * The first call baselines the current catalog and sends nothing.
 */
export function planDigest(
  contests: readonly Contest[],
  seen: SeenSets,
  asOfIso: string,
): DigestPlan {
  const currentOpen = new Set<string>();
  const currentClosing = new Set<string>();
  const currentGallery = new Set<string>();
  const openItems: DigestItem[] = [];
  const closingItems: DigestItem[] = [];
  const galleryItems: DigestItem[] = [];

  const ordered = [...contests].sort(byName);
  for (const contest of ordered) {
    if (isOpenCall(contest, asOfIso)) {
      const key = openKey(contest);
      currentOpen.add(key);
      if (seen.initialized && !seen.open.has(key)) {
        openItems.push({ kind: "open", key, contest });
      }
    }
    if (
      contest.status === "published" &&
      deadlineWithinDays(contest, asOfIso, DIGEST_CLOSING_DAYS)
    ) {
      currentClosing.add(contest.id);
      if (seen.initialized && !seen.closing.has(contest.id)) {
        closingItems.push({ kind: "closing", key: contest.id, contest });
      }
    }
    if (contest.status === "published" || contest.status === "archived") {
      const urls = [...contest.gallery_urls].sort((a, b) => a.url.localeCompare(b.url));
      for (const gallery of urls) {
        const key = `${contest.id}|${gallery.url}`;
        currentGallery.add(key);
        if (seen.initialized && !seen.gallery.has(key)) {
          galleryItems.push({ kind: "gallery", key, contest, url: gallery.url });
        }
      }
    }
  }

  closingItems.sort(
    (a, b) => Date.parse(a.contest.deadline_at ?? "") - Date.parse(b.contest.deadline_at ?? ""),
  );

  if (!seen.initialized) {
    return {
      kind: "baseline",
      seen: {
        initialized: true,
        open: currentOpen,
        closing: currentClosing,
        gallery: currentGallery,
      },
    };
  }

  const combined = [...openItems, ...closingItems, ...galleryItems];
  const items = combined.slice(0, DIGEST_ITEM_CAP);
  const retainSeen: SeenSets = {
    initialized: true,
    open: new Set(seen.open),
    closing: intersect(seen.closing, currentClosing),
    gallery: intersect(seen.gallery, currentGallery),
  };
  const nextSeen: SeenSets = {
    initialized: true,
    open: new Set(retainSeen.open),
    closing: new Set(retainSeen.closing),
    gallery: new Set(retainSeen.gallery),
  };
  for (const item of items) {
    if (item.kind === "open") nextSeen.open.add(item.key);
    if (item.kind === "closing") nextSeen.closing.add(item.key);
    if (item.kind === "gallery") nextSeen.gallery.add(item.key);
  }

  return {
    kind: "diff",
    items,
    overflow: combined.length > DIGEST_ITEM_CAP,
    nextSeen,
    retainSeen,
  };
}
