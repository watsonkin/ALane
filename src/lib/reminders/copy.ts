import type { Locale } from "@/lib/locale";

const zh = {
  link: "邮件提醒",
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
  confirm: "验证并订阅",
  resend: "重新发送验证码",
  codeLabel: "验证码",
  codeSent: "验证码已发送，请在 10 分钟内输入。",
  cooldown: "请稍候再重发。",
  expired: "验证码已过期，请重新获取。",
  incorrect: "验证码不正确。",
  locked: "尝试过多，请 15 分钟后再试。",
  rateLimited: "发送次数已达上限，请稍后再试。",
  subscribed: "已订阅邮件提醒。欢迎信已发送。",
  subscribedWelcomeHeld: "已订阅邮件提醒。欢迎信尚未发送（文案待确认）。",
  alreadySubscribed: "该邮箱已订阅。",
  localeUpdated: "邮件语言已更新。",
  unsubscribed: "已退订，不会再发送提醒。",
  unsubscribeLead: "输入邮箱以退订邮件提醒。",
  unsubscribe: "退订",
  disabled: "邮件提醒尚未开始发送。",
  unavailable: "请稍后再试。",
  invalidEmail: "请输入有效邮箱。",
  consentRequired: "请先勾选同意隐私说明。",
};

const en = {
  link: "Email alerts",
  title: "Email alerts",
  blurb:
    "After you verify your email, we\u2019ll send a short digest when new contests open, deadlines fall within 14 days, or winners are published. This does not replace calendar subscribe. Unsubscribe anytime.",
  emailLabel: "Email",
  emailPlaceholder: "you@example.com",
  localeLabel: "Email language",
  localeZh: "中文",
  localeEn: "English",
  consentBefore: "I have read and agree to the ",
  consentLink: "Privacy Policy",
  consentAfter: " section on email alerts (purpose, retention, and unsubscribe).",
  send: "Send code",
  confirm: "Verify and subscribe",
  resend: "Resend code",
  codeLabel: "Code",
  codeSent: "Code sent. Enter it within 10 minutes.",
  cooldown: "Please wait before resending.",
  expired: "Code expired. Request a new one.",
  incorrect: "Incorrect code.",
  locked: "Too many attempts. Try again in 15 minutes.",
  rateLimited: "Send limit reached. Try again later.",
  subscribed: "You\u2019re subscribed. A welcome email is on the way.",
  subscribedWelcomeHeld: "You\u2019re subscribed. The welcome email has not been sent yet.",
  alreadySubscribed: "This email is already subscribed.",
  localeUpdated: "Email language updated.",
  unsubscribed: "Unsubscribed. You won\u2019t receive further alerts.",
  unsubscribeLead: "Enter your email to unsubscribe from alerts.",
  unsubscribe: "Unsubscribe",
  disabled: "Email alerts are not being sent yet.",
  unavailable: "Try again later.",
  invalidEmail: "Enter a valid email address.",
  consentRequired: "Agree to the privacy note before we send a code.",
};

export type ReminderCopy = typeof zh;

export function reminderCopy(locale: Locale): ReminderCopy {
  return locale === "en" ? en : zh;
}

const STATUS_KEY = {
  sent: "codeSent",
  cooldown: "cooldown",
  expired: "expired",
  incorrect: "incorrect",
  locked: "locked",
  rate_limited: "rateLimited",
  already_subscribed: "alreadySubscribed",
  locale_updated: "localeUpdated",
  unsubscribed: "unsubscribed",
  disabled: "disabled",
  invalid_email: "invalidEmail",
  consent_required: "consentRequired",
  invalid_locale: "invalidEmail",
  unavailable: "unavailable",
} as const satisfies Record<string, keyof ReminderCopy>;

export function reminderStatusText(
  locale: Locale,
  status: string,
  welcome?: "sent" | "skipped",
): string {
  const copy = reminderCopy(locale);
  if (status === "subscribed") {
    return welcome === "sent" ? copy.subscribed : copy.subscribedWelcomeHeld;
  }
  const key = STATUS_KEY[status as keyof typeof STATUS_KEY];
  return key ? copy[key] : copy.unavailable;
}
