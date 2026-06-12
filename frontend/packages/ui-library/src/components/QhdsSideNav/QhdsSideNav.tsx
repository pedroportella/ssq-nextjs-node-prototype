import type { MouseEvent, ReactNode } from "react";

import "./QhdsSideNav.scss";

export interface QhdsSideNavItem {
  badge?: ReactNode;
  href: string;
  items?: QhdsSideNavItem[];
  label: string;
}

export interface QhdsSideNavProps {
  activeHref?: string;
  ariaLabel?: string;
  heading?: ReactNode;
  items: QhdsSideNavItem[];
  onNavigate?: (href: string) => void;
}

function isActive(item: QhdsSideNavItem, activeHref?: string): boolean {
  return item.href === activeHref || Boolean(item.items?.some((child) => isActive(child, activeHref)));
}

export function QhdsSideNav({ activeHref, ariaLabel = "Section navigation", heading, items, onNavigate }: QhdsSideNavProps) {
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

  function renderItems(navItems: QhdsSideNavItem[], nested = false) {
    return (
      <ul className={nested ? "qld__link-list ssq-side-nav__list ssq-side-nav__list--nested" : "qld__link-list ssq-side-nav__list"}>
        {navItems.map((item) => {
          const active = isActive(item, activeHref);
          const current = item.href === activeHref;

          return (
            <li className="ssq-side-nav__item" key={item.href}>
              <a
                aria-current={current ? "page" : undefined}
                className={["ssq-side-nav__link", active ? "ssq-side-nav__link--active" : ""].filter(Boolean).join(" ")}
                href={item.href}
                {...getNavigationProps(item.href)}
              >
                <span>{item.label}</span>
                {item.badge ? <span className="ssq-side-nav__badge">{item.badge}</span> : null}
              </a>
              {item.items && active ? renderItems(item.items, true) : null}
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <nav aria-label={ariaLabel} className="qld__side-nav ssq-side-nav">
      {heading ? <div className="ssq-side-nav__heading">{heading}</div> : null}
      {renderItems(items)}
    </nav>
  );
}
