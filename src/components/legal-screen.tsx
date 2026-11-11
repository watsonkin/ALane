import type { ReactNode } from "react";
import type { Locale } from "@/lib/locale";

const textLink = "text-accent underline-offset-4 hover:underline";
const codeText = "font-mono text-[0.92em]";

function MailLink() {
  return (
    <a href="mailto:AlaneStreetPhotos@icloud.com" className={textLink}>
      <strong>AlaneStreetPhotos@icloud.com</strong>
    </a>
  );
}

function LegalArticle({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="max-w-2xl">
      <h1 className="font-serif text-4xl leading-tight">{title}</h1>
      <div className="mt-6 space-y-8 text-base leading-7">{children}</div>
    </article>
  );
}

export function TermsScreen({ locale }: { locale: Locale }) {
  return (
    <LegalArticle title={locale === "en" ? "Terms of Use" : "使用条款"}>
      {locale === "en" ? <EnglishTerms /> : <ChineseTerms />}
    </LegalArticle>
  );
}

export function PrivacyScreen({ locale }: { locale: Locale }) {
  return (
    <LegalArticle title={locale === "en" ? "Privacy Policy" : "隐私政策"}>
      {locale === "en" ? <EnglishPrivacy /> : <ChinesePrivacy />}
    </LegalArticle>
  );
}

function ChineseTerms() {
  return (
    <section className="space-y-4">
      <h2 className="font-serif text-xl leading-snug">使用条款与免责声明</h2>
      <ol className="list-decimal space-y-4 pl-5">
        <li>
          本站（ALane）仅提供摄影赛事信息的<strong>索引与链接</strong>，不举办、不主办、不承办任何赛事；本站与所列各主办方之间<strong>无任何合作、授权或隶属关系</strong>。
        </li>
        <li>
          赛事的开放时间、截止日期、报名费用等由各自主办方核定，<strong>以各主办方官方页面为准</strong>；本站所示信息可能与官网不一致，仅供参考，不构成报名依据。
        </li>
        <li>
          本站<strong>不保存任何参赛作品</strong>，也不提供图片下载；作品相关入口仅链接至主办方官网。
        </li>
        <li>
          若您认为本站对您的作品名称、商标或其他权利存在不当使用，或希望移出索引，请发送邮件至 <MailLink /> 说明情况，我们将在核实后<strong>尽快处理或下线相关内容</strong>。
        </li>
        <li>
          因使用本站信息（含外链跳转）所产生的任何后果，由使用者与各主办方自行承担；本站运营者不承担责任。
        </li>
      </ol>
    </section>
  );
}

function EnglishTerms() {
  return (
    <section className="space-y-4">
      <h2 className="font-serif text-xl leading-snug">Terms of Use and Disclaimer</h2>
      <ol className="list-decimal space-y-4 pl-5">
        <li>
          ALane provides an <strong>index of and links to</strong> photography awards only. It does not host, organize, or run any award, and has <strong>no partnership, license, or affiliation</strong> with any listed organizer.
        </li>
        <li>
          Opening windows, deadlines, and fees are set by each organizer and <strong>prevail on the organizer{"\u2019"}s official site</strong>; information on this index may differ and is for reference only, not a basis for entry.
        </li>
        <li>
          This site <strong>does not store any competition entries</strong> and does not offer image downloads; work-related links go to the organizer{"\u2019"}s official site.
        </li>
        <li>
          If you believe your work, mark, or other rights are used improperly here, or you want an item removed from the index, email <MailLink />; we will review and <strong>promptly address or remove</strong> the material as appropriate.
        </li>
        <li>
          Neither ALane nor the operator is liable for any outcome arising from using this site or its outbound links.
        </li>
      </ol>
    </section>
  );
}

