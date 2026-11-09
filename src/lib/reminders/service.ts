import { codeExpiresAt, evaluateSend, evaluateVerify, randomSixDigitCode } from "@/lib/reminders/codes";
import { PENDING_PURGE_MS, UNSUBSCRIBE_RETAIN_MS } from "@/lib/reminders/constants";
import { createUnsubscribeToken, hashVerificationCode, readUnsubscribeToken, safeEqual } from "@/lib/reminders/crypto";
import {
  catalogContests,
  diffCatalog,
  parseSnapshot,
  type DigestContest,
} from "@/lib/reminders/digest";
import { normalizeEmail } from "@/lib/reminders/email";
import {
  businessDigestAllowed,
  publicOrigin,
  readRemindersEnv,
  subscriberMailAllowed,
  type RemindersEnv,
} from "@/lib/reminders/env";
import { createResendMailer, type Mailer } from "@/lib/reminders/mailer";
import type { ReminderLocale } from "@/lib/reminders/schema";
import { createD1RemindersStore, type RemindersStore, type SubscriberRow } from "@/lib/reminders/store";
import { digestTemplate, otpTemplate, welcomeTemplate } from "@/lib/reminders/templates";

export type ReminderDeps = {
  store: RemindersStore;
  mailer: Mailer;
  env: RemindersEnv;
  now: () => Date;
  randomCode?: () => string;
  contests?: readonly DigestContest[];
};

export type SendCodeResult =
  | { ok: true; status: "sent" | "already_subscribed" }
  | { ok: false; error: "invalid_email" | "invalid_locale" | "consent_required" | "disabled" | "cooldown" | "rate_limited" | "locked" };

export type VerifyResult =
  | { ok: true; status: "subscribed"; welcome: "sent" | "skipped" }
  | { ok: true; status: "locale_updated" }
  | { ok: false; error: "invalid_email" | "expired" | "incorrect" | "locked" };

export type UnsubscribeResult =
  | { ok: true; status: "unsubscribed" }
  | { ok: false; error: "invalid_email" | "invalid_token" };

export type DigestRunResult = {
  sent: false;
  reason: "digest_copy_unconfirmed" | "disabled" | "baseline" | "no_change" | "no_recipients" | "not_delivered";
  delivered: number;
} | {
  sent: true;
  delivered: number;
  items: number;
};

export function existingSubscriberAction(
  existing: SubscriberRow | null,
  locale: ReminderLocale,
): "already_subscribed" | "issue_code" {
  if (existing?.status === "active" && existing.locale === locale) return "already_subscribed";
  return "issue_code";
}

export async function sendCode(
  deps: ReminderDeps,
  input: { email: string; locale: ReminderLocale; consent: boolean },
): Promise<SendCodeResult> {
  const email = normalizeEmail(input.email);
  if (!email) return { ok: false, error: "invalid_email" };
  if (input.locale !== "zh-CN" && input.locale !== "en") return { ok: false, error: "invalid_locale" };
  if (input.consent !== true) return { ok: false, error: "consent_required" };
  if (!subscriberMailAllowed(deps.env)) return { ok: false, error: "disabled" };

  const secret = deps.env.REMINDERS_UNSUBSCRIBE_SECRET ?? "";
  const now = deps.now();
  const existing = await deps.store.getSubscriber(email);
  if (existingSubscriberAction(existing, input.locale) === "already_subscribed") {
    return { ok: true, status: "already_subscribed" };
  }

  const decision = evaluateSend(await deps.store.getCode(email), now.getTime());
  if (!decision.ok) return { ok: false, error: decision.error };

  const code = deps.randomCode?.() ?? randomSixDigitCode();
  const template = otpTemplate(code);
  if (template.placeholder) return { ok: false, error: "disabled" };

  const mailed = await deps.mailer.send({ ...template, to: email });
  if (!mailed.delivered) return { ok: false, error: "disabled" };

  const timestamp = now.toISOString();
  const subscriber: SubscriberRow = {
    email,
    locale: input.locale,
    status: existing?.status === "active" ? "active" : "pending_verify",
    verified_at: existing?.verified_at ?? null,
    subscribed_at: existing?.status === "active" ? existing.subscribed_at : null,
    unsubscribed_at: existing?.status === "active" ? null : existing?.unsubscribed_at ?? null,
    last_digest_at: existing?.last_digest_at ?? null,
    consent_at: timestamp,
    created_at: existing?.created_at ?? timestamp,
    updated_at: timestamp,
  };
  await deps.store.upsertSubscriber(subscriber);
  await deps.store.upsertCode({
    email,
    code_hash: await hashVerificationCode(code, secret),
    expires_at: codeExpiresAt(now.getTime()),
    wrong_attempts: 0,
    locked_until: null,
    send_count: decision.sendCount,
    send_window_started_at: decision.windowStartedAt,
    last_sent_at: timestamp,
    pending_locale: input.locale,
  });
  return { ok: true, status: "sent" };
}

