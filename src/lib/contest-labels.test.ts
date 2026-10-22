import assert from "node:assert/strict";
import test from "node:test";
import { readContestsFromDisk } from "@/lib/contest-files";
import {
  CLOSING_SOON_LIMIT,
  DEADLINE_GRACE_MS,
  compareByWindow,
  contestYear,
  deadlineWindow,
  selectClosingSoon,
  windowChipLabel,
} from "@/lib/contest-labels";
import type { Contest } from "@/lib/contest-schema";

const WSPA = "2026-10-17T23:59:00+02:00";
const AUSSIE = "2026-10-25T23:59:00+11:00";
const FUJIFILM = "2026-10-31T23:59:00+01:00";
const PISPA = "2026-11-02T23:59:00+01:00";
const RICOH = "2026-12-20T23:59:00+09:00";
const SONY = "2026-12-31T23:59:00+00:00";

function contest(id: string, deadline_at: string | null, name = id): Contest {
  return {
    id,
    slug: id,
    name,
    official_url: "https://example.com/contest",
    status: "published",
    open_at: null,
    deadline_at,
    announce_at: null,
    edition: null,
    geo: null,
    online: true,
    fee: "free",
    street_photo_relevance: "core",
    rights_tags: [],
    gallery_urls: [],
    gallery_works: [],
    source_adapters: [],
    last_fetched_at: null,
    content_hash: null,
    health: "ok",
  };
}

function ids(result: { contests: Contest[] }): string[] {
  return result.contests.map((item) => item.id);
}

test("grace is one written minute", () => {
  assert.equal(DEADLINE_GRACE_MS, 60_000);
  const deadlineMs = Date.parse(WSPA);
  const inside = new Date(deadlineMs + DEADLINE_GRACE_MS - 1).toISOString();
  const boundary = new Date(deadlineMs + DEADLINE_GRACE_MS).toISOString();
  assert.equal(deadlineWindow(contest("wspa", WSPA), inside), "open");
  assert.equal(deadlineWindow(contest("wspa", WSPA), boundary), "closed");
});

test("null and unparseable deadlines stay undated", () => {
  const asOf = "2026-10-18T00:00:00.000Z";
  assert.equal(deadlineWindow(contest("pure", null), asOf), "undated");
  assert.equal(deadlineWindow(contest("blank", ""), asOf), "undated");
  assert.equal(deadlineWindow(contest("bad", "not-a-date"), asOf), "undated");
  assert.equal(deadlineWindow(contest("space", "   "), asOf), "undated");
});

test("acceptance instants for the four named deadlines", () => {
  const wspa = contest("world-street-photo-awards", WSPA);
  const aussie = contest("aussie-street", AUSSIE);
  const fuji = contest("fujifilm-moment", FUJIFILM);
  const pispa = contest("pispa", PISPA);

  assert.equal(deadlineWindow(wspa, "2026-10-17T23:59:30+02:00"), "open");
  assert.equal(deadlineWindow(wspa, "2026-10-18T00:00:00+02:00"), "closed");

  assert.equal(deadlineWindow(aussie, "2026-10-25T23:59:59+11:00"), "open");
  assert.equal(deadlineWindow(aussie, "2026-10-26T00:00:00+11:00"), "closed");

  assert.equal(deadlineWindow(fuji, "2026-11-01T00:00:00+01:00"), "closed");
  assert.equal(deadlineWindow(pispa, "2026-11-01T00:00:00+01:00"), "open");
  assert.equal(deadlineWindow(pispa, "2026-11-03T00:00:00+01:00"), "closed");
});

test("window labels match across locales for the same instant", () => {
  const wspa = contest("world-street-photo-awards", WSPA);
  const pure = contest("pure-street", null);
  const asOf = "2026-10-18T00:00:00+02:00";
  assert.equal(deadlineWindow(wspa, asOf), "closed");
  assert.equal(deadlineWindow(pure, asOf), "undated");
  assert.equal(windowChipLabel("open", "zh-CN"), "开放中");
  assert.equal(windowChipLabel("open", "en"), "Open");
  assert.equal(windowChipLabel("closed", "zh-CN"), "已截止");
  assert.equal(windowChipLabel("closed", "en"), "Closed");
  assert.equal(windowChipLabel("undated", "zh-CN"), "待定");
  assert.equal(windowChipLabel("undated", "en"), "Date TBD");
});

