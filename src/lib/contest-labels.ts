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
  { value: "undated", label: "日期未定" },
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

export function formatContestDate(iso: string): string {
  const formatted = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(iso));
  return `${formatted}（北京时间）`;
}

export function formatPlace(contest: Pick<Contest, "online" | "geo">): string {
  if (contest.online && contest.geo) return `线上 + ${contest.geo.label}`;
  if (contest.online) return "仅线上";
  return contest.geo?.label ?? "地点未填";
}
