import Link from "next/link";
import { loadContests } from "@/lib/contests";
import {
  calendarArchivedNote,
  calendarNoDeadlineNote,
  calendarOmitReason,
} from "@/lib/contest-ics";
import { displayName } from "@/lib/contest-labels";
import { hrefFor, type Locale } from "@/lib/locale";
import { copy } from "@/lib/messages";

export async function AboutScreen({ locale }: { locale: Locale }) {
  const contests = await loadContests();
  const omitted = contests.flatMap((contest) => {
    const reason = calendarOmitReason(contest, locale);
    return reason ? [{ id: contest.id, name: displayName(contest, locale), reason }] : [];
  });
  const t = copy(locale);

  return (
    <article className="max-w-2xl">
      <h1 className="font-serif text-4xl leading-tight">{t.aboutTitle}</h1>
      <div className="mt-6 space-y-4 text-base leading-7">
        {locale === "en" ? <EnglishAbout /> : <ChineseAbout />}
      </div>
      <details className="mt-8 border-t border-border pt-4 text-sm leading-6 text-muted-foreground">
        <summary className="cursor-pointer text-ink">{t.calendarNotes}</summary>
        <div className="mt-3 space-y-3">
          {locale === "en" ? (
            <p>
              <a href="/calendar.ics" className="text-accent underline-offset-4 hover:underline">
                /calendar.ics
              </a>{" "}
              includes an award only when it has at least one date (open, deadline, or announcement).
              Archived entries that still have a date carry the note 「{calendarArchivedNote(locale)}」.
              Entries with no deadline that use the open or announcement date carry 「
              {calendarNoDeadlineNote(locale)}」.
            </p>
          ) : (
            <p>
              <a href="/calendar.ics" className="text-accent underline-offset-4 hover:underline">
                /calendar.ics
              </a>{" "}
              只写入至少有一个日期（开放、截止或公布）的赛事。已归档的条目如果仍有日期，事件说明会写「{calendarArchivedNote(locale)}」没有截止时间、但改用开放或公布日期占位的，说明会写「{calendarNoDeadlineNote(locale)}」
            </p>
          )}
          {omitted.length === 0 ? (
            <p>{t.calendarNoneOmitted}</p>
          ) : (
            <>
              <p>{t.calendarOmittedLead}</p>
              <ul className="list-disc space-y-2 pl-5">
                {omitted.map((contest) => (
                  <li key={contest.id}>
                    <span className="text-foreground">{contest.name}</span>
                    <span> — {contest.reason}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
          <p>
            <Link href={hrefFor(locale, "/")} className="text-accent underline-offset-4 hover:underline">
              {t.calendarBack}
            </Link>
            <span aria-hidden="true"> · </span>
            <a href="/calendar.ics" className="text-accent underline-offset-4 hover:underline">
              {t.downloadCalendar}
            </a>
          </p>
        </div>
      </details>
    </article>
  );
}

function ChineseAbout() {
  return (
    <p>
      ALane 是街头摄影与纪实向摄影赛事的索引站。你在这里查看征稿是否仍开放、截止与费用，再点进主办方官网报名或看规则。本站<strong>不保存</strong>参赛作品，也不提供图片下载；作品相关入口仅链接至主办方官网。权利标签与部分日期仅供参考，一律以官网为准。勘误或希望移出索引，请邮件{" "}
      <a
        href="mailto:AlaneStreetPhotos@icloud.com"
        className="text-accent underline-offset-4 hover:underline"
      >
        AlaneStreetPhotos@icloud.com
      </a>
      。
    </p>
  );
}

function EnglishAbout() {
  return (
    <p>
      {
        "ALane is an index of street and documentary-leaning photography awards. Check whether a call is still open, its deadline and fees, then go to the organizer\u2019s site to enter or read the rules. This site "
      }
      <strong>does not store</strong>
      {
        " competition entries and does not offer image downloads; work-related links go to the organizer\u2019s official site. Rights labels and some dates are for reference only\u2014always trust the official site. For corrections or removal from the index, email "
      }
      <a
        href="mailto:AlaneStreetPhotos@icloud.com"
        className="text-accent underline-offset-4 hover:underline"
      >
        AlaneStreetPhotos@icloud.com
      </a>
      .
    </p>
  );
}
