import fs from "node:fs";
import path from "node:path";
import { parse } from "yaml";
import { ZodError } from "zod";
import { contestSchema, type Contest } from "@/lib/contest-schema";

const STATUS_RANK: Record<Contest["status"], number> = {
  published: 0,
  draft: 1,
  archived: 2,
};

function formatZodError(error: ZodError): string {
  return error.issues
    .map((issue) => {
      const at = issue.path.length > 0 ? issue.path.join(".") : "(root)";
      return `- ${at}: ${issue.message}`;
    })
    .join("\n");
}

function assertUnique(contests: Contest[]): void {
  const seenIds = new Set<string>();
  const seenSlugs = new Set<string>();

  for (const contest of contests) {
    if (seenIds.has(contest.id)) {
      throw new Error(`重复的 contest id：${contest.id}`);
    }
    if (seenSlugs.has(contest.slug)) {
      throw new Error(`重复的 contest slug：${contest.slug}`);
    }
    seenIds.add(contest.id);
    seenSlugs.add(contest.slug);
  }
}

export function sortContests(contests: Contest[]): Contest[] {
  return [...contests].sort((a, b) => {
    const byStatus = STATUS_RANK[a.status] - STATUS_RANK[b.status];
    if (byStatus !== 0) return byStatus;

    if (a.deadline_at === b.deadline_at) return a.name.localeCompare(b.name, "zh");
    if (a.deadline_at === null) return 1;
    if (b.deadline_at === null) return -1;
    return a.deadline_at.localeCompare(b.deadline_at);
  });
}

/**
 * Read and validate every contest YAML file.
 * Uses the YAML 1.2 core schema so timestamps stay strings for Zod.
 * Throws on the first broken file so a bad edit fails CI and `next build`.
 */
export function readContestsFromDisk(): Contest[] {
  const dir = path.join(process.cwd(), "data", "contests");
  if (!fs.existsSync(dir)) return [];

  const files = fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(".yaml") || name.endsWith(".yml"))
    .sort();

  const contests = files.map((name) => {
    const raw = fs.readFileSync(
      path.join(process.cwd(), "data", "contests", name),
      "utf8",
    );
    let data: unknown;
    try {
      data = parse(raw, { schema: "core" });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`无法解析 ${name}：${message}`);
    }

    const result = contestSchema.safeParse(data);
    if (!result.success) {
      throw new Error(
        `赛事 YAML 未通过校验 ${name}：\n${formatZodError(result.error)}`,
      );
    }
    return result.data;
  });

  assertUnique(contests);
  return sortContests(contests);
}
