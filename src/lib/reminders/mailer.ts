import { REMINDERS_FROM } from "@/lib/reminders/constants";

export type OutboundMail = {
  to: string;
  subject: string;
  text: string;
};

export type Mailer = {
  send(message: OutboundMail): Promise<{ ok: true } | { ok: false; error: string }>;
};

/** JSON body for Resend. From is fixed; the corrections mailbox is never the sender. */
export function resendBody(message: OutboundMail): {
  from: string;
  to: string[];
  subject: string;
  text: string;
} {
  return {
    from: REMINDERS_FROM,
    to: [message.to],
    subject: message.subject,
    text: message.text,
  };
}

export function resendMailer(apiKey: string): Mailer {
  return {
    async send(message) {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          authorization: `Bearer ${apiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify(resendBody(message)),
      });
      if (!response.ok) return { ok: false, error: `resend_${response.status}` };
      return { ok: true };
    },
  };
}

/** Dev-only sink. The Worker build forces NODE_ENV=production, so this stays off there. */
export function memoryMailer(): Mailer {
  return {
    async send(message) {
      console.info(`[reminders mail sink] ${message.subject}`);
      return { ok: true };
    },
  };
}
