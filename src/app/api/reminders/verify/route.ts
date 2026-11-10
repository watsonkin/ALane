import { httpStatus } from "@/lib/reminders/codes";
import { loadReminderDeps } from "@/lib/reminders/env";
import { isSameOrigin, json, jsonCode, readJson, readString } from "@/lib/reminders/http";
import { verifyCode } from "@/lib/reminders/service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonCode("forbidden", false);
  const loaded = await loadReminderDeps();
  if (!loaded.ok) return jsonCode("storage_unavailable", false);
  const body = await readJson(request);
  const outcome = await verifyCode(loaded.deps, {
    email: readString(body, "email"),
    code: readString(body, "code"),
    locale: readString(body, "locale"),
  });
  return json({ ok: outcome.ok, code: outcome.code }, httpStatus(outcome.code));
}
