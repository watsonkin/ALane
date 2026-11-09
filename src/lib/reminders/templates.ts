import type { Locale } from "@/lib/locale";
import type { DigestItem } from "@/lib/reminders/digest";

/**
 * PLACEHOLDER — awaiting Watson confirmation of §7.4 / §7.5 / §7.6.
 * Do not replace these strings with the draft email copy until that confirmation.
 * Bodies omit codes, contest names, and unsubscribe URLs so a mistaken send
 * cannot deliver the unconfirmed text.
 */
export const TEMPLATE_MARK = "PLACEHOLDER" as const;

export type TemplateKind = "otp" | "welcome" | "digest";

export type OutboundTemplate = {
  kind: TemplateKind;
  placeholder: boolean;
  subject: string;
  text: string;
  html: string;
};

function placeholder(kind: TemplateKind, which: string): OutboundTemplate {
  const text = `PLACEHOLDER awaiting Watson confirmation of the ${which}. Do not send.`;
  return {
    kind,
    placeholder: true,
    subject: TEMPLATE_MARK,
    text,
    html: `<p>${text}</p>`,
  };
}

/** §7.4 verification mail. `code` is intentionally left out of the body. */
export function otpTemplate(code: string): OutboundTemplate {
  void code;
  return placeholder("otp", "verification email");
}

/** §7.5 welcome mail. Unsubscribe and calendar URLs stay out until confirmation. */
export function welcomeTemplate(locale: Locale, unsubscribeUrl: string): OutboundTemplate {
  void locale;
  void unsubscribeUrl;
  return placeholder("welcome", "welcome email");
}

/** §7.6 digest. Item lists stay out until confirmation. */
export function digestTemplate(
  locale: Locale,
  items: readonly DigestItem[],
  options?: { truncated?: boolean; unsubscribeUrl?: string },
): OutboundTemplate {
  void locale;
  void items;
  void options;
  return placeholder("digest", "digest email");
}
