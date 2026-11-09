import { errorStatus, json, readJson } from "@/lib/reminders/http";
import { verifyBodySchema } from "@/lib/reminders/schema";
import { openReminderDeps, verifyCode } from "@/lib/reminders/service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const parsed = verifyBodySchema.safeParse(await readJson(request));
  if (!parsed.success) return json({ ok: false, error: "invalid_email" }, 400);

  const deps = await openReminderDeps();
  if (!deps.store) return json({ ok: false, error: "disabled" }, 503);
  const result = await verifyCode(
    { ...deps, store: deps.store, now: () => new Date() },
    parsed.data,
  );
  if (!result.ok) return json(result, errorStatus(result.error));
  return json(result);
}
