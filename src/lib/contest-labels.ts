import type {
  Contest,
  ContestHealth,
  ContestStatus,
  FeeTier,
  RightsTag,
  SourceAdapterKind,
  StreetPhotoRelevance,
} from "@/lib/contest-schema";

export const STATUS_LABEL: Record<ContestStatus, string> = {
  draft: "草稿",
  published: "已发布",
  archived: "已归档",
};

export const HEALTH_LABEL: Record<ContestHealth, string> = {
  ok: "正常",
  warn: "需留意",
  dead: "可能失效",
};

export const FEE_LABEL: Record<FeeTier, string> = {
  free: "免费",
  paid: "收费",
  mixed: "混合",
  unknown: "费用未知",
};

export const RELEVANCE_LABEL: Record<StreetPhotoRelevance, string> = {
  core: "核心街拍",
  adjacent: "相邻题材",
  unreviewed: "未初标",
};

export const RIGHTS_TAG_LABEL: Record<RightsTag, string> = {
  transfer_copyright: "版权转让",
  exclusive: "独家",
  no_payment: "无报酬",
  moral_rights_waived: "放弃精神权利",
};

export const ADAPTER_KIND_LABEL: Record<SourceAdapterKind, string> = {
  manual: "手工种子",
  jsonld: "JSON-LD（未接入）",
  html: "HTML（未接入）",
  api: "API（未接入）",
};

export const STATUS_FILTERS = [
  { value: "all", label: "全部状态" },
  { value: "published", label: STATUS_LABEL.published },
  { value: "draft", label: STATUS_LABEL.draft },
  { value: "archived", label: STATUS_LABEL.archived },
] as const;

export const RELEVANCE_FILTERS = [
  { value: "all", label: "全部相关度" },
  { value: "core", label: RELEVANCE_LABEL.core },
  { value: "adjacent", label: RELEVANCE_LABEL.adjacent },
  { value: "unreviewed", label: RELEVANCE_LABEL.unreviewed },
] as const;

export const FEE_FILTERS = [
  { value: "all", label: "全部费用" },
  { value: "free", label: FEE_LABEL.free },
  { value: "paid", label: FEE_LABEL.paid },
  { value: "mixed", label: FEE_LABEL.mixed },
  { value: "unknown", label: FEE_LABEL.unknown },
] as const;

/** Deadline axis. A missing deadline is its own bucket, never "open". */
export const WINDOW_FILTERS = [
  { value: "all", label: "全部" },
  { value: "open", label: "开放中" },
  { value: "closed", label: "已截止" },
  { value: "undated", label: "待定" },
] as const;

export const REGION_FILTERS = [
  { value: "all", label: "全部地区" },
  { value: "online", label: "含线上" },
  { value: "cn", label: "中国" },
  { value: "europe", label: "欧洲" },
  { value: "americas", label: "美洲" },
  { value: "oceania", label: "大洋洲" },
  { value: "other", label: "其他地区" },
] as const;

export type StatusFilter = (typeof STATUS_FILTERS)[number]["value"];
export type RelevanceFilter = (typeof RELEVANCE_FILTERS)[number]["value"];
export type FeeFilter = (typeof FEE_FILTERS)[number]["value"];
export type WindowFilter = (typeof WINDOW_FILTERS)[number]["value"];
export type RegionFilter = (typeof REGION_FILTERS)[number]["value"];

const EUROPE = new Set([
  "AT", "BE", "CH", "CZ", "DE", "DK", "ES", "FI", "FR", "GB", "GR", "HU",
  "IE", "IS", "IT", "LU", "NL", "NO", "PL", "PT", "RO", "SE",
]);
const AMERICAS = new Set(["AR", "BR", "CA", "MX", "US"]);
const OCEANIA = new Set(["AU", "NZ"]);

export function deadlineWindow(
  contest: Pick<Contest, "deadline_at">,
  asOfIso: string,
): Exclude<WindowFilter, "all"> {
  if (!contest.deadline_at) return "undated";
  return Date.parse(contest.deadline_at) >= Date.parse(asOfIso) ? "open" : "closed";
}

/** Online contests also match their country. No country code matches only 含线上. */
export function matchesRegion(
  contest: Pick<Contest, "online" | "geo">,
  region: RegionFilter,
): boolean {
  if (region === "all") return true;
  if (region === "online") return contest.online;
  const country = contest.geo?.country;
  if (!country) return false;
  if (region === "cn") return country === "CN";
  if (region === "europe") return EUROPE.has(country);
  if (region === "americas") return AMERICAS.has(country);
  if (region === "oceania") return OCEANIA.has(country);
  return (
    country !== "CN" &&
    !EUROPE.has(country) &&
    !AMERICAS.has(country) &&
    !OCEANIA.has(country)
  );
}

/**
 * Public date label. Uses the calendar day written in the timestamp
 * (2026-10-31T23:59:00+00:00 stays 10月31日), not a Shanghai clock that
 * turns end-of-day UTC into the next morning.
 */
