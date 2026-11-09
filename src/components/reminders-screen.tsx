"use client";

import { useState, type FormEvent } from "react";
import { LocaleLink } from "@/components/locale-link";
import type { Locale } from "@/lib/locale";
import { reminderCopy, reminderStatusText } from "@/lib/reminders/copy";

type Phase = "email" | "code" | "done";

type ApiBody = {
  ok?: boolean;
  status?: string;
  error?: string;
  welcome?: "sent" | "skipped";
};

const fieldClass =
  "mt-2 w-full border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
const primaryButtonClass =
  "border border-transparent bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50";
const quietButtonClass =
  "border border-border bg-background px-3 py-2 text-sm text-foreground disabled:opacity-50";

async function postJson(path: string, body: unknown): Promise<ApiBody | null> {
  try {
    const response = await fetch(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data: unknown = await response.json();
    if (!data || typeof data !== "object") return null;
    return data as ApiBody;
  } catch {
    return null;
  }
}

export function RemindersScreen({ locale }: { locale: Locale }) {
  const t = reminderCopy(locale);
  const [email, setEmail] = useState("");
  const [mailLocale, setMailLocale] = useState<Locale>(locale);
  const [consent, setConsent] = useState(false);
  const [code, setCode] = useState("");
  const [phase, setPhase] = useState<Phase>("email");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [unsubEmail, setUnsubEmail] = useState("");
  const [unsubMessage, setUnsubMessage] = useState<string | null>(null);
  const [unsubPending, setUnsubPending] = useState(false);

  async function requestCode() {
    setPending(true);
    const result = await postJson("/api/reminders/code", {
      email,
      locale: mailLocale,
      consent: true,
    });
    setPending(false);
    if (!result) {
      setMessage(t.unavailable);
      return;
    }
    if (result.ok && result.status === "sent") {
      setPhase("code");
      setCode("");
      setMessage(reminderStatusText(locale, "sent"));
      return;
    }
    if (result.ok && result.status === "already_subscribed") {
      setMessage(reminderStatusText(locale, "already_subscribed"));
      return;
    }
    setMessage(reminderStatusText(locale, result.error ?? "unavailable"));
  }

  async function confirmCode() {
    setPending(true);
    const result = await postJson("/api/reminders/verify", { email, code });
    setPending(false);
    if (!result) {
      setMessage(t.unavailable);
      return;
    }
    if (result.ok && (result.status === "subscribed" || result.status === "locale_updated")) {
      setPhase("done");
      setMessage(reminderStatusText(locale, result.status, result.welcome));
      return;
    }
    setMessage(reminderStatusText(locale, result.error ?? "unavailable"));
  }

  async function unsubscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUnsubPending(true);
    const result = await postJson("/api/reminders/unsubscribe", { email: unsubEmail });
    setUnsubPending(false);
    if (!result) {
      setUnsubMessage(t.unavailable);
      return;
    }
    if (result.ok && result.status === "unsubscribed") {
      setUnsubMessage(reminderStatusText(locale, "unsubscribed"));
      return;
    }
    setUnsubMessage(reminderStatusText(locale, result.error ?? "unavailable"));
  }

  return (
    <article className="max-w-2xl">
      <h1 className="font-serif text-4xl leading-tight">{t.title}</h1>
      <p className="mt-6 text-base leading-7">{t.blurb}</p>

      {phase === "done" ? (
        <p className="mt-6 text-sm leading-6" role="status">
          {message}
        </p>
      ) : (
        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (phase === "code") {
              void confirmCode();
              return;
            }
            void requestCode();
          }}
        >
          <div>
            <label htmlFor="reminder-email" className="text-sm">
              {t.emailLabel}
            </label>
            <input
              id="reminder-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder={t.emailPlaceholder}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="reminder-locale" className="text-sm">
              {t.localeLabel}
            </label>
            <select
              id="reminder-locale"
              name="locale"
              value={mailLocale}
              onChange={(event) => setMailLocale(event.target.value === "en" ? "en" : "zh-CN")}
              className={fieldClass}
            >
              <option value="zh-CN">{t.localeZh}</option>
              <option value="en">{t.localeEn}</option>
            </select>
          </div>
          <div className="flex items-start gap-3 text-sm leading-6">
            <input
              id="reminder-consent"
              name="consent"
              type="checkbox"
              className="mt-1"
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
              aria-labelledby="reminder-consent-note"
              required
            />
            <p id="reminder-consent-note">
              {t.consentBefore}
              <LocaleLink href="/privacy" className="text-accent underline-offset-4 hover:underline">
                {t.consentLink}
              </LocaleLink>
              {t.consentAfter}
            </p>
          </div>
          {phase === "code" ? (
            <div>
              <label htmlFor="reminder-code" className="text-sm">
                {t.codeLabel}
              </label>
              <input
                id="reminder-code"
                name="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                minLength={6}
                maxLength={6}
                required
                value={code}
                onChange={(event) => setCode(event.target.value)}
                className={fieldClass}
              />
            </div>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <button type="submit" className={primaryButtonClass} disabled={pending || !consent}>
              {phase === "code" ? t.confirm : t.send}
            </button>
            {phase === "code" ? (
              <button
                type="button"
                className={quietButtonClass}
                disabled={pending || !consent}
                onClick={() => {
                  void requestCode();
                }}
              >
                {t.resend}
              </button>
            ) : null}
          </div>
          {message ? (
            <p className="text-sm leading-6" role="status">
              {message}
            </p>
          ) : null}
        </form>
      )}

      <form className="mt-10 space-y-4 border-t border-border pt-6" onSubmit={unsubscribe}>
        <p className="text-sm leading-6 text-muted-foreground">{t.unsubscribeLead}</p>
        <div>
          <label htmlFor="reminder-unsubscribe-email" className="text-sm">
            {t.emailLabel}
          </label>
          <input
            id="reminder-unsubscribe-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder={t.emailPlaceholder}
            value={unsubEmail}
            onChange={(event) => setUnsubEmail(event.target.value)}
            className={fieldClass}
          />
        </div>
        <button type="submit" className={quietButtonClass} disabled={unsubPending}>
          {t.unsubscribe}
        </button>
        {unsubMessage ? (
          <p className="text-sm leading-6" role="status">
            {unsubMessage}
          </p>
        ) : null}
      </form>
    </article>
  );
}
