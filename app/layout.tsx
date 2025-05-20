import Header from "@/components/header";
import type { Metadata } from "next";
import type React from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Idiotcoder.com - Retro Game Development Blog",
  description:
    "A tactical blog about game jams, personal projects, and RTS game development",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=VT323&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {/* RTS-style header panel */}
        <Header />
        {children}
      </body>
    </html>
  );
}
