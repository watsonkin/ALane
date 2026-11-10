import type { Locale } from "@/lib/locale";
import type { SeenSets } from "@/lib/reminders/digest";
import { SCHEMA_STATEMENTS } from "@/lib/reminders/schema";
import type { SqlDatabase } from "@/lib/reminders/sql";

export type SubscriberStatus = "pending_verify" | "active" | "unsubscribed";

export type Subscriber = {
  email: string;
  locale: Locale;
  status: SubscriberStatus;
  verified_at: string | null;
  subscribed_at: string | null;
  unsubscribed_at: string | null;
  last_digest_at: string | null;
  consent_at: string;
};

/**
 * In-memory shape used by the service. Live verification_codes stores
 * `locale` as pending_locale and `send_window_start` as send_window_started_at.
 */
export type OtpRow = {
  email: string;
  code_hash: string;
  expires_at: string;
  locale: Locale;
  wrong_attempts: number;
  locked_until: string | null;
  send_count: number;
  send_window_start: string;
  last_sent_at: string;
};

type SeenJson = {
  initialized?: unknown;
  open?: unknown;
  closing?: unknown;
  gallery?: unknown;
};

const schemaReady = new WeakMap<SqlDatabase, Promise<void>>();

export function ensureSchema(db: SqlDatabase): Promise<void> {
  const existing = schemaReady.get(db);
  if (existing) return existing;
  const pending = (async () => {
    for (const statement of SCHEMA_STATEMENTS) {
      await db.prepare(statement).run();
    }
  })().catch((error: unknown) => {
    schemaReady.delete(db);
    throw error;
  });
  schemaReady.set(db, pending);
  return pending;
}

function asLocale(value: string): Locale {
  return value === "en" ? "en" : "zh-CN";
}

function strings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function seenFromPayload(raw: string | null): SeenSets {
  if (!raw) {
    return { initialized: false, open: new Set(), closing: new Set(), gallery: new Set() };
  }
  try {
    const parsed = JSON.parse(raw) as SeenJson;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { initialized: false, open: new Set(), closing: new Set(), gallery: new Set() };
    }
    return {
      initialized: parsed.initialized === true,
      open: new Set(strings(parsed.open)),
      closing: new Set(strings(parsed.closing)),
      gallery: new Set(strings(parsed.gallery)),
    };
  } catch {
    return { initialized: false, open: new Set(), closing: new Set(), gallery: new Set() };
  }
}

function seenToPayload(seen: SeenSets): string {
  return JSON.stringify({
    initialized: seen.initialized,
    open: [...seen.open],
    closing: [...seen.closing],
    gallery: [...seen.gallery],
  });
}

export async function getSubscriber(db: SqlDatabase, email: string): Promise<Subscriber | null> {
  const row = await db
    .prepare(
      `SELECT email, locale, status, verified_at, subscribed_at, unsubscribed_at, last_digest_at, consent_at
       FROM subscribers WHERE email = ?`,
    )
    .bind(email)
    .first<Subscriber>();
  if (!row) return null;
  return { ...row, locale: asLocale(row.locale), status: row.status };
}

export async function getOtp(db: SqlDatabase, email: string): Promise<OtpRow | null> {
  const row = await db
    .prepare(
      `SELECT email, code_hash, expires_at, pending_locale AS locale, wrong_attempts, locked_until,
              send_count, send_window_started_at AS send_window_start, last_sent_at
       FROM verification_codes WHERE email = ?`,
    )
    .bind(email)
    .first<OtpRow>();
  if (!row) return null;
  return {
    ...row,
    locale: asLocale(row.locale),
    wrong_attempts: Number(row.wrong_attempts),
    send_count: Number(row.send_count),
  };
}

