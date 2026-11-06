import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";
import {
  hrefFor,
  isEnPath,
  isZhPath,
  localizeHref,
  localeFromPathname,
  toEnPath,
  toZhPath,
  toZhPrefixedPath,
} from "@/lib/locale";

test("path locale prefixes are exact", () => {
  assert.equal(isEnPath("/en"), true);
  assert.equal(isEnPath("/en/about"), true);
  assert.equal(isEnPath("/english"), false);
  assert.equal(isZhPath("/zh"), true);
  assert.equal(isZhPath("/zh/contests/bspf"), true);
  assert.equal(isZhPath("/zhang"), false);
  assert.equal(localeFromPathname("/zh/about"), "zh-CN");
  assert.equal(localeFromPathname("/about"), "zh-CN");
  assert.equal(localeFromPathname("/en"), "en");
});

test("toEnPath never nests /zh under /en", () => {
  assert.equal(toEnPath("/zh"), "/en");
  assert.equal(toEnPath("/zh/about"), "/en/about");
  assert.equal(toEnPath("/zh/contests/bspf?window=open"), "/en/contests/bspf?window=open");
  assert.equal(toEnPath("/en/zh"), "/en");
  assert.equal(toEnPath("/about"), "/en/about");
  assert.equal(toEnPath("/"), "/en");
  assert.equal(toEnPath("/en/about"), "/en/about");
});

test("中 goes to unprefixed Chinese and /zh links stay under /zh", () => {
  assert.equal(toZhPath("/zh"), "/");
  assert.equal(toZhPath("/zh/about?window=open#list"), "/about?window=open#list");
  assert.equal(toZhPath("/en/contests/bspf"), "/contests/bspf");
  assert.equal(toZhPrefixedPath("/about"), "/zh/about");
  assert.equal(toZhPrefixedPath("/en/about"), "/zh/about");
  assert.equal(toZhPrefixedPath("/"), "/zh");
  assert.equal(hrefFor("zh-CN", "/zh/terms"), "/terms");
  assert.equal(hrefFor("en", "/zh/terms"), "/en/terms");
});

test("localizeHref follows the page prefix and leaves files alone", () => {
  assert.equal(localizeHref("/zh/about", "/terms"), "/zh/terms");
  assert.equal(localizeHref("/zh", "/contests/bspf"), "/zh/contests/bspf");
  assert.equal(localizeHref("/zh", "/?window=open#contest-list"), "/zh?window=open#contest-list");
  assert.equal(localizeHref("/en/about", "/privacy"), "/en/privacy");
  assert.equal(localizeHref("/about", "/privacy"), "/privacy");
  assert.equal(localizeHref("/", "/"), "/");
  assert.equal(localizeHref("/zh", "/calendar.ics"), "/calendar.ics");
  assert.equal(localizeHref("/zh", "#contest-list"), "#contest-list");
  assert.equal(localizeHref("/zh/about", "https://example.com/terms"), "https://example.com/terms");
});

function respond(path: string, cookie?: string, acceptLanguage?: string) {
  const headers = new Headers();
  if (cookie) headers.set("cookie", `alane_locale=${cookie}`);
  if (acceptLanguage) headers.set("accept-language", acceptLanguage);
  const request = new NextRequest(new URL(path, "http://alane.local"), { headers });
  return proxy(request);
}

test("proxy does not redirect /zh to /en/zh", () => {
  for (const path of ["/zh", "/zh/about", "/zh/contests/bspf"]) {
    const englishCookie = respond(path, "en", "en");
    assert.equal(englishCookie.status, 200, path);
    assert.equal(englishCookie.headers.get("location"), null, path);
    assert.equal(englishCookie.cookies.get("alane_locale")?.value, "zh-CN");

    const acceptEnglish = respond(path, undefined, "en");
    assert.equal(acceptEnglish.status, 200, path);
    assert.equal(acceptEnglish.headers.get("location"), null, path);
  }
});

test("proxy still sends unprefixed English cookie traffic to /en", () => {
  const redirected = respond("/about?window=open", "en");
  assert.equal(redirected.status, 307);
  assert.equal(new URL(redirected.headers.get("location") ?? "", "http://alane.local").pathname, "/en/about");
  assert.equal(new URL(redirected.headers.get("location") ?? "", "http://alane.local").search, "?window=open");

  const chinese = respond("/about", "zh-CN", "en");
  assert.equal(chinese.status, 200);
  assert.equal(chinese.headers.get("location"), null);

  const firstVisit = respond("/", undefined, "en");
  assert.equal(firstVisit.status, 307);
  assert.equal(new URL(firstVisit.headers.get("location") ?? "", "http://alane.local").pathname, "/en");
  assert.equal(firstVisit.cookies.get("alane_locale"), undefined);
});

test("proxy sets the English cookie on /en and does not nest it", () => {
  const response = respond("/en/about", "zh-CN", "zh-CN");
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("location"), null);
  assert.equal(response.cookies.get("alane_locale")?.value, "en");
});
