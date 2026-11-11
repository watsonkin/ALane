/** Non-identifying count of contest-detail clicks through to an organizer site. */

export const OFFICIAL_SITE_OUTBOUND = "official_site_outbound";

export const OFFICIAL_SITE_OUTBOUND_PATH = "/api/ops/outbound";

const EXACT_BODY = `{"event":"${OFFICIAL_SITE_OUTBOUND}"}`;

const MAX_BODY_CHARS = 200;

const NO_STORE = { "cache-control": "no-store" };

export type OutboundPoint = {
  blobs: string[];
  indexes: string[];
  doubles: number[];
};

export type OutboundWrite = {
  writeDataPoint(point: OutboundPoint): void;
};

export function outboundPoint(): OutboundPoint {
  return {
    blobs: [OFFICIAL_SITE_OUTBOUND],
    indexes: [OFFICIAL_SITE_OUTBOUND],
    doubles: [1],
  };
}

export function officialSiteOutboundInit(): RequestInit {
  return {
    method: "POST",
    credentials: "omit",
    keepalive: true,
    cache: "no-store",
    referrerPolicy: "no-referrer",
    headers: { "content-type": "application/json" },
    body: EXACT_BODY,
  };
}

/** Fire-and-forget. Ignores the click event so the href is never copied into the count. */
export function reportOfficialSiteOutbound(): void {
  try {
    void fetch(OFFICIAL_SITE_OUTBOUND_PATH, officialSiteOutboundInit()).catch(() => {});
  } catch {
    // Counting is optional. The official-site navigation still proceeds.
  }
}

async function readExactBody(request: Request): Promise<boolean> {
  const type = (request.headers.get("content-type") ?? "").split(";")[0]?.trim().toLowerCase();
  if (type !== "application/json") return false;
  const declared = request.headers.get("content-length");
  if (declared !== null && Number(declared) > MAX_BODY_CHARS) return false;
  let text: string;
  try {
    text = await request.text();
  } catch {
    return false;
  }
  if (text.length > MAX_BODY_CHARS) return false;
  try {
    const parsed: unknown = JSON.parse(text);
    return JSON.stringify(parsed) === EXACT_BODY;
  } catch {
    return false;
  }
}

export async function handleOfficialSiteOutbound(
  request: Request,
  write: OutboundWrite | null,
): Promise<Response> {
  if (request.method !== "POST") {
    return new Response(null, { status: 405, headers: { ...NO_STORE, allow: "POST" } });
  }
  let url: URL;
  try {
    url = new URL(request.url);
  } catch {
    return new Response(null, { status: 400, headers: NO_STORE });
  }
  if (request.url.includes("?") || url.search !== "") {
    return new Response(null, { status: 400, headers: NO_STORE });
  }
  const accepted = await readExactBody(request);
  if (!accepted) {
    return new Response(null, { status: 400, headers: NO_STORE });
  }
  if (write) write.writeDataPoint(outboundPoint());
  return new Response(null, { status: 204, headers: NO_STORE });
}
