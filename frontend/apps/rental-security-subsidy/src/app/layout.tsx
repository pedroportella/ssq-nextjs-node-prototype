import "./globals.css";

import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Rental Security Subsidy",
  description: "Prototype Rental Security Subsidy digital transaction."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-AU">
      <body>{children}</body>
    </html>
  );
}
