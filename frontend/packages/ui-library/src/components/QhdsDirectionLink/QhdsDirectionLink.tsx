import type { AnchorHTMLAttributes, ReactNode } from "react";

import "./QhdsDirectionLink.scss";

export type QhdsDirectionLinkDirection = "down" | "left" | "right" | "up";

export interface QhdsDirectionLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  children: ReactNode;
  direction?: QhdsDirectionLinkDirection;
  href: string;
}

export function QhdsDirectionLink({ children, className, direction = "left", ...props }: QhdsDirectionLinkProps) {
  const classes = [
    "qld__direction-link",
    `qld__direction-link--${direction}`,
    "ssq-direction-link",
    `ssq-direction-link--${direction}`,
    className
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <a className={classes} {...props}>
      {children}
    </a>
  );
}
