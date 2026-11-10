/**
 * PR-SUBSCRIBE-01 §7.4 (OTP), §7.5 (welcome), and §7.6 (digest) copy is
 * confirmed (locked 2026-11-10). Business digest mail still sends only when
 * reminders are enabled.
 */
export const DIGEST_COPY_CONFIRMED: boolean = true;

export const REMINDERS_FROM = "ALane <reminders@alane.photography>";
export const REMINDERS_FROM_ADDRESS = "reminders@alane.photography";

/** Email closing window. The on-site homepage row stays at 60 days. */
export const DIGEST_CLOSING_DAYS = 14;
export const DIGEST_ITEM_CAP = 20;

export const OTP_TTL_MS = 10 * 60 * 1000;
export const OTP_COOLDOWN_MS = 60 * 1000;
export const OTP_MAX_SENDS_PER_HOUR = 5;
export const OTP_HOUR_MS = 60 * 60 * 1000;
export const OTP_MAX_WRONG = 5;
export const OTP_LOCK_MS = 15 * 60 * 1000;
export const PENDING_VERIFY_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const UNSUBSCRIBED_RETAIN_MS = 90 * 24 * 60 * 60 * 1000;

if (
  !REMINDERS_FROM.includes(REMINDERS_FROM_ADDRESS) ||
  REMINDERS_FROM.toLowerCase().includes("icloud")
) {
  throw new Error("reminders From address must be reminders@alane.photography");
}
