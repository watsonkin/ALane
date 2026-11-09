import { Resend } from "resend";
import {
  DIGEST_COPY_CONFIRMED,
  REMINDERS_FROM,
  SUBSCRIBER_MAIL_COPY_CONFIRMED,
} from "@/lib/reminders/constants";
import { isRemindersEnabled, type RemindersEnv } from "@/lib/reminders/env";
import type { OutboundTemplate, TemplateKind } from "@/lib/reminders/templates";

export type OutboundMail = OutboundTemplate & { to: string };

export type MailSendResult = {
  delivered: boolean;
  skipped?:
    | "placeholder"
    | "digest_copy_unconfirmed"
    | "subscriber_copy_unconfirmed"
    | "disabled"
    | "missing_key"
    | "provider_error";
};

export interface Mailer {
  send(mail: OutboundMail): Promise<MailSendResult>;
}

type GateMail = {
  kind: TemplateKind;
  placeholder: boolean;
  subject: string;
  text: string;
  html: string;
  to: string;
};

/**
 * Resend is the selected provider. Placeholder templates and unconfirmed copy
 * return before the client is constructed, so no request leaves the worker.
 */
export function createResendMailer(env: RemindersEnv): Mailer {
  return {
    async send(mail: GateMail): Promise<MailSendResult> {
      if (mail.placeholder || mail.subject === "PLACEHOLDER" || mail.text.includes("PLACEHOLDER")) {
        return { delivered: false, skipped: "placeholder" };
      }
      if (mail.kind === "digest" && !DIGEST_COPY_CONFIRMED) {
        return { delivered: false, skipped: "digest_copy_unconfirmed" };
      }
      if ((mail.kind === "otp" || mail.kind === "welcome") && !SUBSCRIBER_MAIL_COPY_CONFIRMED) {
        return { delivered: false, skipped: "subscriber_copy_unconfirmed" };
      }
      if (!isRemindersEnabled(env)) return { delivered: false, skipped: "disabled" };
      if (!env.RESEND_API_KEY) return { delivered: false, skipped: "missing_key" };

      try {
        const resend = new Resend(env.RESEND_API_KEY);
        const result = await resend.emails.send({
          from: REMINDERS_FROM,
          to: [mail.to],
          subject: mail.subject,
          text: mail.text,
          html: mail.html,
        });
        if (result.error) return { delivered: false, skipped: "provider_error" };
        return { delivered: true };
      } catch {
        return { delivered: false, skipped: "provider_error" };
      }
    },
  };
}
