import type { Metadata, Viewport } from "next";
import { Courier_Prime, Instrument_Serif, Space_Mono } from "next/font/google";
import "./globals.css";
import { SITE } from "@/lib/site";

const courier = Courier_Prime({ variable: "--font-courier", subsets: ["latin"], weight: ["400", "700"] });
const mono = Space_Mono({ variable: "--font-space", subsets: ["latin"], weight: ["400", "700"] });
const serif = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});


const TITLE = "The file an AI would keep on you";
const DESC =
  "TIME read Meta's Muse instructions: it updates a file on you every hour. This builds that file from public posts only. Drop your X archive, it never leaves your browser.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: TITLE,
  description: DESC,
  openGraph: { title: TITLE, description: DESC, images: [{ url: "/api/og", width: 1200, height: 630 }], type: "website" },
  twitter: { card: "summary_large_image", creator: "@tibo_maker", title: TITLE, description: DESC, images: ["/api/og"] },
};

export const viewport: Viewport = { themeColor: "#0b0a09", colorScheme: "dark" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${courier.variable} ${mono.variable} ${serif.variable} antialiased`}>
      <body className="min-h-full bg-[#0b0a09]">{children}</body>
    </html>
  );
}
