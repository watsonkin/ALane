import { NextResponse } from "next/server";
import {
  LOCALE_COOKIE,
  LOCALE_MAX_AGE,
  isLocale,
  safeNextPath,
  toEnPath,
  toZhPath,
} from "@/lib/locale";

/** Manual switch. Sets the cookie, then redirects to the matching path. */
export function GET(request: Request) {
  const url = new URL(request.url);
  const requestedLocale = url.searchParams.get("to");
  const locale = isLocale(requestedLocale) ? requestedLocale : "zh-CN";
  const fallback = locale === "en" ? "/en" : "/";
  const requested = safeNextPath(url.searchParams.get("next"), fallback);
  const next = locale === "en" ? toEnPath(requested) : toZhPath(requested);
  // Relative Location keeps the browser on the host it used. request.url in
  // `next dev` is http://0.0.0.0, and an absolute redirect there drops the cookie.
  const response = new NextResponse(null, {
    status: 302,
    headers: { Location: next },
  });
  response.cookies.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: LOCALE_MAX_AGE,
    sameSite: "lax",
    httpOnly: true,
  });
  return response;
}
