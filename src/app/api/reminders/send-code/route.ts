import { httpStatus } from "@/lib/reminders/codes";
import { loadReminderDeps } from "@/lib/reminders/env";
import { isSameOrigin, json, jsonCode, readJson, readString } from "@/lib/reminders/http";
import { sendCode } from "@/lib/reminders/service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonCode("forbidden", false);
  const loaded = await loadReminderDeps();
  if (!loaded.ok) return jsonCode("storage_unavailable", false);
  const body = await readJson(request);
  const outcome = await sendCode(loaded.deps, {
    email: readString(body, "email"),
    locale: readString(body, "locale"),
    consent: body?.consent === true,
  });
  return json({ ok: outcome.ok, code: outcome.code }, httpStatus(outcome.code));
}
