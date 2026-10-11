import type { Metadata } from "next";
import { AboutScreen } from "@/components/about-screen";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "About",
  description: "ALane is an index of street photography awards. It does not host entries.",
};

export default function EnglishAboutPage() {
  return <AboutScreen locale="en" />;
}
