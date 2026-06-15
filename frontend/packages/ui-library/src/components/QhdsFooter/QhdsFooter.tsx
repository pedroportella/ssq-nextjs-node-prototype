import type { ReactNode } from "react";

import { QhdsButton } from "../QhdsButton";

import "./QhdsFooter.scss";

export interface QhdsFooterAction {
  href: string;
  label: string;
}

export interface QhdsFooterLink {
  href: string;
  label: string;
}

export type QhdsFooterWidth = "app" | "contained";

export interface QhdsFooterProps {
  children?: ReactNode;
  contactAction?: QhdsFooterAction | null;
  links?: QhdsFooterLink[];
  width?: QhdsFooterWidth;
}

const defaultContactAction: QhdsFooterAction = {
  href: "https://www.qld.gov.au/contact-us",
  label: "Contact us"
};

const defaultFooterLinks: QhdsFooterLink[] = [
  { href: "https://www.qld.gov.au/legal/copyright", label: "Copyright" },
  { href: "https://www.qld.gov.au/legal/disclaimer", label: "Disclaimer" },
  { href: "https://www.qld.gov.au/legal/privacy", label: "Privacy" },
  { href: "https://www.qld.gov.au/about/rights-accountability/right-to-information", label: "Right to information" },
  { href: "https://www.qld.gov.au/help/accessibility", label: "Accessibility" },
  { href: "https://www.qld.gov.au/languages", label: "Other languages" }
];

export function QhdsFooter({
  children,
  contactAction = defaultContactAction,
  links = defaultFooterLinks,
  width = "app"
}: QhdsFooterProps) {
  const footerClassName = ["qld__footer", "qld__footer--dark-alt", "ssq-footer", `ssq-footer--${width}`].join(" ");

  return (
    <footer className={footerClassName} role="contentinfo">
      <div className="container-fluid ssq-footer__container">
        <div className="row qld__footer__row">
          <div className="col-xs-12 qld__footer__column">
            <div className="qld__footer__title ssq-footer__title">
              <h2 className="qld__footer__heading ssq-footer__heading">Queensland Government</h2>
            </div>
          </div>
        </div>
        <div className="row ssq-footer__row">
          <div className="col-xs-12 col-lg-3 qld__footer__column ssq-footer__column">
            <div className="ssq-footer__contact">
              <div className="ssq-footer__contact-content">
                <h3 className="qld__footer__heading ssq-footer__section-heading">Contact Us</h3>
                <p className="qld__footer__cta-content">For general enquiries, feedback, complaints and compliments:</p>
                <p className="qld__footer__cta-content">
                  13 QGOV (<a href="tel:137468">13 74 68</a>)
                </p>
              </div>
              {contactAction ? (
                <div className="ssq-footer__contact-action">
                  <QhdsButton href={contactAction.href} variant="secondary">
                    {contactAction.label}
                  </QhdsButton>
                </div>
              ) : null}
            </div>
          </div>
          <div className="col-xs-12 col-lg-2 qld__footer__column ssq-footer__column">
            <nav aria-label="footer" className="qld__footer__navigation">
              <ul className="qld__link-list ssq-footer__link-list">
                {links.map((link) => (
                  <li key={link.href}>
                    <a className="qld__footer__clickable__link" href={link.href}>{link.label}</a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
          <div className="col-xs-12 col-lg-7 qld__footer__column ssq-footer__column ssq-footer__acknowledgements">
            <h3 className="qld__footer__heading ssq-footer__section-heading">Acknowledgements</h3>
            <p>Queensland Government acknowledges the Traditional Owners of the land and pays respect to Elders past, present and future.</p>
            <p>&copy; The State of Queensland 1995-2026</p>
            {children ? <div className="ssq-footer__content">{children}</div> : null}
          </div>
        </div>
      </div>
    </footer>
  );
}
