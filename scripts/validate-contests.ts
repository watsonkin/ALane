import fs from "node:fs";
import path from "node:path";
import { readContestsFromDisk } from "../src/lib/contest-files";
import { contestSchema, THUMB_MAX_EDGE } from "../src/lib/contest-schema";

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

const hotlinkThumb = contestSchema.safeParse({
  ...sample,
  gallery_works: [
    {
      source_page_url: "https://example.com/projects/1-work",
      thumb_path: "https://cdn.example.com/large.jpg",
      source_site_label: "Example",
    },
  ],
});
if (hotlinkThumb.success) {
  console.error("外链缩略图应该校验失败。");
  process.exit(1);
}

const indexWork = contestSchema.safeParse({
  ...sample,
  id: "lensculture-street",
  slug: "lensculture-street",
  gallery_works: [
    {
      source_page_url:
        "https://www.lensculture.com/photo-competitions/street-photography-awards/2025/winners",
      thumb_path: "thumbs/lensculture-street/tides-of-life.png",
      source_site_label: "LensCulture",
    },
  ],
});
if (indexWork.success) {
  console.error("获奖列表页不应当作单件作品页。");
  process.exit(1);
}

function imageSize(buf: Buffer): { width: number; height: number } {
  if (buf.length >= 24 && buf[0] === 0x89 && buf.toString("ascii", 1, 4) === "PNG") {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < buf.length) {
      if (buf[offset] !== 0xff) break;
      const marker = buf[offset + 1];
      const size = buf.readUInt16BE(offset + 2);
      if (marker >= 0xc0 && marker <= 0xc3) {
        return {
          height: buf.readUInt16BE(offset + 5),
          width: buf.readUInt16BE(offset + 7),
        };
      }
      offset += 2 + size;
    }
  }
  throw new Error("无法读取图片尺寸");
}

for (const contest of contests) {
  for (const work of contest.gallery_works) {
    if (!work.thumb_path) continue;
    const file = path.join(process.cwd(), "public", work.thumb_path);
    if (!fs.existsSync(file)) {
      console.error(`缺少缩略图文件：${work.thumb_path}`);
      process.exit(1);
    }
    const { width, height } = imageSize(fs.readFileSync(file));
    if (Math.max(width, height) > THUMB_MAX_EDGE) {
      console.error(`${work.thumb_path} 最长边 ${Math.max(width, height)} 超过 ${THUMB_MAX_EDGE}`);
      process.exit(1);
    }
  }
}

console.log(`validated ${contests.length} contests`);
for (const contest of contests) {
  console.log(`- ${contest.slug} [${contest.status}] ${contest.name}`);
}
