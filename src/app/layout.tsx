import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "./providers";
import { CosmicBackground } from "@/components/layout/CosmicBackground";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SetupBanner } from "@/components/layout/SetupBanner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AstroSwap — Swap Freely. Trade Privately.",
  description:
    "Decentralised exchange with a real Railgun privacy path. Public Uniswap V3 swaps on Base & Ethereum; shield into Railgun on Ethereum.",
  applicationName: "AstroSwap",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#05040f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="relative flex min-h-full flex-col text-foreground">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <Providers>
          <CosmicBackground />
          <SetupBanner />
          <Header />
          <main
            id="main-content"
            tabIndex={-1}
            className="relative z-10 mx-auto flex w-full min-w-0 max-w-6xl flex-1 flex-col px-3 py-5 outline-none sm:px-6 sm:py-8"
          >
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
