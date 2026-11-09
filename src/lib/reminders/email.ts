const EMAIL_PATTERN = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;

/** Lower-case mailbox, or null when it is not a single ordinary address. */
export function normalizeEmail(raw: string | null | undefined): string | null {
  if (typeof raw !== "string") return null;
  const email = raw.trim().toLowerCase();
  if (email.length < 3 || email.length > 254) return null;
  if (email.includes(" ") || email.includes("..")) return null;
  if (!EMAIL_PATTERN.test(email)) return null;
  return email;
}
