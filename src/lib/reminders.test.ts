import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PrivacyScreen } from "@/components/legal-screen";
import { deadlineWithinDays } from "@/lib/contest-labels";
import type { Contest } from "@/lib/contest-schema";
import {
  DIGEST_COPY_CONFIRMED,
  OTP_COOLDOWN_MS,
  OTP_HOUR_MS,
  OTP_LOCK_MS,
  OTP_TTL_MS,
  REMINDERS_FROM,
  REMINDERS_FROM_ADDRESS,
} from "@/lib/reminders/constants";
import { signUnsubscribe } from "@/lib/reminders/crypto";
import { emptySeen, planDigest } from "@/lib/reminders/digest";
import type { OutboundMail } from "@/lib/reminders/mailer";
import { resendBody } from "@/lib/reminders/mailer";
import { SCHEMA_STATEMENTS } from "@/lib/reminders/schema";
import {
  ensureSchema,
  getOtp,
  getSubscriber,
  listActive,
} from "@/lib/reminders/store";
import type { SqlDatabase, SqlStatement, SqlValue } from "@/lib/reminders/sql";
import {
  runDigest,
  sendCode,
  unsubscribeEmail,
  unsubscribeToken,
  verifyCode,
  type ReminderDeps,
} from "@/lib/reminders/service";
import {
  renderDigest,
  renderOtp,
  renderWelcome,
} from "@/lib/reminders/templates";

type StatementSync = {
  run(...params: never[]): unknown;
  all(...params: never[]): unknown[];
  get(...params: never[]): unknown;
};

type SqliteDatabase = {
  prepare(source: string): StatementSync;
};

const { DatabaseSync } = createRequire(import.meta.url)("node:sqlite") as {
  DatabaseSync: new (path: string) => SqliteDatabase;
};

const AS_OF = "2026-11-09T02:00:00.000Z";

