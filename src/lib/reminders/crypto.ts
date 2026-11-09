function bytesToHex(bytes: Uint8Array): string {
  let hex = "";
  for (const byte of bytes) hex += byte.toString(16).padStart(2, "0");
  return hex;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) return null;
  const pad = (4 - (value.length % 4)) % 4;
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/") + "=".repeat(pad);
  try {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  } catch {
    return null;
  }
}

export function safeEqual(left: string, right: string): boolean {
  const a = new TextEncoder().encode(left);
  const b = new TextEncoder().encode(right);
  const length = Math.max(a.length, b.length);
  let diff = a.length === b.length ? 0 : 1;
  for (let index = 0; index < length; index += 1) {
    diff |= (a[index] ?? 0) ^ (b[index] ?? 0);
  }
  return diff === 0;
}

/** One-way code hash. The plaintext code is never stored. */
export async function hashVerificationCode(code: string, secret: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`alane-reminder-code:${secret}:${code}`),
  );
  return bytesToHex(new Uint8Array(digest));
}

async function hmacSha256(secret: string, message: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return new Uint8Array(signature);
}

/** Signed unsubscribe token. The link works once the row leaves `active`. */
export async function createUnsubscribeToken(email: string, secret: string): Promise<string> {
  const emailBytes = new TextEncoder().encode(email);
  const signature = await hmacSha256(secret, `unsubscribe:${email}`);
  return `${bytesToBase64Url(emailBytes)}.${bytesToBase64Url(signature)}`;
}

export async function readUnsubscribeToken(token: string, secret: string): Promise<string | null> {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const emailBytes = base64UrlToBytes(parts[0] ?? "");
  if (!emailBytes) return null;
  const email = new TextDecoder().decode(emailBytes);
  const expected = await createUnsubscribeToken(email, secret);
  if (!safeEqual(expected, token)) return null;
  return email;
}
