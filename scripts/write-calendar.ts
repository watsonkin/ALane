import fs from "node:fs";
import path from "node:path";
import { contestsToIcs } from "../src/lib/contest-ics";
import { readContestsFromDisk } from "../src/lib/contest-files";

const contests = readContestsFromDisk();
const body = contestsToIcs(contests);
const calendarPath = path.join(process.cwd(), "public", "calendar.ics");
const snapshotPath = path.join(process.cwd(), "src", "generated", "contests.json");
fs.mkdirSync(path.dirname(calendarPath), { recursive: true });
fs.mkdirSync(path.dirname(snapshotPath), { recursive: true });
fs.writeFileSync(calendarPath, body);
fs.writeFileSync(snapshotPath, `${JSON.stringify(contests, null, 2)}\n`);

const events = body.split("BEGIN:VEVENT").length - 1;
if (contests.length > 0 && events === 0) {
  throw new Error("calendar.ics was written with contests but no events");
}

process.stdout.write(
  `wrote ${calendarPath} (${events} events) and ${snapshotPath} (${contests.length} contests)\n`,
);
