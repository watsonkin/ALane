import type { Metadata } from "next";
import { PrivacyScreen } from "@/components/legal-screen";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "This season ALane does not collect subscriber emails or account passwords. The site runs on Cloudflare Workers and stores only the alane_locale cookie.",
};

export default function EnglishPrivacyPage() {
  return <PrivacyScreen locale="en" />;
}
