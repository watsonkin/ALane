import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { CODE_TTL_MS, DIGEST_COPY_CONFIRMED, LOCK_MS, REMINDERS_FROM, SUBSCRIBER_MAIL_COPY_CONFIRMED } from "@/lib/reminders/constants";
import { evaluateSend, evaluateVerify } from "@/lib/reminders/codes";
import { createUnsubscribeToken, hashVerificationCode, readUnsubscribeToken, safeEqual } from "@/lib/reminders/crypto";
import { catalogContests, diffCatalog, parseSnapshot, type DigestContest } from "@/lib/reminders/digest";
import { normalizeEmail } from "@/lib/reminders/email";
import { businessDigestAllowed, subscriberMailAllowed } from "@/lib/reminders/env";
import { createResendMailer } from "@/lib/reminders/mailer";
import { SQL } from "@/lib/reminders/sql";
import {
  createD1RemindersStore,
  createMemoryRemindersStore,
  type CodeRow,
  type RemindersD1,
  type SubscriberRow,
} from "@/lib/reminders/store";
import {
  existingSubscriberAction,
  runDailyDigest,
  sendCode,
  unsubscribeEmail,
  unsubscribeWithToken,
  verifyCode,
} from "@/lib/reminders/service";
import { digestTemplate, otpTemplate, TEMPLATE_MARK, welcomeTemplate } from "@/lib/reminders/templates";

const SECRET = "test-unsubscribe-secret";
const NOW = "2026-11-09T00:15:00.000Z";
const NOW_MS = Date.parse(NOW);

function codeRow(overrides: Partial<CodeRow> = {}): CodeRow {
  return {
    email: "person@example.com",
    code_hash: "hash",
    expires_at: new Date(NOW_MS + CODE_TTL_MS).toISOString(),
    wrong_attempts: 0,
    locked_until: null,
    send_count: 1,
    send_window_started_at: NOW,
    last_sent_at: NOW,
    pending_locale: "zh-CN",
    ...overrides,
  };
}

function subscriber(overrides: Partial<SubscriberRow> = {}): SubscriberRow {
  return {
    email: "person@example.com",
    locale: "zh-CN",
    status: "pending_verify",
    verified_at: null,
    subscribed_at: null,
    unsubscribed_at: null,
    last_digest_at: null,
    consent_at: NOW,
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  };
}

function contest(overrides: Partial<DigestContest> = {}): DigestContest {
  return {
    id: "sample",
    slug: "sample",
    name: "Sample Award",
    status: "published",
    deadline_at: "2026-12-20T23:59:00.000Z",
    edition: "2026",
    official_url: "https://example.com/sample",
    gallery_urls: [],
    ...overrides,
  };
}

test("normalizeEmail lowercases a single mailbox", () => {
  assert.equal(normalizeEmail("  Person@Example.com "), "person@example.com");
  assert.equal(normalizeEmail("not an email"), null);
  assert.equal(normalizeEmail("a@b"), null);
  assert.equal(normalizeEmail("one@example.com,two@example.com"), null);
});

test("codes are six digits and are not stored in the clear", async () => {
  const hash = await hashVerificationCode("123456", SECRET);
  assert.notEqual(hash, "123456");
  assert.equal(hash.length, 64);
  const other = await hashVerificationCode("123456", "other-secret");
  assert.notEqual(hash, other);
  assert.equal(safeEqual(hash, hash), true);
  assert.equal(safeEqual(hash, other), false);
});

test("send limits are 60 seconds, 5 per hour, and honor the lock", () => {
  assert.deepEqual(evaluateSend(codeRow({ last_sent_at: new Date(NOW_MS - 59_000).toISOString() }), NOW_MS), {
    ok: false,
    error: "cooldown",
  });
  const cooled = evaluateSend(codeRow({ last_sent_at: new Date(NOW_MS - 60_000).toISOString(), send_count: 4 }), NOW_MS);
  assert.equal(cooled.ok, true);
  if (cooled.ok) assert.equal(cooled.sendCount, 5);

  assert.deepEqual(
    evaluateSend(codeRow({ last_sent_at: new Date(NOW_MS - 61_000).toISOString(), send_count: 5 }), NOW_MS),
    { ok: false, error: "rate_limited" },
  );
  const nextHour = evaluateSend(
    codeRow({
      last_sent_at: new Date(NOW_MS - 61_000).toISOString(),
      send_window_started_at: new Date(NOW_MS - 60 * 60 * 1000).toISOString(),
      send_count: 5,
    }),
    NOW_MS,
  );
  assert.equal(nextHour.ok, true);
  if (nextHour.ok) assert.equal(nextHour.sendCount, 1);

  assert.deepEqual(
    evaluateSend(codeRow({ locked_until: new Date(NOW_MS + 1000).toISOString() }), NOW_MS),
    { ok: false, error: "locked" },
  );
});

