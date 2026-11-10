"use client";

import { useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { pageCopy, statusCopy, statusOk } from "@/lib/reminders/copy";
import type { ReminderCode } from "@/lib/reminders/codes";
import { localizeHref, type Locale } from "@/lib/locale";

type Feedback = { tone: "ok" | "err"; text: string };

const fieldClass = "mt-2 w-full max-w-md border border-border bg-background px-3 py-2 text-sm";
const buttonClass =
  "border border-transparent bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50";
const linkClass = "text-accent underline-offset-4 hover:underline";

function FeedbackLine({ item }: { item: Feedback | null }) {
  if (!item) return null;
  return (
    <p role={item.tone === "err" ? "alert" : "status"} className="text-sm leading-6">
      {item.text}
    </p>
  );
}

async function post(path: string, body: unknown): Promise<{ ok: boolean; code: ReminderCode }> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(body),
  });
  const data: unknown = await response.json();
  if (!data || typeof data !== "object" || !("code" in data) || typeof data.code !== "string") {
    return { ok: false, code: "storage_unavailable" };
  }
  return { ok: "ok" in data && data.ok === true, code: data.code as ReminderCode };
}

export function RemindersScreen({
  locale,
  enabled,
  notice,
}: {
  locale: Locale;
  enabled: boolean;
  notice: Feedback | null;
}) {
  const copy = pageCopy(locale);
  const pathname = usePathname() ?? "/";
  const privacy = localizeHref(pathname, "/privacy");
  const [email, setEmail] = useState("");
  const [language, setLanguage] = useState<Locale>(locale);
  const [consent, setConsent] = useState(false);
  const [code, setCode] = useState("");
  const [phase, setPhase] = useState<"request" | "code" | "done">("request");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [unsubEmail, setUnsubEmail] = useState("");
  const [pending, startTransition] = useTransition();

  function apply(result: { ok: boolean; code: ReminderCode }) {
    setFeedback({ tone: statusOk(result.code) ? "ok" : "err", text: statusCopy(locale, result.code) });
    if (result.code === "sent") setPhase("code");
    if (result.code === "subscribed" || result.code === "subscribed_welcome_failed" || result.code === "locale_updated") {
      setPhase("done");
    }
  }

  function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      try {
        const result = await post("/api/reminders/send-code", {
          email,
          locale: language,
          consent,
        });
        apply(result);
      } catch {
        setFeedback({ tone: "err", text: statusCopy(locale, "storage_unavailable") });
      }
    });
  }

  function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      try {
        const result = await post("/api/reminders/verify", { email, code, locale: language });
        apply(result);
      } catch {
        setFeedback({ tone: "err", text: statusCopy(locale, "storage_unavailable") });
      }
    });
  }

  function unsubscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      try {
        const result = await post("/api/reminders/unsubscribe", { email: unsubEmail });
        setFeedback({
          tone: statusOk(result.code) ? "ok" : "err",
          text: statusCopy(locale, result.code),
        });
      } catch {
        setFeedback({ tone: "err", text: statusCopy(locale, "storage_unavailable") });
      }
    });
  }

  return (
    <article className="max-w-2xl">
      <h1 className="font-serif text-4xl leading-tight">{copy.title}</h1>
      <div className="mt-6 space-y-6 text-base leading-7">
        <p>{copy.blurb}</p>
        <FeedbackLine item={notice} />
        <FeedbackLine item={feedback} />
        {enabled ? (
          phase === "done" ? null : (
            <form onSubmit={phase === "code" ? verify : send} className="space-y-4">
              <div>
                <label htmlFor="reminders-email" className="text-sm">
                  {copy.emailLabel}
                </label>
                <input
                  id="reminders-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  inputMode="email"
                  required
                  placeholder={copy.emailPlaceholder}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  readOnly={phase === "code"}
                  className={fieldClass}
                />
              </div>
              <div>
                <label htmlFor="reminders-locale" className="text-sm">
                  {copy.localeLabel}
                </label>
                <select
                  id="reminders-locale"
                  name="locale"
                  value={language}
                  onChange={(event) => setLanguage(event.target.value === "en" ? "en" : "zh-CN")}
                  className={fieldClass}
                >
                  <option value="zh-CN">{copy.localeZh}</option>
                  <option value="en">{copy.localeEn}</option>
                </select>
              </div>
              <label htmlFor="reminders-consent" className="flex items-start gap-3 text-sm leading-6">
                <input
                  id="reminders-consent"
                  name="consent"
                  type="checkbox"
                  checked={consent}
                  onChange={(event) => setConsent(event.target.checked)}
                  className="mt-1"
                  required
                />
                <span>
                  {copy.consentBefore}
                  <Link href={privacy} className={linkClass}>
                    {copy.consentLink}
                  </Link>
                  {copy.consentAfter}
                </span>
              </label>
              {phase === "code" ? (
                <div>
                  <label htmlFor="reminders-code" className="text-sm">
                    {locale === "en" ? "Code" : "验证码"}
                  </label>
                  <input
                    id="reminders-code"
                    name="code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    required
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                    className={fieldClass}
                  />
                </div>
              ) : null}
              <div className="flex flex-wrap gap-3">
                <button type="submit" disabled={pending || !consent || email.trim() === ""} className={buttonClass}>
                  {phase === "code" ? copy.verify : copy.send}
                </button>
                {phase === "code" ? (
                  <button
                    type="button"
                    disabled={pending || !consent}
                    className={buttonClass}
                    onClick={() => {
                      startTransition(async () => {
                        try {
                          const result = await post("/api/reminders/send-code", {
                            email,
                            locale: language,
                            consent,
                          });
                          apply(result);
                        } catch {
                          setFeedback({ tone: "err", text: statusCopy(locale, "storage_unavailable") });
                        }
                      });
                    }}
                  >
                    {copy.resend}
                  </button>
                ) : null}
              </div>
            </form>
          )
        ) : (
          <p className="text-sm text-muted-foreground">{copy.closed}</p>
        )}
        <form onSubmit={unsubscribe} className="space-y-4 border-t border-border pt-6">
          <h2 className="font-serif text-xl leading-snug">{copy.unsubTitle}</h2>
          <p className="text-sm leading-6 text-muted-foreground">{copy.unsubBlurb}</p>
          <div>
            <label htmlFor="reminders-unsub-email" className="text-sm">
              {copy.emailLabel}
            </label>
            <input
              id="reminders-unsub-email"
              name="email"
              type="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              required
              placeholder={copy.emailPlaceholder}
              value={unsubEmail}
              onChange={(event) => setUnsubEmail(event.target.value)}
              className={fieldClass}
            />
          </div>
          <button type="submit" disabled={pending || unsubEmail.trim() === ""} className={buttonClass}>
            {copy.unsubButton}
          </button>
        </form>
      </div>
    </article>
  );
}
