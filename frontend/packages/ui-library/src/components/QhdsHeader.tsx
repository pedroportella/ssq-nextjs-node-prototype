import { prototypeAssetManifest } from "@ssq/ui-assets";

import type { MouseEvent, ReactNode } from "react";

export interface QhdsHeaderNavItem {
  href: string;
  label: string;
}

export interface QhdsHeaderProps {
  actions?: ReactNode;
  navItems?: QhdsHeaderNavItem[];
  onNavigate?: (href: string) => void;
  serviceName?: string;
}

export function QhdsHeader({
  actions,
  navItems = [],
  onNavigate,
  serviceName = prototypeAssetManifest.logos.prototypeWordmark.text
}: QhdsHeaderProps) {
  function getNavigationProps(href: string) {
    if (!onNavigate) {
      return {};
    }

    return {
      onClick: (event: MouseEvent<HTMLAnchorElement>) => {
        event.preventDefault();
        onNavigate(href);
      }
    };
  }

  return (
    <header className="ssq-header">
      <div className="ssq-header__inner">
        <a className="ssq-header__brand" href="/" {...getNavigationProps("/")}>
          {serviceName}
        </a>
        {navItems.length > 0 ? (
          <nav aria-label="Primary" className="ssq-header__nav">
            {navItems.map((item) => (
              <a className="ssq-header__link" href={item.href} key={item.href} {...getNavigationProps(item.href)}>
                {item.label}
              </a>
            ))}
          </nav>
        ) : null}
        {actions ? <div className="ssq-header__actions">{actions}</div> : null}
      </div>
    </header>
  );
}