function contest(overrides: Partial<Contest> & { id: string }): Contest {
  return {
    slug: overrides.id,
    name: overrides.id,
    official_url: "https://example.com/official",
    status: "published",
    open_at: null,
    deadline_at: "2026-12-31T23:59:00.000Z",
    announce_at: null,
    edition: "2026",
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

function sqliteDb(raw: SqliteDatabase): SqlDatabase {
  return {
    prepare(query: string): SqlStatement {
      const statement = raw.prepare(query);
      let params: SqlValue[] = [];
      const api: SqlStatement = {
        bind(...values: SqlValue[]) {
          params = values;
          return api;
        },
        async run() {
          statement.run(...(params as never[]));
          return {};
        },
        async all<T>() {
          return { results: statement.all(...(params as never[])) as T[] };
        },
        async first<T>() {
          const row = statement.get(...(params as never[])) as T | undefined;
          return row ?? null;
        },
      };
      return api;
    },
  };
}

function harness(enabled = true) {
  let now = Date.parse(AS_OF);
  const sent: OutboundMail[] = [];
  const deps: ReminderDeps = {
    db: sqliteDb(new DatabaseSync(":memory:")),
    now: () => new Date(now),
    secret: "test-secret",
    siteOrigin: "https://alane.photography",
    mail: {
      async send(message) {
        sent.push(message);
        return { ok: true };
      },
    },
    enabled,
  };
  return {
    deps,
    sent,
    advance(ms: number) {
      now += ms;
    },
  };
}

function codeFrom(message: OutboundMail): string {
  const match = message.text.match(/\b(\d{6})\b/);
  assert.ok(match, "verification mail should carry the one-time code");
  return match[1]!;
}

test("digest copy is confirmed and From is the reminders address", () => {
  assert.equal(DIGEST_COPY_CONFIRMED, true);
  assert.equal(REMINDERS_FROM.includes("icloud"), false);
  assert.match(REMINDERS_FROM, new RegExp(REMINDERS_FROM_ADDRESS.replace(".", "\\.")));
  const body = resendBody({ to: "person@example.com", subject: "s", text: "t" });
  assert.equal(body.from, REMINDERS_FROM);
  assert.deepEqual(body.to, ["person@example.com"]);
  assert.equal("html" in body, false);
});

test("migration matches the runtime schema", () => {
  const file = readFileSync(new URL("../../migrations/0001_reminders.sql", import.meta.url), "utf8").replace(
    /\s+/g,
    " ",
  );
  for (const statement of SCHEMA_STATEMENTS) {
    assert.ok(file.includes(statement.replace(/\s+/g, " ")), statement.slice(0, 40));
  }
});

test("privacy pages name Resend and drop the no-subscription claim", () => {
  const en = renderToStaticMarkup(createElement(PrivacyScreen, { locale: "en" }));
  const zh = renderToStaticMarkup(createElement(PrivacyScreen, { locale: "zh-CN" }));
  assert.equal(en.includes("does not offer email subscription"), false);
  assert.equal(zh.includes("不提供邮件订阅"), false);
  assert.match(en, /Resend/);
  assert.match(zh, /Resend/);
  assert.match(en, /reminders@alane\.photography/);
  assert.match(zh, /reminders@alane\.photography/);
  assert.match(en, /90 days/);
  assert.match(zh, /90 天/);
  assert.equal(en.includes("Trusted"), false);
  assert.equal(zh.includes("Trusted"), false);
});

test("confirmed templates use locked copy and do not embed images or privacy links", () => {
  const otp = renderOtp("zh-CN", "042013");
  assert.equal(otp.subject, "您的 ALane 验证码");
  assert.equal(
    otp.text,
    `您好，

收到您的订阅请求，感谢订阅！请用下面的验证码在网站上完成确认（10 分钟内有效）：

042013

验证通过后，您就可以在站内继续浏览赛事索引；我们只会在索引有实质更新时，用邮件给您一份简短的摘要。

若不是您本人操作，忽略本邮件即可，我们不会再给您发送邮件。

请回到网站输入验证码：https://alane.photography/
`,
  );
  assert.equal(otp.text.includes("日历"), false);
  assert.equal(otp.text.includes("勘误"), false);
  assert.equal(otp.text.includes("AlaneStreetPhotos"), false);
  assert.equal(otp.text.includes("退订"), false);
  assert.equal(otp.text.includes("/privacy"), false);
  assert.equal(otp.text.includes("<img"), false);

  const otpEn = renderOtp("en", "042013");
  assert.equal(otpEn.subject, "Your ALane verification code");
  assert.match(otpEn.text, /^Hello,/);
  assert.equal(
    otpEn.text,
    `Hello,

We’ve received your subscription request — thank you. Please enter the code below on the site to confirm (valid for 10 minutes):

042013

Once verified, you can continue browsing the contest index on the site. We’ll only email you a short digest when the index has a material update.

If this wasn’t you, you can ignore this email — we won’t send you further messages from this request.

Please return to the site to enter the code: https://alane.photography/en
`,
  );
  assert.equal(otpEn.text.includes("Calendar:"), false);
  assert.equal(otpEn.text.includes("Corrections"), false);
  assert.equal(otpEn.text.includes("Unsubscribe"), false);
  assert.equal(otpEn.text.includes("/privacy"), false);

  const welcome = renderWelcome("en", {
    unsubscribeUrl: "https://alane.photography/en/reminders?token=abc",
    calendarUrl: "https://alane.photography/calendar.ics",
  });
  assert.equal(welcome.subject, "You’re subscribed to ALane alerts");
  assert.equal(
    welcome.text,
    `Hello,

Your email is confirmed and alerts are active — thank you for subscribing.

We won’t email you every day. We’ll only send a combined digest when a new contest opens, when a deadline falls within 14 days, or when contest winners are published.



→ Continue browsing the ALane homepage here
https://alane.photography/en

The ALane homepage also offers calendar subscribe.
Unsubscribe anytime: https://alane.photography/en/reminders?token=abc

Calendar: https://alane.photography/calendar.ics
Corrections / removal: AlaneStreetPhotos@icloud.com
`,
  );
  const welcomeFooter = welcome.text.split("\n\n").at(-1) ?? "";
  assert.equal(welcomeFooter.includes("Unsubscribe"), false);
  assert.equal(welcomeFooter.includes("/privacy"), false);
  assert.match(welcomeFooter, /^Calendar: /);
  assert.equal(welcome.text.includes("/privacy"), false);
  const welcomeBody = welcome.text.split("\nCalendar:")[0] ?? "";
  assert.equal(welcomeBody.includes("calendar.ics"), false);
  assert.equal(welcomeBody.includes("AlaneStreetPhotos"), false);

  const welcomeZh = renderWelcome("zh-CN", {
    unsubscribeUrl: "https://alane.photography/reminders?token=abc",
    calendarUrl: "https://alane.photography/calendar.ics",
  });
  assert.equal(welcomeZh.subject, "已订阅 ALane 提醒");
  assert.match(welcomeZh.text, /^您好，/);
  assert.match(welcomeZh.text, /Alane主页也提供日历订阅功能。/);
  assert.match(
    welcomeZh.text,
    /→ 您可以从这里继续浏览 ALane 主页\nhttps:\/\/alane\.photography\/\n/,
  );
  const welcomeZhFooter = welcomeZh.text.split("\n\n").at(-1) ?? "";
  assert.equal(
    welcomeZhFooter,
    `日历订阅：https://alane.photography/calendar.ics
勘误 / 移出索引：AlaneStreetPhotos@icloud.com
`,
  );
  assert.equal(welcomeZhFooter.includes("退订"), false);
  assert.equal(welcomeZh.text.includes("/privacy"), false);

  const itemContest = contest({
    id: "lens",
    slug: "lens",
    name: "Lens Award",
    open_at: "2026-10-01T00:00:00.000Z",
    deadline_at: "2026-11-20T23:59:00.000Z",
    gallery_urls: [{ url: "https://example.com/winners" }],
  });
  const digestItems = [
    { kind: "open" as const, key: "lens|2026", contest: itemContest },
    { kind: "closing" as const, key: "lens", contest: itemContest },
    {
      kind: "gallery" as const,
      key: "lens|https://example.com/winners",
      contest: itemContest,
      url: "https://example.com/winners",
    },
  ];
  const digest = renderDigest({
    locale: "en",
    date: "2026-11-09",
    overflow: true,
    origin: "https://alane.photography",
    unsubscribeUrl: "https://alane.photography/en/reminders?token=one",
    calendarUrl: "https://alane.photography/calendar.ics",
    items: digestItems,
  });
  assert.equal(digest.subject, "ALane · index updates (2026-11-09)");
  assert.equal(
    digest.text,
    `Hello,

As of 2026-11-09, a few changes on the index are worth a look (snapshot at send time; dates and status still prevail on the organizer’s site and ALane pages).

→ Browse all contests on the ALane homepage
https://alane.photography/en

[Newly open]
· Lens Award · 2026 · Opens 2026-10-01 · Deadline 2026-11-20
  Details https://alane.photography/en/contests/lens · Official https://example.com/official

[Closing soon]
· Lens Award · 2026 · Deadline 2026-11-20
  Details https://alane.photography/en/contests/lens · Official https://example.com/official

[Winners published]
· Lens Award · 2026
  Winners https://example.com/winners · Details https://alane.photography/en/contests/lens

If the list is long, we suggest going back to the homepage to filter and open details; this email is only a digest.

Calendar: https://alane.photography/calendar.ics
Corrections / removal: AlaneStreetPhotos@icloud.com
Unsubscribe: https://alane.photography/en/reminders?token=one
`,
  );
  const digestFooter = digest.text.split("\n\n").at(-1) ?? "";
  assert.match(digestFooter, /^Calendar: /);
  assert.match(digestFooter, /Unsubscribe: /);
  assert.equal(digest.text.includes("<img"), false);
  assert.equal(digest.text.includes("!["), false);
  assert.equal(digest.text.includes("/thumbs/"), false);
  assert.equal(digest.text.includes("/privacy"), false);
  assert.equal(digest.text.includes("From reminders@"), false);
  const other = renderDigest({
    locale: "en",
    date: "2026-11-09",
    overflow: true,
    origin: "https://alane.photography",
    unsubscribeUrl: "https://alane.photography/en/reminders?token=two",
    calendarUrl: "https://alane.photography/calendar.ics",
    items: digestItems,
  });
  assert.equal(
    digest.text.replaceAll("token=one", "token"),
    other.text.replaceAll("token=two", "token"),
  );

  const zhDigest = renderDigest({
    locale: "zh-CN",
    date: "2026-11-09",
    overflow: false,
    origin: "https://alane.photography",
    unsubscribeUrl: "https://alane.photography/reminders?token=zh",
    calendarUrl: "https://alane.photography/calendar.ics",
    items: [{ kind: "gallery", key: "lens|https://example.com/winners", contest: itemContest, url: "https://example.com/winners" }],
  });
  assert.equal(zhDigest.subject, "ALane · 索引有更新（2026-11-09）");
  assert.match(zhDigest.text, /^您好，/);
  assert.match(zhDigest.text, /截至 2026-11-09，站内索引有几处值得看一眼的变化（发送时刻快照；具体日期与状态仍以官网和站内页为准）。/);
  assert.match(zhDigest.text, /→ 回 ALane 主页浏览全部赛事\nhttps:\/\/alane\.photography\/\n/);
  assert.equal(zhDigest.text.includes("【新赛开幕】"), false);
  assert.equal(zhDigest.text.includes("【临近截止】"), false);
  assert.match(zhDigest.text, /【获奖公布】\n· Lens Award · 2026\n  获奖页 https:\/\/example\.com\/winners · 详情 https:\/\/alane\.photography\/contests\/lens/);
  assert.match(zhDigest.text, /列表较长时，建议直接回主页筛选与打开详情；本信仅作提要。/);
  const zhFooter = zhDigest.text.split("\n\n").at(-1) ?? "";
  assert.equal(
    zhFooter,
    `日历订阅：https://alane.photography/calendar.ics
勘误 / 移出索引：AlaneStreetPhotos@icloud.com
退订：https://alane.photography/reminders?token=zh
`,
  );
  assert.equal(zhDigest.text.includes("/privacy"), false);
  assert.equal(zhDigest.text.includes("隐私"), false);
});

test("closing window for mail is 14 written days, not the 60-day homepage row", () => {
  const onEdge = contest({ id: "edge", deadline_at: "2026-11-23T23:59:00.000Z" });
  const outside = contest({ id: "out", deadline_at: "2026-11-24T00:00:00.000Z" });
  const forty = contest({ id: "far", deadline_at: "2026-12-20T00:00:00.000Z" });
  assert.equal(deadlineWithinDays(onEdge, AS_OF, 14), true);
  assert.equal(deadlineWithinDays(outside, AS_OF, 14), false);
  assert.equal(deadlineWithinDays(forty, AS_OF, 14), false);
  assert.equal(deadlineWithinDays(forty, AS_OF, 60), true);
});

test("digest plan baselines first, then reports open, closing, and gallery changes", () => {
  const steady = contest({ id: "steady" });
  const baseline = planDigest([steady], emptySeen(), AS_OF);
  assert.equal(baseline.kind, "baseline");
  if (baseline.kind !== "baseline") return;
  assert.equal(baseline.seen.open.has("steady|2026"), true);
  assert.equal(baseline.seen.closing.has("steady"), false);

  const quiet = planDigest([steady], baseline.seen, AS_OF);
  assert.equal(quiet.kind, "diff");
  if (quiet.kind !== "diff") return;
  assert.equal(quiet.items.length, 0);

  const entered = planDigest(
    [contest({ id: "steady", deadline_at: "2026-11-20T23:59:00.000Z" })],
    baseline.seen,
    AS_OF,
  );
  assert.equal(entered.kind, "diff");
  if (entered.kind !== "diff") return;
  assert.deepEqual(
    entered.items.map((item) => item.kind),
    ["closing"],
  );

  const withGallery = planDigest(
    [contest({ id: "steady", gallery_urls: [{ url: "https://example.com/g/1" }] })],
    baseline.seen,
    AS_OF,
  );
  assert.equal(withGallery.kind, "diff");
  if (withGallery.kind !== "diff") return;
  assert.equal(withGallery.items.length, 1);
  assert.equal(withGallery.items[0]?.kind, "gallery");

  const draft = planDigest(
    [contest({ id: "drafty", status: "draft", deadline_at: "2026-11-18T00:00:00.000Z", gallery_urls: [{ url: "https://example.com/nope" }] })],
    baseline.seen,
    AS_OF,
  );
  assert.equal(draft.kind, "diff");
  if (draft.kind !== "diff") return;
  assert.equal(draft.items.length, 0);

  const archived = planDigest(
    [contest({ id: "old", status: "archived", deadline_at: null, gallery_urls: [{ url: "https://example.com/old" }] })],
    baseline.seen,
    AS_OF,
  );
  assert.equal(archived.kind, "diff");
  if (archived.kind !== "diff") return;
  assert.equal(archived.items.length, 1);
  assert.equal(archived.items[0]?.kind, "gallery");

  const future = contest({ id: "soon", open_at: "2026-12-01T00:00:00.000Z" });
  const beforeOpen = planDigest([future], emptySeen(), AS_OF);
  assert.equal(beforeOpen.kind, "baseline");
  if (beforeOpen.kind !== "baseline") return;
  assert.equal(beforeOpen.seen.open.has("soon|2026"), false);
  const afterOpen = planDigest([future], beforeOpen.seen, "2026-12-02T00:00:00.000Z");
  assert.equal(afterOpen.kind, "diff");
  if (afterOpen.kind !== "diff") return;
  assert.equal(afterOpen.items.some((item) => item.kind === "open"), true);

  const edition = planDigest(
    [contest({ id: "steady", edition: "2027" })],
    baseline.seen,
    AS_OF,
  );
  assert.equal(edition.kind, "diff");
  if (edition.kind !== "diff") return;
  assert.equal(edition.items.some((item) => item.kind === "open" && item.key === "steady|2027"), true);

  const many = Array.from({ length: 25 }, (_, index) =>
    contest({ id: `n${index}`, slug: `n${index}`, name: `N${index}` }),
  );
  const emptyBaseline = planDigest([], emptySeen(), AS_OF);
  assert.equal(emptyBaseline.kind, "baseline");
  if (emptyBaseline.kind !== "baseline") return;
  const capped = planDigest(many, emptyBaseline.seen, AS_OF);
  assert.equal(capped.kind, "diff");
  if (capped.kind !== "diff") return;
  assert.equal(capped.items.length, 20);
  assert.equal(capped.overflow, true);
});

test("disabled and unchecked consent do not store or send", async () => {
  const off = harness(false);
  const blocked = await sendCode(off.deps, {
    email: "Person@Example.com",
    locale: "zh-CN",
    consent: true,
  });
  assert.equal(blocked.code, "disabled");
  assert.equal(off.sent.length, 0);
  await ensureSchema(off.deps.db);
  assert.equal(await getSubscriber(off.deps.db, "person@example.com"), null);

  const on = harness(true);
  const consent = await sendCode(on.deps, {
    email: "person@example.com",
    locale: "zh-CN",
    consent: false,
  });
  assert.equal(consent.code, "consent_required");
  assert.equal(on.sent.length, 0);
  await ensureSchema(on.deps.db);
  assert.equal(await getSubscriber(on.deps.db, "person@example.com"), null);
});

test("unverified addresses stay off the send list until the code matches", async () => {
  const { deps, sent } = harness();
  const sentCode = await sendCode(deps, {
    email: " Person@Example.com ",
    locale: "zh-CN",
    consent: true,
  });
  assert.equal(sentCode.code, "sent");
  assert.equal(sent.length, 1);
  assert.equal(sent[0]!.subject, "您的 ALane 验证码");
  assert.match(sent[0]!.text, /^您好，/);
  assert.equal(sent[0]!.text.includes("日历订阅"), false);
  assert.equal(sent[0]!.text.includes("勘误"), false);
  assert.equal(sent[0]!.text.includes("/privacy"), false);
  const code = codeFrom(sent[0]!);
  const otp = await getOtp(deps.db, "person@example.com");
  assert.ok(otp);
  assert.notEqual(otp.code_hash, code);
  assert.equal(otp.code_hash.includes(code), false);
  assert.deepEqual(await listActive(deps.db), []);

  const verified = await verifyCode(deps, {
    email: "person@example.com",
    code,
    locale: "zh-CN",
  });
  assert.equal(verified.code, "subscribed");
  assert.equal(sent.length, 2);
  assert.equal(sent[1]!.subject, "已订阅 ALane 提醒");
  assert.match(sent[1]!.text, /^您好，/);
  assert.match(sent[1]!.text, /calendar\.ics/);
  const welcomeFooter = sent[1]!.text.split("\n\n").at(-1) ?? "";
  assert.equal(welcomeFooter.includes("退订"), false);
  assert.match(welcomeFooter, /^日历订阅：/);
  assert.equal(sent[1]!.text.includes("/privacy"), false);
  assert.deepEqual(await listActive(deps.db), [{ email: "person@example.com", locale: "zh-CN" }]);

  const again = await sendCode(deps, {
    email: "person@example.com",
    locale: "zh-CN",
    consent: true,
  });
  assert.equal(again.code, "already_subscribed");
  assert.equal(sent.length, 2);
});

test("cooldown, hourly cap, expiry, and lock follow the one-time code rules", async () => {
  const box = harness();
  const first = await sendCode(box.deps, { email: "a@example.com", locale: "en", consent: true });
  assert.equal(first.code, "sent");
  box.advance(OTP_COOLDOWN_MS - 1000);
  assert.equal(
    (await sendCode(box.deps, { email: "a@example.com", locale: "en", consent: true })).code,
    "cooldown",
  );
  box.advance(1000);
  assert.equal(
    (await sendCode(box.deps, { email: "a@example.com", locale: "en", consent: true })).code,
    "sent",
  );

  const limited = harness();
  for (let n = 0; n < 5; n++) {
    if (n > 0) limited.advance(OTP_COOLDOWN_MS);
    assert.equal(
      (await sendCode(limited.deps, { email: "b@example.com", locale: "en", consent: true })).code,
      "sent",
    );
  }
  limited.advance(OTP_COOLDOWN_MS);
  assert.equal(
    (await sendCode(limited.deps, { email: "b@example.com", locale: "en", consent: true })).code,
    "rate_limited",
  );
  limited.advance(OTP_HOUR_MS);
  assert.equal(
    (await sendCode(limited.deps, { email: "b@example.com", locale: "en", consent: true })).code,
    "sent",
  );

  const expiry = harness();
  assert.equal(
    (await sendCode(expiry.deps, { email: "c@example.com", locale: "zh-CN", consent: true })).code,
    "sent",
  );
  const expiredCode = codeFrom(expiry.sent[0]!);
  expiry.advance(OTP_TTL_MS + 1);
  assert.equal(
    (await verifyCode(expiry.deps, { email: "c@example.com", code: expiredCode, locale: "zh-CN" })).code,
    "expired",
  );
  assert.equal((await getOtp(expiry.deps.db, "c@example.com"))?.wrong_attempts, 0);

  const lock = harness();
  assert.equal(
    (await sendCode(lock.deps, { email: "d@example.com", locale: "zh-CN", consent: true })).code,
    "sent",
  );
  const good = codeFrom(lock.sent[0]!);
  for (let n = 0; n < 4; n++) {
    assert.equal(
      (await verifyCode(lock.deps, { email: "d@example.com", code: "000000", locale: "zh-CN" })).code,
      "incorrect",
    );
  }
  assert.equal(
    (await verifyCode(lock.deps, { email: "d@example.com", code: "000000", locale: "zh-CN" })).code,
    "locked",
  );
  assert.equal(
    (await verifyCode(lock.deps, { email: "d@example.com", code: good, locale: "zh-CN" })).code,
    "locked",
  );
  lock.advance(60_000);
  assert.equal(
    (await sendCode(lock.deps, { email: "d@example.com", locale: "zh-CN", consent: true })).code,
    "locked",
  );
  lock.advance(OTP_LOCK_MS);
  assert.equal(
    (await verifyCode(lock.deps, { email: "d@example.com", code: good, locale: "zh-CN" })).code,
    "expired",
  );
  assert.equal(
    (await sendCode(lock.deps, { email: "d@example.com", locale: "zh-CN", consent: true })).code,
    "sent",
  );
  const fresh = codeFrom(lock.sent.at(-1)!);
  assert.equal(
    (await verifyCode(lock.deps, { email: "d@example.com", code: fresh, locale: "zh-CN" })).code,
    "subscribed",
  );
});

test("locale change keeps one subscription and resubscribe needs a new code", async () => {
  const { deps, sent } = harness();
  assert.equal(
    (await sendCode(deps, { email: "e@example.com", locale: "zh-CN", consent: true })).code,
    "sent",
  );
  assert.equal(
    (
      await verifyCode(deps, {
        email: "e@example.com",
        code: codeFrom(sent[0]!),
        locale: "zh-CN",
      })
    ).code,
    "subscribed",
  );
  assert.equal(
    (await sendCode(deps, { email: "e@example.com", locale: "en", consent: true })).code,
    "sent",
  );
  assert.equal(
    (
      await verifyCode(deps, {
        email: "e@example.com",
        code: codeFrom(sent.at(-1)!),
        locale: "en",
      })
    ).code,
    "locale_updated",
  );
  assert.equal((await getSubscriber(deps.db, "e@example.com"))?.locale, "en");
  assert.equal(sent.filter((message) => message.text.includes("/calendar.ics")).length, 1);

  const token = await signUnsubscribe("e@example.com", "test-secret");
  assert.equal((await unsubscribeToken(deps, token)).code, "unsubscribed");
  assert.equal((await unsubscribeToken(deps, token)).code, "unsubscribed");
  assert.equal((await unsubscribeToken(deps, "not-a-token")).code, "invalid_token");
  assert.deepEqual(await listActive(deps.db), []);
  assert.equal(
    (await sendCode(deps, { email: "e@example.com", locale: "en", consent: true })).code,
    "sent",
  );
  assert.equal((await unsubscribeEmail(deps, "missing@example.com")).code, "unsubscribed");
  assert.equal(await getSubscriber(deps.db, "missing@example.com"), null);
});

test("pending rows age out after 7 days and unsubscribed rows after 90", async () => {
  const pending = harness();
  await sendCode(pending.deps, { email: "p@example.com", locale: "zh-CN", consent: true });
  pending.advance(6 * 24 * 60 * 60 * 1000);
  await runDigest(pending.deps, []);
  assert.equal((await getSubscriber(pending.deps.db, "p@example.com"))?.status, "pending_verify");
  pending.advance(2 * 24 * 60 * 60 * 1000);
  await runDigest(pending.deps, []);
  assert.equal(await getSubscriber(pending.deps.db, "p@example.com"), null);

  const gone = harness();
  await sendCode(gone.deps, { email: "u@example.com", locale: "en", consent: true });
  await verifyCode(gone.deps, {
    email: "u@example.com",
    code: codeFrom(gone.sent[0]!),
    locale: "en",
  });
  await unsubscribeEmail(gone.deps, "u@example.com");
  gone.advance(89 * 24 * 60 * 60 * 1000);
  await runDigest(gone.deps, []);
  assert.equal((await getSubscriber(gone.deps.db, "u@example.com"))?.status, "unsubscribed");
  gone.advance(2 * 24 * 60 * 60 * 1000);
  await runDigest(gone.deps, []);
  assert.equal(await getSubscriber(gone.deps.db, "u@example.com"), null);
});

test("confirmed digests send when reminders are enabled and stay withheld when they are not", async () => {
  const { deps, sent } = harness();
  const before = contest({ id: "before", slug: "before" });
  await sendCode(deps, { email: "reader@example.com", locale: "zh-CN", consent: true });
  await verifyCode(deps, {
    email: "reader@example.com",
    code: codeFrom(sent[0]!),
    locale: "zh-CN",
  });
  const mailsBeforeScan = sent.length;
  const baseline = await runDigest(deps, [before]);
  assert.equal(baseline.result, "baseline");
  assert.equal(baseline.sent, 0);
  const quiet = await runDigest(deps, [before]);
  assert.equal(quiet.result, "no_change");
  assert.equal(quiet.sent, 0);
  const opened = contest({ id: "opened", slug: "opened", name: "Opened Prize" });
  deps.enabled = false;
  const held = await runDigest(deps, [before, opened]);
  assert.equal(held.result, "withheld");
  assert.equal(held.pendingItems > 0, true);
  assert.equal(held.sent, 0);
  assert.equal(sent.length, mailsBeforeScan);
  assert.equal(sent.some((message) => message.text.includes("Opened Prize")), false);

  deps.enabled = true;
  const changed = await runDigest(deps, [before, opened]);
  assert.equal(changed.result, "sent");
  assert.equal(changed.sent, 1);
  const digest = sent.at(-1)!;
  assert.equal(digest.subject, "ALane · 索引有更新（2026-11-09）");
  assert.match(digest.text, /^您好，/);
  assert.match(digest.text, /截至 2026-11-09，站内索引有几处值得看一眼的变化/);
  assert.match(digest.text, /【新赛开幕】/);
  assert.match(digest.text, /Opened Prize/);
  assert.match(
    digest.text,
    /日历订阅：https:\/\/alane\.photography\/calendar\.ics\n勘误 \/ 移出索引：AlaneStreetPhotos@icloud\.com\n退订：/,
  );
  assert.equal(digest.text.includes("/privacy"), false);
  assert.equal(digest.text.includes("From reminders@"), false);
  assert.equal(digest.text.includes("【临近截止】"), false);
  assert.equal(digest.text.includes("【获奖公布】"), false);
});
