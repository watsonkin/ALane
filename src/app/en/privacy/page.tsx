import type { Metadata } from "next";
import { PrivacyScreen } from "@/components/legal-screen";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "ALane offers optional email alerts. After verification we store the minimum fields and send digests through Resend. Unverified addresses are not on the digest list.",
};

export default function EnglishPrivacyPage() {
  return <PrivacyScreen locale="en" />;
}
