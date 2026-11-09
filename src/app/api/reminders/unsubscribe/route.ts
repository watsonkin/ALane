import { errorStatus, json, readJson, unsubscribePage } from "@/lib/reminders/http";
import { unsubscribeBodySchema } from "@/lib/reminders/schema";
import { openReminderDeps, unsubscribeEmail, unsubscribeWithToken } from "@/lib/reminders/service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const parsed = unsubscribeBodySchema.safeParse(await readJson(request));
  if (!parsed.success) return json({ ok: false, error: "invalid_email" }, 400);

  const deps = await openReminderDeps();
  if (!deps.store) return json({ ok: false, error: "disabled" }, 503);
  const result = await unsubscribeEmail(
    { ...deps, store: deps.store, now: () => new Date() },
    parsed.data.email,
  );
  if (!result.ok) return json(result, errorStatus(result.error));
  return json(result);
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const deps = await openReminderDeps();
  if (!deps.store || !token) return unsubscribePage(false);
  const result = await unsubscribeWithToken(
    { ...deps, store: deps.store, now: () => new Date() },
    token,
  );
  return unsubscribePage(result.ok);
}
