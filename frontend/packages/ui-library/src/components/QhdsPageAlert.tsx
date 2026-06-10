import type { ReactNode } from "react";

type PageAlertTone = "info" | "success" | "warning";

export interface QhdsPageAlertProps {
  children: ReactNode;
  heading: string;
  tone?: PageAlertTone;
}

export function QhdsPageAlert({ children, heading, tone = "info" }: QhdsPageAlertProps) {
  return (
    <aside className={`ssq-page-alert ssq-page-alert--${tone}`} role="status">
      <h2 className="ssq-page-alert__heading">{heading}</h2>
      <div className="ssq-page-alert__content">{children}</div>
    </aside>
  );
}
