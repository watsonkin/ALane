import { displayEdition, displayName } from "@/lib/contest-labels";
import type { Locale } from "@/lib/locale";
import type { Contest } from "@/lib/contest-schema";
import type { DigestItem } from "@/lib/reminders/digest";

/**
 * Confirmed mail copy from PR-SUBSCRIBE-01 §7.4 (OTP), §7.5 (welcome),
 * and §7.6 (digest), locked 2026-11-10. Text and links only — no images.
 * OTP is transactional and has no calendar, corrections, or unsubscribe
 * footer. Welcome and digest append that weak footer after the body.
 * The digest footer also keeps a one-click unsubscribe. None of these
 * messages include a privacy URL.
 */
const DEFAULT_SITE_ORIGIN = "https://alane.photography";
const CORRECTIONS_EMAIL = "AlaneStreetPhotos@icloud.com";

function oneLine(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

export function shanghaiDate(now: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function homeUrl(origin: string | undefined, locale: Locale): string {
  const base = (origin?.trim() || DEFAULT_SITE_ORIGIN).replace(/\/+$/, "");
  return new URL(locale === "en" ? "/en" : "/", base).toString();
}

/** Public ICS feed already linked as `/calendar.ics`. */
export function calendarFeedUrl(origin: string): string {
  const base = origin.trim().replace(/\/+$/, "") || DEFAULT_SITE_ORIGIN;
  return new URL("/calendar.ics", base).toString();
}

export function detailUrl(origin: string, locale: Locale, slug: string): string {
  const path = locale === "en" ? `/en/contests/${slug}` : `/contests/${slug}`;
  return new URL(path, origin).toString();
}

export function unsubscribeUrl(origin: string, locale: Locale, token: string): string {
  const path = locale === "en" ? "/en/reminders" : "/reminders";
  const url = new URL(path, origin);
  url.searchParams.set("token", token);
  return url.toString();
}

function weakFooter(locale: Locale, calendarUrl: string, unsubscribe?: string): string {
  if (locale === "en") {
    const lines = [
      `Calendar: ${calendarUrl}`,
      `Corrections / removal: ${CORRECTIONS_EMAIL}`,
    ];
    if (unsubscribe) lines.push(`Unsubscribe: ${unsubscribe}`);
    return lines.join("\n");
  }
  const lines = [
    `日历订阅：${calendarUrl}`,
    `勘误 / 移出索引：${CORRECTIONS_EMAIL}`,
  ];
  if (unsubscribe) lines.push(`退订：${unsubscribe}`);
  return lines.join("\n");
}

export function renderOtp(
  locale: Locale,
  code: string,
  origin = DEFAULT_SITE_ORIGIN,
): { subject: string; text: string } {
  const home = homeUrl(origin, locale);
  const safeCode = oneLine(code);
  if (locale === "en") {
    return {
      subject: "Your ALane verification code",
      text: `Hello,

We’ve received your subscription request — thank you. Please enter the code below on the site to confirm (valid for 10 minutes):

${safeCode}

Once verified, you can continue browsing the contest index on the site. We’ll only email you a short digest when the index has a material update.

If this wasn’t you, you can ignore this email — we won’t send you further messages from this request.

Please return to the site to enter the code: ${home}
`,
    };
  }
  return {
    subject: "您的 ALane 验证码",
    text: `您好，

收到您的订阅请求，感谢订阅！请用下面的验证码在网站上完成确认（10 分钟内有效）：

${safeCode}

验证通过后，您就可以在站内继续浏览赛事索引；我们只会在索引有实质更新时，用邮件给您一份简短的摘要。

若不是您本人操作，忽略本邮件即可，我们不会再给您发送邮件。

请回到网站输入验证码：${home}
`,
  };
}

export function renderWelcome(
  locale: Locale,
  links: { unsubscribeUrl: string; calendarUrl: string },
): { subject: string; text: string } {
  const origin = new URL(links.calendarUrl).origin;
  const home = homeUrl(origin, locale);
  const footer = weakFooter(locale, links.calendarUrl);
  if (locale === "en") {
    const body = `Hello,

Your email is confirmed and alerts are active — thank you for subscribing.

We won’t email you every day. We’ll only send a combined digest when a new contest opens, when a deadline falls within 14 days, or when contest winners are published.



→ Continue browsing the ALane homepage here
${home}

The ALane homepage also offers calendar subscribe.
Unsubscribe anytime: ${links.unsubscribeUrl}`;
    return {
      subject: "You’re subscribed to ALane alerts",
      text: `${body}\n\n${footer}\n`,
    };
  }
  const body = `您好，

邮箱已确认，提醒订阅生效，感谢订阅！

我们不会每天给您发送邮件，只有新赛开幕、赛事截止前14天，或有赛事获奖信息公布时，我们才发一封合并摘要。



→ 您可以从这里继续浏览 ALane 主页
${home}

Alane主页也提供日历订阅功能。
退订随时生效：${links.unsubscribeUrl}`;
  return {
    subject: "已订阅 ALane 提醒",
    text: `${body}\n\n${footer}\n`,
  };
}

function writtenDay(iso: string | null): string | null {
  if (!iso) return null;
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(iso.trim());
  return match?.[1] ?? null;
}

function dotted(parts: Array<string | null | undefined>): string {
  return parts.filter((part): part is string => Boolean(part && part.trim())).join(" · ");
}

function contestBits(contest: Contest, locale: Locale): { name: string; edition: string | null } {
  const edition = displayEdition(contest, locale);
  return {
    name: oneLine(displayName(contest, locale)),
    edition: edition ? oneLine(edition) : null,
  };
}

function openLine(contest: Contest, locale: Locale, origin: string): string {
  const { name, edition } = contestBits(contest, locale);
  const openAt = writtenDay(contest.open_at);
  const deadline = writtenDay(contest.deadline_at);
  const en = locale === "en";
  const head = dotted([
    name,
    edition,
    openAt ? `${en ? "Opens" : "开放"} ${openAt}` : null,
    deadline ? `${en ? "Deadline" : "截止"} ${deadline}` : null,
  ]);
  const detail = detailUrl(origin, locale, contest.slug);
  const tail = `${en ? "Details" : "详情"} ${detail} · ${en ? "Official" : "官网"} ${oneLine(contest.official_url)}`;
  return `· ${head}\n  ${tail}`;
}

function closingLine(contest: Contest, locale: Locale, origin: string): string {
  const { name, edition } = contestBits(contest, locale);
  const deadline = writtenDay(contest.deadline_at);
  const en = locale === "en";
  const head = dotted([
    name,
    edition,
    deadline ? `${en ? "Deadline" : "截止"} ${deadline}` : null,
  ]);
  const detail = detailUrl(origin, locale, contest.slug);
  const tail = `${en ? "Details" : "详情"} ${detail} · ${en ? "Official" : "官网"} ${oneLine(contest.official_url)}`;
  return `· ${head}\n  ${tail}`;
}

function galleryLine(contest: Contest, locale: Locale, origin: string, galleryUrl: string): string {
  const { name, edition } = contestBits(contest, locale);
  const en = locale === "en";
  const head = dotted([name, edition]);
  const detail = detailUrl(origin, locale, contest.slug);
  const tail = `${en ? "Winners" : "获奖页"} ${oneLine(galleryUrl)} · ${en ? "Details" : "详情"} ${detail}`;
  return `· ${head}\n  ${tail}`;
}

function section(title: string, lines: string[]): string | null {
  if (lines.length === 0) return null;
  return [title, ...lines].join("\n");
}

export function renderDigest(input: {
  locale: Locale;
  date: string;
  items: readonly DigestItem[];
  overflow: boolean;
  unsubscribeUrl: string;
  calendarUrl: string;
  origin: string;
}): { subject: string; text: string } {
  const { locale, date, items, origin } = input;
  const home = homeUrl(origin, locale);
  const subject =
    locale === "en"
      ? `ALane · index updates (${date})`
      : `ALane · 索引有更新（${date}）`;
  const intro =
    locale === "en"
      ? `Hello,

As of ${date}, a few changes on the index are worth a look (snapshot at send time; dates and status still prevail on the organizer’s site and ALane pages).

→ Browse all contests on the ALane homepage
${home}`
      : `您好，

截至 ${date}，站内索引有几处值得看一眼的变化（发送时刻快照；具体日期与状态仍以官网和站内页为准）。

→ 回 ALane 主页浏览全部赛事
${home}`;
  const closing =
    locale === "en"
      ? "If the list is long, we suggest going back to the homepage to filter and open details; this email is only a digest."
      : "列表较长时，建议直接回主页筛选与打开详情；本信仅作提要。";

  const openLines: string[] = [];
  const closingLines: string[] = [];
  const galleryLines: string[] = [];
  for (const item of items) {
    if (item.kind === "open") openLines.push(openLine(item.contest, locale, origin));
    else if (item.kind === "closing") closingLines.push(closingLine(item.contest, locale, origin));
    else galleryLines.push(galleryLine(item.contest, locale, origin, item.url));
  }

  const sections = [
    section(locale === "en" ? "[Newly open]" : "【新赛开幕】", openLines),
    section(locale === "en" ? "[Closing soon]" : "【临近截止】", closingLines),
    section(locale === "en" ? "[Winners published]" : "【获奖公布】", galleryLines),
  ].filter((block): block is string => block !== null);

  const text = [
    intro,
    ...sections,
    closing,
    weakFooter(locale, input.calendarUrl, input.unsubscribeUrl),
  ].join("\n\n");
  return { subject, text: `${text}\n` };
}
