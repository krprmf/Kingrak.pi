import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

// Self-hosted (src/fonts), see src/lib/fonts.ts for why. Noto Sans Thai was
// removed: its --font-thai variable was never used, Thai already used the system font.
const inter = localFont({
  src: "../fonts/inter-latin.woff2",
  weight: "100 900",
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "CRAFTJAI — Mood Character Journal",
  description:
    "Write your diary and collect AI-generated mood characters. Powered by generative AI and gamification.",
  keywords: ["mood journal", "AI", "character collection", "gamification", "mental health"],
  authors: [{ name: "Kingrak Phairoh" }],
};

export const viewport: Viewport = {
  themeColor: "#7c3aed",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <TooltipProvider>
          {children}
          <Toaster position="top-center" richColors />
        </TooltipProvider>
      </body>
    </html>
  );
}
