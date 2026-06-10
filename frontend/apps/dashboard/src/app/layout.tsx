import "./globals.css";

import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "SSQ service dashboard",
  description: "Prototype dashboard for SSQ digital transaction workflows."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-AU">
      <body>{children}</body>
    </html>
  );
}
