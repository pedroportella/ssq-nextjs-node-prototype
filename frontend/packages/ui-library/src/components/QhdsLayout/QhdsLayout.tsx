import type { ReactNode } from "react";

import "./QhdsLayout.scss";

export type QhdsLayoutContentWidth = "body" | "full" | "task";
export type QhdsLayoutWidth = "app" | "contained";

export interface QhdsLayoutProps {
  children: ReactNode;
  className?: string;
  contentLabelledBy?: string;
  contentWidth?: QhdsLayoutContentWidth;
  focusMode?: boolean;
  footer?: ReactNode;
  header?: ReactNode;
  mainId?: string;
  mainLabel?: string;
  sideNav?: ReactNode;
  skipLinkLabel?: string;
  width?: QhdsLayoutWidth;
}

export function QhdsLayout({
  children,
  className,
  contentLabelledBy,
  contentWidth,
  focusMode = false,
  footer,
  header,
  mainId = "content",
  mainLabel,
  sideNav,
  skipLinkLabel = "Skip to main content",
  width = "app"
}: QhdsLayoutProps) {
  const hasSideNav = Boolean(sideNav) && !focusMode;
  const resolvedContentWidth = contentWidth ?? (focusMode ? "task" : "full");
  const contentClasses = [
    "col-xs-12",
    hasSideNav ? "col-lg-9 col-xl-9" : "col-lg-12 col-xl-12",
    "ssq-layout__content",
    `ssq-layout__content--${resolvedContentWidth}`
  ];
  const layoutClasses = ["qld__grid", "ssq-layout", `ssq-layout--${width}`, focusMode ? "ssq-layout--focus" : "", className];

  return (
    <div className={layoutClasses.filter(Boolean).join(" ")}>
      <nav aria-label="skip links" className="qld__skip-link ssq-layout__skip-links" tabIndex={-1}>
        <a className="qld__skip-link__link ssq-layout__skip-link" href={`#${mainId}`}>
          {skipLinkLabel}
        </a>
        {hasSideNav ? (
          <a className="qld__skip-link__link ssq-layout__skip-link" href="#section-navigation">
            Skip to section navigation
          </a>
        ) : null}
      </nav>
      {header}
      <main aria-label={mainLabel} className="main ssq-layout__main" tabIndex={-1}>
        <section className="qld__body ssq-layout__body">
          <div className="container-fluid ssq-layout__container">
            <div className="row">
              {hasSideNav ? (
                <div className="col-xs-12 col-lg-3 col-xl-3 ssq-layout__sidebar" id="section-navigation">
                  {sideNav}
                </div>
              ) : null}
              <div aria-labelledby={contentLabelledBy} className={contentClasses.filter(Boolean).join(" ")} id={mainId}>
                {children}
              </div>
            </div>
          </div>
        </section>
      </main>
      {footer}
    </div>
  );
}
