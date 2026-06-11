import type { ReactNode } from "react";

import "./QhdsFooter.scss";

export interface QhdsFooterProps {
  children?: ReactNode;
  serviceName?: string;
}

export function QhdsFooter({ children, serviceName = "Services Queensland" }: QhdsFooterProps) {
  return (
    <footer className="ssq-footer">
      <div className="ssq-footer__inner">
        <p className="ssq-footer__service">{serviceName}</p>
        {children ? <div className="ssq-footer__content">{children}</div> : null}
      </div>
    </footer>
  );
}
