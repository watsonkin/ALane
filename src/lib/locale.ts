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

export function isEnPath(pathname: string): boolean {
  return pathname === "/en" || pathname.startsWith("/en/");
}

export function isZhPath(pathname: string): boolean {
  return pathname === "/zh" || pathname.startsWith("/zh/");
}

export function localeFromPathname(pathname: string): Locale {
  return isEnPath(pathname) ? "en" : "zh-CN";
}

/** Drop one or two `/en` or `/zh` prefixes. `/zh/about` and `/en/zh/about` both become `/about`. */
function stripLocalePrefix(pathname: string): string {
  let path = pathname || "/";
  for (let i = 0; i < 2; i += 1) {
    if (path === "/en" || path === "/zh") return "/";
    if (path.startsWith("/en/") || path.startsWith("/zh/")) {
      path = path.slice(3) || "/";
      continue;
    }
    break;
  }
  return path || "/";
}

function withPrefix(prefix: "" | "/en" | "/zh", path: string): string {
  const { pathname, suffix } = splitPath(path);
  const bare = stripLocalePrefix(pathname);
  if (prefix === "") return `${bare}${suffix}`;
  if (bare === "/") return `${prefix}${suffix}`;
  return `${prefix}${bare}${suffix}`;
}

export function toEnPath(path: string): string {
  return withPrefix("/en", path);
}

/** Cookie Chinese: unprefixed, including when the source path was `/zh` or `/en`. */
export function toZhPath(path: string): string {
  return withPrefix("", path);
}

/** Explicit `/zh` path locale. In-page links stay under `/zh`. */
export function toZhPrefixedPath(path: string): string {
  return withPrefix("/zh", path);
}

export function hrefFor(locale: Locale, path: string): string {
  return locale === "en" ? toEnPath(path) : toZhPath(path);
}

/**
 * Keep the current path locale. `/zh/...` stays under `/zh`, `/en/...` under `/en`,
 * and unprefixed Chinese stays unprefixed. Hash-only, protocol-relative, and file
 * URLs (a dot in the path, such as `/calendar.ics`) are returned unchanged.
 */
export function localizeHref(pathname: string, href: string): string {
  if (!href.startsWith("/") || href.startsWith("//")) return href;
  const { pathname: target } = splitPath(href);
  if (target.includes(".")) return href;
  if (isEnPath(pathname)) return toEnPath(href);
  if (isZhPath(pathname)) return toZhPrefixedPath(href);
  return toZhPath(href);
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
