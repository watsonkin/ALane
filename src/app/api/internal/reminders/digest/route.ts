import { loadContests } from "@/lib/contests";
import { authorizeCron, json } from "@/lib/reminders/http";
import { openReminderDeps, runDailyDigest } from "@/lib/reminders/service";

export const dynamic = "force-dynamic";

/** Called by the Worker scheduled handler. Business digests stay off until copy is confirmed. */
export async function POST(request: Request) {
  const deps = await openReminderDeps();
  if (!authorizeCron(request, deps.env.REMINDERS_CRON_SECRET)) {
    return json({ ok: false, error: "unauthorized" }, 401);
  }
  if (!deps.store) return json({ ok: false, error: "no_database" }, 503);

  const contests = await loadContests();
  const report = await runDailyDigest({
    ...deps,
    store: deps.store,
    now: () => new Date(),
    contests,
  });
  return json({ ok: true, ...report });
}
