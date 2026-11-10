const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Lowercase mailbox, or null when the address is not usable as a key. */
export function normalizeEmail(raw: string): string | null {
  const email = raw.trim().toLowerCase();
  if (email.length > 254 || email.length < 3) return null;
  if (!EMAIL_PATTERN.test(email)) return null;
  return email;
}
