import { connection } from "next/server";
import { RemindersScreen } from "@/components/reminders-screen";
import type { Locale } from "@/lib/locale";
import { statusCopy } from "@/lib/reminders/copy";
import { loadReminderDeps } from "@/lib/reminders/env";
import { unsubscribeToken } from "@/lib/reminders/service";

export async function RemindersRoute({
  locale,
  searchParams,
}: {
  locale: Locale;
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  await connection();
  const query = await searchParams;
  const raw = query.token;
  const token = Array.isArray(raw) ? raw[0] : raw;
  const loaded = await loadReminderDeps();
  let notice: { tone: "ok" | "err"; text: string } | null = null;
  if (token) {
    if (!loaded.ok) {
      notice = { tone: "err", text: statusCopy(locale, "storage_unavailable") };
    } else {
      const outcome = await unsubscribeToken(loaded.deps, token);
      notice = {
        tone: outcome.code === "invalid_token" || !outcome.ok ? "err" : "ok",
        text: statusCopy(locale, outcome.code),
      };
    }
  }
  return <RemindersScreen locale={locale} enabled={loaded.enabled} notice={notice} />;
}
