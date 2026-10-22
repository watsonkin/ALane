import type { Metadata } from "next";
import { TermsScreen } from "@/components/legal-screen";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Terms of Use",
  description:
    "ALane provides an index of and links to photography awards. It does not store competition entries and has no affiliation with listed organizers.",
};

export default function EnglishTermsPage() {
  return <TermsScreen locale="en" />;
}
