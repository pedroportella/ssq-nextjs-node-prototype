import { css } from "lit";

export const ssqAlertStyles = css`
  :host {
    display: block;
  }

  .ssq-page-alert {
    background: var(--ssq-color-info-background);
    border-left: 6px solid var(--ssq-color-info-border);
    box-sizing: border-box;
    color: var(--ssq-color-text);
    margin-block: var(--ssq-space-4);
    max-width: 46rem;
    padding: var(--ssq-space-4);
  }

  .ssq-page-alert--success {
    background: var(--ssq-color-success-background);
    border-left-color: var(--ssq-color-success-border);
  }

  .ssq-page-alert--warning {
    background: var(--ssq-color-warning-background);
    border-left-color: var(--ssq-color-warning-border);
  }

  .ssq-page-alert--error {
    border-left-color: var(--ssq-color-error);
  }

  .ssq-page-alert__heading {
    font-size: 1.25rem;
    line-height: 1.25;
    margin: 0 0 var(--ssq-space-2);
  }

  .ssq-page-alert__content ::slotted(:first-child) {
    margin-top: 0;
  }

  .ssq-page-alert__content ::slotted(:last-child) {
    margin-bottom: 0;
  }
`;
