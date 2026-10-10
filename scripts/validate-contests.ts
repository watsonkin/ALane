import { readContestsFromDisk } from "../src/lib/contest-files";
import { contestSchema } from "../src/lib/contest-schema";

const contests = readContestsFromDisk();

if (contests.length < 1) {
  console.error("data/contests 里至少要有一条通过校验的赛事。");
  process.exit(1);
}

const sample = contests[0];

const invertedDeadline = contestSchema.safeParse({
  ...sample,
  open_at: "2026-08-01T00:00:00+08:00",
  deadline_at: "2026-01-01T00:00:00+08:00",
});
if (invertedDeadline.success) {
  console.error("deadline_at 早于 open_at 时应该校验失败。");
  process.exit(1);
}

const missingGeo = contestSchema.safeParse({
  ...sample,
  online: false,
  geo: null,
});
if (missingGeo.success) {
  console.error("非线上赛事缺少 geo 时应该校验失败。");
  process.exit(1);
}

const unknownField = contestSchema.safeParse({
  ...sample,
  not_a_field: true,
});
if (unknownField.success) {
  console.error("未知字段应该校验失败。");
  process.exit(1);
}

console.log(`validated ${contests.length} contests`);
for (const contest of contests) {
  console.log(`- ${contest.slug} [${contest.status}] ${contest.name}`);
}
