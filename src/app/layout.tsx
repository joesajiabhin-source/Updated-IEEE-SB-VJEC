import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const grotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-grotesk",
  display: "swap",
});

/* Umbral Rift Display — the hand-drawn, pen-hatched display face used for the
   "IEEE SB" line, echoing the sketched reference. Self-hosted (woff2,
   preloaded); Regular only, so it is never faux-bolded. */
const umbral = localFont({
  src: "./fonts/UmbralRiftDisplay-Regular.woff2",
  variable: "--font-umbral",
  display: "swap",
  weight: "400",
});

/* Anton VJEC — our self-hosted, metrics-normalised copy of Anton (OFL,
   renamed per the licence because the vertical metrics are patched: ascent
   0.90em / descent -0.07em, matching the ink's real bounds). A condensed
   poster face whose caps tower 0.859em tall over a narrow 1.82em VJEC glyph
   run — used ONLY for the "VJEC" wordmark, so it reads dramatically taller
   and more massive than the wide grotesk ever could at the same frame. */
const anton = localFont({
  src: "./fonts/Anton-Regular.woff2",
  variable: "--font-anton",
  display: "swap",
  weight: "400",
});

export const metadata: Metadata = {
  title: "IEEE SB VJEC — IEEE Student Branch",
  description:
    "The IEEE Student Branch at VJEC. 338+ members, 9+ societies, 50+ events.",
  keywords: ["IEEE", "IEEE SB VJEC", "student branch", "VJEC", "engineering"],
  icons: { icon: "/logo.png" },
  openGraph: {
    title: "IEEE SB VJEC",
    description:
      "The IEEE Student Branch at VJEC — 338+ members, 9+ societies, 50+ events.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${grotesk.variable} ${umbral.variable} ${anton.variable} antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
