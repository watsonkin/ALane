import { getCloudflareContext } from "@opennextjs/cloudflare";
import { memoryMailer, resendMailer, type Mailer } from "@/lib/reminders/mailer";
import type { ReminderDeps } from "@/lib/reminders/service";
import type { SqlDatabase } from "@/lib/reminders/sql";

type BindingEnv = {
  REMINDERS_DB?: SqlDatabase;
  REMINDERS_ENABLED?: string;
  REMINDERS_MAIL_SINK?: string;
  RESEND_API_KEY?: string;
  REMINDERS_UNSUBSCRIBE_SECRET?: string;
  REMINDERS_CRON_SECRET?: string;
  SITE_ORIGIN?: string;
};

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function bindingsFrom(env: Record<string, unknown> | BindingEnv): BindingEnv {
  const record = env as Record<string, unknown>;
  return {
    REMINDERS_DB: record.REMINDERS_DB as SqlDatabase | undefined,
    REMINDERS_ENABLED: asString(record.REMINDERS_ENABLED),
    REMINDERS_MAIL_SINK: asString(record.REMINDERS_MAIL_SINK),
    RESEND_API_KEY: asString(record.RESEND_API_KEY),
    REMINDERS_UNSUBSCRIBE_SECRET: asString(record.REMINDERS_UNSUBSCRIBE_SECRET),
    REMINDERS_CRON_SECRET: asString(record.REMINDERS_CRON_SECRET),
    SITE_ORIGIN: asString(record.SITE_ORIGIN),
  };
}

export async function readBindings(): Promise<BindingEnv> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    return bindingsFrom(env as unknown as Record<string, unknown>);
  } catch {
    return bindingsFrom(process.env);
  }
}

export function siteOrigin(value: string | undefined): string {
  const raw = value?.trim() || "https://alane.photography";
  return raw.replace(/\/+$/, "");
}

export function buildMailer(bindings: BindingEnv): Mailer | null {
  if (process.env.NODE_ENV !== "production" && bindings.REMINDERS_MAIL_SINK === "memory") {
    return memoryMailer();
  }
  if (bindings.RESEND_API_KEY) return resendMailer(bindings.RESEND_API_KEY);
  return null;
}

export async function loadReminderDeps(): Promise<
  | { ok: true; deps: ReminderDeps; enabled: boolean; cronSecret: string }
  | { ok: false; enabled: boolean; cronSecret: string }
> {
  const bindings = await readBindings();
  const enabled = bindings.REMINDERS_ENABLED === "1";
  const cronSecret = bindings.REMINDERS_CRON_SECRET ?? "";
  if (!bindings.REMINDERS_DB) return { ok: false, enabled, cronSecret };
  return {
    ok: true,
    enabled,
    cronSecret,
    deps: {
      db: bindings.REMINDERS_DB,
      now: () => new Date(),
      secret: bindings.REMINDERS_UNSUBSCRIBE_SECRET ?? "",
      siteOrigin: siteOrigin(bindings.SITE_ORIGIN),
      mail: buildMailer(bindings),
      enabled,
    },
  };
}