function ChinesePrivacy() {
  return (
    <>
      <section className="space-y-3">
        <h2 className="font-serif text-xl leading-snug">1. 我们收集什么</h2>
        <ul className="list-disc space-y-3 pl-5">
          <li>
            <strong>邮件提醒（可选）</strong>：若您订阅邮件提醒，我们会在您提交并验证邮箱后，保存<strong>邮箱地址、邮件语言（中文或英文）、同意时间、验证/订阅/退订时间</strong>等最小必要字段。用途仅限于发送：① 新赛开幕 ② 招募期临近截止（与站内「即将截止」同源，默认未来 14 天）③ 获奖公布 的合并摘要；<strong>有变化才发，无变化不发</strong>。未通过验证码确认的邮箱<strong>不会</strong>进入业务发送列表。您可随时退订；退订后立即停止业务摘要。退订记录保留 <strong>90 天</strong>（防误发与留痕），期满删除或匿名化。验证码邮件仅用于确认订阅，不算业务推送。
          </li>
          <li>
            本站<strong>不提供</strong>账号注册，<strong>不收集</strong>密码。
          </li>
          <li>
            若您手动切换语言，浏览器可能保存 Cookie <strong><code className={codeText}>alane_locale</code></strong>（值为 <code className={codeText}>zh-CN</code> 或 <code className={codeText}>en</code>），仅用于记住界面语言；该 Cookie <strong>不</strong>决定邮件语言（邮件语言以订阅时选择为准）。
          </li>
          <li>
            浏览统计：本站在网页中使用 Cloudflare Web Analytics 官方脚本，用于了解访问量、热门页面、来源、大致地区，以及设备/浏览器与页面性能。该脚本不设统计 Cookie，也不使用 localStorage 等浏览器存储做统计；不加在日历订阅文件（<code className={codeText}>/calendar.ics</code>）中。该统计不用于营销画像，不与订阅邮箱或可识别个人的信息打通。
          </li>
          <li>
            官网外链点击：若您从赛事详情页点击前往主办方官网（例如查看报名或规则），我们可能做无身份计数，只记录事件类型与次数，不记录邮箱或其他可识别个人的信息，也不与订阅名单或浏览行为打通。
          </li>
          <li>
            您若主动发邮件至 <MailLink />（勘误、移出索引、权利主张、隐私询问等），邮件内容由该邮箱接收与处理。
          </li>
        </ul>
      </section>
      <section className="space-y-3">
        <h2 className="font-serif text-xl leading-snug">2. 托管与访问日志</h2>
        <ul className="list-disc space-y-3 pl-5">
          <li>本站部署于 <strong>Cloudflare Workers</strong>，内容经 Cloudflare 边缘网络分发。</li>
          <li>
            Cloudflare 作为托管平台可能保留<strong>访问日志与边缘分析</strong>（例如请求时间、URL 路径、HTTP 状态、大致地理区域、User-Agent 等），用于服务运行、安全与故障排查。本站运营者不另建面向营销的用户档案。该平台日志有别于第 1 节所述的 Cloudflare Web Analytics 浏览统计。
          </li>
          <li>
            邮件发送经专业发信服务商 <strong>Resend</strong> 处理，限于投递验证码、欢迎信与上述三类摘要。
          </li>
        </ul>
      </section>
      <section className="space-y-3">
        <h2 className="font-serif text-xl leading-snug">3. 我们不做什么</h2>
        <ul className="list-disc space-y-3 pl-5">
          <li>不出售个人信息。</li>
          <li>不要求账号密码。</li>
          <li>不把 ICS 日历订阅（<a href="/calendar.ics" className={textLink}>/calendar.ics</a>）当作邮件采集通道。</li>
          <li>
            <strong>不把订阅邮箱用于上述三类提醒以外的营销、广告或向第三方出售/租用名单。</strong>
          </li>
          <li>不接 Google Analytics、广告像素、热力图或会话回放。</li>
          <li>不在邮件中加入打开或点击追踪像素。</li>
          <li>不把浏览统计或外链点击与订阅邮箱打通。</li>
        </ul>
      </section>
      <section className="space-y-3">
        <h2 className="font-serif text-xl leading-snug">4. 联系与发信身份</h2>
        <ul className="list-disc space-y-3 pl-5">
          <li>隐私询问、勘误、移出索引、权利主张：<MailLink />。</li>
          <li>
            验证码、欢迎信与业务摘要的发件地址：<strong>reminders@alane.photography</strong>（与勘误邮箱分工不同；<strong>不用</strong>勘误邮箱群发）。
          </li>
        </ul>
      </section>
    </>
  );
}

