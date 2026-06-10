import { prototypeTokens } from "@ssq/ui-tokens";

import type { ReactNode } from "react";

export interface PrototypePageShellProps {
  children: ReactNode;
  title: string;
}

export function PrototypePageShell({ children, title }: PrototypePageShellProps) {
  return (
    <main
      style={{
        color: prototypeTokens.color.text,
        padding: prototypeTokens.space.page
      }}
    >
      <section aria-labelledby="page-title">
        <h1 id="page-title">{title}</h1>
        {children}
      </section>
    </main>
  );
}
