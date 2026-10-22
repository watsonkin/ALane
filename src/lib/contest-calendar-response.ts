import { calendarOmitReason, contestsToIcs } from "@/lib/contest-ics";
import { loadContestBySlug } from "@/lib/contests";

/** One contest as an .ics download. Contests with no timestamp are not a calendar entry. */
export async function contestCalendarResponse(slug: string): Promise<Response> {
  const contest = await loadContestBySlug(slug);
  if (!contest || calendarOmitReason(contest)) {
    return new Response("Not found", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
  return new Response(contestsToIcs([contest]), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${contest.slug}.ics"`,
    },
  });
}
