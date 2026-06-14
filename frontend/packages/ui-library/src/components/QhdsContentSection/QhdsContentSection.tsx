import type { HTMLAttributes, ReactNode } from "react";

import "./QhdsContentSection.scss";

export interface QhdsContentSectionProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  heading?: ReactNode;
  headingId?: string;
  lead?: ReactNode;
}

export function QhdsContentSection({
  children,
  className,
  heading,
  headingId,
  lead,
  ...props
}: QhdsContentSectionProps) {
  const generatedHeadingId =
    typeof heading === "string"
      ? `${heading.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-section`
      : undefined;
  const resolvedHeadingId = headingId ?? generatedHeadingId;
  const classes = ["qld__body", "ssq-content-section", className].filter(Boolean).join(" ");
  const sectionProps = heading && resolvedHeadingId ? { "aria-labelledby": resolvedHeadingId, ...props } : props;

  return (
    <section className={classes} {...sectionProps}>
      {heading ? (
        <header className="ssq-content-section__header">
          <h2 className="ssq-content-section__heading" id={resolvedHeadingId}>
            {heading}
          </h2>
          {lead ? <p className="qld__abstract ssq-content-section__lead">{lead}</p> : null}
        </header>
      ) : null}
      <div className="ssq-content-section__body">{children}</div>
    </section>
  );
}