export async function insertPending(
  db: SqlDatabase,
  input: { email: string; locale: Locale; consentAt: string },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO subscribers (
         email, locale, status, verified_at, subscribed_at, unsubscribed_at, last_digest_at,
         consent_at, created_at, updated_at
       ) VALUES (?, ?, 'pending_verify', NULL, NULL, NULL, NULL, ?, ?, ?)`,
    )
    .bind(input.email, input.locale, input.consentAt, input.consentAt, input.consentAt)
    .run();
}

export async function updateConsent(
  db: SqlDatabase,
  input: { email: string; consentAt: string; locale: Locale | null },
): Promise<void> {
  if (input.locale) {
    await db
      .prepare(
        `UPDATE subscribers SET consent_at = ?, locale = ?, updated_at = ? WHERE email = ?`,
      )
      .bind(input.consentAt, input.locale, input.consentAt, input.email)
      .run();
    return;
  }
  await db
    .prepare(`UPDATE subscribers SET consent_at = ?, updated_at = ? WHERE email = ?`)
    .bind(input.consentAt, input.consentAt, input.email)
    .run();
}

export async function activateSubscriber(
  db: SqlDatabase,
  input: { email: string; locale: Locale; at: string; keepSubscribedAt: boolean },
): Promise<void> {
  if (input.keepSubscribedAt) {
    await db
      .prepare(
        `UPDATE subscribers
         SET status = 'active', locale = ?, verified_at = ?, unsubscribed_at = NULL, updated_at = ?
         WHERE email = ?`,
      )
      .bind(input.locale, input.at, input.at, input.email)
      .run();
    return;
  }
  await db
    .prepare(
      `UPDATE subscribers
       SET status = 'active', locale = ?, verified_at = ?, subscribed_at = ?, unsubscribed_at = NULL, updated_at = ?
       WHERE email = ?`,
    )
    .bind(input.locale, input.at, input.at, input.at, input.email)
    .run();
}

export async function markUnsubscribed(db: SqlDatabase, email: string, at: string): Promise<boolean> {
  const existing = await getSubscriber(db, email);
  if (!existing) return false;
  if (existing.status !== "unsubscribed") {
    await db
      .prepare(
        `UPDATE subscribers
         SET status = 'unsubscribed', unsubscribed_at = ?, updated_at = ?
         WHERE email = ?`,
      )
      .bind(at, at, email)
      .run();
  }
  await deleteOtp(db, email);
  return true;
}

export async function saveOtp(db: SqlDatabase, row: OtpRow): Promise<void> {
  await db
    .prepare(
      `INSERT INTO verification_codes (
         email, code_hash, expires_at, wrong_attempts, locked_until, send_count,
         send_window_started_at, last_sent_at, pending_locale
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(email) DO UPDATE SET
         code_hash = excluded.code_hash,
         expires_at = excluded.expires_at,
         wrong_attempts = excluded.wrong_attempts,
         locked_until = excluded.locked_until,
         send_count = excluded.send_count,
         send_window_started_at = excluded.send_window_started_at,
         last_sent_at = excluded.last_sent_at,
         pending_locale = excluded.pending_locale`,
    )
    .bind(
      row.email,
      row.code_hash,
      row.expires_at,
      row.wrong_attempts,
      row.locked_until,
      row.send_count,
      row.send_window_start,
      row.last_sent_at,
      row.locale,
    )
    .run();
}

export async function deleteOtp(db: SqlDatabase, email: string): Promise<void> {
  await db.prepare(`DELETE FROM verification_codes WHERE email = ?`).bind(email).run();
}

export async function listActive(db: SqlDatabase): Promise<Array<{ email: string; locale: Locale }>> {
  const rows = await db
    .prepare(`SELECT email, locale FROM subscribers WHERE status = 'active' ORDER BY email`)
    .all<{ email: string; locale: string }>();
  return (rows.results ?? []).map((row) => ({ email: row.email, locale: asLocale(row.locale) }));
}

export async function markDigestSent(db: SqlDatabase, emails: readonly string[], at: string): Promise<void> {
  for (const email of emails) {
    await db
      .prepare(
        `UPDATE subscribers SET last_digest_at = ?, updated_at = ? WHERE email = ? AND status = 'active'`,
      )
      .bind(at, at, email)
      .run();
  }
  if (emails.length > 0) {
    await db.prepare(`UPDATE digest_state SET sent_at = ? WHERE id = 1`).bind(at).run();
  }
}

export async function cleanup(
  db: SqlDatabase,
  thresholds: { pendingBefore: string; unsubscribedBefore: string; nowIso: string },
): Promise<void> {
  await db
    .prepare(
      `DELETE FROM subscribers
       WHERE status = 'pending_verify'
         AND consent_at < ?
         AND email NOT IN (
           SELECT email FROM verification_codes
           WHERE locked_until IS NOT NULL AND locked_until > ?
         )`,
    )
    .bind(thresholds.pendingBefore, thresholds.nowIso)
    .run();
  await db
    .prepare(
      `DELETE FROM subscribers
       WHERE status = 'unsubscribed'
         AND unsubscribed_at IS NOT NULL
         AND unsubscribed_at < ?`,
    )
    .bind(thresholds.unsubscribedBefore)
    .run();
  await db
    .prepare(`DELETE FROM verification_codes WHERE email NOT IN (SELECT email FROM subscribers)`)
    .run();
}

export async function loadSeen(db: SqlDatabase): Promise<SeenSets> {
  const row = await db
    .prepare(`SELECT payload_json FROM digest_state WHERE id = 1`)
    .first<{ payload_json: string }>();
  return seenFromPayload(row?.payload_json ?? null);
}

export async function saveSeen(db: SqlDatabase, seen: SeenSets): Promise<void> {
  await db
    .prepare(
      `INSERT INTO digest_state (id, sent_at, payload_json) VALUES (1, NULL, ?)
       ON CONFLICT(id) DO UPDATE SET payload_json = excluded.payload_json`,
    )
    .bind(seenToPayload(seen))
    .run();
}