test("closing soon caps at 8 and does not backfill with closed or undated", () => {
  const open = Array.from({ length: 10 }, (_, index) => {
    const day = String(index + 1).padStart(2, "0");
    return contest(`open-${day}`, `2026-11-${day}T23:59:00Z`, `Open ${day}`);
  });
  const closed = contest("already-closed", "2026-10-01T23:59:00Z", "Closed sooner");
  const undated = contest("pure-street", null, "Pure Street");
  const invalid = contest("bad-date", "not-a-date", "Bad");
  const later = contest("ricoh", RICOH, "Ricoh");
  const asOf = "2026-10-17T12:00:00.000Z";

  const result = selectClosingSoon([later, undated, invalid, closed, ...open], asOf);
  assert.equal(result.truncated, true);
  assert.equal(result.contests.length, CLOSING_SOON_LIMIT);
  assert.deepEqual(
    ids(result),
    ["open-01", "open-02", "open-03", "open-04", "open-05", "open-06", "open-07", "open-08"],
  );
  assert.ok(result.contests.every((item) => deadlineWindow(item, asOf) === "open"));

  const thin = selectClosingSoon([closed, undated, invalid, open[0]!, open[1]!], asOf);
  assert.equal(thin.truncated, false);
  assert.deepEqual(ids(thin), ["open-01", "open-02"]);
});

test("an empty closing-soon row stays empty", () => {
  const result = selectClosingSoon(
    [
      contest("closed", "2026-01-01T00:00:00Z"),
      contest("pure", null),
      contest("bad", "not-a-date"),
    ],
    "2027-03-01T00:00:00.000Z",
  );
  assert.deepEqual(result, { contests: [], truncated: false });
});

test("Ricoh and Sony enter the 60-day window on the UTC calendar day", () => {
  const rows = [
    contest("ricoh-gr-photo-festival", RICOH),
    contest("sony-wpa-street", SONY),
    contest("closed", "2026-01-01T00:00:00Z"),
    contest("pure-street", null),
  ];
  assert.ok(!ids(selectClosingSoon(rows, "2026-10-20T23:59:59.000Z")).includes("ricoh-gr-photo-festival"));
  assert.ok(ids(selectClosingSoon(rows, "2026-10-21T00:00:00.000Z")).includes("ricoh-gr-photo-festival"));
  assert.ok(!ids(selectClosingSoon(rows, "2026-10-31T23:59:59.000Z")).includes("sony-wpa-street"));
  const november = selectClosingSoon(rows, "2026-11-01T00:00:00.000Z");
  assert.ok(ids(november).includes("ricoh-gr-photo-festival"));
  assert.ok(ids(november).includes("sony-wpa-street"));
  assert.deepEqual(ids(november), ["ricoh-gr-photo-festival", "sony-wpa-street"]);
});