export function formatContestDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) {
    return new Intl.DateTimeFormat("zh-CN", {
      timeZone: "Asia/Shanghai",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(iso));
  }
  return `${Number(match[1])}年${Number(match[2])}月${Number(match[3])}日`;
}

/** Homepage「即将截止」: open deadlines from now through this many calendar days. */
export const CLOSING_SOON_DAYS = 60;
export const CLOSING_SOON_LIMIT = 8;

const DAY_MS = 24 * 60 * 60 * 1000;

/** UTC midnight of the calendar day written in an ISO timestamp. */
function writtenUtcDay(iso: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return Number.NaN;
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

/**
 * Open contests whose deadline falls within the next 60 calendar days, soonest first.
 * Closed and undated contests are never used to fill the row.
 */
export function selectClosingSoon(
  contests: readonly Contest[],
  asOfIso: string,
): { contests: Contest[]; truncated: boolean } {
  const asOfMs = Date.parse(asOfIso);
  if (!Number.isFinite(asOfMs)) return { contests: [], truncated: false };
  const today = writtenUtcDay(new Date(asOfMs).toISOString());
  const lastDay = today + CLOSING_SOON_DAYS * DAY_MS;

  const matched = contests
    .filter((contest) => {
      if (!contest.deadline_at) return false;
      const deadlineMs = Date.parse(contest.deadline_at);
      if (!Number.isFinite(deadlineMs)) return false;
      if (deadlineWindow(contest, asOfIso) !== "open") return false;
      const deadlineDay = writtenUtcDay(contest.deadline_at);
      return Number.isFinite(deadlineDay) && deadlineDay <= lastDay;
    })
    .sort(
      (a, b) => Date.parse(a.deadline_at ?? "") - Date.parse(b.deadline_at ?? ""),
    );

  return {
    contests: matched.slice(0, CLOSING_SOON_LIMIT),
    truncated: matched.length > CLOSING_SOON_LIMIT,
  };
}

export function windowChipLabel(
  window: Exclude<WindowFilter, "all">,
): string {
  if (window === "open") return "开放中";
  if (window === "closed") return "已截止";
  return "待定";
}

/** Page language. Chinese UI fills placeholders with the title; English UI uses initials. */
export const SITE_UI_LOCALE = "zh-CN";

export function isChineseUi(locale: string = SITE_UI_LOCALE): boolean {
  return locale.toLowerCase().startsWith("zh");
}

/** English UI: initials such as WSPA. Falls back to the title when the name has no Latin words. */
export function englishInitials(name: string): string {
  const stripped = name.replace(/[（(][^）)]*[）)]/g, " ");
  const words = stripped.match(/[A-Za-z0-9]+/g) ?? [];
  const initials = words.map((word) => word[0]!.toUpperCase()).join("");
  if (initials) return initials.slice(0, 8);
  const title = name.trim();
  return title.slice(0, 12) || "·";
}

/**
 * Gray-placeholder caption.
 * zh: the contest or work title (CSS clamps it when the box is small).
 * en: name initials.
 */
export function thumbPlaceholderText(
  title: string,
  locale: string = SITE_UI_LOCALE,
): string {
  const name = title.trim() || "赛事";
  if (isChineseUi(locale)) return name;
  return englishInitials(name);
}

export function compareByWindow(a: Contest, b: Contest, asOfIso: string): number {
  const rank = { open: 0, undated: 1, closed: 2 } as const;
  const left = deadlineWindow(a, asOfIso);
  const right = deadlineWindow(b, asOfIso);
  if (rank[left] !== rank[right]) return rank[left] - rank[right];
  if (left === "open") {
    return Date.parse(a.deadline_at ?? "") - Date.parse(b.deadline_at ?? "");
  }
  if (left === "closed") {
    return Date.parse(b.deadline_at ?? "") - Date.parse(a.deadline_at ?? "");
  }
  return a.name.localeCompare(b.name, "zh");
}

export type RightsChip = "trusted" | "caution" | "unevaluated";

export const RIGHTS_CHIP_LABEL: Record<RightsChip, string> = {
  trusted: "Trusted",
  caution: "需留意",
  unevaluated: "未评估",
};

/**
 * Public rights chip.
 * health warn is the seed caution flag (often a rights caution) → 需留意.
 * Any recorded rights tag is also 需留意, even when health is ok.
 * health dead is not Trusted.
 * health ok with no caution tag → Trusted. That is the seed flag, not a finished legal review.
 */
export function rightsChip(
  contest: Pick<Contest, "health" | "rights_tags">,
): RightsChip {
  if (
    contest.health === "warn" ||
    contest.health === "dead" ||
    contest.rights_tags.length > 0
  ) {
    return "caution";
  }
  if (contest.health === "ok") return "trusted";
  return "unevaluated";
}

export function contestThumbPath(
  contest: Pick<Contest, "gallery_works">,
): string | null {
  return contest.gallery_works.find((work) => work.thumb_path)?.thumb_path ?? null;
}

export function formatPlace(contest: Pick<Contest, "online" | "geo">): string {
  if (contest.online && contest.geo) return `线上 + ${contest.geo.label}`;
  if (contest.online) return "仅线上";
  return contest.geo?.label ?? "地点未填";
}
