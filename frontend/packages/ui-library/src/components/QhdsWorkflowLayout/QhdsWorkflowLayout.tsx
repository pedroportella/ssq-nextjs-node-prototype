import type { ReactNode } from "react";

import "./QhdsWorkflowLayout.scss";

export interface QhdsWorkflowLayoutProps {
  actions?: ReactNode;
  backLink?: ReactNode;
  children: ReactNode;
  contextLabel?: ReactNode;
  heading: ReactNode;
  lead?: ReactNode;
  progress?: ReactNode;
  requiredText?: ReactNode;
}

export function QhdsWorkflowLayout({
  actions,
  backLink,
  children,
  contextLabel,
  heading,
  lead,
  progress,
  requiredText
}: QhdsWorkflowLayoutProps) {
  return (
    <div className={["ssq-workflow-layout", progress ? "ssq-workflow-layout--with-progress" : ""].filter(Boolean).join(" ")}>
      {progress ? (
        <aside aria-label="Form progress" className="ssq-workflow-layout__progress">
          {progress}
        </aside>
      ) : null}
      <div className="ssq-workflow-layout__content">
        {backLink ? <div className="ssq-workflow-layout__back">{backLink}</div> : null}
        <header className="ssq-workflow-layout__header">
          {contextLabel ? <p className="ssq-workflow-layout__context">{contextLabel}</p> : null}
          <h1 className="ssq-workflow-layout__heading">{heading}</h1>
          {lead ? <p className="ssq-workflow-layout__lead">{lead}</p> : null}
          {requiredText ? <p className="ssq-workflow-layout__required">{requiredText}</p> : null}
        </header>
        <div className="ssq-workflow-layout__body">{children}</div>
        {actions ? <div className="ssq-workflow-layout__actions">{actions}</div> : null}
      </div>
    </div>
  );
}