test("five wrong codes lock for 15 minutes, including a later correct guess", () => {
  let row = codeRow();
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const decision = evaluateVerify(row, false, NOW_MS);
    assert.equal(decision.ok, false);
    if (!decision.ok) {
      assert.equal(decision.error, "incorrect");
      assert.ok(decision.next);
      row = decision.next ?? row;
      assert.equal(row.wrong_attempts, attempt);
    }
  }
  const locked = evaluateVerify(row, false, NOW_MS);
  assert.equal(locked.ok, false);
  if (!locked.ok) {
    assert.equal(locked.error, "locked");
    assert.equal(Date.parse(locked.next?.locked_until ?? ""), NOW_MS + LOCK_MS);
    row = locked.next ?? row;
  }
  const duringLock = evaluateVerify(row, true, NOW_MS + 1000);
  assert.deepEqual(duringLock, { ok: false, error: "locked" });

  const afterLock = evaluateVerify(
    { ...row, locked_until: new Date(NOW_MS - 1).toISOString(), expires_at: new Date(NOW_MS + CODE_TTL_MS).toISOString() },
    false,
    NOW_MS,
  );
  assert.equal(afterLock.ok, false);
  if (!afterLock.ok) assert.equal(afterLock.next?.wrong_attempts, 1);

  assert.deepEqual(evaluateVerify(codeRow({ expires_at: new Date(NOW_MS - 1).toISOString() }), true, NOW_MS), {
    ok: false,
    error: "expired",
  });
});

test("templates stay PLACEHOLDER and omit the code and contest names", () => {
  const otp = otpTemplate("123456");
  assert.equal(otp.placeholder, true);
  assert.equal(otp.subject, TEMPLATE_MARK);
  assert.equal(otp.text.includes("123456"), false);
  assert.equal(otp.text.includes("PLACEHOLDER"), true);

  const welcome = welcomeTemplate("en", "https://alane.photography/api/reminders/unsubscribe?token=secret");
  assert.equal(welcome.placeholder, true);
  assert.equal(welcome.text.includes("secret"), false);
  assert.equal(welcome.text.includes("Welcome to ALane"), false);

  const digest = digestTemplate("zh-CN", [
    {
      kind: "open",
      key: "sample\t2026",
      id: "sample",
      slug: "sample",
      name: "UniqueContestName",
      nameZh: "独特赛事",
      nameEn: "UniqueContestName",
      edition: "2026",
      editionEn: "2026",
      deadlineAt: "2026-11-20T00:00:00.000Z",
      officialUrl: "https://example.com/unique",
      detailPath: "/contests/sample",
      galleryUrl: null,
    },
  ]);
  assert.equal(digest.placeholder, true);
  assert.equal(digest.text.includes("UniqueContestName"), false);
  assert.equal(digest.text.includes("example.com"), false);
  assert.equal(DIGEST_COPY_CONFIRMED, false);
  assert.equal(SUBSCRIBER_MAIL_COPY_CONFIRMED, false);
  assert.equal(REMINDERS_FROM, "ALane <reminders@alane.photography>");
});

test("mail gates stay closed and Resend is not called", async () => {
  const env = {
    REMINDERS_ENABLED: "1",
    RESEND_API_KEY: "not-a-real-key",
    REMINDERS_UNSUBSCRIBE_SECRET: SECRET,
  };
  assert.equal(subscriberMailAllowed(env), false);
  assert.equal(businessDigestAllowed(env), false);

  const calls: string[] = [];
  const original = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    calls.push(String(input));
    return new Response("{}", { status: 200 });
  }) as typeof fetch;
  try {
    const mailer = createResendMailer(env);
    const otp = await mailer.send({ ...otpTemplate("999999"), to: "a@example.com" });
    assert.equal(otp.skipped, "placeholder");
    const digest = await mailer.send({
      to: "a@example.com",
      kind: "digest",
      placeholder: false,
      subject: "draft",
      text: "draft",
      html: "<p>draft</p>",
    });
    assert.equal(digest.skipped, "digest_copy_unconfirmed");
    const welcome = await mailer.send({
      to: "a@example.com",
      kind: "welcome",
      placeholder: false,
      subject: "draft",
      text: "draft",
      html: "<p>draft</p>",
    });
    assert.equal(welcome.skipped, "subscriber_copy_unconfirmed");
    assert.deepEqual(calls, []);
  } finally {
    globalThis.fetch = original;
  }
});

