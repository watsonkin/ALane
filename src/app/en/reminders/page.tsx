import type { Metadata } from "next";
import { RemindersScreen } from "@/components/reminders-screen";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Email alerts",
  description:
    "After you verify your email, we’ll send a short digest when new contests open, deadlines fall within 14 days, or winners are published. This does not replace calendar subscribe. Unsubscribe anytime.",
};

export default function EnglishRemindersPage() {
  return <RemindersScreen locale="en" />;
}
