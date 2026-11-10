import { isLocale, type Locale } from "@/lib/locale";
import { generateOtpCode, hashOtp, readUnsubscribeToken, safeEqual, signUnsubscribe } from "@/lib/reminders/crypto";
import type { ReminderCode, ReminderResult } from "@/lib/reminders/codes";
import {
  DIGEST_COPY_CONFIRMED,
  OTP_COOLDOWN_MS,
  OTP_HOUR_MS,
  OTP_LOCK_MS,
  OTP_MAX_SENDS_PER_HOUR,
  OTP_MAX_WRONG,
  OTP_TTL_MS,
  PENDING_VERIFY_TTL_MS,
  UNSUBSCRIBED_RETAIN_MS,
} from "@/lib/reminders/constants";
import { planDigest, type DigestItem } from "@/lib/reminders/digest";
import { normalizeEmail } from "@/lib/reminders/email";
import type { Mailer } from "@/lib/reminders/mailer";
import {
  activateSubscriber,
  cleanup,
  deleteOtp,
  ensureSchema,
  getOtp,
  getSubscriber,
  insertPending,
  listActive,
  loadSeen,
  markDigestSent,
  markUnsubscribed,
  saveOtp,
  saveSeen,
  updateConsent,
  type OtpRow,
} from "@/lib/reminders/store";
import type { SqlDatabase } from "@/lib/reminders/sql";
import {
  calendarFeedUrl,
  renderDigest,
  renderOtp,
  renderWelcome,
  shanghaiDate,
  unsubscribeUrl,
} from "@/lib/reminders/templates";
import type { Contest } from "@/lib/contest-schema";

export type ReminderDeps = {
  db: SqlDatabase;
  now: () => Date;
  secret: string;
  siteOrigin: string;
  mail: Mailer | null;
  enabled: boolean;
};

export type DigestRunResult = {
  result: "baseline" | "no_change" | "withheld" | "no_recipients" | "mail_not_configured" | "sent";
  pendingItems: number;
  sent: number;
  failed: number;
};

function result(code: ReminderCode): ReminderResult {
  const ok =
    code === "sent" ||
    code === "subscribed" ||
    code === "subscribed_welcome_failed" ||
    code === "already_subscribed" ||
    code === "locale_updated" ||
    code === "unsubscribed";
  return { ok, code };
}

function iso(date: Date): string {
  return date.toISOString();
}

async function sweep(deps: ReminderDeps, now: Date): Promise<void> {
  await cleanup(deps.db, {
    pendingBefore: iso(new Date(now.getTime() - PENDING_VERIFY_TTL_MS)),
    unsubscribedBefore: iso(new Date(now.getTime() - UNSUBSCRIBED_RETAIN_MS)),
    nowIso: iso(now),
  });
}

function locked(otp: OtpRow | null, nowMs: number): boolean {
  if (!otp?.locked_until) return false;
  return Date.parse(otp.locked_until) > nowMs;
}

export async function sendCode(
  deps: ReminderDeps,
  input: { email: string; locale: string; consent: boolean },
): Promise<ReminderResult> {
  if (!deps.enabled) return result("disabled");
  const email = normalizeEmail(input.email);
  if (!email) return result("invalid_email");
  if (!isLocale(input.locale)) return result("invalid_locale");
  if (input.consent !== true) return result("consent_required");

  await ensureSchema(deps.db);
  const now = deps.now();
  await sweep(deps, now);
  const nowMs = now.getTime();
  const subscriber = await getSubscriber(deps.db, email);
  if (subscriber?.status === "active" && subscriber.locale === input.locale) {
    return result("already_subscribed");
  }

  const otp = await getOtp(deps.db, email);
  if (locked(otp, nowMs)) return result("locked");

  let sendCount = otp?.send_count ?? 0;
  let windowStart = otp ? Date.parse(otp.send_window_start) : nowMs;
  if (!otp || !Number.isFinite(windowStart) || nowMs - windowStart >= OTP_HOUR_MS) {
    sendCount = 0;
    windowStart = nowMs;
  }
  if (sendCount >= OTP_MAX_SENDS_PER_HOUR) return result("rate_limited");
  if (otp && nowMs - Date.parse(otp.last_sent_at) < OTP_COOLDOWN_MS) return result("cooldown");
  if (!deps.secret || !deps.mail) return result("mail_not_configured");

  const code = generateOtpCode();
  const message = renderOtp(input.locale, code, deps.siteOrigin);
  const sent = await deps.mail.send({ to: email, subject: message.subject, text: message.text });
  if (!sent.ok) return result("mail_failed");

  const at = iso(now);
  if (!subscriber) {
    await insertPending(deps.db, { email, locale: input.locale, consentAt: at });
  } else if (subscriber.status === "pending_verify") {
    await updateConsent(deps.db, { email, consentAt: at, locale: input.locale });
  } else {
    await updateConsent(deps.db, { email, consentAt: at, locale: null });
  }
  await saveOtp(deps.db, {
    email,
    code_hash: await hashOtp(email, code, deps.secret),
    expires_at: iso(new Date(nowMs + OTP_TTL_MS)),
    locale: input.locale,
    wrong_attempts: 0,
    locked_until: null,
    send_count: sendCount + 1,
    send_window_start: iso(new Date(windowStart)),
    last_sent_at: at,
  });
  return result("sent");
}

