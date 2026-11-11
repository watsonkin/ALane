import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { POST } from "@/app/api/ops/outbound/route";
import { OfficialSiteLink } from "@/components/official-site-link";
import {
  OFFICIAL_SITE_OUTBOUND,
  OFFICIAL_SITE_OUTBOUND_PATH,
  handleOfficialSiteOutbound,
  officialSiteOutboundInit,
  outboundPoint,
  type OutboundWrite,
} from "@/lib/ops-analytics";

function writer() {
  const points: unknown[] = [];
  const write: OutboundWrite = {
    writeDataPoint(point) {
      points.push(point);
    },
  };
  return { points, write };
}

function post(url: string, body: string, headers: Record<string, string> = {}) {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body,
  });
}

const EXACT = `{"event":"${OFFICIAL_SITE_OUTBOUND}"}`;

test("official-site count writes only the event type and a one", async () => {
  const { points, write } = writer();
  const response = await handleOfficialSiteOutbound(
    post("https://alane.photography/api/ops/outbound", EXACT, {
      cookie: "alane_locale=zh-CN",
      "user-agent": "TestBrowser",
      "cf-connecting-ip": "203.0.113.8",
      referer: "https://alane.photography/zh/contests/example",
    }),
    write,
  );
  assert.equal(response.status, 204);
  assert.deepEqual(points, [outboundPoint()]);
  const stored = JSON.stringify(points[0]);
  assert.equal(stored.includes("203.0.113.8"), false);
  assert.equal(stored.includes("alane_locale"), false);
  assert.equal(stored.includes("TestBrowser"), false);
  assert.equal(stored.includes("contests"), false);
  assert.equal(stored.includes("@"), false);
  assert.equal(stored.includes("http"), false);
  assert.deepEqual(outboundPoint(), {
    blobs: ["official_site_outbound"],
    indexes: ["official_site_outbound"],
    doubles: [1],
  });
});

test("a missing analytics binding returns 204 and stores nothing", async () => {
  const response = await handleOfficialSiteOutbound(
    post("https://www.alane.photography/api/ops/outbound", EXACT),
    null,
  );
  assert.equal(response.status, 204);
  assert.equal(await response.text(), "");
});

test("extra fields, bad events, and query strings write nothing", async () => {
  const cases = [
    post("https://alane.photography/api/ops/outbound", '{"event":"official_site_outbound","email":"a@b.c"}'),
    post("https://alane.photography/api/ops/outbound", '{"event":"official_site_outbound","url":"https://example.com"}'),
    post("https://alane.photography/api/ops/outbound", '{"ip":"203.0.113.8","event":"official_site_outbound"}'),
    post("https://alane.photography/api/ops/outbound", '{"event":"page_view"}'),
    post("https://alane.photography/api/ops/outbound", "[]"),
    post("https://alane.photography/api/ops/outbound", "{}"),
    post("https://alane.photography/api/ops/outbound?email=a@b.c", EXACT),
    post("https://alane.photography/api/ops/outbound?", EXACT),
    new Request("https://alane.photography/api/ops/outbound", {
      method: "POST",
      headers: { "content-type": "text/plain" },
      body: EXACT,
    }),
    post("https://alane.photography/api/ops/outbound", `${"x".repeat(201)}`),
  ];
  for (const request of cases) {
    const { points, write } = writer();
    const response = await handleOfficialSiteOutbound(request, write);
    assert.equal(response.status, 400, request.url);
    assert.deepEqual(points, []);
    assert.equal(await response.text(), "");
  }
});

test("whitespace around the exact object is still only the event", async () => {
  const { points, write } = writer();
  const response = await handleOfficialSiteOutbound(
    post("https://alane.photography/api/ops/outbound", '{\n  "event": "official_site_outbound"\n}'),
    write,
  );
  assert.equal(response.status, 204);
  assert.deepEqual(points, [outboundPoint()]);
});

test("non-POST writes nothing", async () => {
  const { points, write } = writer();
  const response = await handleOfficialSiteOutbound(
    new Request("https://alane.photography/api/ops/outbound", { method: "GET" }),
    write,
  );
  assert.equal(response.status, 405);
  assert.deepEqual(points, []);
});

test("the browser call omits credentials and sends no URL", () => {
  const init = officialSiteOutboundInit();
  assert.equal(init.method, "POST");
  assert.equal(init.credentials, "omit");
  assert.equal(init.referrerPolicy, "no-referrer");
  assert.equal(init.body, EXACT);
  assert.equal(OFFICIAL_SITE_OUTBOUND_PATH, "/api/ops/outbound");
  assert.equal(OFFICIAL_SITE_OUTBOUND_PATH.includes("?"), false);
  const parsed = JSON.parse(String(init.body)) as { event: string };
  assert.deepEqual(parsed, { event: "official_site_outbound" });
  assert.equal(Object.keys(parsed).length, 1);
});

test("the route accepts the exact event without a binding and rejects a query", async () => {
  const ok = await POST(post("https://alane.photography/api/ops/outbound", EXACT));
  assert.equal(ok.status, 204);
  const rejected = await POST(post("https://alane.photography/api/ops/outbound?ref=person", EXACT));
  assert.equal(rejected.status, 400);
});

test("only the official-site control reports the count", () => {
  const html = renderToStaticMarkup(
    createElement(OfficialSiteLink, {
      href: "https://example.com/official",
      className: "text-link",
      children: "查看官网",
    }),
  );
  assert.match(html, /href="https:\/\/example.com\/official"/);
  assert.match(html, /查看官网/);
  assert.equal(html.includes("/api/ops/outbound"), false);
  assert.equal(html.includes("official_site_outbound"), false);

  const detail = readFileSync(new URL("../components/contest-detail.tsx", import.meta.url), "utf8");
  assert.equal(detail.match(/<OfficialSiteLink/g)?.length, 1);
  assert.match(detail, /href=\{sourceUrl\}/);
  const link = readFileSync(new URL("../components/official-site-link.tsx", import.meta.url), "utf8");
  assert.equal(link.includes("official_url"), false);
  assert.match(link, /onClick=\{reportOfficialSiteOutbound\}/);
});
