/** D1 statements. Digest recipients are `status = 'active'` only. */

export const SQL = {
  selectSubscriber: `SELECT email, locale, status, verified_at, subscribed_at, unsubscribed_at,
      last_digest_at, consent_at, created_at, updated_at
    FROM subscribers WHERE email = ?1`,
  upsertSubscriber: `INSERT INTO subscribers (
      email, locale, status, verified_at, subscribed_at, unsubscribed_at,
      last_digest_at, consent_at, created_at, updated_at
    ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
    ON CONFLICT(email) DO UPDATE SET
      locale = excluded.locale,
      status = excluded.status,
      verified_at = excluded.verified_at,
      subscribed_at = excluded.subscribed_at,
      unsubscribed_at = excluded.unsubscribed_at,
      last_digest_at = excluded.last_digest_at,
      consent_at = excluded.consent_at,
      updated_at = excluded.updated_at`,
  listActive: `SELECT email, locale, status, verified_at, subscribed_at, unsubscribed_at,
      last_digest_at, consent_at, created_at, updated_at
    FROM subscribers WHERE status = 'active' ORDER BY email`,
  deleteSubscriber: `DELETE FROM subscribers WHERE email = ?1`,
  deletePendingCodes: `DELETE FROM verification_codes WHERE email IN (
      SELECT email FROM subscribers WHERE status = 'pending_verify' AND updated_at < ?1
    )`,
  deletePendingSubscribers: `DELETE FROM subscribers
    WHERE status = 'pending_verify' AND updated_at < ?1`,
  deleteStaleUnsubscribeCodes: `DELETE FROM verification_codes WHERE email IN (
      SELECT email FROM subscribers
      WHERE status = 'unsubscribed' AND unsubscribed_at IS NOT NULL AND unsubscribed_at < ?1
    )`,
  deleteStaleUnsubscribes: `DELETE FROM subscribers
    WHERE status = 'unsubscribed' AND unsubscribed_at IS NOT NULL AND unsubscribed_at < ?1`,
  selectCode: `SELECT email, code_hash, expires_at, wrong_attempts, locked_until, send_count,
      send_window_started_at, last_sent_at, pending_locale
    FROM verification_codes WHERE email = ?1`,
  upsertCode: `INSERT INTO verification_codes (
      email, code_hash, expires_at, wrong_attempts, locked_until, send_count,
      send_window_started_at, last_sent_at, pending_locale
    ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
    ON CONFLICT(email) DO UPDATE SET
      code_hash = excluded.code_hash,
      expires_at = excluded.expires_at,
      wrong_attempts = excluded.wrong_attempts,
      locked_until = excluded.locked_until,
      send_count = excluded.send_count,
      send_window_started_at = excluded.send_window_started_at,
      last_sent_at = excluded.last_sent_at,
      pending_locale = excluded.pending_locale`,
  deleteCode: `DELETE FROM verification_codes WHERE email = ?1`,
  selectSnapshot: `SELECT payload_json, sent_at FROM digest_state WHERE id = 1`,
  upsertSnapshot: `INSERT INTO digest_state (id, sent_at, payload_json) VALUES (1, ?1, ?2)
    ON CONFLICT(id) DO UPDATE SET
      sent_at = excluded.sent_at,
      payload_json = excluded.payload_json`,
  touchActiveDigest: `UPDATE subscribers
    SET last_digest_at = ?1, updated_at = ?1
    WHERE status = 'active'`,
} as const;
