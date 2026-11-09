import {
  CODE_DIGITS,
  CODE_TTL_MS,
  HOUR_MS,
  LOCK_MS,
  MAX_SENDS_PER_HOUR,
  MAX_WRONG_ATTEMPTS,
  RESEND_COOLDOWN_MS,
} from "@/lib/reminders/constants";
import type { CodeRow } from "@/lib/reminders/store";

export type SendBlock = "locked" | "cooldown" | "rate_limited";

export type SendDecision =
  | { ok: true; sendCount: number; windowStartedAt: string }
  | { ok: false; error: SendBlock };

export type VerifyDecision =
  | { ok: true }
  | { ok: false; error: "locked" | "expired" | "incorrect"; next?: CodeRow };

export function randomSixDigitCode(): string {
  const limit = 10 ** CODE_DIGITS;
  const bucket = Math.floor(0x1_0000_0000 / limit) * limit;
  const buffer = new Uint32Array(1);
  for (;;) {
    crypto.getRandomValues(buffer);
    const value = buffer[0] ?? 0;
    if (value < bucket) return String(value % limit).padStart(CODE_DIGITS, "0");
  }
}

export function codeExpiresAt(nowMs: number): string {
  return new Date(nowMs + CODE_TTL_MS).toISOString();
}

/**
 * Same mailbox: 60s between sends, 5 sends per hour, and no send during a lock.
 * A rejected send does not consume the hourly budget.
 */
export function evaluateSend(row: CodeRow | null, nowMs: number): SendDecision {
  if (row?.locked_until && Date.parse(row.locked_until) > nowMs) {
    return { ok: false, error: "locked" };
  }
  if (row && nowMs - Date.parse(row.last_sent_at) < RESEND_COOLDOWN_MS) {
    return { ok: false, error: "cooldown" };
  }
  if (row && nowMs - Date.parse(row.send_window_started_at) < HOUR_MS) {
    if (row.send_count >= MAX_SENDS_PER_HOUR) {
      return { ok: false, error: "rate_limited" };
    }
    return {
      ok: true,
      sendCount: row.send_count + 1,
      windowStartedAt: row.send_window_started_at,
    };
  }
  return {
    ok: true,
    sendCount: 1,
    windowStartedAt: new Date(nowMs).toISOString(),
  };
}

/**
 * Five wrong codes lock the mailbox for 15 minutes.
 * The lock applies even when the latest guess is correct.
 * An expired lock starts the wrong-attempt count over.
 */
export function evaluateVerify(row: CodeRow | null, matches: boolean, nowMs: number): VerifyDecision {
  if (row?.locked_until && Date.parse(row.locked_until) > nowMs) {
    return { ok: false, error: "locked" };
  }
  if (!row || Date.parse(row.expires_at) <= nowMs) {
    return { ok: false, error: "expired" };
  }
  if (matches) return { ok: true };

  const priorAttempts =
    row.locked_until && Date.parse(row.locked_until) <= nowMs ? 0 : row.wrong_attempts;
  const wrongAttempts = priorAttempts + 1;
  if (wrongAttempts >= MAX_WRONG_ATTEMPTS) {
    return {
      ok: false,
      error: "locked",
      next: {
        ...row,
        wrong_attempts: wrongAttempts,
        locked_until: new Date(nowMs + LOCK_MS).toISOString(),
      },
    };
  }
  return {
    ok: false,
    error: "incorrect",
    next: { ...row, wrong_attempts: wrongAttempts, locked_until: null },
  };
}