test("catalog follows the WSPA, Aussie, Fujifilm, and PISPA acceptance cases", () => {
  const contests = readContestsFromDisk();
  const byId = new Map(contests.map((item) => [item.id, item]));
  assert.equal(byId.get("world-street-photo-awards")?.deadline_at, WSPA);
  assert.equal(byId.get("aussie-street")?.deadline_at, AUSSIE);
  assert.equal(byId.get("fujifilm-moment")?.deadline_at, FUJIFILM);
  assert.equal(byId.get("pispa")?.deadline_at, PISPA);
  assert.equal(byId.get("pure-street")?.deadline_at, null);

  const during = "2026-10-17T23:59:30+02:00";
  const after = "2026-10-18T00:00:00+02:00";
  const openDuring = selectClosingSoon(contests, during);
  assert.equal(openDuring.contests[0]?.id, "world-street-photo-awards");
  assert.ok(openDuring.contests.length <= CLOSING_SOON_LIMIT);
  assert.ok(openDuring.contests.every((item) => deadlineWindow(item, during) === "open"));

  const openAfter = selectClosingSoon(contests, after);
  assert.ok(!ids(openAfter).includes("world-street-photo-awards"));
  assert.ok(openAfter.contests.every((item) => deadlineWindow(item, after) === "open"));
  assert.equal(
    deadlineWindow(byId.get("world-street-photo-awards")!, after),
    "closed",
  );
  assert.equal(deadlineWindow(byId.get("pure-street")!, after), "undated");
  assert.ok(!ids(openAfter).includes("pure-street"));

  const aussieOpen = "2026-10-25T23:59:59+11:00";
  const aussieClosed = "2026-10-26T00:00:00+11:00";
  assert.equal(deadlineWindow(byId.get("aussie-street")!, aussieOpen), "open");
  assert.ok(ids(selectClosingSoon(contests, aussieOpen)).includes("aussie-street"));
  assert.equal(deadlineWindow(byId.get("aussie-street")!, aussieClosed), "closed");
  assert.ok(!ids(selectClosingSoon(contests, aussieClosed)).includes("aussie-street"));

  const fujiFlip = "2026-11-01T00:00:00+01:00";
  assert.equal(deadlineWindow(byId.get("fujifilm-moment")!, fujiFlip), "closed");
  assert.equal(deadlineWindow(byId.get("pispa")!, fujiFlip), "open");
  assert.ok(!ids(selectClosingSoon(contests, fujiFlip)).includes("fujifilm-moment"));
  assert.ok(ids(selectClosingSoon(contests, fujiFlip)).includes("pispa"));
  assert.equal(deadlineWindow(byId.get("pispa")!, "2026-11-03T00:00:00+01:00"), "closed");

  assert.ok(
    ids(selectClosingSoon(contests, "2026-10-21T00:00:00.000Z")).includes("ricoh-gr-photo-festival"),
  );
  assert.ok(
    !ids(selectClosingSoon(contests, "2026-10-20T23:59:59.000Z")).includes("ricoh-gr-photo-festival"),
  );
  assert.ok(ids(selectClosingSoon(contests, "2026-11-01T00:00:00.000Z")).includes("sony-wpa-street"));
  assert.ok(
    !ids(selectClosingSoon(contests, "2026-10-31T23:59:59.000Z")).includes("sony-wpa-street"),
  );

  const emptied = selectClosingSoon(contests, "2027-03-01T00:00:00.000Z");
  assert.deepEqual(emptied, { contests: [], truncated: false });

  for (const locale of ["zh-CN", "en"] as const) {
    const ranked = [...contests].sort((a, b) => compareByWindow(a, b, after, locale));
    const windows = ranked.map((item) => deadlineWindow(item, after));
    const openCount = windows.filter((item) => item === "open").length;
    const undatedCount = windows.filter((item) => item === "undated").length;
    assert.deepEqual(windows.slice(0, openCount), Array(openCount).fill("open"));
    assert.deepEqual(
      windows.slice(openCount, openCount + undatedCount),
      Array(undatedCount).fill("undated"),
    );
    assert.ok(windows.slice(openCount + undatedCount).every((item) => item === "closed"));
    assert.equal(ranked[0] && deadlineWindow(ranked[0], after), "open");
    assert.ok(ranked.some((item) => item.id === "world-street-photo-awards" && deadlineWindow(item, after) === "closed"));
  }
});

test("contestYear keeps a written date and skips an edition that is not a year", () => {
  assert.equal(contestYear(contest("dated", "2026-10-25T23:59:00+11:00"), "en"), "2026");
  const datedEdition = contest("dated-edition", "2026-10-25T23:59:00Z");
  datedEdition.edition = "2019";
  assert.equal(contestYear(datedEdition, "zh-CN"), "2026");

  const opened = contest("opened", null);
  opened.open_at = "2024-01-01T00:00:00Z";
  opened.edition = "1999";
  assert.equal(contestYear(opened, "en"), "2024");

  const editionOnly = contest("edition", null);
  editionOnly.edition = "2026";
  assert.equal(contestYear(editionOnly, "zh-CN"), "2026");

  const prose = contest("prose", null);
  prose.edition = "第十二届";
  assert.equal(contestYear(prose, "zh-CN"), null);
  assert.equal(contestYear(contest("blank", null), "en"), null);

  const english = contest("english", null);
  english.edition = "第十二届";
  english.edition_en = "2019 winners";
  assert.equal(contestYear(english, "en"), "2019");
  assert.equal(contestYear(english, "zh-CN"), null);
});

test("compareByWindow keeps a grace-minute contest with the open group", () => {
  const asOf = "2026-10-17T23:59:30+02:00";
  const rows = [
    contest("closed-later", "2026-10-01T23:59:00Z", "Zed"),
    contest("undated", null, "Amy"),
    contest("wspa", WSPA, "WSPA"),
    contest("aussie", AUSSIE, "Aussie"),
  ];
  const ranked = [...rows].sort((a, b) => compareByWindow(a, b, asOf, "en"));
  assert.deepEqual(
    ranked.map((item) => item.id),
    ["wspa", "aussie", "undated", "closed-later"],
  );
});