test("sendCode does not write a subscriber or call the mailer while copy is unconfirmed", async () => {
  const store = createMemoryRemindersStore();
  const calls: string[] = [];
  const result = await sendCode(
    {
      store,
      env: {
        REMINDERS_ENABLED: "1",
        RESEND_API_KEY: "not-a-real-key",
        REMINDERS_UNSUBSCRIBE_SECRET: SECRET,
      },
      now: () => new Date(NOW),
      mailer: {
        async send(mail) {
          calls.push(mail.to);
          return { delivered: true };
        },
      },
    },
    { email: "Person@Example.com", locale: "zh-CN", consent: true },
  );
  assert.deepEqual(result, { ok: false, error: "disabled" });
  assert.equal(await store.getSubscriber("person@example.com"), null);
  assert.deepEqual(calls, []);
  assert.deepEqual(await sendCode(
    {
      store,
      env: {},
      now: () => new Date(NOW),
      mailer: { async send() { return { delivered: false }; } },
    },
    { email: "nope", locale: "zh-CN", consent: true },
  ), { ok: false, error: "invalid_email" });
});

test("active subscribers are the only digest recipients", () => {
  assert.equal(existingSubscriberAction(subscriber({ status: "active", locale: "zh-CN" }), "zh-CN"), "already_subscribed");
  assert.equal(existingSubscriberAction(subscriber({ status: "active", locale: "zh-CN" }), "en"), "issue_code");
  assert.equal(existingSubscriberAction(subscriber({ status: "unsubscribed" }), "zh-CN"), "issue_code");
  assert.match(SQL.listActive, /status = 'active'/);
  assert.doesNotMatch(SQL.listActive, /pending_verify/);
});

test("verify activates one row, rejects a lock, and leaves pending mailboxes off the list", async () => {
  const store = createMemoryRemindersStore();
  const hash = await hashVerificationCode("123456", SECRET);
  await store.upsertSubscriber(subscriber());
  await store.upsertSubscriber(subscriber({
    email: "pending@example.com",
    status: "pending_verify",
  }));
  await store.upsertCode(codeRow({ code_hash: hash }));
  const deps = {
    store,
    env: { REMINDERS_UNSUBSCRIBE_SECRET: SECRET, REMINDERS_ENABLED: "0" },
    now: () => new Date(NOW),
    mailer: { async send() { return { delivered: true }; } },
  };

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const wrong = await verifyCode(deps, { email: "Person@Example.com", code: "000000" });
    assert.deepEqual(wrong, { ok: false, error: "incorrect" });
  }
  assert.deepEqual(await verifyCode(deps, { email: "person@example.com", code: "000000" }), {
    ok: false,
    error: "locked",
  });
  assert.deepEqual(await verifyCode(deps, { email: "person@example.com", code: "123456" }), {
    ok: false,
    error: "locked",
  });
  assert.deepEqual(await store.listActive(), []);

  const fresh = createMemoryRemindersStore();
  await fresh.upsertSubscriber(subscriber({ subscribed_at: null }));
  await fresh.upsertCode(codeRow({ code_hash: hash, pending_locale: "en" }));
  const verified = await verifyCode(
    { ...deps, store: fresh },
    { email: "person@example.com", code: "123456" },
  );
  assert.deepEqual(verified, { ok: true, status: "subscribed", welcome: "skipped" });
  const active = await fresh.listActive();
  assert.deepEqual(active.map((row) => row.email), ["person@example.com"]);
  assert.equal(active[0]?.locale, "en");
  assert.equal(active[0]?.status, "active");
  assert.equal(await fresh.getCode("person@example.com"), null);

  await fresh.upsertCode(codeRow({ code_hash: hash, pending_locale: "zh-CN" }));
  const updated = await verifyCode(
    { ...deps, store: fresh },
    { email: "person@example.com", code: "123456" },
  );
  assert.deepEqual(updated, { ok: true, status: "locale_updated" });
  assert.equal((await fresh.getSubscriber("person@example.com"))?.locale, "zh-CN");
  assert.equal((await fresh.listActive()).length, 1);
});

