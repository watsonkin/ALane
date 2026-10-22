import type { Metadata } from "next";
import { AboutScreen } from "@/components/about-screen";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "About",
  description:
    "ALane is an index of street photography awards. This site does not store competition entries; it only links to the organizer’s official site.",
};

export default function EnglishAboutPage() {
  return <AboutScreen locale="en" />;
}
