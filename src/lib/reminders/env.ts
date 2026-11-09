import { getCloudflareContext } from "@opennextjs/cloudflare";
import {
  DEFAULT_PUBLIC_ORIGIN,
  DIGEST_COPY_CONFIRMED,
  SUBSCRIBER_MAIL_COPY_CONFIRMED,
} from "@/lib/reminders/constants";
import type { RemindersD1 } from "@/lib/reminders/store";
import { digestTemplate, otpTemplate } from "@/lib/reminders/templates";

export type RemindersEnv = {
  REMINDERS_ENABLED?: string;
  RESEND_API_KEY?: string;
  REMINDERS_UNSUBSCRIBE_SECRET?: string;
  REMINDERS_CRON_SECRET?: string;
  REMINDERS_PUBLIC_ORIGIN?: string;
  REMINDERS_DB?: RemindersD1;
};

declare global {
  interface CloudflareEnv {
    REMINDERS_ENABLED?: string;
    RESEND_API_KEY?: string;
    REMINDERS_UNSUBSCRIBE_SECRET?: string;
    REMINDERS_CRON_SECRET?: string;
    REMINDERS_PUBLIC_ORIGIN?: string;
    REMINDERS_DB?: RemindersD1;
  }
}

export function isRemindersEnabled(env: Pick<RemindersEnv, "REMINDERS_ENABLED">): boolean {
  return env.REMINDERS_ENABLED === "1";
}

/** OTP and welcome cannot leave the worker until Watson confirms §7.4 and §7.5. */
export function subscriberMailAllowed(env: RemindersEnv): boolean {
  const template = otpTemplate("000000");
  return (
    SUBSCRIBER_MAIL_COPY_CONFIRMED &&
    template.placeholder === false &&
    isRemindersEnabled(env) &&
    Boolean(env.RESEND_API_KEY) &&
    Boolean(env.REMINDERS_UNSUBSCRIBE_SECRET)
  );
}

/** Business digests stay off while §7.6 is unconfirmed, even if the env flag is on. */
export function businessDigestAllowed(env: RemindersEnv): boolean {
  const template = digestTemplate("en", []);
  return DIGEST_COPY_CONFIRMED && template.placeholder === false && isRemindersEnabled(env);
}

export function publicOrigin(env: Pick<RemindersEnv, "REMINDERS_PUBLIC_ORIGIN">): string {
  const raw = env.REMINDERS_PUBLIC_ORIGIN?.trim() || DEFAULT_PUBLIC_ORIGIN;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" && url.protocol !== "http:") return DEFAULT_PUBLIC_ORIGIN;
    return url.origin;
  } catch {
    return DEFAULT_PUBLIC_ORIGIN;
  }
}

export async function readRemindersEnv(): Promise<RemindersEnv> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    return env;
  } catch {
    return { REMINDERS_ENABLED: "0" };
  }
}
