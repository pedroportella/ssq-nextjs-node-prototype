import { prototypeAssetManifest } from "@ssq/ui-assets";

import type { ReactNode } from "react";

export interface PrototypePageShellProps {
  children: ReactNode;
  title: string;
}

export function PrototypePageShell({ children, title }: PrototypePageShellProps) {
  return (
    <main className="ssq-page-shell">
      <section aria-labelledby="page-title" className="ssq-page-shell__inner">
        <p className="ssq-page-shell__brand">{prototypeAssetManifest.logos.prototypeWordmark.text}</p>
        <h1 className="ssq-page-shell__title" id="page-title">
          {title}
        </h1>
        {children}
      </section>
    </main>
  );
}
