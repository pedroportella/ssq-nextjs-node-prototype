import type { HTMLAttributes, ReactNode } from "react";

import "./QhdsPageHeader.scss";

export interface QhdsPageHeaderProps extends HTMLAttributes<HTMLElement> {
  aside?: ReactNode;
  children?: ReactNode;
  contextLabel?: ReactNode;
  heading: ReactNode;
  headingId?: string;
  lead?: ReactNode;
}

export function QhdsPageHeader({
  aside,
  children,
  className,
  contextLabel,
  heading,
  headingId = "page-title",
  lead,
  ...props
}: QhdsPageHeaderProps) {
  const classes = ["ssq-page-header", aside ? "ssq-page-header--with-aside" : "", className].filter(Boolean).join(" ");

  return (
    <header className={classes} {...props}>
      <div className="ssq-page-header__content">
        {contextLabel ? <p className="ssq-page-header__context">{contextLabel}</p> : null}
        <h1 className="ssq-page-header__heading" id={headingId}>
          {heading}
        </h1>
        {lead ? <p className="qld__abstract ssq-page-header__lead">{lead}</p> : null}
        {children ? <div className="ssq-page-header__body">{children}</div> : null}
      </div>
      {aside ? <div className="ssq-page-header__aside">{aside}</div> : null}
    </header>
  );
}
