import type { ReactNode } from "react";

import { QhdsFooter } from "../QhdsFooter";
import { QhdsHeader } from "../QhdsHeader";
import { QhdsLayout } from "../QhdsLayout";

import "./PrototypePageShell.scss";

export interface PrototypePageShellProps {
  children: ReactNode;
  lead?: string;
  title: string;
}

export function PrototypePageShell({ children, lead, title }: PrototypePageShellProps) {
  return (
    <QhdsLayout footer={<QhdsFooter />} header={<QhdsHeader />}>
      <main className="ssq-page-shell">
        <section aria-labelledby="page-title" className="ssq-page-shell__inner">
          <h1 className="ssq-page-shell__title" id="page-title">
            {title}
          </h1>
          {lead ? <p className="ssq-page-shell__lead">{lead}</p> : null}
          {children}
        </section>
      </main>
    </QhdsLayout>
  );
}
