import { deadlineWindow, displayEdition, displayName } from "@/lib/contest-labels";
import { DIGEST_CLOSING_DAYS, DIGEST_ITEM_CAP } from "@/lib/reminders/constants";
import type { ReminderLocale } from "@/lib/reminders/schema";

const DAY_MS = 24 * 60 * 60 * 1000;

export type DigestContest = {
  id: string;
  slug: string;
  name: string;
  name_zh?: string | null;
  name_en?: string | null;
  status: "draft" | "published" | "archived";
  deadline_at: string | null;
  edition: string | null;
  edition_en?: string | null;
  official_url: string;
  gallery_urls: readonly { url: string }[];
};

export type DigestItem = {
  kind: "open" | "closing" | "winners";
  key: string;
  id: string;
  slug: string;
  name: string;
  nameZh: string;
  nameEn: string;
  edition: string | null;
  editionEn: string | null;
  deadlineAt: string | null;
  officialUrl: string;
  detailPath: string;
  galleryUrl: string | null;
};

export type DigestCatalog = {
  open: DigestItem[];
  closing: DigestItem[];
  winners: DigestItem[];
};

export type DigestSnapshot = {
  openKeys: string[];
  closingKeys: string[];
  galleryKeys: string[];
};

export type DigestDiff = {
  baseline: boolean;
  items: DigestItem[];
  truncated: boolean;
  next: DigestSnapshot;
};

function utcDay(iso: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return Number.NaN;
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function toItem(
  kind: DigestItem["kind"],
  key: string,
  contest: DigestContest,
  galleryUrl: string | null,
): DigestItem {
  return {
    kind,
    key,
    id: contest.id,
    slug: contest.slug,
    name: contest.name,
    nameZh: displayName(contest, "zh-CN"),
    nameEn: displayName(contest, "en"),
    edition: displayEdition(contest, "zh-CN"),
    editionEn: displayEdition(contest, "en"),
    deadlineAt: contest.deadline_at,
    officialUrl: contest.official_url,
    detailPath: `/contests/${contest.slug}`,
    galleryUrl,
  };
}

/**
 * Published contests only. Open and closing follow the on-site deadline window.
 * Closing is the next 14 calendar days. Winner rows are gallery_urls, never work files.
 */
export function catalogContests(contests: readonly DigestContest[], asOfIso: string): DigestCatalog {
  const asOfMs = Date.parse(asOfIso);
  const today = Number.isFinite(asOfMs) ? utcDay(new Date(asOfMs).toISOString()) : Number.NaN;
  const lastClosingDay = today + DIGEST_CLOSING_DAYS * DAY_MS;
  const open: DigestItem[] = [];
  const closing: DigestItem[] = [];
  const winners: DigestItem[] = [];

  for (const contest of contests) {
    if (contest.status !== "published") continue;
    if (deadlineWindow(contest, asOfIso) === "open") {
      const edition = contest.edition?.trim() || "";
      open.push(toItem("open", `${contest.id}\t${edition}`, contest, null));
      if (contest.deadline_at) {
        const deadlineDay = utcDay(contest.deadline_at);
        if (Number.isFinite(today) && Number.isFinite(deadlineDay) && deadlineDay <= lastClosingDay) {
          closing.push(toItem("closing", contest.id, contest, null));
        }
      }
    }
    for (const gallery of contest.gallery_urls) {
      const url = gallery.url.trim();
      if (!url) continue;
      winners.push(toItem("winners", `${contest.id}\t${url}`, contest, url));
    }
  }

  const byKey = (a: DigestItem, b: DigestItem) => a.key.localeCompare(b.key);
  open.sort(byKey);
  closing.sort(byKey);
  winners.sort(byKey);
  return { open, closing, winners };
}

/** No previous snapshot is a baseline: record the catalog and send nothing. */
export function diffCatalog(previous: DigestSnapshot | null, catalog: DigestCatalog): DigestDiff {
  const next: DigestSnapshot = {
    openKeys: catalog.open.map((item) => item.key),
    closingKeys: catalog.closing.map((item) => item.key),
    galleryKeys: catalog.winners.map((item) => item.key),
  };
  if (!previous) {
    return { baseline: true, items: [], truncated: false, next };
  }
  const openKeys = new Set(previous.openKeys);
  const closingKeys = new Set(previous.closingKeys);
  const galleryKeys = new Set(previous.galleryKeys);
  const fresh = [
    ...catalog.open.filter((item) => !openKeys.has(item.key)),
    ...catalog.closing.filter((item) => !closingKeys.has(item.key)),
    ...catalog.winners.filter((item) => !galleryKeys.has(item.key)),
  ];
  return {
    baseline: false,
    items: fresh.slice(0, DIGEST_ITEM_CAP),
    truncated: fresh.length > DIGEST_ITEM_CAP,
    next,
  };
}

export function parseSnapshot(raw: string | null): DigestSnapshot | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") return null;
    const record = value as Partial<DigestSnapshot>;
    if (!Array.isArray(record.openKeys) || !Array.isArray(record.closingKeys) || !Array.isArray(record.galleryKeys)) {
      return null;
    }
    const strings = (items: unknown[]) => items.filter((item): item is string => typeof item === "string");
    return {
      openKeys: strings(record.openKeys),
      closingKeys: strings(record.closingKeys),
      galleryKeys: strings(record.galleryKeys),
    };
  } catch {
    return null;
  }
}

export function detailUrl(origin: string, item: DigestItem, locale: ReminderLocale): string {
  const path = locale === "en" ? `/en${item.detailPath}` : item.detailPath;
  return `${origin}${path}`;
}
