import qgovLogoUrlBrand from "@ssq/ui-assets/logos/header-logo-qgov-url";

import type { MouseEvent, ReactNode } from "react";

import "./QhdsHeader.scss";

export interface QhdsHeaderNavItem {
  href: string;
  label: string;
}

export interface QhdsHeaderProps {
  actions?: ReactNode;
  navItems?: QhdsHeaderNavItem[];
  onNavigate?: (href: string) => void;
  serviceDescription?: string;
  serviceName?: string;
}

export function QhdsHeader({
  actions,
  navItems = [],
  onNavigate,
  serviceDescription = "Digital services prototype",
  serviceName = "Services Queensland"
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
    <header className="qld__header ssq-header" role="banner">
      <div className="qld__header__pre-header qld__header__pre-header--dark-alt ssq-header__pre-header">
        <div className="container-fluid">
          <div className="row">
            <div className="col-xs-12 ssq-header__pre-header-content">
              <span className="qld__header__pre-header-url ssq-header__pre-header-url">qld.gov.au</span>
              {actions ? <div className="qld__header__cta-wrapper ssq-header__actions">{actions}</div> : null}
            </div>
          </div>
        </div>
      </div>
      <div className="qld__header__main qld__header__main--dark ssq-header__main">
        <div className="container-fluid">
          <div className="row">
            <div className="col-xs-12 ssq-header__main-content">
              <a className="qld__header__brand ssq-header__brand" href="/" {...getNavigationProps("/")}>
                <span className="ssq-header__qg-lockup" aria-label="Queensland Government">
                  <img alt="Queensland Government" className="ssq-header__qg-logo" src={qgovLogoUrlBrand} />
                </span>
                <span className="qld__header__site-name ssq-header__site-name">
                  <span className="qld__header__heading ssq-header__heading">{serviceName}</span>
                  <span className="qld__header__subline ssq-header__subline">{serviceDescription}</span>
                </span>
              </a>
              {navItems.length > 0 ? (
                <nav aria-label="Primary" className="qld__main-nav ssq-header__nav" id="qld-header-main-nav">
                  <ul className="qld__link-list ssq-header__nav-list">
                    {navItems.map((item) => (
                      <li className="ssq-header__nav-item" key={item.href}>
                        <a className="qld__main-nav__item-link ssq-header__link" href={item.href} {...getNavigationProps(item.href)}>
                          {item.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
