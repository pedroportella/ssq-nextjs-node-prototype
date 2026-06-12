import type { ReactNode } from "react";

import "./QhdsFooter.scss";

export interface QhdsFooterProps {
  children?: ReactNode;
  serviceName?: string;
}

export function QhdsFooter({ children, serviceName = "Services Queensland" }: QhdsFooterProps) {
  return (
    <footer className="qld__footer qld__footer--dark-alt ssq-footer" role="contentinfo">
      <div className="container-fluid">
        <div className="row qld__footer__row">
          <div className="col-xs-12 qld__footer__column">
            <div className="qld__footer__title ssq-footer__title">
              <h2 className="qld__footer__heading ssq-footer__heading">Queensland Government</h2>
            </div>
          </div>
        </div>
        <div className="row ssq-footer__row">
          <div className="col-xs-12 col-lg-3 qld__footer__column ssq-footer__column">
            <h3 className="qld__footer__heading ssq-footer__section-heading">Contact Us</h3>
            <p className="qld__footer__cta-content">For general enquiries, feedback, complaints and compliments:</p>
            <p className="qld__footer__cta-content">
              13 QGOV (<a href="tel:137468">13 74 68</a>)
            </p>
          </div>
          <div className="col-xs-12 col-lg-2 qld__footer__column ssq-footer__column">
            <nav aria-label="footer" className="qld__footer__navigation">
              <ul className="qld__link-list ssq-footer__link-list">
                <li><a className="qld__footer__clickable__link" href="https://www.qld.gov.au/legal/copyright">Copyright</a></li>
                <li><a className="qld__footer__clickable__link" href="https://www.qld.gov.au/legal/disclaimer">Disclaimer</a></li>
                <li><a className="qld__footer__clickable__link" href="https://www.qld.gov.au/legal/privacy">Privacy</a></li>
                <li><a className="qld__footer__clickable__link" href="https://www.qld.gov.au/about/rights-accountability/right-to-information">Right to information</a></li>
                <li><a className="qld__footer__clickable__link" href="https://www.qld.gov.au/help/accessibility">Accessibility</a></li>
                <li><a className="qld__footer__clickable__link" href="https://www.qld.gov.au/languages">Other languages</a></li>
              </ul>
            </nav>
          </div>
          <div className="col-xs-12 col-lg-7 qld__footer__column ssq-footer__column ssq-footer__acknowledgements">
            <h3 className="qld__footer__heading ssq-footer__section-heading">Acknowledgements</h3>
            <p>
              Queensland Government acknowledges the Traditional Owners of the land and pays respect to Elders past,
              present and future.
            </p>
            <p>(C) The State of Queensland 1995-2026</p>
            {children ? (
              <div className="ssq-footer__content" aria-label={`${serviceName} footer notes`}>
                {children}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </footer>
  );
}
