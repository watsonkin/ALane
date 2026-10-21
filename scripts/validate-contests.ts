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

const hotlinkIcon = contestSchema.safeParse({
  ...sample,
  organizer_icon: "https://cdn.example.com/logo.svg",
});
if (hotlinkIcon.success) {
  console.error("外链主办方 icon 应该校验失败。");
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

function expectFail(
  result: ReturnType<typeof contestSchema.safeParse>,
  needle: string,
  label: string,
) {
  if (result.success) {
    console.error(label);
    process.exit(1);
  }
  const blob = JSON.stringify(result.error.issues);
  if (!blob.includes(needle)) {
    console.error(label);
    console.error(blob);
    process.exit(1);
  }
}

const workPage = {
  source_page_url: "https://example.com/projects/1-work",
  title: "Tides of Life",
  author_name: "张三",
  author_name_en: "San Zhang",
  source_site_label: "Example",
};

expectFail(
  contestSchema.safeParse({
    ...sample,
    social: { facebook: "https://www.facebook.com/example" },
  }),
  "facebook",
  "未知主办社交平台应该校验失败。",
);

expectFail(
  contestSchema.safeParse({
    ...sample,
    gallery_works: [{ ...workPage, social: { tiktok: "https://www.tiktok.com/@example" } }],
  }),
  "tiktok",
  "未知获奖者社交平台应该校验失败。",
);

expectFail(
  contestSchema.safeParse({
    ...sample,
    social: {},
  }),
  "空对象",
  "空的主办 social 对象应该校验失败。",
);

expectFail(
  contestSchema.safeParse({
    ...sample,
    gallery_works: [{ ...workPage, social: {} }],
  }),
  "空对象",
  "空的获奖者 social 对象应该校验失败。",
);

expectFail(
  contestSchema.safeParse({
    ...sample,
    social: {
      wechat_oa: {
        name: "街拍视界",
        qr_path: "https://cdn.example.com/qr.png",
      },
    },
  }),
  "qr_path",
  "外链微信二维码应该校验失败。",
);

expectFail(
  contestSchema.safeParse({
    ...sample,
    social: {
      wechat_oa: {
        name: "街拍视界",
        qr_path: "/icons/organizers/lensculture-street.png",
      },
    },
  }),
  "qr_path",
  "错误目录的微信二维码应该校验失败。",
);

const validSocial = contestSchema.safeParse({
  ...sample,
  social: {
    instagram: "https://www.instagram.com/lensculture",
    x: "https://x.com/lensculture",
    wechat_oa: {
      name: "街拍视界",
      qr_path: "/icons/wechat/jiepai-shijie.png",
    },
  },
  gallery_works: [
    {
      ...workPage,
      social: {
        instagram: "https://www.instagram.com/example/",
        x: "https://x.com/example",
        website: "https://example.com/photographer",
      },
    },
  ],
});
if (!validSocial.success) {
  console.error("合法的主办与获奖者社交应该通过校验。");
  console.error(JSON.stringify(validSocial.error.issues));
  process.exit(1);
}
if (
  validSocial.data.social?.instagram !== "https://www.instagram.com/lensculture" ||
  validSocial.data.social.x !== "https://x.com/lensculture" ||
  validSocial.data.social.wechat_oa?.name !== "街拍视界" ||
  validSocial.data.social.wechat_oa.qr_path !== "/icons/wechat/jiepai-shijie.png" ||
  validSocial.data.gallery_works[0]?.social?.website !== "https://example.com/photographer" ||
  validSocial.data.gallery_works[0]?.author_name_en !== "San Zhang"
) {
  console.error("合法社交字段不应该在校验后被丢掉。");
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
  if (contest.organizer_icon) {
    const iconRel = contest.organizer_icon.replace(/^\//, "");
    const iconFile = path.join(process.cwd(), "public", iconRel);
    if (!fs.existsSync(iconFile)) {
      console.error(`缺少主办方 icon：${contest.organizer_icon}`);
      process.exit(1);
    }
    if (iconFile.endsWith(".svg")) {
      const svg = fs.readFileSync(iconFile, "utf8");
      if (/<image[\s>]/.test(svg) || /(?:xlink:)?href\s*=\s*["']https?:/i.test(svg)) {
        console.error(`${contest.organizer_icon} 不能引用外站图片`);
        process.exit(1);
      }
    } else {
      const { width, height } = imageSize(fs.readFileSync(iconFile));
      if (Math.max(width, height) > THUMB_MAX_EDGE) {
        console.error(`${contest.organizer_icon} 最长边超过 ${THUMB_MAX_EDGE}`);
        process.exit(1);
      }
    }
  }

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
