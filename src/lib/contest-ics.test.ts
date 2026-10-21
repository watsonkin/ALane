import assert from "node:assert/strict";
import test from "node:test";
import {
  CALENDAR_ARCHIVED_NOTE_EN,
  CALENDAR_ARCHIVED_NOTE_ZH,
  CALENDAR_NO_DEADLINE_NOTE_EN,
  CALENDAR_NO_DEADLINE_NOTE_ZH,
  calendarArchivedNote,
  calendarDescriptionNotes,
  calendarNoDeadlineNote,
  contestsToIcs,
} from "@/lib/contest-ics";
import type { Contest } from "@/lib/contest-schema";

function contest(overrides: Partial<Contest> = {}): Contest {
  return {
    id: "sample",
    slug: "sample",
    name: "Sample",
    official_url: "https://example.com/contest",
    status: "archived",
    open_at: "2024-01-01T00:00:00Z",
    deadline_at: null,
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
    ...overrides,
  };
}

test("calendar notes follow the locale", () => {
  assert.equal(calendarArchivedNote("en"), CALENDAR_ARCHIVED_NOTE_EN);
  assert.equal(calendarArchivedNote("zh-CN"), CALENDAR_ARCHIVED_NOTE_ZH);
  assert.equal(calendarNoDeadlineNote("en"), CALENDAR_NO_DEADLINE_NOTE_EN);
  assert.equal(calendarNoDeadlineNote("zh-CN"), CALENDAR_NO_DEADLINE_NOTE_ZH);
  assert.equal(/[\u3400-\u9fff]/.test(CALENDAR_ARCHIVED_NOTE_EN), false);
  assert.equal(/[\u3400-\u9fff]/.test(CALENDAR_NO_DEADLINE_NOTE_EN), false);
});

test("description notes stay Chinese unless a locale is passed", () => {
  const entry = contest();
  assert.deepEqual(calendarDescriptionNotes(entry), [
    CALENDAR_ARCHIVED_NOTE_ZH,
    CALENDAR_NO_DEADLINE_NOTE_ZH,
  ]);
  assert.deepEqual(calendarDescriptionNotes(entry, "en"), [
    CALENDAR_ARCHIVED_NOTE_EN,
    CALENDAR_NO_DEADLINE_NOTE_EN,
  ]);
});

test("the calendar does not read social fields", () => {
  const body = contestsToIcs(
    [
      contest({
        social: {
          instagram: "https://www.instagram.com/lensculture",
          x: "https://x.com/lensculture",
          wechat_oa: { name: "街拍视界" },
        },
        gallery_works: [
          {
            source_page_url: "https://example.com/projects/1-work",
            source_site_label: "Example",
            social: {
              instagram: "https://www.instagram.com/example/",
              x: "https://x.com/example",
              website: "https://example.com/photographer",
            },
          },
        ],
      }),
    ],
    new Date("2026-10-21T00:00:00Z"),
  );
  assert.equal(body.includes("instagram.com"), false);
  assert.equal(body.includes("x.com/lensculture"), false);
  assert.equal(body.includes("街拍视界"), false);
  assert.equal(body.includes("example.com/photographer"), false);
});

test("the single ics feed keeps the Chinese notes", () => {
  const body = contestsToIcs([contest()], new Date("2026-10-21T00:00:00Z")).replace(/\r\n /g, "");
  assert.equal(body.includes(CALENDAR_ARCHIVED_NOTE_ZH), true);
  assert.equal(body.includes(CALENDAR_NO_DEADLINE_NOTE_ZH), true);
  assert.equal(body.includes(CALENDAR_ARCHIVED_NOTE_EN), false);
  assert.equal(body.includes(CALENDAR_NO_DEADLINE_NOTE_EN), false);
});
