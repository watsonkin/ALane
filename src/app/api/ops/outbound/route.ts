import { getCloudflareContext } from "@opennextjs/cloudflare";
import { handleOfficialSiteOutbound, type OutboundWrite } from "@/lib/ops-analytics";

export const dynamic = "force-dynamic";

function asOutboundWrite(value: unknown): OutboundWrite | null {
  if (!value || typeof value !== "object") return null;
  if (typeof (value as { writeDataPoint?: unknown }).writeDataPoint !== "function") return null;
  return value as OutboundWrite;
}

async function readOutboundClicks(): Promise<OutboundWrite | null> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    return asOutboundWrite((env as unknown as Record<string, unknown>).OUTBOUND_CLICKS);
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  return handleOfficialSiteOutbound(request, await readOutboundClicks());
}
