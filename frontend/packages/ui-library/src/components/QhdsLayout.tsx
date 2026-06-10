import type { ReactNode } from "react";

export interface QhdsLayoutProps {
  children: ReactNode;
  footer?: ReactNode;
  header?: ReactNode;
}

export function QhdsLayout({ children, footer, header }: QhdsLayoutProps) {
  return (
    <div className="ssq-layout">
      {header}
      {children}
      {footer}
    </div>
  );
}
