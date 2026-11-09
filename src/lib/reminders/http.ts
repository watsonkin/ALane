import { safeEqual } from "@/lib/reminders/crypto";
import { reminderCopy } from "@/lib/reminders/copy";

export function json(body: unknown, status = 200): Response {
  return Response.json(body, {
    status,
    headers: { "cache-control": "no-store" },
  });
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export function errorStatus(error: string): number {
  switch (error) {
    case "disabled":
    case "no_database":
      return 503;
    case "cooldown":
    case "rate_limited":
    case "locked":
      return 429;
    case "unauthorized":
      return 401;
    default:
      return 400;
  }
}

export function authorizeCron(request: Request, secret: string | undefined): boolean {
  if (!secret) return false;
  const header = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(\S+)\s*$/i.exec(header);
  if (!match?.[1]) return false;
  return safeEqual(match[1], secret);
}

/** Static bilingual page. No request data is interpolated. */
export function unsubscribePage(ok: boolean): Response {
  const zh = reminderCopy("zh-CN");
  const en = reminderCopy("en");
  const title = "ALane";
  const english = ok ? en.unsubscribed : "This unsubscribe link is not valid. Enter your email on the alerts page.";
  const chinese = ok ? zh.unsubscribed : "这个退订链接无效。请到邮件提醒页输入邮箱退订。";
  const html = `<!doctype html>
<html lang="zh-CN">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<main>
<p>${chinese}</p>
<p>${english}</p>
<p><a href="/reminders">${zh.link}</a> · <a href="/en/reminders">${en.link}</a></p>
</main>
`;
  return new Response(html, {
    status: ok ? 200 : 400,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}
