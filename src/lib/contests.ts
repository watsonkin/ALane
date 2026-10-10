import snapshot from "@/generated/contests.json";
import { readContestsFromDisk } from "@/lib/contest-files";
import { contestSchema, type Contest } from "@/lib/contest-schema";

/**
 * Production and the Worker use this snapshot. `prebuild` rewrites it from
 * `data/contests` before `next build`, so the Worker does not read YAML off
 * a filesystem it does not have.
 */
const bundledContests: Contest[] = contestSchema.array().parse(snapshot);

function contestsForThisProcess(): Contest[] {
  if (process.env.NODE_ENV === "development") {
    return readContestsFromDisk();
  }
  return bundledContests;
}

export async function loadContests(): Promise<Contest[]> {
  return contestsForThisProcess();
}

export function contestStaticParams(): { slug: string }[] {
  return contestsForThisProcess().map((contest) => ({ slug: contest.slug }));
}

export async function loadContestBySlug(slug: string): Promise<Contest | null> {
  const contests = await loadContests();
  return contests.find((contest) => contest.slug === slug) ?? null;
}
