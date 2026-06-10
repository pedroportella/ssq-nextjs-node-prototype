import type { ReactNode } from "react";

export interface QhdsCardProps {
  action?: ReactNode;
  children: ReactNode;
  heading: string;
}

export function QhdsCard({ action, children, heading }: QhdsCardProps) {
  return (
    <article className="ssq-card">
      <div className="ssq-card__body">
        <h2 className="ssq-card__heading">{heading}</h2>
        <div className="ssq-card__content">{children}</div>
      </div>
      {action ? <div className="ssq-card__action">{action}</div> : null}
    </article>
  );
}
