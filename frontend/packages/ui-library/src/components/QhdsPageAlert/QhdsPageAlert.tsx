import type { ReactNode } from "react";

import "./QhdsPageAlert.scss";

type PageAlertTone = "info" | "success" | "warning";

export interface QhdsPageAlertProps {
  children: ReactNode;
  heading: string;
  tone?: PageAlertTone;
}

export function QhdsPageAlert({ children, heading, tone = "info" }: QhdsPageAlertProps) {
  const className = ["qld__page-alerts", "qld__page-alerts--svg", `qld__page-alerts--${tone}`, "ssq-page-alert", `ssq-page-alert--${tone}`].join(" ");

  return (
    <aside className={className} role="status">
      <span aria-hidden="true" className="qld__page-alerts__icon ssq-page-alert__icon" />
      <div className="qld__page-alerts--wrapper ssq-page-alert__wrapper">
        <h2 className="qld__page-alerts--heading ssq-page-alert__heading">{heading}</h2>
        <div className="ssq-page-alert__content">{children}</div>
      </div>
    </aside>
  );
}