function EnglishPrivacy() {
  return (
    <>
      <section className="space-y-3">
        <h2 className="font-serif text-xl leading-snug">1. What we collect</h2>
        <ul className="list-disc space-y-3 pl-5">
          <li>
            <strong>Email alerts (optional):</strong> If you subscribe, after you submit and verify your email we store the <strong>minimum needed fields</strong>: email address, alert language (中文 or English), consent time, and verification / subscribe / unsubscribe timestamps. We use them only to send digests when: (1) new contests open, (2) open calls enter the closing window (aligned with on-site “closing soon”, default <strong>14</strong> days), or (3) winners are published. Digests go out <strong>only when something changed</strong>—never empty mail. Unverified addresses are <strong>not</strong> added to the digest list. You may unsubscribe anytime; digests stop immediately. We keep the unsubscribe record for <strong>90 days</strong> (to prevent mistaken resends and for audit), then delete or anonymize it. Verification emails are for confirming subscription only, not contest digests.
          </li>
          <li>
            The site <strong>does not</strong> offer account sign-up and <strong>does not</strong> collect passwords.
          </li>
          <li>
            If you switch language manually, your browser may store the Cookie <strong><code className={codeText}>alane_locale</code></strong> (<code className={codeText}>zh-CN</code> or <code className={codeText}>en</code>) only to remember UI language; it does <strong>not</strong> set email language (that follows your subscription choice).
          </li>
          <li>
            Site analytics: On web pages, we use the official Cloudflare Web Analytics script to understand visits, popular pages, referrers, coarse region, and device / browser and page performance. The script does not set analytics cookies and does not use localStorage or similar browser storage for analytics. It is not added to the calendar file (<code className={codeText}>/calendar.ics</code>). These analytics are not used for marketing profiles and are not linked to subscriber emails or other information that identifies you.
          </li>
          <li>
            Official-site outbound clicks: If you click through from a contest detail page to an organizer{"\u2019"}s site (for example to enter or read the rules), we may keep a non-identifying count of the event type and how often it happens. We do not record email addresses or other information that identifies you, and we do not link these counts to the subscriber list or to your browsing.
          </li>
          <li>
            If you email <MailLink /> (corrections, removal, rights notices, privacy questions), that message is received in that mailbox.
          </li>
        </ul>
      </section>
      <section className="space-y-3">
        <h2 className="font-serif text-xl leading-snug">2. Hosting and access logs</h2>
        <ul className="list-disc space-y-3 pl-5">
          <li>
            The site runs on <strong>Cloudflare Workers</strong> and is served via Cloudflare{"\u2019"}s edge network.
          </li>
          <li>
            As the host, Cloudflare may keep <strong>access logs and edge analytics</strong> (e.g. request time, URL path, HTTP status, coarse region, User-Agent) for operations, security, and troubleshooting. The operator does not build a marketing profile database on top of this site. Those platform logs are distinct from the Cloudflare Web Analytics described in section 1.
          </li>
          <li>
            Outbound mail is processed by <strong>Resend</strong>, limited to verification codes, the welcome message, and the three digest types above.
          </li>
        </ul>
      </section>
      <section className="space-y-3">
        <h2 className="font-serif text-xl leading-snug">3. What we do not do</h2>
        <ul className="list-disc space-y-3 pl-5">
          <li>We do not sell personal information.</li>
          <li>We do not ask for account passwords.</li>
          <li>
            Calendar ICS (<a href="/calendar.ics" className={textLink}>/calendar.ics</a>) is a file download/subscribe path, not an email collection form.
          </li>
          <li>
            <strong>We do not use subscriber emails for marketing or ads beyond the three alert types above, and we do not sell or rent the list.</strong>
          </li>
          <li>We do not use Google Analytics, advertising pixels, heatmaps, or session replay.</li>
          <li>We do not add open- or click-tracking pixels to email.</li>
          <li>We do not link site analytics or outbound-click counts to subscriber emails.</li>
        </ul>
      </section>
      <section className="space-y-3">
        <h2 className="font-serif text-xl leading-snug">4. Contact and From addresses</h2>
        <ul className="list-disc space-y-3 pl-5">
          <li>Privacy questions, corrections, removal, and rights notices: <MailLink />.</li>
          <li>
            Verification, welcome, and digest mail is sent from <strong>reminders@alane.photography</strong> (separate from the corrections mailbox; the corrections address is <strong>not</strong> used for bulk send).
          </li>
        </ul>
      </section>
    </>
  );
}