export async function verifyCode(
  deps: ReminderDeps,
  input: { email: string; code: string },
): Promise<VerifyResult> {
  const email = normalizeEmail(input.email);
  if (!email) return { ok: false, error: "invalid_email" };
  const secret = deps.env.REMINDERS_UNSUBSCRIBE_SECRET ?? "";
  const now = deps.now();
  const row = await deps.store.getCode(email);
  const submitted = input.code.trim();
  const matches =
    /^\d{6}$/.test(submitted) && row
      ? safeEqual(await hashVerificationCode(submitted, secret), row.code_hash)
      : false;
  const decision = evaluateVerify(row, matches, now.getTime());
  if (!decision.ok) {
    if (decision.next) await deps.store.upsertCode(decision.next);
    return { ok: false, error: decision.error };
  }

  const existing = await deps.store.getSubscriber(email);
  if (!existing || !row) return { ok: false, error: "expired" };
  const wasActive = existing.status === "active";
  const timestamp = now.toISOString();
  await deps.store.upsertSubscriber({
    ...existing,
    locale: row.pending_locale,
    status: "active",
    verified_at: existing.verified_at ?? timestamp,
    subscribed_at: wasActive ? existing.subscribed_at : timestamp,
    unsubscribed_at: null,
    updated_at: timestamp,
  });
  await deps.store.deleteCode(email);

  if (wasActive) return { ok: true, status: "locale_updated" };

  const origin = publicOrigin(deps.env);
  const token = secret ? await createUnsubscribeToken(email, secret) : "";
  const unsubscribeUrl = token ? `${origin}/api/reminders/unsubscribe?token=${encodeURIComponent(token)}` : "";
  const template = welcomeTemplate(row.pending_locale, unsubscribeUrl);
  if (template.placeholder || !subscriberMailAllowed(deps.env)) {
    return { ok: true, status: "subscribed", welcome: "skipped" };
  }
  const mailed = await deps.mailer.send({ ...template, to: email });
  return { ok: true, status: "subscribed", welcome: mailed.delivered ? "sent" : "skipped" };
}

export async function unsubscribeEmail(deps: ReminderDeps, emailRaw: string): Promise<UnsubscribeResult> {
  const email = normalizeEmail(emailRaw);
  if (!email) return { ok: false, error: "invalid_email" };
  const existing = await deps.store.getSubscriber(email);
  if (!existing || existing.status === "unsubscribed") {
    return { ok: true, status: "unsubscribed" };
  }
  const timestamp = deps.now().toISOString();
  await deps.store.upsertSubscriber({
    ...existing,
    status: "unsubscribed",
    unsubscribed_at: timestamp,
    updated_at: timestamp,
  });
  await deps.store.deleteCode(email);
  return { ok: true, status: "unsubscribed" };
}

export async function openReminderDeps(): Promise<{
  env: RemindersEnv;
  store: RemindersStore | null;
  mailer: Mailer;
}> {
  const env = await readRemindersEnv();
  return {
    env,
    store: env.REMINDERS_DB ? createD1RemindersStore(env.REMINDERS_DB) : null,
    mailer: createResendMailer(env),
  };
}

export async function unsubscribeWithToken(deps: ReminderDeps, token: string): Promise<UnsubscribeResult> {
  const secret = deps.env.REMINDERS_UNSUBSCRIBE_SECRET;
  if (!secret) return { ok: false, error: "invalid_token" };
  const email = await readUnsubscribeToken(token, secret);
  if (!email) return { ok: false, error: "invalid_token" };
  return unsubscribeEmail(deps, email);
}

/**
 * Daily job. Retention runs even while copy is unconfirmed.
 * Business digests do not: DIGEST_COPY_CONFIRMED is false and the template is a placeholder.
 */
export async function runDailyDigest(deps: ReminderDeps): Promise<DigestRunResult> {
  const now = deps.now();
  await deps.store.purgePendingUnverified(new Date(now.getTime() - PENDING_PURGE_MS).toISOString());
  await deps.store.purgeUnsubscribed(new Date(now.getTime() - UNSUBSCRIBE_RETAIN_MS).toISOString());

  if (!businessDigestAllowed(deps.env)) {
    return { sent: false, reason: "digest_copy_unconfirmed", delivered: 0 };
  }

  const catalog = catalogContests(deps.contests ?? [], now.toISOString());
  const diff = diffCatalog(parseSnapshot(await deps.store.getSnapshot()), catalog);
  if (diff.baseline) {
    await deps.store.saveSnapshot(JSON.stringify(diff.next), null);
    return { sent: false, reason: "baseline", delivered: 0 };
  }
  if (diff.items.length === 0) {
    return { sent: false, reason: "no_change", delivered: 0 };
  }

  const recipients = await deps.store.listActive();
  if (recipients.length === 0) {
    return { sent: false, reason: "no_recipients", delivered: 0 };
  }

  const secret = deps.env.REMINDERS_UNSUBSCRIBE_SECRET ?? "";
  const origin = publicOrigin(deps.env);
  let delivered = 0;
  for (const locale of ["zh-CN", "en"] as const) {
    const group = recipients.filter((row) => row.locale === locale);
    if (group.length === 0) continue;
    for (const recipient of group) {
      const token = secret ? await createUnsubscribeToken(recipient.email, secret) : "";
      const template = digestTemplate(locale, diff.items, {
        truncated: diff.truncated,
        unsubscribeUrl: token ? `${origin}/api/reminders/unsubscribe?token=${encodeURIComponent(token)}` : "",
      });
      if (template.placeholder) {
        return { sent: false, reason: "digest_copy_unconfirmed", delivered: 0 };
      }
      const mailed = await deps.mailer.send({ ...template, to: recipient.email });
      if (mailed.delivered) delivered += 1;
    }
  }

  if (delivered === 0) return { sent: false, reason: "not_delivered", delivered: 0 };
  const sentAt = now.toISOString();
  await deps.store.saveSnapshot(JSON.stringify(diff.next), sentAt);
  await deps.store.touchActiveDigest(sentAt);
  return { sent: true, delivered, items: diff.items.length };
}
