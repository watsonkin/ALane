import type { Metadata } from "next";

export const metadata: Metadata = {
  description:
    "Street Photography Awards Index. Check the deadline, then open the official site.",
};

export default function EnglishLayout({ children }: { children: React.ReactNode }) {
  return children;
}
