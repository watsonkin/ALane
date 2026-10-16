import type { Locale } from "@/lib/locale";
import type {
  Contest,
  ContestHealth,
  ContestStatus,
  FeeTier,
  GalleryUrl,
  RightsTag,
  SourceAdapterKind,
  StreetPhotoRelevance,
} from "@/lib/contest-schema";

export const STATUS_LABEL: Record<ContestStatus, string> = {
  draft: "草稿",
  published: "已发布",
  archived: "已归档",
};

const STATUS_LABEL_EN: Record<ContestStatus, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};

export const HEALTH_LABEL: Record<ContestHealth, string> = {
  ok: "正常",
  warn: "需留意",
  dead: "可能失效",
};

const HEALTH_LABEL_EN: Record<ContestHealth, string> = {
  ok: "Healthy",
  warn: "Check",
  dead: "May be dead",
};

export const FEE_LABEL: Record<FeeTier, string> = {
  free: "免费",
  paid: "收费",
  mixed: "混合",
  unknown: "费用未知",
};

const FEE_LABEL_EN: Record<FeeTier, string> = {
  free: "Free",
  paid: "Paid",
  mixed: "Mixed",
  unknown: "Fee unknown",
};

export const RELEVANCE_LABEL: Record<StreetPhotoRelevance, string> = {
  core: "核心街拍",
  adjacent: "相邻题材",
  unreviewed: "未初标",
};

const RELEVANCE_LABEL_EN: Record<StreetPhotoRelevance, string> = {
  core: "Core street",
  adjacent: "Adjacent",
  unreviewed: "Unreviewed",
};

export const RIGHTS_TAG_LABEL: Record<RightsTag, string> = {
  transfer_copyright: "版权转让",
  exclusive: "独家",
  no_payment: "无报酬",
  moral_rights_waived: "放弃精神权利",
};

const RIGHTS_TAG_LABEL_EN: Record<RightsTag, string> = {
  transfer_copyright: "Copyright transfer",
  exclusive: "Exclusive",
  no_payment: "Unpaid",
  moral_rights_waived: "Moral rights waived",
};

export const ADAPTER_KIND_LABEL: Record<SourceAdapterKind, string> = {
  manual: "手工种子",
  jsonld: "JSON-LD（未接入）",
  html: "HTML（未接入）",
  api: "API（未接入）",
};

const ADAPTER_KIND_LABEL_EN: Record<SourceAdapterKind, string> = {
  manual: "Manual seed",
  jsonld: "JSON-LD (not connected)",
  html: "HTML (not connected)",
  api: "API (not connected)",
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

const STATUS_FILTER_EN: Record<StatusFilter, string> = {
  all: "Any status",
  published: STATUS_LABEL_EN.published,
  draft: STATUS_LABEL_EN.draft,
  archived: STATUS_LABEL_EN.archived,
};

const RELEVANCE_FILTER_EN: Record<RelevanceFilter, string> = {
  all: "Any relevance",
  core: RELEVANCE_LABEL_EN.core,
  adjacent: RELEVANCE_LABEL_EN.adjacent,
  unreviewed: RELEVANCE_LABEL_EN.unreviewed,
};

const FEE_FILTER_EN: Record<FeeFilter, string> = {
  all: "Any fee",
  free: FEE_LABEL_EN.free,
  paid: FEE_LABEL_EN.paid,
  mixed: FEE_LABEL_EN.mixed,
  unknown: FEE_LABEL_EN.unknown,
};

const WINDOW_FILTER_EN: Record<WindowFilter, string> = {
  all: "All",
  open: "Open",
  closed: "Closed",
  undated: "Date TBD",
};

const REGION_FILTER_EN: Record<RegionFilter, string> = {
  all: "All regions",
  online: "Includes online",
  cn: "China",
  europe: "Europe",
  americas: "Americas",
  oceania: "Oceania",
  other: "Other regions",
};

function localizeFilters<T extends string>(
  options: readonly { value: T; label: string }[],
  locale: Locale,
  english: Record<T, string>,
): readonly { value: T; label: string }[] {
  if (locale !== "en") return options;
  return options.map((option) => ({ value: option.value, label: english[option.value] }));
}

export function statusFilters(locale: Locale) {
  return localizeFilters(STATUS_FILTERS, locale, STATUS_FILTER_EN);
}

export function relevanceFilters(locale: Locale) {
  return localizeFilters(RELEVANCE_FILTERS, locale, RELEVANCE_FILTER_EN);
}

export function feeFilters(locale: Locale) {
  return localizeFilters(FEE_FILTERS, locale, FEE_FILTER_EN);
}

export function windowFilters(locale: Locale) {
  return localizeFilters(WINDOW_FILTERS, locale, WINDOW_FILTER_EN);
}

export function regionFilters(locale: Locale) {
  return localizeFilters(REGION_FILTERS, locale, REGION_FILTER_EN);
}

export function statusLabel(status: ContestStatus, locale: Locale): string {
  return locale === "en" ? STATUS_LABEL_EN[status] : STATUS_LABEL[status];
}

export function healthLabel(health: ContestHealth, locale: Locale): string {
  return locale === "en" ? HEALTH_LABEL_EN[health] : HEALTH_LABEL[health];
}

export function feeLabel(fee: FeeTier, locale: Locale): string {
  return locale === "en" ? FEE_LABEL_EN[fee] : FEE_LABEL[fee];
}

export function relevanceLabel(relevance: StreetPhotoRelevance, locale: Locale): string {
  return locale === "en" ? RELEVANCE_LABEL_EN[relevance] : RELEVANCE_LABEL[relevance];
}

export function rightsTagLabel(tag: RightsTag, locale: Locale): string {
  return locale === "en" ? RIGHTS_TAG_LABEL_EN[tag] : RIGHTS_TAG_LABEL[tag];
}

export function adapterLabel(kind: SourceAdapterKind, locale: Locale): string {
  return locale === "en" ? ADAPTER_KIND_LABEL_EN[kind] : ADAPTER_KIND_LABEL[kind];
}

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

const EN_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

/**
 * Public date label. Uses the calendar day written in the timestamp
 * (2026-10-31T23:59:00+00:00 stays 31 Oct / 10月31日), not a Shanghai clock that
 * turns end-of-day UTC into the next morning.
 */
export function formatContestDate(iso: string, locale: Locale): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) {
    return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "zh-CN", {
      timeZone: "UTC",
      year: "numeric",
      month: locale === "en" ? "short" : "long",
      day: "numeric",
    }).format(new Date(iso));
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (locale === "en") return `${day} ${EN_MONTHS[month - 1] ?? ""} ${year}`;
  return `${year}年${month}月${day}日`;
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
  locale: Locale,
): string {
  return locale === "en" ? WINDOW_FILTER_EN[window] : window === "open" ? "开放中" : window === "closed" ? "已截止" : "待定";
}

