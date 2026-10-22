import { contestCalendarResponse } from "@/lib/contest-calendar-response";
import { contestStaticParams } from "@/lib/contests";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return contestStaticParams();
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  return contestCalendarResponse(slug);
}
