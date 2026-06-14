import type { ReactNode } from "react";

import "./QhdsCard.scss";

export interface QhdsCardProps {
  action?: ReactNode;
  children: ReactNode;
  heading: string;
}

export function QhdsCard({ action, children, heading }: QhdsCardProps) {
  const cardClassName = ["qld__card", action ? "qld__card__multi-action" : "", "ssq-card"].filter(Boolean).join(" ");

  return (
    <article className={cardClassName}>
      <div className="qld__card__inner ssq-card__body">
        <div className="qld__card__content ssq-card__content">
          <div className="qld__card__content-inner ssq-card__content-inner">
            <h2 className="qld__card__title ssq-card__heading">{heading}</h2>
            <div className="ssq-card__content-body">{children}</div>
          </div>
        </div>
      </div>
      {action ? (
        <div className="qld__card__footer ssq-card__action">
          <div className="qld__card__footer-inner">{action}</div>
        </div>
      ) : null}
    </article>
  );
}