export function isChineseUi(locale: string): boolean {
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
export function thumbPlaceholderText(title: string, locale: string): string {
  const name = title.trim() || (isChineseUi(locale) ? "赛事" : "Award");
  if (isChineseUi(locale)) return name;
  return englishInitials(name);
}

/** English UI prefers edition_en. Chinese UI reads edition only. */
export function displayEdition(
  record: { edition?: string | null; edition_en?: string | null },
  locale: Locale,
): string | null {
  if (locale === "en") {
    const english = record.edition_en?.trim();
    if (english) return english;
  }
  const edition = record.edition?.trim();
  return edition || null;
}

function firstFilled(...values: Array<string | null | undefined>): string {
  for (const value of values) {
    const text = value?.trim();
    if (text) return text;
  }
  return "";
}

function sameGalleryText(left: string, right: string): boolean {
  return left.localeCompare(right, undefined, { sensitivity: "accent" }) === 0;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * True when `part` already stands alone inside `whole`.
 * A year inside a longer number, or a word inside a longer word, does not count.
 */
function containsGalleryToken(whole: string, part: string): boolean {
  if (!part || part.length > whole.length) return false;
  const pattern = new RegExp(
    `(?:^|[^0-9A-Za-z])${escapeRegExp(part)}(?:$|[^0-9A-Za-z])`,
    "i",
  );
  return pattern.test(whole);
}

/**
 * Join a gallery title and edition with a middle dot only when both add information.
 * `2025` + `2025` stays `2025`. `2026 Single Photo` + `2026` stays `2026 Single Photo`.
 */
export function formatGalleryLinkLabel(
  title: string,
  edition: string | null | undefined,
): string {
  const name = title.trim().replace(/\s+/g, " ");
  const year = (edition ?? "").trim().replace(/\s+/g, " ");
  if (!year) return name;
  if (!name) return year;
  if (sameGalleryText(name, year)) return name;
  if (containsGalleryToken(name, year)) return name;
  if (containsGalleryToken(year, name)) return year;
  return `${name} · ${year}`;
}

/**
 * Locale label for one gallery link.
 * English prefers `label_en`, Chinese prefers `label_zh`, then the shared `label`.
 * A single `label` still works for both locales.
 */
export function galleryLinkText(
  gallery: Pick<GalleryUrl, "label" | "label_zh" | "label_en" | "edition" | "edition_en">,
  locale: Locale,
  fallback: string,
): string {
  const title =
    locale === "en"
      ? firstFilled(gallery.label_en, gallery.label, fallback)
      : firstFilled(gallery.label_zh, gallery.label, fallback);
  return formatGalleryLinkLabel(title, displayEdition(gallery, locale));
}

export function displayName(
  contest: Pick<Contest, "name"> & { name_zh?: string | null; name_en?: string | null },
  locale: Locale,
): string {
  if (locale === "zh-CN") {
    const zhName = contest.name_zh?.trim();
    return zhName || contest.name;
  }
  const enName = contest.name_en?.trim();
  return enName || contest.name;
}

export function compareByWindow(
  a: Contest,
  b: Contest,
  asOfIso: string,
  locale: Locale,
): number {
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
  return displayName(a, locale).localeCompare(
    displayName(b, locale),
    locale === "en" ? "en" : "zh",
  );
}

export type RightsChip = "trusted" | "caution" | "unevaluated";

export const RIGHTS_CHIP_LABEL: Record<RightsChip, string> = {
  trusted: "Trusted",
  caution: "需留意",
  unevaluated: "未评估",
};

const RIGHTS_CHIP_LABEL_EN: Record<RightsChip, string> = {
  trusted: "Trusted",
  caution: "Check rights",
  unevaluated: "Not reviewed",
};

export function rightsChipLabel(kind: RightsChip, locale: Locale): string {
  return locale === "en" ? RIGHTS_CHIP_LABEL_EN[kind] : RIGHTS_CHIP_LABEL[kind];
}

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

export function formatPlace(
  contest: Pick<Contest, "online" | "geo">,
  locale: Locale,
): string {
  if (contest.online && contest.geo) {
    return locale === "en" ? `Online + ${contest.geo.label}` : `线上 + ${contest.geo.label}`;
  }
  if (contest.online) return locale === "en" ? "Online only" : "仅线上";
  return contest.geo?.label ?? (locale === "en" ? "Place not recorded" : "地点未填");
}
