import type { Metadata } from "next";
import { SiteFrame } from "@/components/site-frame";
import { fontClassName } from "@/app/fonts";
import "../globals.css";

export const metadata: Metadata = {
  title: {
    default: "ALane",
    template: "%s · ALane",
  },
  description:
    "Street Photography Awards Index. Check the deadline, then open the official site.",
};

export default function EnglishLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fontClassName}>
      <body className="min-h-full flex flex-col">
        <SiteFrame>{children}</SiteFrame>
      </body>
    </html>
  );
}
