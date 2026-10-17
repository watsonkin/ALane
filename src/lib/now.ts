/** How often an open page re-reads the clock. */
export const NOW_TICK_MS = 60_000;

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

/**
 * `?now=` is a debug clock for dev, loopback, and `*.workers.dev` preview.
 * OpenNext sets production `NODE_ENV` on the workers.dev preview, so the host
 * is part of the allowlist. Any other public hostname ignores the parameter.
 */
export function debugNowAllowed(nodeEnv: string | undefined, hostname?: string): boolean {
  if (nodeEnv !== "production") return true;
  if (!hostname) return false;
  const host = hostname.trim().toLowerCase().replace(/\.$/, "");
  if (LOOPBACK_HOSTS.has(host)) return true;
  return host.endsWith(".workers.dev");
}

/** Accept a raw `?now=` value, including a `+` offset that arrived as a space. */
export function parseDebugNow(raw: string): number | null {
  const trimmed = raw.trim();
  const candidates = [
    trimmed,
    trimmed.replace(/ (\d{2}:\d{2}(?::\d{2})?)$/, "+$1"),
  ];
  for (const candidate of candidates) {
    const parsed = Date.parse(candidate);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

/**
 * Instant used after hydration.
 * An allowed, parseable `?now=` wins; anything else uses `nowMs` (the device clock).
 */
export function readNowMs(options: {
  nowMs: number;
  search: string;
  nodeEnv: string | undefined;
  hostname?: string;
}): number {
  if (!debugNowAllowed(options.nodeEnv, options.hostname)) return options.nowMs;
  const query = options.search.startsWith("?") ? options.search.slice(1) : options.search;
  const raw = new URLSearchParams(query).get("now");
  if (!raw) return options.nowMs;
  return parseDebugNow(raw) ?? options.nowMs;
}
