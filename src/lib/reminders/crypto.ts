import { normalizeEmail } from "@/lib/reminders/email";

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function base64UrlDecode(value: string): Uint8Array | null {
  if (!value || /[^A-Za-z0-9_-]/.test(value)) return null;
  const pad = value.length % 4 === 0 ? "" : "=".repeat(4 - (value.length % 4));
  try {
    const binary = atob(value.replaceAll("-", "+").replaceAll("_", "/") + pad);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

export function safeEqual(left: string, right: string): boolean {
  const a = new TextEncoder().encode(left);
  const b = new TextEncoder().encode(right);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i]! ^ b[i]!;
  return diff === 0;
}

async function hmacRaw(secret: string, message: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return new Uint8Array(sig);
}

export async function hashOtp(email: string, code: string, secret: string): Promise<string> {
  return base64UrlEncode(await hmacRaw(secret, `otp\n${email}\n${code}`));
}

export function generateOtpCode(): string {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return String(buf[0]! % 1_000_000).padStart(6, "0");
}

export async function signUnsubscribe(email: string, secret: string): Promise<string> {
  const payload = base64UrlEncode(new TextEncoder().encode(email));
  const sig = base64UrlEncode(await hmacRaw(secret, `unsub\n${payload}`));
  return `${payload}.${sig}`;
}

export async function readUnsubscribeToken(token: string, secret: string): Promise<string | null> {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  if (!payload || !sig || !secret) return null;
  const expected = base64UrlEncode(await hmacRaw(secret, `unsub\n${payload}`));
  if (!safeEqual(sig, expected)) return null;
  const bytes = base64UrlDecode(payload);
  if (!bytes) return null;
  return normalizeEmail(new TextDecoder().decode(bytes));
}

/** Compare secrets without leaking which one mismatched on length. */
export async function secretsMatch(provided: string, expected: string): Promise<boolean> {
  if (!expected) return false;
  const enc = new TextEncoder();
  const digest = async (value: string) =>
    new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(value)));
  const [left, right] = await Promise.all([digest(provided), digest(expected)]);
  let diff = 0;
  for (let i = 0; i < left.length; i++) diff |= left[i]! ^ right[i]!;
  return diff === 0;
}
