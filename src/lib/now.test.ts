import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { NOW_TICK_MS, debugNowAllowed, parseDebugNow, readNowMs } from "@/lib/now";
import { useNow } from "@/lib/use-now";

const A1 = "2026-10-17T23:59:30+02:00";
const A1_MS = Date.parse(A1);

test("tick interval is 60 seconds", () => {
  assert.equal(NOW_TICK_MS, 60_000);
});

test("debug clock is limited to dev and loopback preview", () => {
  assert.equal(debugNowAllowed("development", "alane.example"), true);
  assert.equal(debugNowAllowed("test", undefined), true);
  assert.equal(debugNowAllowed("production", "alane.example"), false);
  assert.equal(debugNowAllowed("production", undefined), false);
  assert.equal(debugNowAllowed("production", "localhost"), true);
  assert.equal(debugNowAllowed("production", "127.0.0.1"), true);
  assert.equal(debugNowAllowed("production", "::1"), true);
});

test("?now= parses offsets and is ignored in production", () => {
  assert.equal(parseDebugNow(A1), A1_MS);
  assert.equal(parseDebugNow("2026-10-17T21:59:30Z"), A1_MS);
  assert.equal(parseDebugNow("2026-10-17T23:59:30 02:00"), A1_MS);
  assert.equal(parseDebugNow("not-a-date"), null);

  const device = Date.parse("2026-01-01T00:00:00Z");
  assert.equal(
    readNowMs({
      nowMs: device,
      search: `?now=${encodeURIComponent(A1)}&window=open`,
      nodeEnv: "development",
      hostname: "localhost",
    }),
    A1_MS,
  );
  assert.equal(
    readNowMs({
      nowMs: device,
      search: "now=2026-10-17T23:59:30 02:00",
      nodeEnv: "development",
    }),
    A1_MS,
  );
  assert.equal(
    readNowMs({
      nowMs: device,
      search: `?now=${encodeURIComponent(A1)}`,
      nodeEnv: "production",
      hostname: "alane.example",
    }),
    device,
  );
  assert.equal(
    readNowMs({
      nowMs: device,
      search: "?now=not-a-date",
      nodeEnv: "development",
      hostname: "localhost",
    }),
    device,
  );
  assert.equal(
    readNowMs({
      nowMs: device,
      search: "",
      nodeEnv: "development",
      hostname: "localhost",
    }),
    device,
  );
});

function Probe({ asOf }: { asOf: string }) {
  const now = useNow(asOf);
  return createElement("span", null, now);
}

test("server render uses the build-time snapshot", () => {
  const asOf = "2026-10-16T13:28:29.000Z";
  const html = renderToString(createElement(Probe, { asOf }));
  assert.equal(html, `<span>${asOf}</span>`);
});
