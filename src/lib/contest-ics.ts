import type { Contest } from "@/lib/contest-schema";

function icsEscape(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\n|\r/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function toIcsUtc(iso: string): string {
  const date = new Date(iso);
  const pad = (part: number) => String(part).padStart(2, "0");
  return (
    String(date.getUTCFullYear()) +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    "T" +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    "Z"
  );
}

function fold(line: string): string {
  const bytes = Buffer.from(line, "utf8");
  if (bytes.length <= 75) return line;
  const parts: string[] = [];
  let start = 0;
  while (start < bytes.length) {
    let end = Math.min(start + (start === 0 ? 75 : 74), bytes.length);
    while (end > start && (bytes[end] & 0xc0) === 0x80) end -= 1;
    parts.push(bytes.subarray(start, end).toString("utf8"));
    start = end;
  }
  return parts.join("\r\n ");
}

function eventWindow(contest: Contest): { start: string; end: string } | null {
  const start = contest.open_at ?? contest.deadline_at ?? contest.announce_at;
  if (!start) return null;
  const end = contest.deadline_at ?? contest.announce_at ?? start;
  if (Date.parse(end) > Date.parse(start)) return { start, end };
  const plusHour = new Date(Date.parse(start) + 60 * 60 * 1000).toISOString();
  return { start, end: plusHour };
}

/** Build a VCALENDAR from contests that have at least one timestamp. */
export function contestsToIcs(contests: Contest[], dtstamp = new Date()): string {
  const stamp = toIcsUtc(dtstamp.toISOString());
  const events = contests.flatMap((contest) => {
    const window = eventWindow(contest);
    if (!window) return [];
    const place = contest.online
      ? contest.geo
        ? `${contest.geo.label} / 线上`
        : "线上"
      : (contest.geo?.label ?? "");
    const description = [
      "ALane 索引条目，日期尚未逐条核验。",
      `状态：${contest.status}`,
      place ? `地点：${place}` : "",
      contest.official_url,
    ]
      .filter(Boolean)
      .join("\n");
    const lines = [
      "BEGIN:VEVENT",
      `UID:${contest.id}@alane`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${toIcsUtc(window.start)}`,
      `DTEND:${toIcsUtc(window.end)}`,
      `SUMMARY:${icsEscape(contest.name)}`,
      `DESCRIPTION:${icsEscape(description)}`,
      `URL:${icsEscape(contest.official_url)}`,
      "END:VEVENT",
    ];
    return lines.map(fold);
  });

  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//ALane//Contests//ZH", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", ...events, "END:VCALENDAR", ""].join("\r\n");
}
