import { loadContests } from "@/lib/contests";
import { secretsMatch } from "@/lib/reminders/crypto";
import { loadReminderDeps } from "@/lib/reminders/env";
import { json, jsonCode } from "@/lib/reminders/http";
import { runDigest } from "@/lib/reminders/service";

export const dynamic = "force-dynamic";

/**
 * Daily scan entry. Digest mail uses the confirmed §7.6 copy only when
 * REMINDERS_ENABLED is "1". Production leaves that switch at "0".
 */
export async function POST(request: Request) {
  const loaded = await loadReminderDeps();
  const provided = request.headers.get("x-alane-cron-secret") ?? "";
  if (!(await secretsMatch(provided, loaded.cronSecret))) return jsonCode("forbidden", false);
  if (!loaded.ok) return jsonCode("storage_unavailable", false);
  const contests = await loadContests();
  const outcome = await runDigest(loaded.deps, contests);
  return json({ ok: true, ...outcome });
}
