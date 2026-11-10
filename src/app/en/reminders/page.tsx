import type { Metadata } from "next";
import { RemindersRoute } from "@/components/reminders-route";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Email alerts",
  description:
    "After you verify your email, ALane sends a short digest when contests open, deadlines are close, or winners are published. This does not replace calendar subscribe.",
};

export default function EnglishRemindersPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  return <RemindersRoute locale="en" searchParams={searchParams} />;
}