test("unsubscribe is immediate and a signed link cannot be forged", async () => {
  const store = createMemoryRemindersStore();
  await store.upsertSubscriber(subscriber({
    status: "active",
    verified_at: NOW,
    subscribed_at: NOW,
  }));
  const deps = {
    store,
    env: { REMINDERS_UNSUBSCRIBE_SECRET: SECRET },
    now: () => new Date(NOW),
    mailer: { async send() { return { delivered: false }; } },
  };
  assert.deepEqual(await unsubscribeEmail(deps, "person@example.com"), { ok: true, status: "unsubscribed" });
  assert.deepEqual(await store.listActive(), []);
  assert.equal((await store.getSubscriber("person@example.com"))?.status, "unsubscribed");

  const resubscribe = createMemoryRemindersStore();
  await resubscribe.upsertSubscriber(subscriber({ status: "unsubscribed", unsubscribed_at: NOW }));
  const hash = await hashVerificationCode("123456", SECRET);
  await resubscribe.upsertCode(codeRow({ code_hash: hash }));
  const again = await verifyCode(
    { ...deps, store: resubscribe },
    { email: "person@example.com", code: "123456" },
  );
  assert.equal(again.ok, true);
  if (again.ok) assert.equal(again.status, "subscribed");
  assert.equal((await resubscribe.getSubscriber("person@example.com"))?.unsubscribed_at, null);

  const token = await createUnsubscribeToken("person@example.com", SECRET);
  assert.equal(await readUnsubscribeToken(token, SECRET), "person@example.com");
  assert.equal(await readUnsubscribeToken(`${token}x`, SECRET), null);
  const linked = createMemoryRemindersStore();
  await linked.upsertSubscriber(subscriber({ status: "active", verified_at: NOW, subscribed_at: NOW }));
  assert.deepEqual(await unsubscribeWithToken({ ...deps, store: linked }, token), {
    ok: true,
    status: "unsubscribed",
  });
  assert.deepEqual(await linked.listActive(), []);
});

test("digest diffs new opens, the 14-day window, and new galleries, and skips an unchanged day", () => {
  const asOf = NOW;
  const openLater = contest({ id: "later", slug: "later", deadline_at: "2026-11-24T12:00:00.000Z" });
  const closing = contest({ id: "soon", slug: "soon", deadline_at: "2026-11-23T23:59:00.000Z", edition: "2026" });
  const closed = contest({ id: "closed", slug: "closed", deadline_at: "2026-11-01T00:00:00.000Z", gallery_urls: [{ url: "https://example.com/winners" }] });
  const draft = contest({ id: "draft", slug: "draft", status: "draft", deadline_at: "2026-11-20T00:00:00.000Z" });
  const catalog = catalogContests([openLater, closing, closed, draft], asOf);

  assert.deepEqual(catalog.open.map((item) => item.id), ["later", "soon"]);
  assert.deepEqual(catalog.closing.map((item) => item.id), ["soon"]);
  assert.deepEqual(catalog.winners.map((item) => item.galleryUrl), ["https://example.com/winners"]);

  const baseline = diffCatalog(null, catalog);
  assert.equal(baseline.baseline, true);
  assert.deepEqual(baseline.items, []);

  const first = diffCatalog({ openKeys: [], closingKeys: [], galleryKeys: [] }, catalog);
  assert.deepEqual(first.items.map((item) => item.kind), ["open", "open", "closing", "winners"]);

  const entered = diffCatalog(
    { openKeys: first.next.openKeys, closingKeys: [], galleryKeys: first.next.galleryKeys },
    catalog,
  );
  assert.deepEqual(entered.items.map((item) => `${item.kind}:${item.id}`), ["closing:soon"]);

  const nextEdition = catalogContests([contest({ ...closing, edition: "2027" })], asOf);
  const editionDiff = diffCatalog(
    { openKeys: ["soon\t2026"], closingKeys: ["soon"], galleryKeys: [] },
    nextEdition,
  );
  assert.deepEqual(editionDiff.items.map((item) => item.key), ["soon\t2027"]);

  const addedGallery = catalogContests([
    contest({
      ...closed,
      gallery_urls: [{ url: "https://example.com/winners" }, { url: "https://example.com/winners-2026" }],
    }),
  ], asOf);
  const galleryDiff = diffCatalog(
    { openKeys: [], closingKeys: [], galleryKeys: ["closed\thttps://example.com/winners"] },
    addedGallery,
  );
  assert.deepEqual(galleryDiff.items.map((item) => item.galleryUrl), ["https://example.com/winners-2026"]);

  const quiet = diffCatalog(first.next, catalog);
  assert.equal(quiet.baseline, false);
  assert.deepEqual(quiet.items, []);

  const many = catalogContests(
    Array.from({ length: 25 }, (_, index) => contest({
      id: `c${index}`,
      slug: `c${index}`,
      deadline_at: "2026-12-01T00:00:00.000Z",
    })),
    asOf,
  );
  const capped = diffCatalog({ openKeys: [], closingKeys: [], galleryKeys: [] }, many);
  assert.equal(capped.items.length, 20);
  assert.equal(capped.truncated, true);
  assert.equal(parseSnapshot("{"), null);
});

