import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PrivacyScreen } from "@/components/legal-screen";

function visible(html: string): string {
  return html.replace(/<[^>]+>/g, "");
}

test("privacy copy discloses analytics and outbound counts without the weekly brief", () => {
  const zhHtml = renderToStaticMarkup(createElement(PrivacyScreen, { locale: "zh-CN" }));
  const enHtml = renderToStaticMarkup(createElement(PrivacyScreen, { locale: "en" }));
  const zh = visible(zhHtml);
  const en = visible(enHtml);

  assert.ok(
    zh.includes(
      "浏览统计：本站在网页中使用 Cloudflare Web Analytics 官方脚本，用于了解访问量、热门页面、来源、大致地区，以及设备/浏览器与页面性能。该脚本不设统计 Cookie，也不使用 localStorage 等浏览器存储做统计；不加在日历订阅文件（/calendar.ics）中。该统计不用于营销画像，不与订阅邮箱或可识别个人的信息打通。",
    ),
  );
  assert.ok(
    zh.includes(
      "官网外链点击：若您从赛事详情页点击前往主办方官网（例如查看报名或规则），我们可能做无身份计数，只记录事件类型与次数，不记录邮箱或其他可识别个人的信息，也不与订阅名单或浏览行为打通。",
    ),
  );
  assert.ok(zh.includes("该平台日志有别于第 1 节所述的 Cloudflare Web Analytics 浏览统计。"));
  assert.ok(zh.includes("不接 Google Analytics、广告像素、热力图或会话回放。"));
  assert.ok(zh.includes("不在邮件中加入打开或点击追踪像素。"));
  assert.ok(zh.includes("不把浏览统计或外链点击与订阅邮箱打通。"));
  assert.ok(zh.indexOf("alane_locale") < zh.indexOf("浏览统计："));
  assert.ok(zh.indexOf("浏览统计：") < zh.indexOf("官网外链点击："));
  assert.ok(zh.indexOf("官网外链点击：") < zh.indexOf("您若主动发邮件至"));
  assert.ok(zh.includes("邮件发送经专业发信服务商 Resend 处理，限于投递验证码、欢迎信与上述三类摘要。"));

  assert.ok(
    en.includes(
      "Site analytics: On web pages, we use the official Cloudflare Web Analytics script to understand visits, popular pages, referrers, coarse region, and device / browser and page performance. The script does not set analytics cookies and does not use localStorage or similar browser storage for analytics. It is not added to the calendar file (/calendar.ics). These analytics are not used for marketing profiles and are not linked to subscriber emails or other information that identifies you.",
    ),
  );
  assert.ok(
    en.includes(
      "Official-site outbound clicks: If you click through from a contest detail page to an organizer’s site (for example to enter or read the rules), we may keep a non-identifying count of the event type and how often it happens. We do not record email addresses or other information that identifies you, and we do not link these counts to the subscriber list or to your browsing.",
    ),
  );
  assert.ok(en.includes("Those platform logs are distinct from the Cloudflare Web Analytics described in section 1."));
  assert.ok(en.includes("We do not use Google Analytics, advertising pixels, heatmaps, or session replay."));
  assert.ok(en.includes("We do not add open- or click-tracking pixels to email."));
  assert.ok(en.includes("We do not link site analytics or outbound-click counts to subscriber emails."));
  assert.ok(en.indexOf("alane_locale") < en.indexOf("Site analytics:"));
  assert.ok(en.indexOf("Site analytics:") < en.indexOf("Official-site outbound clicks:"));
  assert.ok(en.indexOf("Official-site outbound clicks:") < en.indexOf("If you email"));
  assert.ok(
    en.includes(
      "Outbound mail is processed by Resend, limited to verification codes, the welcome message, and the three digest types above.",
    ),
  );

  for (const text of [zh, en, zhHtml, enHtml]) {
    assert.equal(text.includes("每周"), false);
    assert.equal(text.toLowerCase().includes("weekly"), false);
    assert.equal(text.includes("内部简报"), false);
    assert.equal(text.toLowerCase().includes("internal brief"), false);
    assert.equal(text.includes("workers.dev"), false);
  }

  const source = readFileSync(new URL("../components/legal-screen.tsx", import.meta.url), "utf8");
  const zhBullet = source.slice(source.indexOf("浏览统计："), source.indexOf("官网外链点击："));
  const enBullet = source.slice(source.indexOf("Site analytics:"), source.indexOf("Official-site outbound clicks:"));
  assert.equal(zhBullet.includes("<strong>"), false);
  assert.equal(enBullet.includes("<strong>"), false);
});
