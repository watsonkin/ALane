import type { Locale } from "@/lib/locale";
import type { ReminderCode } from "@/lib/reminders/codes";

/**
 * On-site copy from product rule §7.1–§7.3. Email bodies are the confirmed
 * §7.4–§7.6 text in templates.ts.
 */
export function pageCopy(locale: Locale): {
  title: string;
  blurb: string;
  emailLabel: string;
  emailPlaceholder: string;
  localeLabel: string;
  localeZh: string;
  localeEn: string;
  consentBefore: string;
  consentLink: string;
  consentAfter: string;
  send: string;
  verify: string;
  resend: string;
  unsubTitle: string;
  unsubBlurb: string;
  unsubButton: string;
  closed: string;
} {
  if (locale === "en") {
    return {
      title: "Email alerts",
      blurb:
        "After you verify your email, we’ll send a short digest when new contests open, deadlines fall within 14 days, or winners are published. This does not replace calendar subscribe. Unsubscribe anytime.",
      emailLabel: "Email",
      emailPlaceholder: "you@example.com",
      localeLabel: "Email language",
      localeZh: "中文",
      localeEn: "English",
      consentBefore: "I have read and agree to the ",
      consentLink: "Privacy Policy",
      consentAfter: " section on email alerts (purpose, retention, and unsubscribe).",
      send: "Send code",
      verify: "Verify and subscribe",
      resend: "Resend code",
      unsubTitle: "Unsubscribe",
      unsubBlurb: "Enter your email to unsubscribe from alerts.",
      unsubButton: "Unsubscribe",
      closed:
        "Email alerts are not open yet. Addresses are not collected until the sending domain and secrets are ready.",
    };
  }
  return {
    title: "邮件提醒",
    blurb: "输入邮箱并验证后，在有新赛开幕、临近截止或获奖公布时收到摘要。不替代日历订阅；可随时退订。",
    emailLabel: "邮箱",
    emailPlaceholder: "you@example.com",
    localeLabel: "邮件语言",
    localeZh: "中文",
    localeEn: "English",
    consentBefore: "我已阅读并同意",
    consentLink: "隐私政策",
    consentAfter: "中关于邮件提醒的说明（用途、保存与退订）。",
    send: "发送验证码",
    verify: "验证并订阅",
    resend: "重新发送验证码",
    unsubTitle: "退订",
    unsubBlurb: "输入邮箱以退订邮件提醒。",
    unsubButton: "退订",
    closed: "邮件提醒尚未开放。发信域名与密钥就绪前，这里不会收集订阅邮箱。",
  };
}

const zhStatus: Record<ReminderCode, string> = {
  sent: "验证码已发送，请在 10 分钟内输入。",
  cooldown: "请稍候再重发。",
  expired: "验证码已过期，请重新获取。",
  incorrect: "验证码不正确。",
  locked: "尝试过多，请 15 分钟后再试。",
  rate_limited: "发送次数已达上限，请稍后再试。",
  subscribed: "已订阅邮件提醒。欢迎信已发送。",
  subscribed_welcome_failed: "已订阅邮件提醒。欢迎信暂时未能发出。",
  already_subscribed: "该邮箱已订阅。",
  locale_updated: "邮件语言已更新。",
  unsubscribed: "已退订，不会再发送提醒。",
  invalid_token: "退订链接无效。",
  consent_required: "请先勾选同意隐私说明。",
  invalid_email: "请输入有效邮箱。",
  invalid_locale: "请选择邮件语言。",
  invalid_code: "请输入 6 位验证码。",
  disabled: "邮件提醒尚未开放。",
  mail_not_configured: "发信尚未配置，邮件没有发出。",
  mail_failed: "邮件未能发出，请稍后再试。",
  storage_unavailable: "订阅服务暂时不可用。",
  forbidden: "请求被拒绝。",
};

const enStatus: Record<ReminderCode, string> = {
  sent: "Code sent. Enter it within 10 minutes.",
  cooldown: "Please wait before resending.",
  expired: "Code expired. Request a new one.",
  incorrect: "Incorrect code.",
  locked: "Too many attempts. Try again in 15 minutes.",
  rate_limited: "Send limit reached. Try again later.",
  subscribed: "You’re subscribed. A welcome email is on the way.",
  subscribed_welcome_failed: "You’re subscribed. The welcome email could not be sent yet.",
  already_subscribed: "This email is already subscribed.",
  locale_updated: "Email language updated.",
  unsubscribed: "Unsubscribed. You won’t receive further alerts.",
  invalid_token: "This unsubscribe link is not valid.",
  consent_required: "Check the privacy consent box first.",
  invalid_email: "Enter a valid email address.",
  invalid_locale: "Choose an email language.",
  invalid_code: "Enter the 6-digit code.",
  disabled: "Email alerts are not open yet.",
  mail_not_configured: "Mail is not configured, so nothing was sent.",
  mail_failed: "The email could not be sent. Try again later.",
  storage_unavailable: "Alerts are temporarily unavailable.",
  forbidden: "Request rejected.",
};

export function statusCopy(locale: Locale, code: ReminderCode): string {
  return locale === "en" ? enStatus[code] : zhStatus[code];
}

export function statusOk(code: ReminderCode): boolean {
  return (
    code === "sent" ||
    code === "subscribed" ||
    code === "subscribed_welcome_failed" ||
    code === "already_subscribed" ||
    code === "locale_updated" ||
    code === "unsubscribed"
  );
}
