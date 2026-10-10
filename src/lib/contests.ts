import { cacheLife } from "next/cache";
import { readContestsFromDisk } from "@/lib/contest-files";
import type { Contest } from "@/lib/contest-schema";

/**
 * Build-time read of the Git CMS. `cacheLife("max")` keeps the pages static
 * until the next deploy, which is when YAML changes land.
 */
export async function loadContests(): Promise<Contest[]> {
  "use cache";
  cacheLife("max");
  return readContestsFromDisk();
}

export async function loadContestBySlug(slug: string): Promise<Contest | null> {
  const contests = await loadContests();
  return contests.find((contest) => contest.slug === slug) ?? null;
}
