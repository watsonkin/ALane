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
            本站本季<strong>不提供</strong>邮件订阅，<strong>不收集</strong>订阅邮箱，<strong>不提供</strong>账号注册，<strong>不收集</strong>密码。
          </li>
          <li>
            若您手动切换语言，浏览器可能保存 Cookie <strong><code className={codeText}>alane_locale</code></strong>（值为 <code className={codeText}>zh-CN</code> 或 <code className={codeText}>en</code>），仅用于记住界面语言。
          </li>
          <li>
            您若主动发邮件至 <MailLink />（勘误、移出索引、权利主张等），邮件内容由该邮箱接收与处理。
          </li>
        </ul>
      </section>
      <section className="space-y-3">
        <h2 className="font-serif text-xl leading-snug">2. 托管与访问日志</h2>
        <ul className="list-disc space-y-3 pl-5">
          <li>本站部署于 <strong>Cloudflare Workers</strong>，内容经 Cloudflare 边缘网络分发。</li>
          <li>
            Cloudflare 作为托管平台可能保留<strong>访问日志与边缘分析</strong>（例如请求时间、URL 路径、HTTP 状态、大致地理区域、User-Agent 等），用于服务运行、安全与故障排查。本站运营者不另建面向营销的用户档案。
          </li>
        </ul>
      </section>
      <section className="space-y-3">
        <h2 className="font-serif text-xl leading-snug">3. 我们不做什么</h2>
        <ul className="list-disc space-y-3 pl-5">
          <li>不出售个人信息。</li>
          <li>不要求账号密码。</li>
          <li>不把 ICS 日历订阅当作邮件采集通道。</li>
        </ul>
      </section>
      <section className="space-y-3">
        <h2 className="font-serif text-xl leading-snug">4. 联系</h2>
        <ul className="list-disc space-y-3 pl-5">
          <li>隐私相关询问：<MailLink />。</li>
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
            This season the site <strong>does not</strong> offer email subscription, <strong>does not</strong> collect subscriber emails, <strong>does not</strong> offer account sign-up, and <strong>does not</strong> collect passwords.
          </li>
          <li>
            If you switch language manually, your browser may store the Cookie <strong><code className={codeText}>alane_locale</code></strong> (<code className={codeText}>zh-CN</code> or <code className={codeText}>en</code>) only to remember UI language.
          </li>
          <li>
            If you email <MailLink /> (corrections, removal, rights notices), that message is received in that mailbox.
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
            As the host, Cloudflare may keep <strong>access logs and edge analytics</strong> (e.g. request time, URL path, HTTP status, coarse region, User-Agent) for operations, security, and troubleshooting. The operator does not build a marketing profile database on top of this site.
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
        </ul>
      </section>
      <section className="space-y-3">
        <h2 className="font-serif text-xl leading-snug">4. Contact</h2>
        <ul className="list-disc space-y-3 pl-5">
          <li>Privacy questions: <MailLink />.</li>
        </ul>
      </section>
    </>
  );
}
