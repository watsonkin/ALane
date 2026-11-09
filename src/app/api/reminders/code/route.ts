import { errorStatus, json, readJson } from "@/lib/reminders/http";
import { sendCodeBodySchema } from "@/lib/reminders/schema";
import { openReminderDeps, sendCode } from "@/lib/reminders/service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const parsed = sendCodeBodySchema.safeParse(await readJson(request));
  if (!parsed.success) {
    const path = parsed.error.issues[0]?.path[0];
    const error = path === "consent" ? "consent_required" : path === "locale" ? "invalid_locale" : "invalid_email";
    return json({ ok: false, error }, errorStatus(error));
  }

  const deps = await openReminderDeps();
  if (!deps.store) return json({ ok: false, error: "disabled" }, 503);
  const result = await sendCode(
    { ...deps, store: deps.store, now: () => new Date() },
    parsed.data,
  );
  if (!result.ok) return json(result, errorStatus(result.error));
  return json(result);
}
