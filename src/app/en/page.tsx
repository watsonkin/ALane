import type { Metadata } from "next";
import { HomeScreen } from "@/components/home-screen";

export const dynamic = "force-static";

export const metadata: Metadata = {
  description:
    "Street Photography Awards Index. Check the deadline, then open the official site.",
};

export default function EnglishHomePage() {
  return <HomeScreen locale="en" />;
}
