import { Terminal } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type React from "react";
import CacheBuster from "../components/cache-buster";
import ResponsiveNav from "../components/responsive-nav";
import ServiceWorkerRegistration from "../components/service-worker";
import "./globals.css";

export const metadata: Metadata = {
  title: "Command Center - RTS Game Development Blog",
  description:
    "A tactical blog about game jams, personal projects, and RTS game development",
  generator: "v0.dev",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta
          httpEquiv="Cache-Control"
          content="no-cache, no-store, must-revalidate"
        />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
        <link
          href={`https://fonts.googleapis.com/css2?family=VT323&display=swap&v=${Date.now()}`}
          rel="stylesheet"
        />
      </head>
      <body className="bg-black text-amber-400 font-mono crt-effects">
        <CacheBuster />
        <ServiceWorkerRegistration />
        {/* RTS-style background */}
        <div className="fixed inset-0 bg-[url('/placeholder.svg?height=100&width=100&text=BG')] bg-repeat opacity-10 z-0"></div>

        <div className="container mx-auto px-4 py-8 relative z-10">
          {/* RTS-style header panel */}
          <header className="rts-panel mb-8 p-1 relative">
            <div className="rts-panel-inner p-3 flex items-center justify-between local-scanlines">
              <div className="flex items-center gap-2 z-10">
                <Link
                  href="/"
                  className="rts-button-square p-1 w-10 h-10 flex items-center justify-center"
                >
                  <Terminal className="w-6 h-6 text-amber-400" />
                </Link>
                <h1 className="text-2xl font-bold tracking-tight text-amber-400 glow">
                  COMMAND_CENTER
                </h1>
              </div>
              <ResponsiveNav />
            </div>
          </header>

          {children}
        </div>
      </body>
    </html>
  );
}
