import { NextResponse } from "next/server";
import { httpStatus, type ReminderCode } from "@/lib/reminders/codes";

export function json(body: unknown, status = 200): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: { "cache-control": "no-store" },
  });
}

export function jsonCode(code: ReminderCode, ok: boolean): NextResponse {
  return json({ ok, code }, httpStatus(code));
}

export async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  const type = request.headers.get("content-type") ?? "";
  if (!type.includes("application/json")) return null;
  try {
    const value: unknown = await request.json();
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    return value as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function readString(body: Record<string, unknown> | null, key: string): string {
  const value = body?.[key];
  return typeof value === "string" ? value : "";
}

export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    return false;
  }
  // Next dev binds 0.0.0.0, so request.url's host can differ from the browser Host.
  const host = request.headers.get("host") ?? request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  if (host && originHost === host) return true;
  try {
    return originHost === new URL(request.url).host;
  } catch {
    return false;
  }
}
