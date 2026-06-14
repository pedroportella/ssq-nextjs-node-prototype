import type { HTMLAttributes, ReactNode } from "react";

import "./QhdsSummaryList.scss";

export interface QhdsSummaryListItem {
  description: ReactNode;
  term: ReactNode;
}

export interface QhdsSummaryListProps extends HTMLAttributes<HTMLDListElement> {
  ariaLabel?: string;
  items: QhdsSummaryListItem[];
}

export function QhdsSummaryList({ ariaLabel, className, items, ...props }: QhdsSummaryListProps) {
  return (
    <dl aria-label={ariaLabel} className={["qld__summary-list", "ssq-summary-list", className].filter(Boolean).join(" ")} {...props}>
      {items.map((item, index) => (
        <div className="qld__summary-list__row ssq-summary-list__row" key={index}>
          <dt className="qld__summary-list__key ssq-summary-list__term">{item.term}</dt>
          <dd className="qld__summary-list__value ssq-summary-list__description">{item.description}</dd>
        </div>
      ))}
    </dl>
  );
}
