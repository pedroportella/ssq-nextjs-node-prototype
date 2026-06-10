import "./globals.css";

import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Seniors Card",
  description: "Prototype Seniors Card digital transaction."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-AU">
      <body>{children}</body>
    </html>
  );
}
