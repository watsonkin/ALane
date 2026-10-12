import { Inter, Source_Serif_4 } from "next/font/google";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
});

export const fontClassName = `${inter.variable} ${sourceSerif.variable} h-full antialiased`;
