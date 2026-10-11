export const LOCALES = ["zh-CN", "en"] as const;

export type Locale = (typeof LOCALES)[number];

export const LOCALE_COOKIE = "alane_locale";

/** More than a year, including a leap day. */
export const LOCALE_MAX_AGE = 60 * 60 * 24 * 366;

export function isLocale(value: string | null | undefined): value is Locale {
  return value === "zh-CN" || value === "en";
}

/**
 * Highest-q tag only. A leading zh tag (including zh-TW) maps to zh-CN.
 * Any other tag, or an empty header, maps to en.
 */
export function localeFromAcceptLanguage(header: string | null): Locale {
  if (!header) return "en";
  const tags = header
    .split(",")
    .map((part) => {
      const [tagRaw, ...params] = part.trim().split(";");
      let q = 1;
      for (const param of params) {
        const [key, raw] = param.trim().split("=");
        if (key === "q") {
          const parsed = Number(raw);
          q = Number.isFinite(parsed) ? parsed : 0;
        }
      }
      return { tag: tagRaw.trim().toLowerCase(), q };
    })
    .filter((item) => item.tag && item.tag !== "*");

  if (tags.length === 0) return "en";
  tags.sort((a, b) => b.q - a.q);
  const top = tags[0];
  if (!top || top.q <= 0) return "en";
  return top.tag.startsWith("zh") ? "zh-CN" : "en";
}

function splitPath(path: string): { pathname: string; suffix: string } {
  const hashAt = path.indexOf("#");
  const queryAt = path.indexOf("?");
  let cut = path.length;
  if (queryAt >= 0) cut = Math.min(cut, queryAt);
  if (hashAt >= 0) cut = Math.min(cut, hashAt);
  return { pathname: path.slice(0, cut) || "/", suffix: path.slice(cut) };
}

export function localeFromPathname(pathname: string): Locale {
  return pathname === "/en" || pathname.startsWith("/en/") ? "en" : "zh-CN";
}

export function toEnPath(path: string): string {
  const { pathname, suffix } = splitPath(path);
  if (pathname === "/en" || pathname.startsWith("/en/")) return `${pathname}${suffix}`;
  if (pathname === "/") return `/en${suffix}`;
  return `/en${pathname}${suffix}`;
}

export function toZhPath(path: string): string {
  const { pathname, suffix } = splitPath(path);
  if (pathname === "/en") return `/${suffix}`;
  if (pathname.startsWith("/en/")) return `${pathname.slice(3)}${suffix}`;
  return `${pathname}${suffix}`;
}

export function hrefFor(locale: Locale, path: string): string {
  return locale === "en" ? toEnPath(path) : toZhPath(path);
}

/** Same-origin path only. Rejects protocol-relative and backslash tricks. */
export function safeNextPath(raw: string | null, fallback: string): string {
  if (!raw) return fallback;
  if (
    !raw.startsWith("/") ||
    raw.startsWith("//") ||
    raw.includes("\\") ||
    raw.includes("\n") ||
    raw.includes("\r")
  ) {
    return fallback;
  }
  try {
    const url = new URL(raw, "http://alane.local");
    if (url.origin !== "http://alane.local") return fallback;
    if (!url.pathname.startsWith("/") || url.pathname.startsWith("//")) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
