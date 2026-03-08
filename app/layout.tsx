import type { Metadata } from "next";
import { Urbanist } from "next/font/google";
import "./globals.css";

const urbanist = Urbanist({
  variable: "--font-urbanist",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Blueprint — AI Automatisering voor het MKB",
  description:
    "Webshop, WhatsApp Bot & Offerte Generator. Alles wat uw bedrijf nodig heeft, volledig geautomatiseerd met AI.",
  keywords: [
    "AI automatisering",
    "MKB",
    "WhatsApp bot",
    "offerte generator",
    "webshop",
    "Nederland",
    "bouw",
    "ZZP",
  ],
  openGraph: {
    title: "Blueprint — AI Automatisering voor het MKB",
    description:
      "Webshop, WhatsApp Bot & Offerte Generator. Volledig geautomatiseerd met AI.",
    type: "website",
    locale: "nl_NL",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <body className={`${urbanist.variable} antialiased`}>{children}</body>
    </html>
  );
}
