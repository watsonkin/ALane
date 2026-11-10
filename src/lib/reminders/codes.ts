export const REMINDER_CODES = [
  "sent",
  "cooldown",
  "expired",
  "incorrect",
  "locked",
  "rate_limited",
  "subscribed",
  "subscribed_welcome_failed",
  "already_subscribed",
  "locale_updated",
  "unsubscribed",
  "invalid_token",
  "consent_required",
  "invalid_email",
  "invalid_locale",
  "invalid_code",
  "disabled",
  "mail_not_configured",
  "mail_failed",
  "storage_unavailable",
  "forbidden",
] as const;

export type ReminderCode = (typeof REMINDER_CODES)[number];

export type ReminderResult = { ok: boolean; code: ReminderCode };

export function httpStatus(code: ReminderCode): number {
  switch (code) {
    case "sent":
    case "subscribed":
    case "subscribed_welcome_failed":
    case "already_subscribed":
    case "locale_updated":
    case "unsubscribed":
      return 200;
    case "cooldown":
    case "rate_limited":
    case "locked":
      return 429;
    case "mail_not_configured":
    case "mail_failed":
    case "storage_unavailable":
      return 503;
    case "disabled":
    case "forbidden":
      return 403;
    default:
      return 400;
  }
}
