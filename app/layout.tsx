import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
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
      <body className={`${inter.variable} antialiased`}>{children}</body>
    </html>
  );
}
