import { css } from "lit";

export const ssqButtonStyles = css`
  :host {
    display: inline-block;
  }

  .ssq-button {
    align-items: center;
    border: 2px solid transparent;
    border-radius: var(--ssq-radius-sm);
    box-sizing: border-box;
    cursor: pointer;
    display: inline-flex;
    font: inherit;
    font-weight: 700;
    justify-content: center;
    min-height: 2.75rem;
    padding: var(--ssq-space-2) var(--ssq-space-4);
    text-decoration: none;
  }

  .ssq-button--primary {
    background: var(--ssq-color-action);
    color: var(--ssq-color-action-text);
  }

  .ssq-button--secondary {
    background: var(--ssq-color-surface);
    border-color: var(--ssq-color-action);
    color: var(--ssq-color-action);
  }

  .ssq-button[disabled],
  .ssq-button[aria-disabled="true"] {
    cursor: not-allowed;
    opacity: 0.72;
  }
`;
