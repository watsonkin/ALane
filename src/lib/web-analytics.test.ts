import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";
import { patchWorkerSource } from "../../scripts/patch-opennext-scheduled.mjs";
import {
  WEB_ANALYTICS_BEACON_SRC,
  injectWebAnalyticsHtml,
  injectWebAnalyticsResponse,
  isAnalyticsExcludedPath,
  isProductionAnalyticsHost,
  isRealWebAnalyticsToken,
  shouldInjectWebAnalytics,
  webAnalyticsBeaconHtml,
} from "./web-analytics-gate.mjs";

const TOKEN = "0123456789abcdef0123456789abcdef";

const FRESH_WORKER = `export default {
    async fetch(request) {
        const url = new URL(request.url);
        if (url.pathname.startsWith("/plain")) {
            return new Response("hello", { headers: { "content-type": "text/plain" } });
        }
        const html = "<html><body><p>Hi</p></body></html>";
        return new Response(html, {
            headers: { "content-type": "text/html; charset=utf-8", "content-length": String(html.length) },
        });
    },
};
`;

function patchedWorker() {
  const result = patchWorkerSource(FRESH_WORKER);
  assert.equal(result.changed, true);
  return result.source;
}

async function loadWorker(source: string) {
  const dir = mkdtempSync(join(tmpdir(), "alane-worker-"));
  const file = join(dir, "worker.mjs");
  writeFileSync(file, source);
  const loaded = (await import(pathToFileURL(file).href)) as {
    default: {
      fetch(request: Request, env: unknown, ctx: unknown): Promise<Response>;
      scheduled(event: unknown, env: unknown, ctx: { waitUntil(promise: Promise<unknown>): void }): Promise<unknown>;
    };
  };
  return {
    worker: loaded.default,
    cleanup() {
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

test("beacon markup is the official script and a 32-hex token", () => {
  const html = webAnalyticsBeaconHtml(TOKEN);
  assert.match(html, new RegExp(`^<script type="module" src="${WEB_ANALYTICS_BEACON_SRC}"`));
  assert.match(html, /data-cf-beacon='\{"token":"0123456789abcdef0123456789abcdef"\}'/);
  assert.equal(html.includes("google"), false);
  assert.equal(html.includes("gtag"), false);
  assert.equal(webAnalyticsBeaconHtml("placeholder"), "");
  assert.equal(webAnalyticsBeaconHtml(`${TOKEN}aa`), "");
  assert.equal(isRealWebAnalyticsToken(`  ${TOKEN}  `), true);
  assert.equal(isRealWebAnalyticsToken(TOKEN.slice(0, 31)), false);
  assert.equal(isRealWebAnalyticsToken(undefined), false);
  assert.equal(isRealWebAnalyticsToken(""), false);
});

test("production hosts are exact and workers.dev never matches", () => {
  assert.equal(isProductionAnalyticsHost("alane.photography"), true);
  assert.equal(isProductionAnalyticsHost("www.alane.photography"), true);
  assert.equal(isProductionAnalyticsHost("WWW.ALANE.PHOTOGRAPHY."), true);
  assert.equal(isProductionAnalyticsHost("alane.example.workers.dev"), false);
  assert.equal(isProductionAnalyticsHost("alane.photography.workers.dev"), false);
  assert.equal(isProductionAnalyticsHost("preview.alane.photography"), false);
  assert.equal(isProductionAnalyticsHost("not-alane.photography"), false);
  assert.equal(isProductionAnalyticsHost("example.com"), false);
});

test("calendar and ics paths are excluded even when they look like pages", () => {
  for (const path of [
    "/calendar.ics",
    "/calendar.ics/",
    "/CALENDAR.ICS",
    "/files/feed.ics",
    "/zh/contests/foo/calendar",
    "/en/contests/foo/calendar",
    "/contests/foo/calendar",
    "/contests/foo/calendar/",
    "/calendar",
  ]) {
    assert.equal(isAnalyticsExcludedPath(path), true, path);
  }
  assert.equal(isAnalyticsExcludedPath("/zh"), false);
  assert.equal(isAnalyticsExcludedPath("/zh/privacy"), false);
  assert.equal(isAnalyticsExcludedPath("/en/contests/foo"), false);
});

test("injection requires a real token, a production host, and HTML", () => {
  const base = {
    hostname: "alane.photography",
    pathname: "/zh",
    contentType: "text/html; charset=utf-8",
    token: TOKEN,
    method: "GET",
    status: 200,
  };
  assert.equal(shouldInjectWebAnalytics(base), true);
  assert.equal(shouldInjectWebAnalytics({ ...base, hostname: "www.alane.photography" }), true);
  assert.equal(shouldInjectWebAnalytics({ ...base, hostname: "alane.example.workers.dev" }), false);
  assert.equal(shouldInjectWebAnalytics({ ...base, pathname: "/calendar.ics" }), false);
  assert.equal(shouldInjectWebAnalytics({ ...base, pathname: "/en/contests/foo/calendar" }), false);
  assert.equal(shouldInjectWebAnalytics({ ...base, token: "changeme" }), false);
  assert.equal(shouldInjectWebAnalytics({ ...base, token: undefined }), false);
  assert.equal(shouldInjectWebAnalytics({ ...base, contentType: "text/calendar" }), false);
  assert.equal(shouldInjectWebAnalytics({ ...base, contentType: "text/plain" }), false);
  assert.equal(shouldInjectWebAnalytics({ ...base, contentType: null }), false);
  assert.equal(shouldInjectWebAnalytics({ ...base, method: "HEAD" }), false);
  assert.equal(shouldInjectWebAnalytics({ ...base, status: 204 }), false);
  assert.equal(shouldInjectWebAnalytics({ ...base, status: 304 }), false);
  assert.equal(shouldInjectWebAnalytics({ ...base, status: 404 }), true);
});

test("HTML rewrite inserts one official beacon before the last body close", () => {
  const once = injectWebAnalyticsHtml("<html><BODY><p>Hi</p></BODY></html>", TOKEN);
  assert.equal(once.includes(webAnalyticsBeaconHtml(TOKEN) + "</BODY>"), true);
  const twice = injectWebAnalyticsHtml(once, TOKEN);
  assert.equal(twice, once);
  const loose = injectWebAnalyticsHtml("<p>Hi</p>", TOKEN);
  assert.equal(loose.endsWith(webAnalyticsBeaconHtml(TOKEN)), true);
});

test("response helper leaves excluded responses unread as HTML injections", async () => {
  const html = "<html><body>Hi</body></html>";
  const response = new Response(html, { headers: { "content-type": "text/html", "content-length": "4" } });
  const skipped = await injectWebAnalyticsResponse(
    new Request("https://alane.example.workers.dev/zh"),
    response,
    TOKEN,
  );
  assert.equal(skipped, response);
  assert.equal(await skipped.text(), html);

  const calendar = await injectWebAnalyticsResponse(
    new Request("https://alane.photography/calendar.ics"),
    new Response(html, { headers: { "content-type": "text/html" } }),
    TOKEN,
  );
  assert.equal(await calendar.text(), html);
});

test("worker wrap injects only on production HTML and keeps the digest POST", async () => {
  const source = patchedWorker();
  assert.equal(source.includes("/api/internal/reminders/digest"), true);
  assert.equal(source.includes('new Request("https://alane.photography/api/reminders/'), false);
  assert.equal(source.includes(TOKEN), false);
  assert.equal(source.includes(WEB_ANALYTICS_BEACON_SRC), true);
  assert.equal(source.includes("alaneOpenNextWorker.scheduled"), true);
  const again = patchWorkerSource(source);
  assert.equal(again.changed, false);
  assert.equal(again.source, source);

  const loaded = await loadWorker(source);
  try {
    const { worker } = loaded;
    const home = await worker.fetch(
      new Request("https://alane.photography/zh"),
      { CF_WEB_ANALYTICS_TOKEN: TOKEN },
      {},
    );
    const homeHtml = await home.text();
    assert.equal(home.headers.get("content-length"), null);
    assert.equal(homeHtml.includes(webAnalyticsBeaconHtml(TOKEN)), true);
    assert.equal(homeHtml.includes("</body>"), true);

    const www = await worker.fetch(
      new Request("https://www.alane.photography/en/privacy"),
      { CF_WEB_ANALYTICS_TOKEN: ` ${TOKEN.toUpperCase()} ` },
      {},
    );
    assert.equal((await www.text()).includes(WEB_ANALYTICS_BEACON_SRC), true);

    for (const url of [
      "https://alane.example.workers.dev/",
      "https://alane.photography.workers.dev/zh",
      "https://example.com/zh",
      "https://alane.photography/calendar.ics",
      "https://alane.photography/zh/contests/foo/calendar",
      "https://alane.photography/en/contests/foo/calendar",
      "https://www.alane.photography/contests/foo/calendar",
      "https://alane.photography/files/feed.ics",
      "https://alane.photography/plain",
    ]) {
      const response = await worker.fetch(new Request(url), { CF_WEB_ANALYTICS_TOKEN: TOKEN }, {});
      assert.equal((await response.text()).includes(WEB_ANALYTICS_BEACON_SRC), false, url);
    }

    const unset = await worker.fetch(new Request("https://alane.photography/zh"), {}, {});
    assert.equal((await unset.text()).includes(WEB_ANALYTICS_BEACON_SRC), false);
    const placeholder = await worker.fetch(
      new Request("https://alane.photography/zh"),
      { CF_WEB_ANALYTICS_TOKEN: "placeholder" },
      {},
    );
    assert.equal((await placeholder.text()).includes(WEB_ANALYTICS_BEACON_SRC), false);

    const head = await worker.fetch(
      new Request("https://alane.photography/zh", { method: "HEAD" }),
      { CF_WEB_ANALYTICS_TOKEN: TOKEN },
      {},
    );
    assert.equal((await head.text()).includes(WEB_ANALYTICS_BEACON_SRC), false);

    const calls: Request[] = [];
    const waits: Promise<unknown>[] = [];
    await worker.scheduled(
      { cron: "15 0 * * *" },
      {
        REMINDERS_CRON_SECRET: "cron-secret",
        WORKER_SELF_REFERENCE: {
          fetch(request: Request) {
            calls.push(request);
            return Promise.resolve(new Response(null, { status: 204 }));
          },
        },
      },
      { waitUntil(promise: Promise<unknown>) { waits.push(promise); } },
    );
    await Promise.all(waits);
    assert.equal(calls.length, 1);
    const digest = calls[0];
    assert.ok(digest);
    assert.equal(new URL(digest.url).pathname, "/api/internal/reminders/digest");
    assert.equal(digest.method, "POST");
    assert.equal(digest.headers.get("authorization"), "Bearer cron-secret");

    const idle: number[] = [];
    await worker.scheduled(
      {},
      {
        WORKER_SELF_REFERENCE: {
          fetch() {
            idle.push(1);
            return Promise.resolve(new Response());
          },
        },
      },
      { waitUntil() {} },
    );
    assert.deepEqual(idle, []);
  } finally {
    loaded.cleanup();
  }
});

test("repo constraints stay put and no analytics token is committed", () => {
  const pkg = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8")) as {
    dependencies: { next: string };
    devDependencies: { "eslint-config-next": string };
    scripts: { postinstall: string; "cf:build": string };
  };
  assert.equal(pkg.dependencies.next, "16.4.5");
  assert.equal(pkg.devDependencies["eslint-config-next"], "16.4.5");
  assert.match(pkg.scripts.postinstall, /patch-opennext-scheduled\.mjs/);
  assert.match(pkg.scripts["cf:build"], /patch-opennext-scheduled\.mjs/);

  const wrangler = readFileSync(new URL("../../wrangler.jsonc", import.meta.url), "utf8");
  assert.match(wrangler, /"REMINDERS_ENABLED": "1"/);
  assert.match(wrangler, /3de071af-8012-47c6-a460-d8189e5113a8/);
  assert.match(wrangler, /"binding": "OUTBOUND_CLICKS"/);
  assert.match(wrangler, /"dataset": "alane_official_outbound"/);
  assert.match(wrangler, /"keep_vars": true/);
  assert.equal(/"CF_WEB_ANALYTICS_TOKEN"\s*:/.test(wrangler), false);
  assert.equal(/[0-9a-f]{32}/i.test(wrangler), false);

  const gate = readFileSync(new URL("./web-analytics-gate.mjs", import.meta.url), "utf8");
  const patch = readFileSync(new URL("../../scripts/patch-opennext-scheduled.mjs", import.meta.url), "utf8");
  assert.equal(/[0-9a-f]{32}/i.test(gate), false);
  assert.equal(/[0-9a-f]{32}/i.test(patch), false);
  assert.match(patch, /\/api\/internal\/reminders\/digest/);
});
