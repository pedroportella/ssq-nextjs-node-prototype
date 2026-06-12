import type { ReactNode } from "react";

import "./QhdsLayout.scss";

export interface QhdsLayoutProps {
  children: ReactNode;
  className?: string;
  focusMode?: boolean;
  footer?: ReactNode;
  header?: ReactNode;
  mainId?: string;
  mainLabel?: string;
  sideNav?: ReactNode;
  skipLinkLabel?: string;
}

export function QhdsLayout({
  children,
  className,
  focusMode = false,
  footer,
  header,
  mainId = "content",
  mainLabel,
  sideNav,
  skipLinkLabel = "Skip to main content"
}: QhdsLayoutProps) {
  const hasSideNav = Boolean(sideNav) && !focusMode;

  return (
    <div className={["qld__grid", "ssq-layout", focusMode ? "ssq-layout--focus" : "", className].filter(Boolean).join(" ")}>
      <a className="ssq-layout__skip-link" href={`#${mainId}`}>
        {skipLinkLabel}
      </a>
      {header}
      <div className="ssq-layout__body">
        {hasSideNav ? (
          <aside aria-label="Section navigation" className="ssq-layout__sidebar">
            {sideNav}
          </aside>
        ) : null}
        <main aria-label={mainLabel} className="ssq-layout__main" id={mainId} tabIndex={-1}>
          {children}
        </main>
      </div>
      {footer}
    </div>
  );
}
