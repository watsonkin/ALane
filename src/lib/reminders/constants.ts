/** Locked product values for PR-SUBSCRIBE-01. Email body copy is not confirmed. */

export const REMINDERS_FROM = "ALane <reminders@alane.photography>";

export const CODE_DIGITS = 6;
export const CODE_TTL_MS = 10 * 60 * 1000;
export const RESEND_COOLDOWN_MS = 60 * 1000;
export const MAX_SENDS_PER_HOUR = 5;
export const HOUR_MS = 60 * 60 * 1000;
export const MAX_WRONG_ATTEMPTS = 5;
export const LOCK_MS = 15 * 60 * 1000;

/** Digest closing window. The homepage「即将截止」module stays on its own 60-day row. */
export const DIGEST_CLOSING_DAYS = 14;
export const DIGEST_ITEM_CAP = 20;
export const PENDING_PURGE_MS = 7 * 24 * 60 * 60 * 1000;
export const UNSUBSCRIBE_RETAIN_MS = 90 * 24 * 60 * 60 * 1000;

/**
 * Watson has not confirmed §7.6. The daily cron must not send business digests.
 * This is a code constant, not an env flag, so dashboard toggles cannot override it.
 */
export const DIGEST_COPY_CONFIRMED = false;

/** Watson has not confirmed §7.4 or §7.5. OTP and welcome mail stay off. */
export const SUBSCRIBER_MAIL_COPY_CONFIRMED = false;

export const DIGEST_PATH = "/api/internal/reminders/digest";
export const DEFAULT_PUBLIC_ORIGIN = "https://alane.photography";
export const CORRECTIONS_MAILBOX = "AlaneStreetPhotos@icloud.com";