export async function verifyCode(
  deps: ReminderDeps,
  input: { email: string; code: string; locale: string },
): Promise<ReminderResult> {
  if (!deps.enabled) return result("disabled");
  const email = normalizeEmail(input.email);
  if (!email) return result("invalid_email");
  const code = input.code.replace(/\s+/g, "");
  if (!/^\d{6}$/.test(code)) return result("invalid_code");
  if (!deps.secret) return result("mail_not_configured");

  await ensureSchema(deps.db);
  const now = deps.now();
  await sweep(deps, now);
  const nowMs = now.getTime();
  const otp = await getOtp(deps.db, email);
  if (!otp) return result("expired");
  if (locked(otp, nowMs)) return result("locked");
  if (Date.parse(otp.expires_at) <= nowMs) return result("expired");

  const expected = await hashOtp(email, code, deps.secret);
  if (!safeEqual(otp.code_hash, expected)) {
    const attempts = otp.wrong_attempts + 1;
    const lock = attempts >= OTP_MAX_WRONG;
    await saveOtp(deps.db, {
      ...otp,
      wrong_attempts: attempts,
      locked_until: lock ? iso(new Date(nowMs + OTP_LOCK_MS)) : otp.locked_until,
    });
    return result(lock ? "locked" : "incorrect");
  }

  const subscriber = await getSubscriber(deps.db, email);
  if (!subscriber) return result("expired");
  const locale: Locale = isLocale(input.locale) ? input.locale : otp.locale;
  const at = iso(now);
  const alreadyActive = subscriber.status === "active";
  await activateSubscriber(deps.db, {
    email,
    locale,
    at,
    keepSubscribedAt: alreadyActive,
  });
  await deleteOtp(deps.db, email);

  if (alreadyActive) {
    return result(subscriber.locale === locale ? "already_subscribed" : "locale_updated");
  }
  if (!deps.mail) return result("subscribed_welcome_failed");
  const token = await signUnsubscribe(email, deps.secret);
  const welcome = renderWelcome(locale, {
    unsubscribeUrl: unsubscribeUrl(deps.siteOrigin, locale, token),
    calendarUrl: calendarFeedUrl(deps.siteOrigin),
  });
  const sent = await deps.mail.send({ to: email, subject: welcome.subject, text: welcome.text });
  return result(sent.ok ? "subscribed" : "subscribed_welcome_failed");
}

export async function unsubscribeEmail(deps: ReminderDeps, emailRaw: string): Promise<ReminderResult> {
  const email = normalizeEmail(emailRaw);
  if (!email) return result("invalid_email");
  await ensureSchema(deps.db);
  const now = deps.now();
  await sweep(deps, now);
  await markUnsubscribed(deps.db, email, iso(now));
  return result("unsubscribed");
}

export async function unsubscribeToken(deps: ReminderDeps, token: string): Promise<ReminderResult> {
  if (!deps.secret) return result("mail_not_configured");
  const email = await readUnsubscribeToken(token, deps.secret);
  if (!email) return result("invalid_token");
  return unsubscribeEmail(deps, email);
}

/**
 * Daily scan. Confirmed digest copy is sent only when reminders are enabled.
 * Cleanup and the no-send baseline still run while the switch is off.
 */
export async function runDigest(
  deps: ReminderDeps,
  contests: readonly Contest[],
): Promise<DigestRunResult> {
  await ensureSchema(deps.db);
  const now = deps.now();
  await sweep(deps, now);
  const seen = await loadSeen(deps.db);
  const plan = planDigest(contests, seen, iso(now));
  if (plan.kind === "baseline") {
    await saveSeen(deps.db, plan.seen);
    return { result: "baseline", pendingItems: 0, sent: 0, failed: 0 };
  }
  if (plan.items.length === 0) {
    await saveSeen(deps.db, plan.retainSeen);
    return { result: "no_change", pendingItems: 0, sent: 0, failed: 0 };
  }
  if (!deps.enabled || !DIGEST_COPY_CONFIRMED) {
    await saveSeen(deps.db, plan.retainSeen);
    return { result: "withheld", pendingItems: plan.items.length, sent: 0, failed: 0 };
  }
  return sendDigest(deps, plan.items, plan.overflow, plan.nextSeen, now);
}

async function sendDigest(
  deps: ReminderDeps,
  items: readonly DigestItem[],
  overflow: boolean,
  nextSeen: Awaited<ReturnType<typeof loadSeen>>,
  now: Date,
): Promise<DigestRunResult> {
  const active = await listActive(deps.db);
  if (active.length === 0) {
    return { result: "no_recipients", pendingItems: items.length, sent: 0, failed: 0 };
  }
  if (!deps.mail || !deps.secret) {
    return { result: "mail_not_configured", pendingItems: items.length, sent: 0, failed: 0 };
  }
  const date = shanghaiDate(now);
  let sent = 0;
  let failed = 0;
  const succeeded: string[] = [];
  for (const subscriber of active) {
    const token = await signUnsubscribe(subscriber.email, deps.secret);
    const message = renderDigest({
      locale: subscriber.locale,
      date,
      items,
      overflow,
      unsubscribeUrl: unsubscribeUrl(deps.siteOrigin, subscriber.locale, token),
      calendarUrl: calendarFeedUrl(deps.siteOrigin),
      origin: deps.siteOrigin,
    });
    const delivery = await deps.mail.send({
      to: subscriber.email,
      subject: message.subject,
      text: message.text,
    });
    if (delivery.ok) {
      sent += 1;
      succeeded.push(subscriber.email);
    } else {
      failed += 1;
    }
  }
  if (sent > 0) {
    await saveSeen(deps.db, nextSeen);
    await markDigestSent(deps.db, succeeded, iso(now));
  }
  return { result: "sent", pendingItems: items.length, sent, failed };
}
