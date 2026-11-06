import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  LOCALE_COOKIE,
  LOCALE_MAX_AGE,
  isEnPath,
  isLocale,
  isZhPath,
  localeFromAcceptLanguage,
  toEnPath,
} from "@/lib/locale";

const COOKIE = {
  path: "/",
  maxAge: LOCALE_MAX_AGE,
  sameSite: "lax" as const,
  httpOnly: true,
};

function skip(pathname: string): boolean {
  if (pathname.startsWith("/_next")) return true;
  if (pathname === "/locale" || pathname.startsWith("/locale/")) return true;
  if (pathname.includes(".")) return true;
  return false;
}

/**
 * URL wins, then the alane_locale cookie, then Accept-Language.
 * `/en` and `/zh` are both explicit path locales: visiting either sets the
 * cookie and is never nested under the other (`/zh` must not 307 to `/en/zh`).
 * An English cookie on an unprefixed path redirects to the /en equivalent.
 * A first visit with no cookie and a non-Chinese Accept-Language also
 * redirects, without setting the cookie until the /en response.
 * Unprefixed paths stay the cookie-Chinese surface.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (skip(pathname)) return NextResponse.next();

  if (isEnPath(pathname)) {
    const response = NextResponse.next();
    response.cookies.set(LOCALE_COOKIE, "en", COOKIE);
    return response;
  }

  if (isZhPath(pathname)) {
    const response = NextResponse.next();
    response.cookies.set(LOCALE_COOKIE, "zh-CN", COOKIE);
    return response;
  }

  const saved = request.cookies.get(LOCALE_COOKIE)?.value;
  const cookie = isLocale(saved) ? saved : null;
  if (cookie === "en") {
    const url = request.nextUrl.clone();
    url.pathname = toEnPath(pathname);
    url.search = search;
    return NextResponse.redirect(url);
  }
  if (cookie === "zh-CN") return NextResponse.next();

  const detected = localeFromAcceptLanguage(request.headers.get("accept-language"));
  if (detected === "en") {
    const url = request.nextUrl.clone();
    url.pathname = toEnPath(pathname);
    url.search = search;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