test("daily digest purges old rows and does not send", async () => {
  const store = createMemoryRemindersStore();
  const old = new Date(NOW_MS - 8 * 24 * 60 * 60 * 1000).toISOString();
  const recentPending = new Date(NOW_MS - 2 * 24 * 60 * 60 * 1000).toISOString();
  const recent = new Date(NOW_MS - 10 * 24 * 60 * 60 * 1000).toISOString();
  const staleUnsubscribe = new Date(NOW_MS - 91 * 24 * 60 * 60 * 1000).toISOString();
  await store.upsertSubscriber(subscriber({ email: "old-pending@example.com", updated_at: old, created_at: old }));
  await store.upsertSubscriber(subscriber({
    email: "kept-pending@example.com",
    updated_at: recentPending,
    created_at: recentPending,
  }));
  await store.upsertSubscriber(subscriber({
    email: "active@example.com",
    status: "active",
    verified_at: NOW,
    subscribed_at: NOW,
  }));
  await store.upsertSubscriber(subscriber({
    email: "old-unsub@example.com",
    status: "unsubscribed",
    unsubscribed_at: staleUnsubscribe,
    updated_at: staleUnsubscribe,
  }));
  await store.upsertSubscriber(subscriber({
    email: "recent-unsub@example.com",
    status: "unsubscribed",
    unsubscribed_at: recent,
    updated_at: recent,
  }));
  const calls: string[] = [];
  const report = await runDailyDigest({
    store,
    env: { REMINDERS_ENABLED: "1", RESEND_API_KEY: "not-a-real-key", REMINDERS_UNSUBSCRIBE_SECRET: SECRET },
    now: () => new Date(NOW),
    contests: [contest({ deadline_at: "2026-11-20T00:00:00.000Z", gallery_urls: [{ url: "https://example.com/w" }] })],
    mailer: {
      async send(mail) {
        calls.push(mail.to);
        return { delivered: true };
      },
    },
  });
  assert.deepEqual(report, { sent: false, reason: "digest_copy_unconfirmed", delivered: 0 });
  assert.deepEqual(calls, []);
  assert.equal(await store.getSnapshot(), null);
  assert.equal(await store.getSubscriber("old-pending@example.com"), null);
  assert.equal(await store.getSubscriber("old-unsub@example.com"), null);
  assert.ok(await store.getSubscriber("kept-pending@example.com"));
  assert.ok(await store.getSubscriber("recent-unsub@example.com"));
  assert.deepEqual((await store.listActive()).map((row) => row.email), ["active@example.com"]);
});

test("d1 active list uses the active-only statement", async () => {
  const queries: string[] = [];
  const db: RemindersD1 = {
    prepare(query) {
      queries.push(query);
      const statement = {
        bind() {
          return statement;
        },
        async first() {
          return null;
        },
        async all() {
          return { results: [] };
        },
        async run() {
          return undefined;
        },
      };
      return statement;
    },
  };
  assert.deepEqual(await createD1RemindersStore(db).listActive(), []);
  assert.equal(queries.at(-1), SQL.listActive);
});

test("wrangler keeps the kill switch, cron, and secrets out of the repo", () => {
  const wrangler = readFileSync("wrangler.jsonc", "utf8");
  const pkg = JSON.parse(readFileSync("package.json", "utf8")) as {
    dependencies: { next: string; resend: string };
    devDependencies: { "eslint-config-next": string };
  };
  const nextConfig = readFileSync("next.config.ts", "utf8");
  const patch = readFileSync("scripts/patch-opennext-scheduled.mjs", "utf8");
  assert.match(wrangler, /"REMINDERS_ENABLED": "0"/);
  assert.match(wrangler, /15 0 \* \* \*/);
  assert.match(wrangler, /REMINDERS_DB/);
  assert.doesNotMatch(wrangler, /RESEND_API_KEY/);
  assert.match(patch, /\/api\/internal\/reminders\/digest/);
  assert.match(patch, /WORKER_SELF_REFERENCE/);
  assert.equal(pkg.dependencies.next, "16.4.5");
  assert.equal(pkg.devDependencies["eslint-config-next"], "16.4.5");
  assert.equal(typeof pkg.dependencies.resend, "string");
  assert.match(nextConfig, /agentUpgrade: "security"/);
});
